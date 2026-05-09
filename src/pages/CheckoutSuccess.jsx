import { useEffect } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, ArrowRight, Play, Coins, Sparkles, BarChart3 } from 'lucide-react'
import { COURSES } from '../data/constants'

export default function CheckoutSuccess() {
  const { courseId } = useParams()
  const { state }    = useLocation()
  const navigate     = useNavigate()

  const course = state?.course || COURSES.find(c => c.id === courseId)
  const txnId         = state?.txnId         || `NEX-${Date.now()}`
  const pricePoints   = state?.pricePoints   || 1000
  const balanceAfter  = state?.balanceAfter

  useEffect(() => {
    const t = setTimeout(() => navigate('/my-courses'), 9000)
    return () => clearTimeout(t)
  }, [navigate])

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading…</p></div>
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: '#f8faff' }}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, -10, 10, 0] }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"
          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
        >
          <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={3} />
        </motion.div>

        <div className="inline-flex items-center gap-1.5 mb-2 text-xs font-semibold text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full">
          <Sparkles className="w-3 h-3" /> Module unlocked
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
          Redeem successful!
        </h1>
        <p className="text-gray-500 text-sm mb-6 leading-relaxed">
          You now have lifetime access to <strong>{course.title}</strong>.
        </p>

        <div className="rounded-2xl p-4 mb-6 text-left text-sm" style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
          <Row label="Module"        value={course.title} />
          <Row label="Points spent"  value={`${pricePoints.toLocaleString()} NXP`} mono />
          {balanceAfter !== undefined && (
            <Row label="Wallet now"    value={`${balanceAfter.toLocaleString()} NXP`} mono accent />
          )}
          <Row label="Transaction"   value={txnId} mono />
        </div>

        <div className="flex flex-col gap-3">
          <Link to="/my-courses" className="btn-primary justify-center">
            <Play className="w-4 h-4" /> Start watching
          </Link>
          <div className="flex gap-3">
            <Link to="/dashboard" className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-xs hover:border-gray-300 transition-colors">
              <BarChart3 className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <Link to="/store" className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-xs hover:border-gray-300 transition-colors">
              More modules <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
          <Coins className="w-3 h-3 text-yellow-500" /> Receipt in your transaction history
        </p>
      </motion.div>
    </div>
  )
}

function Row({ label, value, mono = false, accent = false }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-gray-500 text-xs">{label}</span>
      <span className={`font-semibold text-xs ${mono ? 'font-mono' : ''} ${accent ? 'text-primary' : 'text-gray-900'}`}>{value}</span>
    </div>
  )
}
