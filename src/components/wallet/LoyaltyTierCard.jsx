import { Award, ChevronRight } from 'lucide-react'
import { useWallet } from '../../contexts/WalletContext'

/**
 * Shows the student's cosmetic tier (Bronze/Silver/Gold/Platinum)
 * based on lifetime points deposited. Includes progress to next tier.
 */
export default function LoyaltyTierCard() {
  const w = useWallet()
  if (!w?.ready) return null

  const { tier, nextTier, lifetimeDeposited } = w
  const progressToNext = nextTier
    ? Math.round(((lifetimeDeposited - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100

  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-5 relative overflow-hidden">
      <div className="absolute -right-12 -top-12 w-32 h-32 rounded-full opacity-10"
           style={{ background: tier.color }} />

      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-4 h-4" style={{ color: tier.color }} />
          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Loyalty Tier</p>
        </div>

        <div className="flex items-baseline gap-2 mb-1">
          <h3 className="text-3xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: tier.color }}>
            {tier.name}
          </h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">{tier.perk}</p>

        {nextTier ? (
          <>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">
                {(nextTier.min - lifetimeDeposited).toLocaleString()} NXP to{' '}
                <strong className="text-gray-900">{nextTier.name}</strong>
              </span>
              <span className="text-gray-400">{progressToNext}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                   style={{ width: `${progressToNext}%`, background: nextTier.color }} />
            </div>
            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
              Next perk: <ChevronRight className="w-3 h-3" /> {nextTier.perk}
            </p>
          </>
        ) : (
          <p className="text-xs text-gray-400 flex items-center gap-1.5">
            🏆 You've reached the top tier — thank you for being a loyal student!
          </p>
        )}
      </div>
    </div>
  )
}
