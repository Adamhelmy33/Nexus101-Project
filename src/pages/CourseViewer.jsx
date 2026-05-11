import { useState, useEffect, useRef } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Play, Lock, ChevronDown, ChevronRight, Download,
  FileText, MessageCircle, StickyNote, X, Menu,
  AlertTriangle, Home, Clock, CheckCircle2, ShoppingCart,
} from 'lucide-react'
import { WHATSAPP_TUTOR_NUMBER } from '../data/constants'
import { useAuth } from '../contexts/AuthContext'
import { hasPurchased } from '../lib/auth'
import BunnyVideoPlayer from '../components/video/BunnyVideoPlayer'
import { getSegmentsForCourse, DEMO_HLS_URL } from '../data/segments'
import { recordWatch } from '../lib/progress'
import { supabase } from '../lib/supabase'
import { useCatalog } from '../hooks/useCatalog'

/* ── Mock lesson data (used when no modules exist in DB for a course) ── */
const MOCK_MODULES = [
  {
    id: 1,
    title: 'Module 1: Foundations',
    lessons: [
      { id: 'l1', title: 'Introduction & Overview',          duration: '12:30', free: true,  done: true  },
      { id: 'l2', title: 'Core Concepts Explained',          duration: '18:45', free: true,  done: true  },
      { id: 'l3', title: 'Worked Examples — Part 1',         duration: '22:10', free: false, done: false },
    ],
  },
  {
    id: 2,
    title: 'Module 2: Intermediate',
    lessons: [
      { id: 'l4', title: 'Deeper Dive into Theory',          duration: '25:00', free: false, done: false },
      { id: 'l5', title: 'Problem Set Walkthrough',          duration: '30:15', free: false, done: false },
      { id: 'l6', title: 'Common Mistakes to Avoid',         duration: '14:50', free: false, done: false },
    ],
  },
  {
    id: 3,
    title: 'Module 3: Advanced',
    lessons: [
      { id: 'l7', title: 'Advanced Techniques',              duration: '28:30', free: false, done: false },
      { id: 'l8', title: 'Past Exam Questions',              duration: '35:00', free: false, done: false },
      { id: 'l9', title: 'Final Review & Summary',           duration: '20:00', free: false, done: false },
    ],
  },
]

const MOCK_RESOURCES = [
  { id: 1, lesson: 'l1', name: 'Introduction Slides.pdf',      size: '1.2 MB' },
  { id: 2, lesson: 'l2', name: 'Core Concepts Cheatsheet.pdf', size: '0.8 MB' },
  { id: 3, lesson: 'l3', name: 'Example Problems.pdf',         size: '2.1 MB' },
]

