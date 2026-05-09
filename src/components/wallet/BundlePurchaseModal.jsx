import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, CreditCard, Smartphone, Building2, ShieldCheck,
  Coins, Sparkles, Lock, AlertCircle, CheckCircle2, Star, Tag,
} from 'lucide-react'
import { useWallet } from '../../contexts/WalletContext'

/**
 * Bundle purchase modal — config-driven.
 *
 * Two modes:
 *   1. Generic top-up         (no `forCourseId` prop)
 *      → User picks any shelf bundle from nexus.config.js → bundles
 *
 *   2. Smart top-up for a specific course (pass `forCourseId`)
 *      → Pre-selects the dynamically-recommended bundle for that course
 *      → Adds a "✨ recommended" badge explaining the loyalty math
 *
 * In production this calls /api/paymob (or Supabase Edge Function paymob-init)
 * with the dynamic { bundle_points, amount_egp_cents } payload. For this local
 * demo we simulate the success callback after a 2s delay.
 */

const PAY_METHODS = [
  { id: 'card',   label: 'Card',           sub: 'Visa / MasterCard / Meeza', icon: CreditCard, color: '#0047AB' },
  { id: 'wallet', label: 'Vodafone Cash',  sub: 'Mobile wallet',             icon: Smartphone, color: '#e60000' },
  { id: 'kiosk',  label: 'Fawry / Kiosk',  sub: 'Pay at any kiosk',          icon: Building2,  color: '#f0a500' },
]

