import { useState, useRef, useMemo, useEffect, useCallback } from 'react'
import { Link, useSearchParams, useParams, Navigate } from 'react-router-dom'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Users, Clock, CheckCircle2, Star, Search, ArrowRight, ArrowLeft,
  BookOpen, Sparkles, GraduationCap,
  Layers, X, ChevronRight, Package, Tag, ShoppingCart, EyeOff,
} from 'lucide-react'

import { supabase } from '../lib/supabase'
import { useCatalog } from '../hooks/useCatalog'
import { UH_SUBJECTS } from '../data/constants'
import WhatsAppGroupPopup from '../components/WhatsAppGroupPopup'

/* ─── Subject icon map ───────────────────────── */
const SUBJECT_ICONS = {
  engineering:   '⚙️',
  physiotherapy: '🩺',
  pharmacy:      '💊',
}
const TRACK_ICONS = {
  'ifp':     '🎓',
  'level-4': '📘',
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

/* ─── University category chip (multi-uni bar) ── */
function UniversityChip({ uni, isActive, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all flex-shrink-0 ${isActive
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
          {count} subject{count !== 1 ? 's' : ''}
        </p>
      </div>
    </button>
  )
}

/* ─── Subject card ───────────────────────────── */
function SubjectCard({ subject, uniId }) {
  const dest = subject.tracks.length === 1
    ? `/store/${uniId}/${subject.id}/${subject.tracks[0].id}`
    : `/store/${uniId}/${subject.id}`

  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }} className="group">
      <Link
        to={dest}
        className="block rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100 transition-shadow hover:shadow-2xl"
      >
        <div
          className="h-44 relative overflow-hidden flex flex-col items-center justify-center p-6"
          style={{ background: `linear-gradient(135deg, ${subject.gradientFrom}, ${subject.gradientTo})` }}
        >
          <div className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="relative z-10 text-center">
            <div className="text-6xl mb-2 select-none">{SUBJECT_ICONS[subject.id] ?? '📚'}</div>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {subject.label}
          </h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{subject.description}</p>
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {subject.tracks.length === 1 ? subject.tracks[0].label : `${subject.tracks.length} tracks`}
            </span>
            <span className="text-sm font-semibold text-primary group-hover:gap-2 flex items-center gap-1 transition-all">
              {subject.tracks.length === 1 ? 'View modules' : 'Choose track'}
              <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ─── Track card ─────────────────────────────── */
function TrackCard({ track, subject, uniId }) {
  return (
    <motion.div variants={fadeUp} whileHover={{ y: -6 }} className="group">
      <Link
        to={`/store/${uniId}/${subject.id}/${track.id}`}
        className="block rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100 transition-shadow hover:shadow-2xl"
      >
        <div
          className="h-44 relative overflow-hidden flex flex-col items-center justify-center p-6"
          style={{ background: `linear-gradient(135deg, ${subject.gradientFrom}, ${subject.gradientTo})` }}
        >
          <div className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />
          <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-white/10" />
          <div className="relative z-10 text-center">
            <div className="text-6xl mb-2 select-none">{TRACK_ICONS[track.id] ?? '📚'}</div>
            <p className="text-white/80 text-xs font-mono tracking-widest uppercase">{track.label}</p>
          </div>
        </div>
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-1 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
            {subject.label} — {track.label}
          </h3>
          <p className="text-sm text-gray-500 mb-4 leading-relaxed">{track.description}</p>
          <div className="flex items-center justify-end pt-4 border-t border-gray-100">
            <span className="text-sm font-semibold text-primary group-hover:gap-2 flex items-center gap-1 transition-all">
              View modules <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

/* ─── Module card ────────────────────────────── */
function ModuleCard({ course, university }) {
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
        {course.instructors && course.instructors.length > 0 && (
          <p className="text-white/60 text-xs mt-1 relative z-10 font-medium">
            Taught by {course.instructors.map(ins => ins.name).join(' & ')}
          </p>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <p className="text-gray-500 text-sm mb-4 leading-relaxed">{course.description}</p>

        <div className="flex items-center gap-3 mb-4 text-xs text-gray-400 flex-wrap">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {(course.students ?? 0).toLocaleString()}</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {course.hours}h</span>
          <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> {course.modules}</span>
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> 4.9</span>
        </div>

        {course.topics && course.topics.length > 0 && (
          <ul className="space-y-1.5 mb-5 flex-1">
            {course.topics.slice(0, 4).map(topic => (
              <li key={topic} className="flex items-start gap-2 text-sm text-gray-600">
                <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                {topic}
              </li>
            ))}
            {course.topics.length > 4 && (
              <li className="text-xs text-gray-400 pl-6">+ {course.topics.length - 4} more topics</li>
            )}
          </ul>
        )}

        <div className="pt-5" style={{ borderTop: '1px solid #f1f5f9' }}>
          <Link
            to={`/module/${course.id}`}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] shadow-md"
            style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
          >
            <BookOpen className="w-4 h-4" /> View Tests
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   Main Store component — handles 3 levels:
     /store                        → subject selection
     /store/:university/:subject   → track selection
     /store/:university/:subject/:track → module list
   ═══════════════════════════════════════════════ */
export default function Store() {
  const { university: uniParam, subject: subjectParam, track: trackParam } = useParams()
  const [params, setParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const { courses, universities, loading } = useCatalog()

  /* ── Bundles & Tab state ── */
  const [bundles, setBundles] = useState([])
  const [bundlesLoading, setBundlesLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('individual')

  /* Reset tab on route segment change */
  useEffect(() => {
    setActiveTab('individual')
  }, [subjectParam, trackParam])

  /* ── WhatsApp group popup state ── */
  const [waPopupOpen, setWaPopupOpen] = useState(false)
  const handleWaClose = useCallback(() => setWaPopupOpen(false), [])

  /* Open popup every time the user arrives at a modules page */
  useEffect(() => {
    if (subjectParam && trackParam) {
      setWaPopupOpen(true)
    } else {
      setWaPopupOpen(false)
    }
  }, [subjectParam, trackParam])

  /* ── Subject visibility ── */
  // Map key: "subject/study_level" → true | false
  const [visibilityMap, setVisibilityMap] = useState({})
  const [visibilityReady, setVisibilityReady] = useState(false)
  // Map key: "subject/study_level" → string | null
  const [waGroupUrlMap, setWaGroupUrlMap] = useState({})

  useEffect(() => {
    async function fetchVisibility() {
      try {
        const { data } = await supabase
          .from('subject_visibility')
          .select('subject, study_level, visible, whatsapp_group_url')
        if (data) {
          const visMap = {}
          const waMap  = {}
          data.forEach(row => {
            const key = `${row.subject}/${row.study_level}`
            visMap[key] = row.visible
            waMap[key]  = row.whatsapp_group_url ?? null
          })
          setVisibilityMap(visMap)
          setWaGroupUrlMap(waMap)
        }
      } catch (_) {
        // silently fall through — all subjects remain visible on error
      } finally {
        setVisibilityReady(true)
      }
    }
    fetchVisibility()
  }, [])

  // Returns true if ANY track for this subject has visible=true.
  // Falls back to true while the fetch is in flight (prevents flash of hidden content).
  const isSubjectVisible = (subjectId) => {
    if (!visibilityReady) return true
    return UH_SUBJECTS
      .find(s => s.id === subjectId)?.tracks
      .some(t => visibilityMap[`${subjectId}/${t.id}`] !== false) ?? true
  }

  // Returns true if this specific subject+track combo is visible.
  const isTrackVisible = (subjectId, trackId) => {
    if (!visibilityReady) return true
    const key = `${subjectId}/${trackId}`
    return key in visibilityMap ? visibilityMap[key] : true
  }

  /* ── Determine navigation level ── */
  const level = trackParam ? 'modules' : subjectParam ? 'tracks' : 'subjects'

  /* ── University chip state (multi-uni /store level only) ── */
  const [activeUni, setActiveUni] = useState(params.get('uni') || 'all')

  /* Sync ?uni= param for the chip bar */
  useEffect(() => {
    if (level !== 'subjects') return
    if (activeUni === 'all') {
      if (params.get('uni')) setParams({}, { replace: true })
    } else {
      setParams({ uni: activeUni }, { replace: true })
    }
    // eslint-disable-next-line
  }, [activeUni, level])

  /* ── Resolve current subject/track from URL ── */
  const currentSubject = subjectParam ? UH_SUBJECTS.find(s => s.id === subjectParam) : null
  const currentTrack   = currentSubject && trackParam
    ? currentSubject.tracks.find(t => t.id === trackParam)
    : null

  /* ── Guards: invalid URL segments → redirect ── */
  if (subjectParam && !currentSubject) {
    return <Navigate to={uniParam ? `/store/uh` : '/store'} replace />
  }
  if (trackParam && !currentTrack) {
    return <Navigate to={`/store/${uniParam}/${subjectParam}`} replace />
  }

  /* ── Single-track subjects skip the track screen (Pharmacy → IFP) ── */
  // Only auto-skip if that sole track is actually visible.
  if (level === 'tracks' && currentSubject && currentSubject.tracks.length === 1) {
    const soleTrack = currentSubject.tracks[0]
    if (isTrackVisible(currentSubject.id, soleTrack.id)) {
      return <Navigate to={`/store/${uniParam}/${subjectParam}/${soleTrack.id}`} replace />
    }
    // Track hidden — fall through to render the "not available" state below
  }

  /* ── Which university are we browsing? ── */
  const effectiveUniId = uniParam
    ?? (universities.length === 1 ? universities[0]?.id : (activeUni !== 'all' ? activeUni : null))

  const currentUni = universities.find(u => u.id === (uniParam ?? effectiveUniId)) ?? null

  /* ── Subjects for the current university ── */
  // UH_SUBJECTS is the source for now; when other unis are added,
  // each uni would have its own subject list.
  // Filter to subjects that have at least one visible track
  const subjectsForUni = UH_SUBJECTS.filter(s => isSubjectVisible(s.id))

  /* ── Filtered courses (module list level) ── */
  const filtered = useMemo(() => {
    let list = courses
    if (uniParam)      list = list.filter(c => c.universityId === uniParam)
    if (subjectParam)  list = list.filter(c => c.subject === subjectParam)
    if (trackParam)    list = list.filter(c => c.studyLevel === trackParam)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        (c.topics ?? []).some(t => t.toLowerCase().includes(q))
      )
    }
    return list
  }, [courses, uniParam, subjectParam, trackParam, search])

  /* ── Fetch bundles for current subject + study_level ── */
  useEffect(() => {
    if (level !== 'modules' || !subjectParam || !trackParam) {
      setBundles([])
      return
    }

    let isMounted = true
    setBundlesLoading(true)

    async function fetchBundles() {
      try {
        const { data, error } = await supabase
          .from('bundles')
          .select(`
            id,
            name,
            subject,
            study_level,
            price_egp,
            bundle_components (
              id,
              course_id,
              item_id,
              course:courses (
                id,
                title,
                buy_form_url,
                bundle_price_egp,
                price_egp
              ),
              item:course_items (
                id,
                title,
                price_egp
              )
            )
          `)
          .eq('subject', subjectParam)
          .eq('study_level', trackParam)

        if (isMounted) {
          if (error) {
            console.warn('[Store] fetchBundles error:', error.message)
            setBundles([])
          } else {
            setBundles(data || [])
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('[Store] fetchBundles threw:', err)
          setBundles([])
        }
      } finally {
        if (isMounted) setBundlesLoading(false)
      }
    }

    fetchBundles()

    return () => {
      isMounted = false
    }
  }, [level, subjectParam, trackParam])

  /* ── Hero gradient + title ── */
  const heroStyle = (level === 'subjects')
    ? 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)'
    : currentSubject
      ? `linear-gradient(135deg, ${currentSubject.gradientFrom}, ${currentSubject.gradientTo})`
      : 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)'

  /* ── Back link target ── */
  const backHref = level === 'modules'
    ? `/store/${uniParam}/${subjectParam}`  // tracks screen (or /store if single-track auto-skipped, but that means there's only 1 step back)
    : level === 'tracks'
      ? '/store'
      : null

  /* ── Breadcrumb nodes ── */
  const crumbs = [
    { label: 'Store', to: '/store' },
    ...(level !== 'subjects' && currentSubject ? [{ label: currentSubject.label, to: `/store/${uniParam}/${subjectParam}` }] : []),
    ...(level === 'modules' && currentTrack ? [{ label: currentTrack.label, to: null }] : []),
  ]

  return (
    <div>
      {/* ── Hero ── */}
      <div
        className="pt-36 sm:pt-28 pb-16 text-center relative overflow-hidden"
        style={{ background: heroStyle }}
      >
        <div className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div className="relative max-w-3xl mx-auto px-4">
          {level === 'subjects' ? (
            /* Top-level: fixed store hero */
            <>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full mb-4">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white/90 text-xs font-medium">Lifetime access · 7-day money-back guarantee</span>
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}>
                {universities.length === 1 ? 'Choose Your Subject' : 'Revision Modules Store'}
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/65 text-base sm:text-lg px-2 sm:px-0">
                {universities.length === 1
                  ? 'Select your degree programme to browse revision modules.'
                  : 'High-intensity revision modules — pick your university to get started.'}
              </motion.p>
            </>
          ) : (
            /* Deeper levels: subject-coloured hero with breadcrumb label */
            <>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="text-white/60 font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
                {currentSubject?.label ?? 'UH'}
                {currentTrack ? ` · ${currentTrack.label}` : ''}
              </motion.p>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                style={{ fontFamily: 'Playfair Display, serif' }}>
                {level === 'tracks' ? 'Choose Your Track' : `${currentSubject?.label} — ${currentTrack?.label}`}
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-white/65 text-base sm:text-lg px-2 sm:px-0">
                {level === 'tracks'
                  ? 'Are you in the Foundation Programme or a first-year undergraduate?'
                  : currentTrack?.description ?? ''}
              </motion.p>
            </>
          )}
        </div>
        <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 50" fill="none">
          <path d="M0 50L1440 50L1440 20C1200 45 960 55 720 40C480 25 240 10 0 30V50Z" fill="white" />
        </svg>
      </div>

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back + breadcrumb row */}
        {(backHref || crumbs.length > 1) && (
          <div className="flex items-center gap-2 mb-8 text-sm flex-wrap">
            {backHref && (
              <Link to={backHref}
                className="inline-flex items-center gap-1.5 text-gray-500 hover:text-primary transition-colors mr-2">
                <ArrowLeft className="w-4 h-4" />
                {level === 'modules' ? 'Back to tracks' : 'Back to subjects'}
              </Link>
            )}
            {crumbs.length > 1 && (
              <span className="flex items-center gap-1.5 text-xs text-gray-400">
                {crumbs.map((c, i) => (
                  <span key={i} className="flex items-center gap-1.5">
                    {i > 0 && <ChevronRight className="w-3 h-3" />}
                    {c.to ? (
                      <Link to={c.to} className="hover:text-primary transition-colors">{c.label}</Link>
                    ) : (
                      <span className="font-semibold text-gray-700">{c.label}</span>
                    )}
                  </span>
                ))}
              </span>
            )}
          </div>
        )}

        {/* ── LEVEL: subjects ── */}
        {level === 'subjects' && (
          <>
            {/* University chip bar — only when multiple universities exist */}
            {(loading || universities.length > 1) && (
              <div className="mb-8">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Choose your university
                </p>
                <div className="flex items-center gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                  {loading ? (
                    [...Array(2)].map((_, i) => (
                      <div key={i} className="h-16 w-32 rounded-2xl bg-gray-100 animate-pulse flex-shrink-0" />
                    ))
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveUni('all')}
                        className={`flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all flex-shrink-0 ${activeUni === 'all'
                          ? 'border-primary shadow-lg scale-[1.02] bg-primary text-white'
                          : 'border-gray-200 hover:border-primary/40 bg-white'
                        }`}
                      >
                        <Layers className={`w-5 h-5 ${activeUni === 'all' ? 'text-white' : 'text-primary'}`} />
                        <div className="text-left">
                          <p className={`text-xs font-mono uppercase tracking-widest ${activeUni === 'all' ? 'text-white/70' : 'text-gray-400'}`}>All</p>
                          <p className="text-sm font-semibold">{universities.length} universities</p>
                        </div>
                      </button>
                      {universities.map(uni => (
                        <UniversityChip
                          key={uni.id}
                          uni={uni}
                          isActive={activeUni === uni.id}
                          onClick={() => setActiveUni(uni.id)}
                          count={UH_SUBJECTS.length}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Subject cards */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100 animate-pulse">
                    <div className="h-44 bg-gray-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-gray-200 rounded w-3/4" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <motion.div
                key="subjects"
                variants={stagger}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {subjectsForUni.length === 0 ? (
                  <motion.div variants={fadeUp} className="col-span-full py-20 text-center">
                    <EyeOff className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-400 text-sm">No subjects available yet — check back soon.</p>
                  </motion.div>
                ) : (
                  subjectsForUni.map(subject => (
                    <SubjectCard
                      key={subject.id}
                      subject={subject}
                      uniId={effectiveUniId ?? universities[0]?.id ?? 'uh'}
                    />
                  ))
                )}
              </motion.div>
            )}
          </>
        )}

        {/* ── LEVEL: tracks ── */}
        {level === 'tracks' && currentSubject && (() => {
          const visibleTracks = currentSubject.tracks.filter(
            t => isTrackVisible(currentSubject.id, t.id)
          )

          // If no tracks are visible (incl. single-track subjects where the track is hidden)
          if (visibleTracks.length === 0) {
            return (
              <motion.div
                key="tracks-hidden"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-lg mx-auto text-center py-20"
              >
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-4xl select-none"
                  style={{ background: `linear-gradient(135deg, ${currentSubject.gradientFrom}22, ${currentSubject.gradientTo}33)` }}>
                  🔜
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Not available yet
                </h2>
                <p className="text-gray-500 text-sm leading-relaxed mb-8">
                  <span className="font-semibold" style={{ color: currentSubject.gradientFrom }}>
                    {currentSubject.label}
                  </span>{' '}modules are coming soon — check back shortly or get notified on WhatsApp.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a href="https://wa.me/201223262295" target="_blank" rel="noopener noreferrer"
                    className="btn-accent">Notify me on WhatsApp</a>
                  <Link to="/store" className="btn-outline">Back to subjects</Link>
                </div>
              </motion.div>
            )
          }

          return (
            <motion.div
              key="tracks"
              variants={stagger}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto"
            >
              {visibleTracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  subject={currentSubject}
                  uniId={uniParam}
                />
              ))}
            </motion.div>
          )
        })()}

        {/* ── LEVEL: modules ── */}
        {level === 'modules' && currentSubject && currentTrack && (
          <>
            {/* Header row: Search bar & Tab navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              {/* Tabs */}
              <div className="flex items-center gap-1 bg-gray-100/90 p-1.5 rounded-2xl w-full sm:w-auto border border-gray-200/70 shadow-inner">
                <button
                  onClick={() => setActiveTab('individual')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex-1 sm:flex-initial ${
                    activeTab === 'individual'
                      ? 'bg-white text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Individual Tests</span>
                </button>
                <button
                  onClick={() => setActiveTab('bundles')}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition-all flex-1 sm:flex-initial ${
                    activeTab === 'bundles'
                      ? 'bg-white text-gray-900 shadow-sm font-semibold'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Package className="w-4 h-4 text-amber-500" />
                  <span>Bundle Deals</span>
                  {bundles.length > 0 && (
                    <span className="px-2 py-0.5 text-xs bg-amber-100 text-amber-800 rounded-full font-bold">
                      {bundles.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Search bar */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <p className="text-sm text-gray-500 whitespace-nowrap hidden sm:block">
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
            </div>

            {/* Tab content panels */}
            <AnimatePresence mode="wait">
              {activeTab === 'individual' ? (
                <motion.div
                  key="tab-individual"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden bg-white shadow-md border border-gray-100 animate-pulse">
                          <div className="h-44 bg-gray-200" />
                          <div className="p-6 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                            <div className="h-3 bg-gray-100 rounded w-full" />
                            <div className="h-3 bg-gray-100 rounded w-5/6" />
                            <div className="h-10 bg-gray-200 rounded-xl mt-4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filtered.length > 0 ? (
                    <motion.div key="modules" variants={stagger} initial="hidden" animate="show"
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filtered.map(course => (
                        <ModuleCard
                          key={course.id}
                          course={course}
                          university={currentUni}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    /* Empty state for individual modules */
                    <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                      <div className="rounded-3xl overflow-hidden" style={{ border: '1px solid #e2ecf9' }}>
                        <div className="h-2"
                          style={{ background: `linear-gradient(90deg, ${currentSubject.gradientFrom}, ${currentSubject.gradientTo})` }}
                        />
                        <div className="py-20 px-6 text-center bg-white">
                          <div className="text-7xl mb-6 select-none">🛠️</div>
                          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3"
                            style={{ fontFamily: 'Playfair Display, serif' }}>
                            Modules coming soon
                          </h2>
                          <p className="text-gray-500 text-lg mb-2">
                            <span className="font-semibold" style={{ color: currentSubject.gradientFrom }}>
                              {currentSubject.label}
                            </span>
                            {' '}—{' '}
                            <span className="font-semibold text-gray-700">{currentTrack.label}</span>
                          </p>
                          <p className="text-sm text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
                            We're building this track right now. Reach out on WhatsApp to be notified when it launches.
                          </p>
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                            <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer"
                              className="btn-accent">
                              Notify me on WhatsApp
                            </a>
                            <Link to="/store" className="btn-outline">
                              Back to subjects
                            </Link>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="tab-bundles"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.2 }}
                >
                  {bundlesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="rounded-2xl p-6 bg-white shadow-md border border-gray-100 animate-pulse space-y-3">
                          <div className="h-5 bg-gray-200 rounded w-1/3" />
                          <div className="h-4 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-full" />
                          <div className="h-10 bg-gray-200 rounded-xl mt-4" />
                        </div>
                      ))}
                    </div>
                  ) : bundles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {bundles.map(bundle => {
                        const components = bundle.bundle_components || []
                        const componentsList = components
                          .map(comp => {
                            const courseTitle = comp.course?.title || ''
                            const itemTitle = comp.item?.title
                            return itemTitle ? `${courseTitle} (${itemTitle})` : courseTitle
                          })
                          .filter(Boolean)
                          .join(' + ')

                        const buyFormUrl = components
                          .find(c => c.course?.buy_form_url)?.course?.buy_form_url ?? null

                        const isLargeBundle = components.length >= 3

                        const listPrice = components.reduce((sum, comp) => {
                          if (comp.item_id && comp.item) {
                            return sum + Number(comp.item.price_egp || 0)
                          }
                          if (comp.course) {
                            return sum + Number(comp.course.bundle_price_egp || comp.course.price_egp || 0)
                          }
                          return sum
                        }, 0)

                        const realPrice = Number(bundle.price_egp || 0)
                        const savingsEgp = listPrice > realPrice ? listPrice - realPrice : 0
                        const discountPct = listPrice > 0 && savingsEgp > 0 ? Math.round((savingsEgp / listPrice) * 100) : 0

                        return (
                          <div
                            key={bundle.id}
                            className={`rounded-2xl p-6 shadow-md flex flex-col justify-between hover:shadow-xl transition-all relative overflow-hidden ${
                              isLargeBundle
                                ? 'border-2 border-amber-400 bg-gradient-to-b from-amber-50/50 via-white to-white shadow-amber-500/10'
                                : 'border-2 border-blue-100 bg-white'
                            }`}
                          >
                            <div className={`absolute top-0 right-0 w-28 h-28 rounded-bl-full -z-0 opacity-40 pointer-events-none ${
                              isLargeBundle ? 'bg-amber-200' : 'bg-blue-100'
                            }`} />

                            <div className="relative z-10 mb-6">
                              <div className="flex items-center gap-2 mb-3 flex-wrap">
                                {isLargeBundle ? (
                                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs rounded-full shadow-sm">
                                    🔥 Best Value
                                  </span>
                                ) : (
                                  <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">
                                    Bundle Deal
                                  </span>
                                )}
                                {discountPct > 0 && (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                                    Save {discountPct}%
                                  </span>
                                )}
                              </div>

                              <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                                {bundle.name}
                              </h3>
                              <p className="text-xs text-gray-500 leading-relaxed">
                                <span className="font-semibold text-gray-700">Includes:</span> {componentsList || 'Full module access'}
                              </p>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4 mt-auto relative z-10">
                              <div>
                                {listPrice > realPrice && (
                                  <p className="text-xs text-gray-400 line-through font-medium leading-none mb-1">
                                    {listPrice.toLocaleString()} EGP
                                  </p>
                                )}
                                <p className="text-2xl font-bold text-gray-900 leading-none">
                                  {realPrice.toLocaleString()}
                                </p>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                                  <Tag className="w-2.5 h-2.5" /> EGP
                                </p>
                              </div>

                              {buyFormUrl ? (
                                <a
                                  href={buyFormUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.03] shadow-md ${
                                    isLargeBundle
                                      ? 'bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700'
                                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                  }`}
                                >
                                  <ShoppingCart className="w-4 h-4" /> Buy This Bundle
                                </a>
                              ) : (
                                <button
                                  disabled
                                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow opacity-50 cursor-not-allowed bg-gray-200 text-gray-500"
                                >
                                  <ShoppingCart className="w-4 h-4" /> Coming soon
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    /* Empty state for Bundle Deals tab */
                    <div className="rounded-3xl bg-white p-12 text-center border border-gray-100 shadow-md">
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4 text-3xl select-none">
                        📦
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                        No bundles available yet for this track
                      </h3>
                      <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed mb-6">
                        We haven't listed bundled packages for this track yet. You can purchase individual modules under the Individual Tests tab or check back soon!
                      </p>
                      <button
                        onClick={() => setActiveTab('individual')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary/90 transition-all shadow-md"
                      >
                        <BookOpen className="w-4 h-4" /> Browse Individual Tests
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

      </div>

      {/* ── WhatsApp group popup (modules level only) ── */}
      {currentSubject && currentTrack && (
        <WhatsAppGroupPopup
          isOpen={waPopupOpen}
          onClose={handleWaClose}
          subjectName={currentSubject.label}
          trackName={currentTrack.label}
          whatsappUrl={waGroupUrlMap[`${subjectParam}/${trackParam}`] ?? null}
        />
      )}
    </div>
  )
}