/* ── Anti-piracy effect ── */
function useAntiPiracy() {
  useEffect(() => {
    const block = (e) => e.preventDefault()
    document.addEventListener('contextmenu', block)
    const blockKeys = (e) => {
      if ((e.ctrlKey && ['s','u','p','i'].includes(e.key.toLowerCase())) || e.key === 'F12') e.preventDefault()
    }
    document.addEventListener('keydown', blockKeys)
    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [])
}

/* ═══════════════════════════════════════════════ */
export default function CourseViewer() {
  const { courseId } = useParams()
  const { user } = useAuth()
  const { courses, loading: catalogLoading } = useCatalog()

  // ── All hooks must be declared before any early returns ──
  useAntiPiracy()

  const [activeLesson, setActiveLesson] = useState(MOCK_MODULES[0].lessons[0])
  const [expandedMods, setExpandedMods] = useState({ 1: true })
  const [activeTab, setActiveTab]       = useState('resources')
  const [sidebarOpen, setSidebarOpen]   = useState(false)
  const [note, setNote]                 = useState('')
  const [chapters, setChapters]         = useState([])

  // Fetch video segments: try Supabase first (for DB courses), fall back to static demo data
  useEffect(() => {
    async function fetchChapters() {
      // Look up the course UUID by slug — only DB-seeded courses will have a row
      const { data: courseRow } = await supabase
        .from('courses')
        .select('id')
        .eq('slug', courseId)
        .maybeSingle()

      if (courseRow?.id) {
        const { data: rows } = await supabase
          .from('video_segments')
          .select('id, start_sec, end_sec, title, subject, difficulty')
          .eq('course_id', courseRow.id)
          .order('start_sec')
        setChapters(rows ?? [])
      } else {
        // Static courses: use demo segments from segments.js
        setChapters(getSegmentsForCourse(courseId))
      }
    }
    fetchChapters()
  }, [courseId])

  // ── Now safe to do derived values and early returns ──
  if (!user) {
    return <Navigate to="/login" state={{ from: `/learn/${courseId}` }} replace />
  }

  // Show a minimal loading state while catalog resolves (only needed for DB-only courses)
  const course = courses.find(c => c.id === courseId)
  if (!course && catalogLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a1628' }}>
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const resolvedCourse = course ?? courses[0]

  if (!hasPurchased(user, resolvedCourse.id)) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#f8faff' }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
               style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
            <Lock className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Access denied
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            You haven't purchased <strong>{resolvedCourse.title}</strong> yet. Buy access to unlock all videos and PDFs in this module.
          </p>
          <div className="flex flex-col gap-3">
            <Link to={`/checkout/${resolvedCourse.id}`} className="btn-primary justify-center">
              <ShoppingCart className="w-4 h-4" /> Buy Access
            </Link>
            <Link to="/store" className="text-sm text-gray-500 hover:text-primary">← Back to store</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const toggleMod = (id) => setExpandedMods(e => ({ ...e, [id]: !e[id] }))

  const allLessons   = MOCK_MODULES.flatMap(m => m.lessons)
  const currentIdx   = allLessons.findIndex(l => l.id === activeLesson.id)
  const prevLesson   = allLessons[currentIdx - 1]
  const nextLesson   = allLessons[currentIdx + 1]

  const resources  = MOCK_RESOURCES.filter(r => r.lesson === activeLesson.id)
  const totalDone  = allLessons.filter(l => l.done).length

  return (
    <div
      className="flex h-screen overflow-hidden select-none"
      style={{ background: '#0a1628', userSelect: 'none' }}
      onContextMenu={e => e.preventDefault()}
    >

      {/* ── Sidebar ── */}
      <aside
        className={`flex-shrink-0 flex flex-col z-30 transition-all duration-300 ${
          sidebarOpen ? 'fixed inset-y-0 left-0 w-80' : 'hidden lg:flex w-80'
        }`}
        style={{ background: '#0f1e35', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Sidebar header */}
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link to="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
            <Home className="w-4 h-4" /> Nexus 101
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Course title */}
        <div className="p-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-white font-bold text-base mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            {resolvedCourse.title}
          </h2>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>{totalDone}/{allLessons.length} lessons</span>
            <span className="text-primary-light">{Math.round((totalDone / allLessons.length) * 100)}% complete</span>
          </div>
          <div className="mt-2 h-1 rounded-full bg-white/10">
            <div
              className="h-1 rounded-full transition-all"
              style={{
                width: `${(totalDone / allLessons.length) * 100}%`,
                background: 'linear-gradient(90deg, #0047AB, #1a6fd4)',
              }}
            />
          </div>
        </div>

        {/* Modules list */}
        <div className="flex-1 overflow-y-auto py-2">
          {MOCK_MODULES.map(mod => (
            <div key={mod.id}>
              <button
                onClick={() => toggleMod(mod.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-white/70 hover:text-white hover:bg-white/5 transition-colors text-sm font-semibold"
              >
                <span>{mod.title}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${expandedMods[mod.id] ? 'rotate-180' : ''}`} />
              </button>

              {expandedMods[mod.id] && mod.lessons.map(lesson => {
                const isActive = lesson.id === activeLesson.id
                return (
                  <button
                    key={lesson.id}
                    onClick={() => { setActiveLesson(lesson); setSidebarOpen(false) }}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-primary/20 border-r-2 border-primary' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      lesson.done ? 'bg-green-500' : isActive ? 'bg-primary' : 'bg-white/10'
                    }`}>
                      {lesson.done
                        ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        : !lesson.free
                          ? <Lock className="w-3 h-3 text-white/60" />
                          : <Play className="w-3 h-3 text-white" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-white/65'}`}>
                        {lesson.title}
                      </p>
                      <p className="text-xs text-white/30 flex items-center gap-1 mt-0.5">
                        <Clock className="w-2.5 h-2.5" /> {lesson.duration}
                        {lesson.free && <span className="ml-1 text-primary-light text-xs">Free</span>}
                      </p>
                    </div>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main area ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <div
          className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
          style={{ background: '#0f1e35', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-white/60 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
            <span className="text-white/50 text-sm truncate">{activeLesson.title}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-yellow-500/60 text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Recording prohibited</span>
          </div>
        </div>

        {/* Video + content */}
        <div className="flex-1 overflow-y-auto">
          <BunnyVideoPlayer
            videoId={resolvedCourse.id}
            courseId={resolvedCourse.id}
            fallbackUrl={DEMO_HLS_URL}
            user={user}
            chapters={chapters}
            title={`${resolvedCourse.title} — ${activeLesson.title}`}
            onWatchedSeconds={(delta) => recordWatch({
              userEmail: user.email,
              courseId:  resolvedCourse.id,
              moduleId:  activeLesson.id,
              seconds:   delta,
            })}
          />

          {/* Info + tabs */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-white text-xl font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {activeLesson.title}
                </h1>
                <p className="text-white/40 text-sm mt-1">
                  {resolvedCourse.title} • {activeLesson.duration}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {prevLesson && (
                  <button
                    onClick={() => setActiveLesson(prevLesson)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white/60 border border-white/10 hover:border-white/30 hover:text-white transition-all"
                  >
                    ← Previous
                  </button>
                )}
                {nextLesson && (
                  <button
                    onClick={() => setActiveLesson(nextLesson)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 mb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {[
                { id: 'resources', label: 'Resources',         icon: FileText },
                { id: 'notes',     label: 'My Notes',          icon: StickyNote },
                { id: 'tutor',     label: 'WhatsApp Tutoring', icon: MessageCircle },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === tab.id
                      ? 'text-primary-light border-primary-light'
                      : 'text-white/40 border-transparent hover:text-white/70'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'resources' && (
              <div>
                {resources.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-white/50 text-sm mb-4">Download materials for this lesson:</p>
                    {resources.map(r => (
                      <div
                        key={r.id}
                        className="flex items-center gap-4 p-4 rounded-xl"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                          <FileText className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{r.name}</p>
                          <p className="text-white/30 text-xs">{r.size} • PDF</p>
                        </div>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 border border-white/10 hover:text-white hover:border-white/30 transition-all">
                          <Download className="w-3.5 h-3.5" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-white/30 text-sm text-center py-8">No resources for this lesson.</p>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div>
                <p className="text-white/50 text-sm mb-3">Your private notes for this lesson:</p>
                <textarea
                  rows={8}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Type your notes here… They're saved locally on your device."
                  className="w-full p-4 rounded-xl text-sm text-white/80 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
              </div>
            )}

            {activeTab === 'tutor' && (
              <div className="text-center py-6">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                     style={{ background: '#25d366' }}>
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Stuck on something?
                </h3>
                <p className="text-white/60 text-sm mb-6 max-w-md mx-auto leading-relaxed">
                  Tap below to message your tutor on WhatsApp. Send a screenshot, ask about a step,
                  or get a concept clarified — usually within an hour.
                </p>
                <a
                  href={`https://wa.me/${WHATSAPP_TUTOR_NUMBER}?text=${encodeURIComponent(
                    `Hi! I'm watching "${activeLesson.title}" in ${resolvedCourse.title} and I have a question:\n\n`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white text-sm transition-all hover:scale-105 hover:shadow-xl"
                  style={{ background: '#25d366' }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Open WhatsApp Tutoring
                </a>
                <p className="text-white/30 text-xs mt-5">
                  Response time: usually under 1 hour · Sat–Thu 10 AM – 11 PM (Cairo)
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
