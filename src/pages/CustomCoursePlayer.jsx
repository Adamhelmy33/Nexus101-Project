import { useState, useMemo, useCallback } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles, ArrowLeft, Play, CheckCircle2, Clock,
  ChevronRight, Lock, Tag, ListVideo, Pause,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getPlaylistById } from '../lib/customCourse'
import { COURSES, UNIVERSITIES } from '../data/constants'
import { recordWatch } from '../lib/progress'

/**
 * CustomCoursePlayer — plays a stitched playlist of atomic video segments.
 * Auto-advances through the queue: when a segment hits its end_sec,
 * the player jumps to the next segment's video at its start_sec.
 */
export default function CustomCoursePlayer() {
  const { playlistId } = useParams()
  const { user } = useAuth()
  const playlist = getPlaylistById(playlistId)
  const [activeIdx, setActiveIdx] = useState(0)
  const [completed, setCompleted] = useState(new Set())

  const items = playlist?.items || []
  const active = items[activeIdx]

  const playNext = useCallback(() => {
    setCompleted(prev => new Set(prev).add(activeIdx))
    if (activeIdx < items.length - 1) setActiveIdx(activeIdx + 1)
  }, [activeIdx, items.length])

  if (!user)     return <Navigate to="/login" replace />
  if (!playlist) return <Navigate to="/custom-course" replace />

  const totalDone = completed.size
  const totalSec  = items.reduce((s, i) => s + (i.segment.end_sec - i.segment.start_sec), 0)
  const doneSec   = items.slice(0, activeIdx).reduce((s, i) => s + (i.segment.end_sec - i.segment.start_sec), 0)
  const progressPct = totalSec > 0 ? Math.round((doneSec / totalSec) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a1628' }}>
      {/* Top bar */}
      <header className="flex items-center gap-4 px-4 py-3 text-white"
              style={{ background: '#0f1e35', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link to="/custom-course" className="flex items-center gap-2 text-white/65 hover:text-white text-sm">
          <ArrowLeft className="w-4 h-4" /> Custom courses
        </Link>
        <div className="hidden sm:flex items-center gap-2 text-white/30 text-sm">
          <ChevronRight className="w-3.5 h-3.5" />
          <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
          <span className="font-semibold text-white/85" style={{ fontFamily: 'Playfair Display, serif' }}>
            {playlist.title}
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-white/55">
          <span>{totalDone}/{items.length} done</span>
          <span className="text-white/15">·</span>
          <span className="text-primary-light">{progressPct}%</span>
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_360px] overflow-hidden">

        {/* Player area */}
        <main className="overflow-y-auto">
          {active ? (
            <>
              <div className="w-full bg-black">
                {active.segment.youtube_video_id ? (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <iframe
                      key={active.segment.youtube_video_id}
                      src={`https://www.youtube.com/embed/${active.segment.youtube_video_id}`}
                      title={active.segment.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full border-0"
                    />
                  </div>
                ) : (
                  <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                      <Play className="w-12 h-12 text-white/20" />
                      <p className="text-white/40 text-sm font-medium">Video coming soon</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest"
                        style={{ background: 'rgba(240,165,0,0.18)', color: '#fbbf24' }}>
                    Segment {activeIdx + 1} / {items.length}
                  </span>
                  <SegmentBadge segment={active.segment} />
                </div>
                <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {active.segment.title}
                </h1>
                <p className="text-sm text-white/55 mb-4">{active.aiReason}</p>

                {/* Transcript card */}
                {active.segment.transcript && (
                  <div className="rounded-2xl p-5"
                       style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-white/55 mb-2 flex items-center gap-1.5">
                      <ListVideo className="w-3 h-3" /> Transcript
                    </p>
                    <p className="text-sm text-white/75 leading-relaxed">{active.segment.transcript}</p>
                  </div>
                )}

                {/* Next segment CTA */}
                {activeIdx < items.length - 1 && (
                  <div className="mt-6 rounded-2xl p-4 flex items-center gap-4"
                       style={{ background: 'rgba(0,71,171,0.15)', border: '1px solid rgba(0,71,171,0.25)' }}>
                    <Play className="w-5 h-5 text-primary-light flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] uppercase tracking-widest font-bold text-white/55">Up next</p>
                      <p className="font-semibold text-sm truncate">{items[activeIdx + 1].segment.title}</p>
                    </div>
                    <button onClick={playNext}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                            style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                      Skip <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-white/55 p-10 text-center">
              <div>
                <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
                <p className="font-semibold">Playlist complete!</p>
                <p className="text-xs mt-1">You've finished every segment in this custom course.</p>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar — playlist queue */}
        <aside className="hidden lg:flex flex-col"
               style={{ background: '#0f1e35', borderLeft: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-4 border-b border-white/5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/55 mb-2 flex items-center gap-1.5">
              <ListVideo className="w-3 h-3" /> Playlist queue
            </p>
            <p className="text-white/85 font-semibold text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>
              {playlist.title}
            </p>
            <p className="text-xs text-white/40 mt-1">{items.length} segments · {fmtMin(totalSec)}</p>

            {/* Top progress bar */}
            <div className="mt-3 h-1 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, #0047AB, #f0a500)' }}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {items.map((item, i) => {
              const course = COURSES.find(c => c.id === item.segment.courseId)
              const isActive = i === activeIdx
              const isDone   = completed.has(i)
              return (
                <button
                  key={item.segment.id}
                  onClick={() => setActiveIdx(i)}
                  className={`w-full text-left p-3 flex items-start gap-3 transition-colors ${
                    isActive
                      ? 'bg-primary/20 border-l-2 border-primary-light'
                      : 'hover:bg-white/5 border-l-2 border-transparent'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold ${
                    isDone
                      ? 'bg-green-500 text-white'
                      : isActive
                        ? 'bg-primary text-white'
                        : 'bg-white/10 text-white/55'
                  }`}>
                    {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                     isActive ? <Pause className="w-3 h-3" fill="currentColor" /> :
                     i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${isActive ? 'text-white' : 'text-white/65'}`}>
                      {item.segment.title}
                    </p>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/40 mt-0.5 flex-wrap">
                      <span>{course?.icon || '📺'} {course?.title || ''}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />
                        {fmtMin(item.segment.end_sec - item.segment.start_sec)}
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>
      </div>
    </div>
  )
}

function SegmentBadge({ segment }) {
  const course = COURSES.find(c => c.id === segment.courseId)
  const uni    = course && UNIVERSITIES.find(u => u.id === course.universityId)
  if (!uni) return null
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest flex items-center gap-1"
          style={{ background: `${uni.color}25`, color: uni.color }}>
      <Tag className="w-2.5 h-2.5" /> {uni.shortName}
    </span>
  )
}

function fmtMin(sec) {
  const m = Math.round(sec / 60)
  return m > 0 ? `${m} min` : `${sec}s`
}
