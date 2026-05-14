import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  getCurrentUser,
  login as doLogin, logout as doLogout, register as doRegister,
  recordPurchase, pingActiveViewer,
} from '../lib/auth'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  /* ── On mount: hydrate from Supabase session, then subscribe to changes ── */
  useEffect(() => {
    let alive = true
    getCurrentUser().then(u => {
      if (!alive) return
      setUser(u)
      setReady(true)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!alive) return
      if (!session?.user) { setUser(null); return }
      const u = await getCurrentUser()
      setUser(u)
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
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const register = useCallback(async (data) => {
    const res = await doRegister(data)
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const logout = useCallback(async () => {
    await doLogout()
    setUser(null)
  }, [])

  const purchase = useCallback(async (courseId, paymentMeta) => {
    const res = await recordPurchase(courseId, paymentMeta)
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const value = {
    user, ready,
    isLoggedIn: !!user,
    isAdmin:    !!user?.isAdmin,
    login, register, logout, purchase,
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
