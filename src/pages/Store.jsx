import { useState, useRef, useMemo, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Users, Clock, CheckCircle2, Star, Search, ArrowRight,
  ShoppingCart, Lock, BookOpen, Tag, Sparkles, GraduationCap,
  Layers, X,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { hasPurchased } from '../lib/auth'
import { pointsCostFor } from '../lib/pricing'
import { useCatalog } from '../hooks/useCatalog'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

/* ─── University category card (top of store) ── */
function UniversityChip({ uni, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all flex-shrink-0 ${
        isActive
          ? 'border-primary shadow-lg scale-[1.02]'
          : 'border-gray-200 hover:border-primary/40 bg-white'
      }`}
      style={isActive ? { background: `linear-gradient(135deg, ${uni.color}, ${uni.color}dd)` } : {}}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: isActive ? 'rgba(255,255,255,0.18)' : `${uni.color}15` }}
      >
        <span style={{ filter: isActive ? 'brightness(0) invert(1)' : 'none' }}>{uni.icon}</span>
      </div>
      <div className="text-left min-w-0">
        <p className={`text-xs font-mono uppercase tracking-widest ${isActive ? 'text-white/70' : 'text-gray-400'}`}>
          {uni.shortName}
        </p>
        <p className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
          {count} module{count !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  )
}

/* ─── Module card ─────────────────────────────── */
function ModuleCard({ course, owned, university }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'show' : 'hidden'}
      whileHover={{ y: -4 }}
      className="rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 flex flex-col transition-shadow hover:shadow-xl"
    >
      <div
        className="h-44 flex flex-col justify-end p-6 relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
      >
        {course.badge && (
          <span className="absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full"
                style={{ background: '#f0a500', color: '#0a1628' }}>
            {course.badge}
          </span>
        )}
        {owned && (
          <span className="absolute top-4 left-4 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5"
                style={{ background: '#22c55e', color: 'white' }}>
            <CheckCircle2 className="w-3 h-3" /> Owned
          </span>
        )}
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />

        {university && (
          <span className="absolute bottom-4 right-4 text-[10px] font-bold uppercase tracking-widest text-white/80 px-2 py-1 rounded-md backdrop-blur-sm"
                style={{ background: 'rgba(0,0,0,0.25)' }}>
            {university.shortName}
          </span>
        )}

        <span className="text-5xl mb-2 select-none relative z-10">{course.icon}</span>
        <h3 className="text-white font-bold text-xl leading-tight relative z-10" style={{ fontFamily: 'Playfair Display, serif' }}>
          {course.title}
        </h3>
        <p className="text-white/70 text-sm mt-1 relative z-10">{course.subtitle}</p>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">{course.description}</p>

        <div className="flex items-center gap-3 mb-4 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {(course.students ?? 0).toLocaleString()}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.hours}h</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {course.modules}</span>
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> 4.9</span>
        </div>

        <ul className="space-y-1.5 mb-5 flex-1">
          {(course.topics ?? []).slice(0, 4).map(topic => (
            <li key={topic} className="flex items-start gap-2 text-sm text-gray-600">
              <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              {topic}
            </li>
          ))}
          {(course.topics ?? []).length > 4 && (
            <li className="text-xs text-gray-400 pl-6">+ {course.topics.length - 4} more topics</li>
          )}
        </ul>

        <div className="pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-end justify-between mb-4">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">{course.duration}</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-primary">{pointsCostFor(course).toLocaleString()}</span>
                <span className="text-gray-400 text-xs uppercase font-semibold tracking-widest">NXP</span>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[10px] font-semibold text-yellow-700 bg-yellow-50 px-2 py-1 rounded-full">
              <Tag className="w-3 h-3" />
              {(university?.shortName || course.universityId)?.toUpperCase()}
            </span>
          </div>

          {owned ? (
            <Link
              to="/my-courses"
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md"
              style={{ background: '#22c55e' }}
            >
              <CheckCircle2 className="w-4 h-4" /> Continue Watching
            </Link>
          ) : (
            <Link
              to={`/checkout/${course.id}`}
              className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md"
              style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
            >
              <ShoppingCart className="w-4 h-4" /> Buy Access
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function Store() {
  const [params, setParams] = useSearchParams()
  const [active, setActive] = useState(params.get('uni') || 'all')
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const { courses, universities, loading } = useCatalog()

  /* Sync URL when filter changes */
  useEffect(() => {
    if (active === 'all') {
      if (params.get('uni')) { setParams({}, { replace: true }) }
    } else {
      setParams({ uni: active }, { replace: true })
    }
    // eslint-disable-next-line
  }, [active])

  const filtered = useMemo(() => {
    let list = courses
    if (active !== 'all') list = list.filter(c => c.universityId === active)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        (c.topics ?? []).some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [courses, active, search])

  /* Group by university for "All" view */
  const grouped = useMemo(() => {
    if (active !== 'all') return null
    return universities.map(uni => ({
      uni,
      courses: filtered.filter(c => c.universityId === uni.id),
    })).filter(g => g.courses.length > 0)
  }, [universities, active, filtered])

  return (
    <div>
      {/* ── Hero ── */}
      <div className="pt-36 sm:pt-28 pb-16 text-center relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)' }}>
        <div className="absolute inset-0 opacity-5"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-3xl mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                      className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="text-white/90 text-xs font-medium">Lifetime access · 7-day money-back guarantee</span>
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                     className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                     style={{ fontFamily: 'Playfair Display, serif' }}>
            Revision Modules Store
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-white/65 text-base sm:text-lg px-2 sm:px-0">
            High-intensity revisions for UH, BUE, GUC, Coventry and Medicine modules.
          </motion.p>
        </div>
        <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 50" fill="none">
          <path d="M0 50L1440 50L1440 20C1200 45 960 55 720 40C480 25 240 10 0 30V50Z" fill="white" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* ── University category bar ── */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <GraduationCap className="w-3.5 h-3.5 text-primary" />
            Choose your university
          </p>
          <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-16 w-32 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
              ))
            ) : (
              <>
                {/* "All" pill */}
                <button
                  onClick={() => setActive('all')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all flex-shrink-0 ${
                    active === 'all'
                      ? 'border-primary shadow-lg scale-[1.02] bg-primary text-white'
                      : 'border-gray-200 hover:border-primary/40 bg-white'
                  }`}
                >
                  <Layers className={`w-5 h-5 ${active === 'all' ? 'text-white' : 'text-primary'}`} />
                  <div className="text-left">
                    <p className={`text-xs font-mono uppercase tracking-widest ${active === 'all' ? 'text-white/70' : 'text-gray-400'}`}>All</p>
                    <p className="text-sm font-semibold">{courses.length} modules</p>
                  </div>
                </button>

                {universities.map(uni => (
                  <UniversityChip
                    key={uni.id}
                    uni={uni}
                    isActive={active === uni.id}
                    onClick={() => setActive(uni.id)}
                    count={courses.filter(c => c.universityId === uni.id).length}
                  />
                ))}
              </>
            )}
          </div>
        </div>

        {/* ── Search + count ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-8">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-900">{filtered.length}</span>{' '}
            module{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search modules, topics…"
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Login nudge for guests ── */}
        {!user && (
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-2xl flex items-center gap-3"
            style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">Sign in to buy and access modules</p>
              <p className="text-xs text-gray-500">You'll need an account to purchase and watch your revision content.</p>
            </div>
            <Link to="/login" className="btn-primary text-xs px-4 py-2 flex-shrink-0">
              Sign In
            </Link>
          </motion.div>
        )}

        {/* ── Grid (grouped or flat) ── */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 animate-pulse">
                  <div className="h-44 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-3 bg-gray-100 rounded w-5/6" />
                    <div className="h-3 bg-gray-100 rounded w-2/3" />
                    <div className="h-10 bg-gray-200 rounded-xl mt-4" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="text-center py-20 text-gray-400">
              <p className="text-5xl mb-4">📭</p>
              <p className="text-lg">No modules match that search.</p>
            </motion.div>
          ) : grouped ? (
            <motion.div key={'grouped' + search} variants={stagger} initial="hidden" animate="show" className="space-y-12">
              {grouped.map(({ uni, courses: groupCourses }) => (
                <div key={uni.id}>
                  <div className="flex items-center justify-between mb-5 pb-3" style={{ borderBottom: `2px solid ${uni.color}25` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl"
                           style={{ background: `${uni.color}15` }}>
                        {uni.icon}
                      </div>
                      <div>
                        <p className="text-xs font-mono uppercase tracking-widest" style={{ color: uni.color }}>{uni.shortName}</p>
                        <h3 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                          {uni.name}
                        </h3>
                      </div>
                    </div>
                    <button
                      onClick={() => setActive(uni.id)}
                      className="text-sm font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                      style={{ color: uni.color }}
                    >
                      View all <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groupCourses.map(course => (
                      <ModuleCard
                        key={course.id}
                        course={course}
                        owned={hasPurchased(user, course.id)}
                        university={uni}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div key={'flat-' + active + search} variants={stagger} initial="hidden" animate="show"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(course => (
                <ModuleCard
                  key={course.id}
                  course={course}
                  owned={hasPurchased(user, course.id)}
                  university={universities.find(u => u.id === course.universityId)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
