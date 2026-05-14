import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import {
  login as doLogin, logout as doLogout, register as doRegister,
  recordPurchase, pingActiveViewer,
} from '../lib/auth'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

/* Build the in-app user object directly from a Supabase session.
   Kept inline so AuthContext owns the loading lifecycle and any
   fetch failure can be swallowed without leaving `ready` stuck. */
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
  /* Track the currently hydrated user id so we can dedupe redundant
     re-fetches when onAuthStateChange fires for the same session. */
  const hydratedIdRef = useRef(null)

  /* ── On mount: hydrate from the persisted session, then subscribe ──
     Critical: `ready` MUST flip to true regardless of network outcome,
     or ProtectedRoute will spin forever. */
  useEffect(() => {
    let alive = true

    async function hydrate() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!alive) return
        if (error || !session?.user) {
          setUser(null)
          hydratedIdRef.current = null
        } else {
          const u = await buildUserFromAuth(session.user)
          if (!alive) return
          setUser(u)
          hydratedIdRef.current = session.user.id
        }
      } catch (err) {
        console.warn('[AuthContext] hydrate failed:', err)
        if (alive) setUser(null)
      } finally {
        if (alive) setReady(true)
      }
    }
    hydrate()

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!alive) return

      // SIGNED_OUT or no session → clear
      if (!session?.user) {
        setUser(null)
        hydratedIdRef.current = null
        setReady(true)
        return
      }

      // INITIAL_SESSION fires right after our own hydrate(). Skip if we
      // already loaded this user — saves a duplicate Supabase round-trip
      // and prevents a momentary `null → user` flicker.
      if (event === 'INITIAL_SESSION' && hydratedIdRef.current === session.user.id) {
        setReady(true)
        return
      }

      // TOKEN_REFRESHED fires periodically — same user, no need to refetch
      if (event === 'TOKEN_REFRESHED' && hydratedIdRef.current === session.user.id) {
        return
      }

      try {
        const u = await buildUserFromAuth(session.user)
        if (!alive) return
        setUser(u)
        hydratedIdRef.current = session.user.id
      } catch (err) {
        console.warn('[AuthContext] onAuthStateChange refetch failed:', err)
      } finally {
        if (alive) setReady(true)
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

  /* Re-pull the user from Supabase. Used after a course purchase so
     `user.purchases` reflects the new row even if the optimistic
     update from recordPurchase was lost to an error. */
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
