import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getWalletState, creditWallet, redeemCourse } from '../lib/wallet'
import {
  pointsCostFor, recommendedBundleFor, bestShelfBundleFor, allShelfBundles,
  getFreeCourseProgress, pointsToEgp, pointsToEgpCents,
} from '../lib/pricing'
import nexusConfig from '../../nexus.config.js'

const WalletContext = createContext(null)

export function WalletProvider({ children }) {
  const { user } = useAuth()
  const [state, setState] = useState(null)

  /* Recompute whenever user changes or after a mutation */
  const refresh = useCallback(() => {
    if (!user) { setState(null); return }
    setState(getWalletState(user.email))
  }, [user])

  useEffect(() => { refresh() }, [refresh])

  /* Listen for cross-tab ledger updates */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'nexus_wallet_ledger') refresh()
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [refresh])

  /* ── Buy a bundle ──
     If `points` not provided, defaults to the cheapest shelf bundle. */
  const buyBundle = useCallback(({ points, paymobTxnId, integration = 'card' } = {}) => {
    if (!user) return { ok: false, error: 'Not signed in.' }
    const finalPoints = points || (allShelfBundles()[0]?.points ?? 1000)
    const txnId = paymobTxnId || `LOCAL-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const res = creditWallet({
      userEmail:  user.email,
      points:     finalPoints,
      paymobTxnId: txnId,
      integration,
      amountEgp:  pointsToEgp(finalPoints),
    })
    refresh()
    return res
  }, [user, refresh])

  /* ── Redeem a course (1-click if balance is sufficient) ── */
  const redeem = useCallback((courseId) => {
    if (!user) return { ok: false, error: 'Not signed in.' }
    const res = redeemCourse({ userEmail: user.email, courseId })
    refresh()
    return res
  }, [user, refresh])

  /* ── Loyalty / free-course progress (dynamic per user) ── */
  const freeCourseProgress = state
    ? getFreeCourseProgress(state.balance, user?.purchases || [])
    : null

  const value = {
    /* Wallet state */
    ...state,                              // balance, ledger, tier, etc.
    freeCourseProgress,                    // { targetPrice, course, pointsAway, pct, canRedeem }

    /* Pricing helpers (component-friendly) */
    pointsCostFor,
    recommendedBundleFor,
    bestShelfBundleFor,
    allShelfBundles,
    pointsToEgp,
    pointsToEgpCents,

    /* Config exposed for labels / copy */
    config:       nexusConfig,
    currency:     nexusConfig.currency,
    exchangeRate: nexusConfig.exchangeRate,
    freeCourseAfter: nexusConfig.loyalty.freeCourseAfter,

    /* Mutations */
    buyBundle, redeem, refresh,

    ready: !!state || !user,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const ctx = useContext(WalletContext)
  if (!ctx) throw new Error('useWallet must be used inside WalletProvider')
  return ctx
}