export default function BundlePurchaseModal({ open, onClose, onSuccess, forCourseId = null }) {
  const w = useWallet()
  const [step, setStep]     = useState(0)         // 0 = pick bundle/method, 1 = processing, 2 = done
  const [method, setMethod] = useState('card')
  const [error, setError]   = useState('')

  /* ── Bundle catalog: shelf bundles + (optionally) dynamic recommendation ── */
  const shelf = useMemo(() => w.allShelfBundles ? w.allShelfBundles() : [], [w])

  const recommended = useMemo(() => {
    if (!forCourseId || !w.recommendedBundleFor) return null
    const r = w.recommendedBundleFor(forCourseId)
    /* Find shelf bundle that matches OR exceeds the recommendation */
    const match = shelf.find(b => b.points >= r.points)
    if (match) return { ...match, _recommended: true, coursePrice: r.coursePrice, residual: match.points - r.coursePrice }
    /* No shelf bundle large enough — synthesize one */
    return {
      id: 'auto', points: r.points, label: 'Recommended size',
      egp: r.egp, _recommended: true, _synthetic: true,
      coursePrice: r.coursePrice, residual: r.residual,
    }
  }, [forCourseId, shelf, w])

  /* All options to show, with recommended on top if applicable */
  const allBundles = recommended
    ? [recommended, ...shelf.filter(b => b.id !== recommended.id)]
    : shelf

  /* Default selection */
  const [selectedId, setSelectedId] = useState(null)
  useEffect(() => {
    if (!open) return
    if (recommended)       setSelectedId(recommended.id)
    else if (shelf.length) setSelectedId(shelf.find(b => b.popular)?.id || shelf[0].id)
  }, [open, recommended, shelf])

  const selected = allBundles.find(b => b.id === selectedId) || allBundles[0]

  const reset = () => { setStep(0); setError(''); setMethod('card'); setSelectedId(null) }

  const handlePay = async () => {
    if (!selected) { setError('Please pick a bundle.'); return }
    setStep(1); setError('')
    try {
      /* — In production: fetch('/api/paymob', { method:'POST', body: {
                  bundle_points: selected.points,
                  amount_egp_cents: selected.points * exchangeRate * 100,
                  integration_id: ... } })
            → user is sent to iframe → completes payment → webhook calls credit_wallet()
         For demo, we simulate a successful HMAC-verified callback: */
      await new Promise(r => setTimeout(r, 1800))
      const txnId = `PMB-${Date.now()}-${method.toUpperCase()}`
      const res = w.buyBundle({ points: selected.points, paymobTxnId: txnId, integration: method })
      if (!res.ok) { setError(res.error); setStep(0); return }
      setStep(2)
      setTimeout(() => { onSuccess?.(res); reset(); onClose() }, 1800)
    } catch (e) {
      setError(e.message || 'Payment failed.')
      setStep(0)
    }
  }

  const handleClose = () => { if (step !== 1) { reset(); onClose() } }

  if (!w?.ready) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 overflow-y-auto"
          style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden my-auto"
          >
            {/* Header */}
            <div className="relative p-6 text-white" style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
              {step !== 1 && (
                <button onClick={handleClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/70">
                  <X className="w-4 h-4" />
                </button>
              )}
              <div className="relative">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="w-5 h-5 text-yellow-300" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Buy Nexus Points</p>
                </div>
                <h2 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Choose your bundle
                </h2>
                {recommended ? (
                  <p className="text-xs text-white/65">
                    Smart pick for this module — leaves <strong className="text-yellow-300">{recommended.residual} NXP residual</strong> toward your next free course.
                  </p>
                ) : (
                  <p className="text-xs text-white/65">
                    Top up your wallet — every purchase builds residual toward a free course.
                  </p>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {step === 0 && (
                <>
                  {/* Bundles */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Select bundle</p>
                  <div className="space-y-2 mb-5">
                    {allBundles.map(b => (
                      <BundleRow
                        key={b.id}
                        bundle={b}
                        currency={w.currency}
                        selected={selectedId === b.id}
                        onSelect={() => setSelectedId(b.id)}
                      />
                    ))}
                  </div>

                  {/* Methods */}
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Payment Method</p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {PAY_METHODS.map(m => (
                      <button
                        key={m.id}
                        onClick={() => setMethod(m.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          method === m.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white"
                             style={{ background: m.color }}>
                          <m.icon className="w-4 h-4" />
                        </div>
                        <p className="text-[11px] font-semibold text-gray-700 leading-tight text-center">{m.label}</p>
                      </button>
                    ))}
                  </div>

                  {error && (
                    <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-sm"
                         style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                    </div>
                  )}

                  <button onClick={handlePay} disabled={!selected} className="btn-accent w-full justify-center disabled:opacity-50">
                    <Lock className="w-4 h-4" />
                    Pay {selected ? (selected.egp ?? Math.round(selected.points * w.exchangeRate)).toLocaleString() : '—'} {w.currency}
                  </button>

                  <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    Secure Paymob checkout · HMAC-validated · 100% encrypted
                  </p>
                </>
              )}

              {step === 1 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 mx-auto mb-4 border-4 border-blue-100 border-t-primary rounded-full animate-spin" />
                  <p className="font-semibold text-gray-900 mb-1">Processing payment…</p>
                  <p className="text-xs text-gray-500">Don't close or refresh.</p>
                </div>
              )}

              {step === 2 && selected && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                            className="text-center py-8">
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                       style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                    <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                    +{selected.points.toLocaleString()} NXP added!
                  </h3>
                  <p className="text-sm text-gray-500">Your wallet has been credited.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ── Single bundle option row ─────────────────── */
function BundleRow({ bundle, selected, onSelect, currency }) {
  const egp = bundle.egp ?? bundle.points
  const isRec = bundle._recommended
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all text-left ${
        selected ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
    >
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: isRec
             ? 'linear-gradient(135deg, #f0a500, #d97706)'
             : 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
        <Coins className="w-5 h-5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-gray-900 text-sm">{bundle.label}</p>
          {isRec && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-yellow-100 text-yellow-800 flex items-center gap-0.5">
              <Sparkles className="w-2.5 h-2.5" /> RECOMMENDED
            </span>
          )}
          {bundle.popular && !isRec && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 flex items-center gap-0.5">
              <Star className="w-2.5 h-2.5" /> POPULAR
            </span>
          )}
          {bundle.bestValue && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-green-100 text-green-700 flex items-center gap-0.5">
              <Tag className="w-2.5 h-2.5" /> BEST VALUE
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5">
          {bundle.description || (isRec ? `Covers your course + ${bundle.residual} residual` : '')}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-lg font-bold text-primary">{bundle.points.toLocaleString()}</p>
        <p className="text-[10px] text-gray-400 uppercase tracking-widest">NXP</p>
        <p className="text-xs text-gray-500 mt-1">{egp.toLocaleString()} {currency}</p>
      </div>
    </button>
  )
}
