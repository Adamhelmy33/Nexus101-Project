import { motion } from 'framer-motion'
import { Sparkles, Gift } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useWallet } from '../../contexts/WalletContext'

/**
 * Dynamic free-course progress.
 * Looks up the cheapest course in the catalog the user doesn't yet own,
 * then shows: "You are X NXP from a FREE [Course Title]!"
 *
 * If they already own everything, falls back to a generic free-course CTA.
 */
export default function FreeCourseProgress() {
  const w = useWallet()
  if (!w?.ready || !w.freeCourseProgress) return null

  const { targetPrice, course, balance, pointsAway, pct, canRedeem } = w.freeCourseProgress

  return (
    <div className="rounded-2xl p-5 relative overflow-hidden"
         style={{ background: canRedeem
           ? 'linear-gradient(135deg, #f59e0b 0%, #f0a500 50%, #d97706 100%)'
           : 'linear-gradient(135deg, #0047AB 0%, #1a6fd4 100%)' }}>

      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-yellow-300" />
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
            {canRedeem ? 'Free course unlocked!' : 'Towards a FREE course'}
          </p>
        </div>

        {canRedeem ? (
          <p className="text-3xl font-bold text-white mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
            🎉 Redeem now
          </p>
        ) : (
          <p className="text-3xl font-bold text-white mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            {pointsAway.toLocaleString()}
            <span className="text-white/55 text-base font-normal"> NXP away</span>
          </p>
        )}

        {course && !canRedeem && (
          <p className="text-xs text-white/65 mb-3 truncate">
            from <strong className="text-white">{course.title}</strong>
            <span className="text-white/55"> ({targetPrice.toLocaleString()} NXP)</span>
          </p>
        )}

        <div className="h-2 rounded-full bg-white/15 overflow-hidden mb-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #fde047, #f0a500)' }}
          />
        </div>

        <p className="text-xs text-white/70 leading-relaxed mb-3">
          {canRedeem ? (
            <>You have enough NXP for <strong className="text-white">{course?.title || 'a free module'}</strong> — go redeem it!</>
          ) : (
            <>You have <strong className="text-white">{balance.toLocaleString()} NXP</strong>. Buy more bundles → residual stacks up to a free course.</>
          )}
        </p>

        {canRedeem ? (
          <Link to={course ? `/checkout/${course.id}` : '/store'}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-primary hover:scale-105 transition-transform">
            <Sparkles className="w-3.5 h-3.5" /> Redeem now
          </Link>
        ) : (
          <p className="text-xs text-white/55 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> {pct}% there
          </p>
        )}
      </div>
    </div>
  )
}
