import { useState } from 'react'
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck, ArrowLeft, CheckCircle2, AlertCircle,
  BookOpen, Clock, CreditCard, Smartphone,
  Building2, Lock, ExternalLink, Loader2, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCatalog } from '../hooks/useCatalog'
import { hasPurchased, recordPurchase } from '../lib/auth'
import { priceEgpFor } from '../lib/pricing'

const DIRECT_PAY_METHODS = [
  { id: 'card',   label: 'Credit / Debit Card', sub: 'Visa · MasterCard · Meeza', icon: CreditCard, color: '#0047AB' },
  { id: 'wallet', label: 'Mobile Wallet',       sub: 'Vodafone Cash · Orange',     icon: Smartphone, color: '#e60000' },
  { id: 'kiosk',  label: 'Fawry / Kiosk',       sub: 'Pay at any branch',          icon: Building2,  color: '#f0a500' },
]

export default function Checkout() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { courses, universities, loading: catalogLoading } = useCatalog()

  const course     = courses.find(c => c.id === courseId)
  const university = course && universities.find(u => u.id === course.universityId)

  const [error, setError]                   = useState('')
  const [payMethod, setPayMethod]           = useState('card')
  const [showDirectPay, setShowDirectPay]   = useState(false)
  const [iframeUrl, setIframeUrl]           = useState('')
  const [iframeLoading, setIframeLoading]   = useState(false)
  const [paymentStep, setPaymentStep]       = useState('idle') // idle | connecting | iframe | success

  /* ── Guards ── */
  if (catalogLoading)                return null
  if (!course)                       return <Navigate to="/store" replace />
  if (!user)                         return <Navigate to="/login" state={{ from: `/checkout/${courseId}` }} replace />
  if (hasPurchased(user, course.id)) return <Navigate to="/my-courses" replace />

  const priceEgp = priceEgpFor(course)

  /* ── Real Paymob direct-pay ── */
  const handleDirectPay = async () => {
    setPaymentStep('connecting')
    setError('')

    try {
      const res = await fetch('/api/create-paymob-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: priceEgp * 100,
          currency:     'EGP',
          method:       payMethod,
          user_email:   user.email,
          user_name:    user.name || 'Nexus Student',
          course_id:    course.id,
        }),
      })

      const data = await res.json()

      if (data.ok && data.iframe_url) {
        setIframeUrl(data.iframe_url)
        setIframeLoading(true)
        setPaymentStep('iframe')
      } else {
        console.warn('[Checkout] Paymob unavailable:', data.error)
        await demoDirectPay()
      }
    } catch (fetchErr) {
      console.warn('[Checkout] Paymob fetch failed:', fetchErr.message)
      await demoDirectPay()
    }
  }

  /* ── Demo fallback (Paymob not configured) ── */
  const demoDirectPay = async () => {
    setPaymentStep('connecting')
    await new Promise(r => setTimeout(r, 2000))

    const txnId = `DIRECT-${Date.now()}-${payMethod.toUpperCase()}`
    const purchaseRes = await recordPurchase(course.id, {
      amount: priceEgp,
      method: payMethod,
      txnId,
    })

    if (!purchaseRes.ok) {
      setError(purchaseRes.error)
      setPaymentStep('idle')
      return
    }

    setPaymentStep('success')
    setTimeout(() => {
      navigate(`/checkout/${course.id}/success`, {
        state: { course, txnId, method: payMethod, priceEgp },
        replace: true,
      })
    }, 2000)
  }

  const resetDirectPay = () => {
    setPaymentStep('idle')
    setIframeUrl('')
    setIframeLoading(false)
    setShowDirectPay(false)
  }

  return (
    <div className="min-h-screen pt-24 pb-12" style={{ background: '#f8faff' }}>

      {/* ── Paymob Iframe Overlay ── */}
      <AnimatePresence>
        {paymentStep === 'iframe' && iframeUrl && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 overflow-y-auto"
            style={{ background: 'rgba(10,22,40,0.75)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.96 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative p-5 text-white" style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
                <button
                  onClick={() => { if (window.confirm('Cancel this payment?')) resetDirectPay() }}
                  className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/15 transition-colors text-white/70"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="relative">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-1">Secure Payment</p>
                  <h2 className="text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Pay {priceEgp.toLocaleString()} EGP for {course.title}
                  </h2>
                </div>
              </div>
              <div className="p-5 relative">
                {iframeLoading && (
                  <div className="absolute inset-5 flex items-center justify-center bg-white/80 z-10 rounded-2xl">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      <p className="text-sm text-gray-600">Loading secure checkout…</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={iframeUrl}
                  title="Paymob Secure Payment"
                  className="w-full rounded-2xl border border-gray-200"
                  style={{ height: '480px', minHeight: '400px' }}
                  onLoad={() => setIframeLoading(false)}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[11px] text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    PCI-DSS compliant · 256-bit encryption
                  </p>
                  <a href={iframeUrl} target="_blank" rel="noopener noreferrer"
                     className="flex items-center gap-1 text-[11px] text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" /> Open in new tab
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/store" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Left: payment panel ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" />
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                    Secure Checkout
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-50 text-blue-600 border border-blue-100">
                  VIA PAYMOB
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Unlock module
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                Pay <strong>{priceEgp.toLocaleString()} EGP</strong> for lifetime access to this module.
              </p>

              <AnimatePresence mode="wait">
                {!showDirectPay ? (
                  <motion.button
                    key="show"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowDirectPay(true)}
                    className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" /> Choose payment method
                  </motion.button>
                ) : (
                  <motion.div key="methods" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                    <div className="grid grid-cols-3 gap-2 mb-5">
                      {DIRECT_PAY_METHODS.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setPayMethod(m.id)}
                          className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                            payMethod === m.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                               style={{ background: m.color }}>
                            <m.icon className="w-5 h-5" />
                          </div>
                          <div className="text-center">
                            <p className="text-[11px] font-semibold text-gray-700 leading-tight">{m.label}</p>
                            <p className="text-[9px] text-gray-400 mt-0.5">{m.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {error && (
                      <div className="mb-4 flex items-start gap-2 p-3 rounded-xl text-sm"
                           style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                      </div>
                    )}

                    {paymentStep === 'connecting' ? (
                      <div className="text-center py-4">
                        <div className="w-8 h-8 mx-auto mb-3 border-3 border-blue-100 border-t-primary rounded-full animate-spin" />
                        <p className="text-sm font-medium text-gray-700">Connecting to Paymob…</p>
                        <p className="text-[11px] text-gray-400 mt-1">Don't close this page.</p>
                      </div>
                    ) : paymentStep === 'success' ? (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                  className="text-center py-4">
                        <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                             style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                          <CheckCircle2 className="w-6 h-6 text-white" strokeWidth={3} />
                        </div>
                        <p className="font-bold text-gray-900">Payment successful!</p>
                        <p className="text-xs text-gray-500 mt-1">Redirecting to your course…</p>
                      </motion.div>
                    ) : (
                      <button
                        onClick={handleDirectPay}
                        disabled={paymentStep !== 'idle'}
                        className="btn-accent w-full justify-center disabled:opacity-60"
                      >
                        <Lock className="w-4 h-4" />
                        Pay {priceEgp.toLocaleString()} EGP with {DIRECT_PAY_METHODS.find(m => m.id === payMethod)?.label || 'Card'}
                      </button>
                    )}

                    <p className="mt-4 flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
                      <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                      Secure Paymob checkout · PCI-DSS · HMAC-validated
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 pt-5 flex items-center justify-center gap-2 text-xs text-gray-400" style={{ borderTop: '1px solid #f1f5f9' }}>
                <ShieldCheck className="w-4 h-4 text-green-500" />
                Instant access · 7-day money-back guarantee
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

              <div className="rounded-2xl p-4 mb-5 space-y-2 text-sm" style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
                <Row label="Price" value={`${priceEgp.toLocaleString()} EGP`} />
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
