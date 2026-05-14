import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Play, Clock, BookOpen, Lock, ShoppingCart, ArrowRight,
  CheckCircle2, Calendar, Sparkles,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { pointsCostFor } from '../lib/pricing'
import { useCatalog } from '../hooks/useCatalog'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.5 } },
}
const stagger = { show: { transition: { staggerChildren: 0.1 } } }

export default function MyCourses() {
  const { user, ready } = useAuth()
  const { courses, loading } = useCatalog()

  if (!ready || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8faff' }}>
        <div className="w-10 h-10 border-4 border-blue-200 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  const purchases = user?.purchases || []
  const ownedIds  = purchases.map(p => p.courseId)
  const ownedSet  = new Set(ownedIds)
  const owned     = courses.filter(c => ownedSet.has(c.id))
  const notOwned  = courses.filter(c => !ownedSet.has(c.id))

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#f8faff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2">My Learning Portal</p>
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Welcome back, {user?.name?.split(' ')[0] || 'student'} 👋
          </h1>
          <p className="text-gray-500">
            {owned.length === 0
              ? "You haven't purchased any modules yet — browse the store to get started."
              : `You own ${owned.length} module${owned.length > 1 ? 's' : ''}. Pick up where you left off.`}
          </p>
        </motion.div>

        {/* ── Empty state ── */}
        {owned.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 px-6 rounded-3xl bg-white shadow-md border border-gray-100"
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              No modules yet
            </h2>
            <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
              Visit the Revision Store to purchase your first module — instant lifetime access.
            </p>
            <Link to="/store" className="btn-primary">
              <ShoppingCart className="w-4 h-4" /> Browse Modules
            </Link>
          </motion.div>
        )}

        {/* ── Owned courses ── */}
        {owned.length > 0 && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-14"
          >
            {owned.map(course => {
              const purchase = purchases.find(p => p.courseId === course.id)
              return (
                <motion.div
                  key={course.id}
                  variants={fadeUp}
                  className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex flex-col"
                >
                  {/* Thumbnail */}
                  <Link to={`/learn/${course.id}`} className="block relative h-44 overflow-hidden group">
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
                    >
                      <span className="text-7xl select-none opacity-90">{course.icon}</span>
                    </div>
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center scale-0 group-hover:scale-100 transition-transform shadow-2xl">
                        <Play className="w-7 h-7 text-primary ml-1" fill="currentColor" />
                      </div>
                    </div>
                    {/* Owned badge */}
                    <span className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                          style={{ background: '#22c55e', color: 'white' }}>
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  </Link>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">{course.subtitle}</p>

                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                      <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {course.modules} modules</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {course.hours}h</span>
                    </div>

                    {/* Progress placeholder — replace when real progress tracked */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Progress</span>
                        <span className="font-semibold text-primary">0%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: '0%', background: 'linear-gradient(90deg, #0047AB, #1a6fd4)' }} />
                      </div>
                    </div>

                    <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5 mt-auto">
                      <Calendar className="w-3 h-3" />
                      Purchased {purchase?.purchasedAt ? new Date(purchase.purchasedAt).toLocaleDateString() : '—'}
                    </p>

                    <Link
                      to={`/learn/${course.id}`}
                      className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md"
                      style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
                    >
                      <Play className="w-4 h-4" /> Continue Watching
                    </Link>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}

        {/* ── Recommended (unowned) ── */}
        {notOwned.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-primary font-semibold text-xs uppercase tracking-widest mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3" /> Recommended for you
                </p>
                <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Expand your revision library
                </h2>
              </div>
              <Link to="/store" className="text-sm font-semibold text-primary hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {notOwned.map(course => (
                <Link
                  key={course.id}
                  to={`/checkout/${course.id}`}
                  className="card-hover bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 flex items-center gap-4 p-4 group"
                >
                  <div
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
                  >
                    <span className="text-white">{course.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{course.title}</p>
                    <p className="text-xs text-gray-400">{pointsCostFor(course).toLocaleString()} NXP · {course.duration}</p>
                  </div>
                  <ShoppingCart className="w-5 h-5 text-gray-300 group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
