import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Coins, Plus, ArrowDownLeft, ArrowUpRight, BookOpen,
  CreditCard, Smartphone, Building2, ShoppingCart, Sparkles,
} from 'lucide-react'
import { useWallet } from '../contexts/WalletContext'
import { useAuth } from '../contexts/AuthContext'
import FreeCourseProgress from '../components/wallet/FreeCourseProgress'
import LoyaltyTierCard   from '../components/wallet/LoyaltyTierCard'
import BundlePurchaseModal from '../components/wallet/BundlePurchaseModal'
import { COURSES } from '../data/constants'

const KIND_META = {
  bundle_purchase:    { label: 'Bundle purchased',  icon: Plus,           color: '#22c55e' },
  course_enrollment:  { label: 'Course unlocked',   icon: BookOpen,       color: '#0047AB' },
  admin_adjust:       { label: 'Admin adjustment',  icon: ArrowUpRight,   color: '#9333ea' },
  refund:             { label: 'Refund',            icon: ArrowDownLeft,  color: '#f59e0b' },
}

const INTEGRATION_META = {
  card:    { label: 'Card',           icon: CreditCard, color: '#0047AB' },
  wallet:  { label: 'Vodafone Cash',  icon: Smartphone, color: '#e60000' },
  kiosk:   { label: 'Fawry / Kiosk',  icon: Building2,  color: '#f0a500' },
}

export default function Wallet() {
  const { user } = useAuth()
  const w = useWallet()
  const [modalOpen, setModalOpen] = useState(false)

  /* Belt-and-suspenders: also bail if a critical field is missing.
     Prevents `w.balance.toLocaleString()` from crashing during the
     post-logout render window before ProtectedRoute redirects. */
  if (!w?.ready || w.balance === undefined || !w.tier || !w.ledger) return null
  if (!user) return null

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#f8faff' }}>
      <BundlePurchaseModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
            <Coins className="w-4 h-4 text-yellow-500" /> Nexus Wallet
          </p>
          <h1 className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Your Nexus Points
          </h1>
          <p className="text-gray-500">
            Spend points on revision modules. Every bundle leaves a residual that stacks toward a free course.
          </p>
        </motion.div>

        {/* Top row: balance + free progress + tier */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">

          {/* Balance card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-2xl p-6 relative overflow-hidden text-white shadow-lg lg:col-span-1"
            style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)' }}
          >
            <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/5" />
            <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full" style={{ background: 'rgba(240,165,0,0.15)' }} />

            <div className="relative">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/55 mb-3 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-yellow-300" /> Current Balance
              </p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-bold">{w.balance.toLocaleString()}</span>
                <span className="text-white/55 text-sm">NXP</span>
              </div>
              <p className="text-xs text-white/55 mb-5">
                ≈ {Math.floor(w.balance / 1000)} module{Math.floor(w.balance / 1000) !== 1 ? 's' : ''} unlockable
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
                <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white/55 mb-0.5">Lifetime in</p>
                  <p className="font-bold text-white">+{w.lifetimeDeposited.toLocaleString()}</p>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <p className="text-white/55 mb-0.5">Lifetime spent</p>
                  <p className="font-bold text-white">−{w.lifetimeSpent.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => setModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all hover:scale-[1.02] hover:shadow-xl"
                style={{ background: '#f0a500', color: '#0a1628' }}
              >
                <Plus className="w-4 h-4" /> Buy a bundle
              </button>
            </div>
          </motion.div>

          {/* Free course progress */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <FreeCourseProgress />
          </motion.div>

          {/* Loyalty tier */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <LoyaltyTierCard />
          </motion.div>
        </div>

        {/* Quick stats strip */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                    className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <Stat label="Bundles bought"      value={w.bundlesPurchased} />
          <Stat label="Courses unlocked"    value={w.coursesEnrolledCount} />
          <Stat label="Free residual"       value={`${w.residual} / 1000`} />
          <Stat label="Tier"                value={w.tier.name} color={w.tier.color} />
        </motion.div>

        {/* Ledger */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
          <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Transaction history
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{w.ledger.length} entr{w.ledger.length === 1 ? 'y' : 'ies'}</p>
            </div>
            <button onClick={() => setModalOpen(true)} className="btn-primary text-xs px-3 py-1.5">
              <Plus className="w-3.5 h-3.5" /> Buy Points
            </button>
          </div>

          {w.ledger.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Coins className="w-10 h-10 mx-auto mb-3 text-yellow-400 opacity-50" />
              <p className="text-gray-500 font-semibold">No transactions yet</p>
              <p className="text-sm text-gray-400 mb-5">Buy your first bundle to get started.</p>
              <button onClick={() => setModalOpen(true)} className="btn-accent">
                <Sparkles className="w-4 h-4" /> Get points
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {w.ledger.map(row => {
                const meta = KIND_META[row.kind] || { label: row.kind, icon: Coins, color: '#6b7280' }
                const Icon = meta.icon
                const positive = row.deltaPoints > 0
                const integration = row.meta?.integration && INTEGRATION_META[row.meta.integration]
                const course = row.kind === 'course_enrollment' && COURSES.find(c => c.id === row.referenceId)
                return (
                  <div key={row.id} className="p-4 sm:p-5 flex items-center gap-4 hover:bg-blue-50/40 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: `${meta.color}15`, color: meta.color }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {course ? course.title : meta.label}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-2 flex-wrap">
                        <span>{new Date(row.createdAt).toLocaleString()}</span>
                        {integration && (
                          <span className="flex items-center gap-1">
                            <span>·</span>
                            <integration.icon className="w-3 h-3" style={{ color: integration.color }} />
                            {integration.label}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-base font-bold ${positive ? 'text-green-600' : 'text-gray-700'}`}>
                        {positive ? '+' : ''}{row.deltaPoints.toLocaleString()}
                        <span className="text-xs text-gray-400 font-medium ml-1">NXP</span>
                      </p>
                      <p className="text-[11px] text-gray-400">Bal {row.balanceAfter.toLocaleString()}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

        {/* Footer CTAs */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/store" className="rounded-2xl p-5 bg-white shadow-md border border-gray-100 hover:shadow-xl transition-all flex items-center gap-4 group">
            <ShoppingCart className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <div>
              <p className="font-bold text-gray-900">Spend your points</p>
              <p className="text-xs text-gray-500">Browse the revision store</p>
            </div>
          </Link>
          <Link to="/dashboard" className="rounded-2xl p-5 bg-white shadow-md border border-gray-100 hover:shadow-xl transition-all flex items-center gap-4 group">
            <Sparkles className="w-8 h-8 text-yellow-500 group-hover:rotate-12 transition-transform" />
            <div>
              <p className="font-bold text-gray-900">View your progress</p>
              <p className="text-xs text-gray-500">Skill heatmap & study hours</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div className="rounded-xl p-3 bg-white border border-gray-100">
      <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
      <p className="text-xl font-bold mt-0.5" style={{ color: color || '#0a1628' }}>{value}</p>
    </div>
  )
}
