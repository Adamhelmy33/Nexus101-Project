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

  /* Refs that survive across renders without triggering them: */
  const hydratedIdRef = useRef(null)        // last user id we built a user object for
  const recoveringRef = useRef(true)        // true until getSession() resolves on mount

  /* ── On mount: recover the persisted session, then subscribe ──
     supabase-js reads the auth token from localStorage on instantiation
     but the in-memory session is only populated after getSession() awaits
     once. Until that happens, onAuthStateChange may briefly fire with
     INITIAL_SESSION + null even though a valid token exists. We MUST NOT
     setUser(null) during that window or the UI flickers logged-out. */
  useEffect(() => {
    let alive = true

    async function recoverSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!alive) return

        if (error) {
          console.warn('[AuthContext] getSession error:', error.message)
          setUser(null)
        } else if (!session?.user) {
          // No persisted session — definitively logged out
          setUser(null)
        } else {
          const u = await buildUserFromAuth(session.user)
          if (!alive) return
          setUser(u)
          hydratedIdRef.current = session.user.id
        }
      } catch (err) {
        console.warn('[AuthContext] recoverSession threw:', err)
        if (alive) setUser(null)
      } finally {
        if (alive) {
          recoveringRef.current = false
          setReady(true)
        }
      }
    }
    recoverSession()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return

      // While we're still recovering the persisted session on mount,
      // ignore null sessions — getSession() is the authoritative source.
      // Acting on a stale null here is the classic "auto sign-out on
      // refresh" bug.
      if (recoveringRef.current && !session?.user) return

      if (!session?.user) {
        // SIGNED_OUT (or session genuinely expired post-recovery)
        setUser(null)
        hydratedIdRef.current = null
        return
      }

      // Same user as already loaded — INITIAL_SESSION right after our
      // own recoverSession(), or a TOKEN_REFRESHED tick. No refetch needed.
      if (hydratedIdRef.current === session.user.id) return

      try {
        const u = await buildUserFromAuth(session.user)
        if (!alive) return
        setUser(u)
        hydratedIdRef.current = session.user.id
      } catch (err) {
        console.warn('[AuthContext] onAuthStateChange refetch failed:', err)
      }
    })

    return () => { alive = false; sub.subscription.unsubscribe() }
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
