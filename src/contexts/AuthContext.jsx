import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  initAuthDB, getCurrentUser,
  login as doLogin, logout as doLogout, register as doRegister,
  recordPurchase, pingActiveViewer,
} from '../lib/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  /* ── On mount: load current user ── */
  useEffect(() => {
    initAuthDB()
    setUser(getCurrentUser())
    setReady(true)
  }, [])

  /* ── Heartbeat: ping every 30s if logged in ── */
  useEffect(() => {
    if (!user) return
    pingActiveViewer(user.email)
    const id = setInterval(() => pingActiveViewer(user.email), 30_000)
    return () => clearInterval(id)
  }, [user])

  const login = useCallback((email, password) => {
    const res = doLogin(email, password)
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const register = useCallback((data) => {
    const res = doRegister(data)
    if (res.ok) setUser(res.user)
    return res
  }, [])

  const logout = useCallback(() => {
    doLogout()
    setUser(null)
  }, [])

  const purchase = useCallback((courseId, paymentMeta) => {
    const res = recordPurchase(courseId, paymentMeta)
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
