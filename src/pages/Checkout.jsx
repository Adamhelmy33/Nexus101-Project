import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coins, ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle,
  Sparkles, BookOpen, Clock, Plus, Zap,
} from 'lucide-react'
import { COURSES, UNIVERSITIES } from '../data/constants'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'
import { hasPurchased } from '../lib/auth'
import BundlePurchaseModal from '../components/wallet/BundlePurchaseModal'
import SmartInsufficientBalanceModal from '../components/wallet/SmartInsufficientBalanceModal'

/**
 * Course checkout — fully driven by nexus.config.js.
 * 1. Course price is read dynamically based on its university (or per-course override).
 * 2. If wallet covers cost → 1-click redeem (Paymob is bypassed entirely).
 * 3. If insufficient → SmartInsufficientBalanceModal suggests the right bundle.
 */
export default function Checkout() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const w        = useWallet()

  const course      = COURSES.find(c => c.id === courseId)
  const university  = course && UNIVERSITIES.find(u => u.id === course.universityId)
  const [busy, setBusy]                       = useState(false)
  const [error, setError]                     = useState('')
  const [insufficientOpen, setInsufficientOpen] = useState(false)
  const [bundleOpen, setBundleOpen]             = useState(false)

  /* ── Guards ── */
  if (!course)                       return <Navigate to="/store" replace />
  if (!user)                         return <Navigate to="/login" state={{ from: `/checkout/${courseId}` }} replace />
  if (hasPurchased(user, course.id)) return <Navigate to="/my-courses" replace />
  if (!w?.ready)                     return null

  /* ── Dynamic pricing ── */
  const price       = w.pointsCostFor(course)
  const sufficient  = w.balance >= price
  const recommended = w.recommendedBundleFor(course)

  const handleRedeem = async () => {
    /* Wallet-first: if balance is sufficient, bypass Paymob entirely. */
    if (!sufficient) { setInsufficientOpen(true); return }
    setBusy(true); setError('')
    const res = w.redeem(course.id)
    setBusy(false)
    if (!res.ok) { setError(res.error); return }
    navigate(`/checkout/${course.id}/success`, {
      state: {
        course, txnId: res.ledgerId, method: 'wallet',
        pricePoints: res.purchasePrice, balanceAfter: res.balanceAfter,
      },
      replace: true,
    })
  }

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: '#f8faff' }}>
      <BundlePurchaseModal
        open={bundleOpen}
        onClose={() => setBundleOpen(false)}
        forCourseId={course.id}
        onSuccess={() => { setBundleOpen(false); setInsufficientOpen(false) }}
      />
      <SmartInsufficientBalanceModal
        open={insufficientOpen}
        course={course}
        onClose={() => setInsufficientOpen(false)}
        onBuyBundle={() => { setInsufficientOpen(false); setBundleOpen(true) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/store" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── Left: redeem panel ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">1-Click Checkout</p>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Unlock module
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Pay with Nexus Points from your wallet.
                {sufficient && <span className="ml-1 text-green-600 font-semibold">Your balance covers it 🎉</span>}
              </p>

              {/* Wallet snapshot */}
              <div className="rounded-2xl p-5 mb-5 relative overflow-hidden text-white"
                   style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)' }}>
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/55 mb-2 flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-yellow-300" /> Wallet Balance
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{w.balance.toLocaleString()}</span>
                  <span className="text-white/60 text-sm">NXP</span>
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="rounded-2xl p-5 mb-5 space-y-2 text-sm" style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
                <Row label={`${university?.shortName || 'Module'} price`} value={`${price.toLocaleString()} NXP`} />
                <Row label="Your balance"   value={`${w.balance.toLocaleString()} NXP`} />
                <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">After redeem</span>
                  <span className={`text-2xl font-bold ${sufficient ? 'text-primary' : 'text-red-500'}`}>
                    {(w.balance - price).toLocaleString()} NXP
                  </span>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {sufficient ? (
                  <motion.div key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {error && (
                      <div className="mb-3 flex items-start gap-2 p-3 rounded-xl text-sm"
                           style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                      </div>
                    )}
                    <button onClick={handleRedeem} disabled={busy}
                            className="btn-accent w-full justify-center disabled:opacity-60">
                      {busy ? (
                        <>
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Redeeming…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" /> Redeem for {price.toLocaleString()} NXP
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center mt-2">
                      ⚡ Instant — no payment gateway needed since your wallet covers it.
                    </p>
                  </motion.div>
                ) : (
                  <motion.div key="short" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                              className="rounded-2xl p-5 mb-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                    <div className="flex items-start gap-3 mb-4">
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-orange-900 text-sm">
                          You're {(price - w.balance).toLocaleString()} NXP short
                        </p>
                        <p className="text-xs text-orange-700 mt-0.5">
                          Top up with the recommended <strong>{recommended.points.toLocaleString()}-NXP</strong> bundle ({recommended.egp.toLocaleString()} {w.currency}). It leaves <strong>{recommended.residual} NXP</strong> residual toward your next free course.
                        </p>
                      </div>
                    </div>
                    <button onClick={() => setInsufficientOpen(true)} className="btn-primary w-full justify-center">
                      <Plus className="w-4 h-4" /> View options
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-5 flex items-center justify-center gap-2 text-xs text-gray-400" style={{ borderTop: '1px solid #f1f5f9' }}>
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Atomic ledger · 100% audit-trail · 7-day money-back
              </div>
            </div>
          </div>

          {/* ── Right: order summary ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-7 sticky top-24">
              <h2 className="font-semibold text-gray-900 mb-5">Order summary</h2>

              <div className="rounded-2xl overflow-hidden mb-5" style={{ background: '#f8faff' }}>
                <div className="h-24 flex items-end p-4 relative"
                     style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}>
                  <span className="text-3xl select-none">{course.icon}</span>
                  {university && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md text-white"
                          style={{ background: 'rgba(0,0,0,0.25)' }}>
                      {university.shortName}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="font-semibold text-sm text-gray-900">{course.title}</p>
                  <p className="text-xs text-gray-500 mb-3">{course.subtitle}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.modules} modules</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.hours}h</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-4 mb-5" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}>
                <p className="text-xs font-bold uppercase tracking-widest text-amber-800 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Loyalty math
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  Buy the recommended <strong>{recommended.points.toLocaleString()}-NXP</strong> bundle, spend <strong>{price.toLocaleString()}</strong> here,
                  keep <strong>{recommended.residual} NXP</strong>. After {w.freeCourseAfter} purchases at this price → free course unlocked.
                </p>
              </div>

              <ul className="space-y-2 text-xs text-gray-500">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Lifetime access</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Watch on any device</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> WhatsApp tutoring included</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> 7-day money-back guarantee</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-900 font-medium">{value}</span>
    </div>
  )
}
