import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  login as doLogin, logout as doLogout, register as doRegister,
  recordPurchase, pingActiveViewer,
} from '../lib/auth'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/* Build the in-app user object directly from a Supabase session.
   Each query is independently try/catch'd so a failure on one
   never wipes the whole user. A degraded-but-valid user is always
   preferable to logging the person out. */
async function buildUserFromAuth(authUser) {
  let profile = null
  let purchases = []

  try {
    const { data } = await supabase
      .from('profiles')
      .select('email, name, role')
      .eq('id', authUser.id)
      .maybeSingle()
    profile = data
  } catch (err) {
    console.warn('[AuthContext] profile fetch failed:', err)
  }

  try {
    const { data } = await supabase
      .from('purchases')
      .select('course_id, purchased_at, amount, points_spent, method, txn_id')
      .eq('user_id', authUser.id)
      .order('purchased_at', { ascending: false })
    purchases = data || []
  } catch (err) {
    console.warn('[AuthContext] purchases fetch failed:', err)
  }

  return {
    id:           authUser.id,
    email:        profile?.email || authUser.email,
    name:         profile?.name || authUser.user_metadata?.name || '',
    isAdmin:      profile?.role === 'admin',
    purchases:    purchases.map(p => ({
      courseId:    p.course_id,
      purchasedAt: p.purchased_at,
      amount:      p.amount,
      pointsSpent: p.points_spent,
      method:      p.method,
      txnId:       p.txn_id,
    })),
    registeredAt: authUser.created_at,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser]   = useState(null)
  const [ready, setReady] = useState(false)

  /* Tracks the user.id we last built a profile for, so onAuthStateChange
     can skip redundant refetches on TOKEN_REFRESHED / repeat INITIAL_SESSION. */
  const hydratedIdRef = useRef(null)

  /* ── Mount: bootstrap auth ──
     Canonical Supabase pattern:
       1. Subscribe to onAuthStateChange first (so no event is missed).
       2. Call getSession() to recover the persisted session from localStorage.
     Both paths funnel through one applySession() so the user state is
     always derived from a single source of truth.

     CRITICAL: setReady(true) MUST run in finally so a network failure
     during profile fetch never leaves the UI stuck on a spinner. */
  useEffect(() => {
    let alive = true

    async function applySession(session) {
      if (!alive) return
      try {
        if (!session?.user) {
          setUser(null)
          hydratedIdRef.current = null
          return
        }
        // Skip refetch if we already loaded this exact user.
        if (hydratedIdRef.current === session.user.id) return

        const u = await buildUserFromAuth(session.user)
        if (!alive) return
        setUser(u)
        hydratedIdRef.current = session.user.id
      } catch (err) {
        console.warn('[AuthContext] applySession failed:', err)
      } finally {
        if (alive) setReady(true)
      }
    }

    // Subscribe FIRST so no event is missed during the getSession await.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      applySession(session)
    })

    // Recover persisted session — wrapped so a network/storage failure
    // can never leave `ready` false.
    ;(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) console.warn('[AuthContext] getSession error:', error.message)
        await applySession(session)
      } catch (err) {
        console.warn('[AuthContext] getSession threw:', err)
        if (alive) setReady(true)
      }
    })()

    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  /* ── Heartbeat: ping every 30s if logged in ── */
  useEffect(() => {
    if (!user) return
    pingActiveViewer(user.email)
    const id = setInterval(() => pingActiveViewer(user.email), 30_000)
    return () => clearInterval(id)
  }, [user])

  const login = useCallback(async (email, password) => {
    const res = await doLogin(email, password)
    if (res.ok) {
      setUser(res.user)
      hydratedIdRef.current = res.user.id
    }
    return res
  }, [])

  const register = useCallback(async (data) => {
    const res = await doRegister(data)
    if (res.ok && res.user?.id) {
      setUser(res.user)
      hydratedIdRef.current = res.user.id
    }
    return res
  }, [])

  const logout = useCallback(async () => {
    await doLogout()
    setUser(null)
    hydratedIdRef.current = null
  }, [])

  const purchase = useCallback(async (courseId, paymentMeta) => {
    const res = await recordPurchase(courseId, paymentMeta)
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) return
      const u = await buildUserFromAuth(session.user)
      setUser(u)
    } catch (err) {
      console.warn('[AuthContext] refreshUser failed:', err)
    }
  }, [])

  const value = {
    user, ready,
    isLoggedIn: !!user,
    isAdmin:    !!user?.isAdmin,
    login, register, logout, purchase, refreshUser,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
