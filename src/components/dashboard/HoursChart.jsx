import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Clock } from 'lucide-react'
import { COURSES } from '../../data/constants'
import { SUBJECTS, TOPICS_BY_COURSE } from '../../data/topics'

/**
 * Stacked bar chart — hours watched per course, segmented by subject.
 */
export default function HoursChart({ perCourse, totalHours, subjectHours }) {
  const data = (perCourse || []).map(c => {
    /* Compute per-subject hours within this course */
    const topics = TOPICS_BY_COURSE[c.id] || []
    if (!topics.length) return { name: c.title, math: 0, physics: 0, cs: 0 }
    const counts = topics.reduce((acc, t) => { acc[t.subject] = (acc[t.subject] || 0) + 1; return acc }, {})
    const total = topics.length
    return {
      name: c.title.length > 22 ? c.title.slice(0, 20) + '…' : c.title,
      math:    +(c.watchedHours * (counts.math    || 0) / total).toFixed(2),
      physics: +(c.watchedHours * (counts.physics || 0) / total).toFixed(2),
      cs:      +(c.watchedHours * (counts.cs      || 0) / total).toFixed(2),
    }
  })

  const empty = data.length === 0 || data.every(d => d.math + d.physics + d.cs === 0)

  return (
    <div className="rounded-2xl bg-white shadow-md border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            Study hours
          </h2>
          <p className="text-xs text-gray-400">
            <Clock className="w-3 h-3 inline mr-1" />
            {totalHours?.toFixed(1) || '0.0'}h total · across {data.length} module{data.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-semibold">
          {Object.entries(SUBJECTS).map(([k, s]) => (
            <div key={k} className="flex items-center gap-1 text-gray-400">
              <span className="w-2.5 h-2.5 rounded" style={{ background: s.color }} />
              <span className="hidden sm:inline">{s.label.slice(0, 4)}</span>
            </div>
          ))}
        </div>
      </div>

      {empty ? (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">No watch time yet — start a module to track your hours.</p>
        </div>
      ) : (
        <>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                  unit="h"
                />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.96)',
                    border: '1px solid #e2ecf9',
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(value, name) => [`${value}h`, SUBJECTS[name].label]}
                  cursor={{ fill: 'rgba(0,71,171,0.05)' }}
                />
                <Bar dataKey="math"    stackId="a" fill={SUBJECTS.math.color}    radius={[0, 0, 0, 0]} />
                <Bar dataKey="physics" stackId="a" fill={SUBJECTS.physics.color} radius={[0, 0, 0, 0]} />
                <Bar dataKey="cs"      stackId="a" fill={SUBJECTS.cs.color}      radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Subject totals strip */}
          <div className="mt-5 grid grid-cols-3 gap-3">
            {Object.entries(SUBJECTS).map(([k, s]) => (
              <div key={k} className="rounded-xl p-3" style={{ background: s.bg }}>
                <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: s.color }}>{s.label}</p>
                <p className="text-2xl font-bold mt-0.5" style={{ color: s.color }}>
                  {(subjectHours?.[k] || 0).toFixed(1)}<span className="text-xs ml-1 opacity-70">h</span>
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
