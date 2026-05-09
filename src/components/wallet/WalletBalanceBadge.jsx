import { Link } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { useWallet } from '../../contexts/WalletContext'

/**
 * Compact balance pill for the navbar.
 * Click → /wallet
 */
export default function WalletBalanceBadge({ variant = 'light' }) {
  const wallet = useWallet()
  if (!wallet?.ready || wallet.balance === undefined) return null

  const isDark = variant === 'dark'
  return (
    <Link
      to="/wallet"
      title={`${wallet.balance.toLocaleString()} Nexus Points`}
      className={`group hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl font-semibold text-sm transition-all hover:scale-105 ${
        isDark
          ? 'bg-white/10 text-white hover:bg-white/15'
          : 'bg-primary/10 text-primary hover:bg-primary/15'
      }`}
    >
      <Coins className={`w-4 h-4 ${isDark ? 'text-yellow-300' : 'text-yellow-500'} group-hover:rotate-12 transition-transform`} />
      <span>{wallet.balance.toLocaleString()}</span>
      <span className={`text-[10px] uppercase tracking-widest ${isDark ? 'text-white/55' : 'text-primary/55'}`}>NXP</span>
    </Link>
  )
}
