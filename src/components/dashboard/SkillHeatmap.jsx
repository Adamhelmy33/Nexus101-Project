import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, AlertCircle } from 'lucide-react'
import { COURSES } from '../../data/constants'
import { SUBJECTS } from '../../data/topics'

/**
 * Skill Heatmap — CSS grid, mastery-driven cell colors.
 * 0.0 = pale, 1.0 = saturated. Hover for tooltip with topic + hours.
 */
export default function SkillHeatmap({ topicMastery }) {
  const [hovered, setHovered] = useState(null)

  if (!topicMastery?.length) {
    return (
      <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center bg-blue-50">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <p className="font-semibold text-gray-900 mb-1">No skill data yet</p>
        <p className="text-sm text-gray-500">Buy a module and start watching — your skill heatmap will appear here.</p>
      </div>
    )
  }

  /* Group topics by course */
  const byCourse = {}
  for (const t of topicMastery) {
    if (!byCourse[t.courseId]) byCourse[t.courseId] = []
    byCourse[t.courseId].push(t)
  }

  /* Mastery bands */
  const bandFor = (m) => {
    if (m >= 0.8)  return { label: 'Mastered',    bg: 'bg-emerald-500', text: 'text-emerald-700', tone: '#10b981' }
    if (m >= 0.5)  return { label: 'Practising',  bg: 'bg-blue-500',    text: 'text-blue-700',    tone: '#3b82f6' }
    if (m >= 0.2)  return { label: 'Started',     bg: 'bg-amber-400',   text: 'text-amber-700',   tone: '#f59e0b' }
    return                  { label: 'Untouched', bg: 'bg-gray-200',    text: 'text-gray-500',    tone: '#cbd5e1' }
  }

  const masteredCount = topicMastery.filter(t => t.mastery >= 0.8).length
  const weakSpots     = topicMastery.filter(t => t.mastery < 0.2).slice(0, 3)

  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Skill Heatmap
          </h2>
          <p className="text-xs text-gray-400">
            {masteredCount} of {topicMastery.length} topics mastered
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest font-semibold">
          {[
            { label: 'Untouched', tone: '#cbd5e1' },
            { label: 'Started',   tone: '#f59e0b' },
            { label: 'Practising', tone: '#3b82f6' },
            { label: 'Mastered',  tone: '#10b981' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-1 text-gray-400">
              <span className="w-2.5 h-2.5 rounded" style={{ background: b.tone }} />
              <span className="hidden sm:inline">{b.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Course rows */}
      <div className="space-y-4">
        {Object.entries(byCourse).map(([courseId, topics]) => {
          const course = COURSES.find(c => c.id === courseId)
          if (!course) return null
          return (
            <div key={courseId}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{course.icon}</span>
                <p className="text-sm font-semibold text-gray-900 truncate">{course.title}</p>
                <span className="text-xs text-gray-400 ml-auto">{topics.length} topics</span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-1.5">
                {topics.map((t, idx) => {
                  const band = bandFor(t.mastery)
                  const subj = SUBJECTS[t.subject] || SUBJECTS.math
                  const opacity = 0.25 + t.mastery * 0.75
                  return (
                    <motion.button
                      key={t.key}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.015 }}
                      onMouseEnter={() => setHovered(t)}
                      onMouseLeave={() => setHovered(null)}
                      className="aspect-square rounded-md relative group transition-transform hover:scale-110 hover:z-10"
                      style={{ background: band.tone, opacity }}
                      title={`${t.title} · ${Math.round(t.mastery * 100)}%`}
                    >
                      <div className="absolute inset-0 rounded-md ring-2 ring-transparent group-hover:ring-white/40 transition-all" />
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Hovered topic tooltip */}
      {hovered && (
        <div className="mt-5 rounded-xl p-4 flex items-start gap-3" style={{ background: SUBJECTS[hovered.subject].bg, border: `1px solid ${SUBJECTS[hovered.subject].color}30` }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white flex-shrink-0"
               style={{ background: bandFor(hovered.mastery).tone }}>
            {Math.round(hovered.mastery * 100)}%
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm">{hovered.title}</p>
            <p className="text-xs text-gray-500">
              {SUBJECTS[hovered.subject].label} · {(hovered.hours || 0).toFixed(1)}h practiced · {bandFor(hovered.mastery).label}
            </p>
          </div>
        </div>
      )}

      {/* Weak spots advisor */}
      {weakSpots.length > 0 && (
        <div className="mt-5 rounded-xl p-4 flex items-start gap-3" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
          <AlertCircle className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs">
            <p className="font-semibold text-orange-900 mb-1">Weak spots to revisit</p>
            <p className="text-orange-700">
              {weakSpots.map(t => t.title).join(' · ')} — ask the Study Buddy for a quick refresher.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
