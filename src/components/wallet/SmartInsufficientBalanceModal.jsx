import { motion, AnimatePresence } from 'framer-motion'
import { useMemo } from 'react'
import { AlertCircle, X, Sparkles, Coins, ArrowRight, BookOpen, Plus } from 'lucide-react'
import { useWallet } from '../../contexts/WalletContext'

/**
 * SmartInsufficientBalanceModal
 * ─────────────────────────────────────
 * Shown when a user clicks "Enroll" on a course they can't afford.
 * Pulls the course price from `nexus.config.js` via WalletContext, then
 * dynamically suggests the smallest bundle that covers it (and explains
 * the leftover-residual loyalty math).
 */
export default function SmartInsufficientBalanceModal({
  open, onClose, course, onBuyBundle,
}) {
  const w = useWallet()

  const data = useMemo(() => {
    if (!course || !w?.ready) return null
    const price        = w.pointsCostFor(course)
    const recommended  = w.recommendedBundleFor(course)
    const shortBy      = Math.max(0, price - w.balance)
    return { price, recommended, shortBy }
  }, [course, w])

  if (!data) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6"
          style={{ background: 'rgba(10,22,40,0.7)', backdropFilter: 'blur(8px)' }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="relative p-6 text-white" style={{ background: 'linear-gradient(135deg, #f59e0b, #f0a500, #d97706)' }}>
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
              <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/15 text-white/70">
                <X className="w-4 h-4" />
              </button>
              <div className="relative flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-white/15 flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">Insufficient Balance</p>
                  <h2 className="text-xl font-bold leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    You're {data.shortBy.toLocaleString()} NXP short
                  </h2>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              {/* Course summary */}
              <div className="flex items-center gap-3 p-3 rounded-xl mb-5" style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
                     style={{ background: `linear-gradient(135deg, ${course.gradientFrom || '#0047AB'}, ${course.gradientTo || '#1a6fd4'})` }}>
                  {course.icon || <BookOpen className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                  <p className="text-xs text-gray-500 truncate">{course.subtitle || course.universityId?.toUpperCase()}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-bold text-primary">{data.price.toLocaleString()}</p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">NXP</p>
                </div>
              </div>

              {/* Balance vs cost */}
              <div className="space-y-2 mb-5 text-sm">
                <Row label="Module cost"   value={`${data.price.toLocaleString()} NXP`} />
                <Row label="Your balance"  value={`${w.balance.toLocaleString()} NXP`} />
                <div className="pt-2 mt-2 border-t border-gray-200 flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Short by</span>
                  <span className="text-xl font-bold text-orange-600">−{data.shortBy.toLocaleString()} NXP</span>
                </div>
              </div>

              {/* The smart suggestion */}
              <div className="rounded-2xl p-4 mb-5" style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', border: '1px solid #fcd34d' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest text-amber-800 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Suggested bundle
                </p>
                <div className="flex items-end justify-between mb-2">
                  <div>
                    <p className="text-3xl font-bold text-amber-900">
                      {data.recommended.points.toLocaleString()}
                      <span className="text-sm font-medium text-amber-700"> NXP</span>
                    </p>
                    <p className="text-xs text-amber-800 mt-0.5">≈ {data.recommended.egp.toLocaleString()} {w.currency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] text-amber-800 uppercase font-semibold tracking-widest">Residual after</p>
                    <p className="text-2xl font-bold text-amber-900">+{data.recommended.residual}</p>
                    <p className="text-[10px] text-amber-700">stacks toward free course</p>
                  </div>
                </div>
                <p className="text-xs text-amber-900 leading-relaxed mt-3 pt-3 border-t border-amber-300">
                  💡 After <strong>{w.freeCourseAfter} purchases</strong> at this price, you'll have <strong>{data.price.toLocaleString()} NXP</strong> in residual — enough for a <strong>FREE course</strong>.
                </p>
              </div>

              {/* CTAs */}
              <button onClick={onBuyBundle} className="btn-accent w-full justify-center mb-2">
                <Plus className="w-4 h-4" /> Buy {data.recommended.points.toLocaleString()} NXP Bundle
              </button>
              <button onClick={onClose} className="w-full text-xs text-gray-500 hover:text-primary py-2 transition-colors">
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
