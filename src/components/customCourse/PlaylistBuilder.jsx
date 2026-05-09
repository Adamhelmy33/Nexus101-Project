import { useState } from 'react'
import { motion, Reorder } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import {
  GripVertical, X, Clock, Sparkles, Save, Play,
  AlertCircle, Tag, ArrowLeft,
} from 'lucide-react'
import { COURSES, UNIVERSITIES } from '../../data/constants'
import { reorderPlaylist } from '../../lib/customCourse'

/**
 * PlaylistBuilder — step 3 of the Custom Course flow.
 * Lets the student reorder/remove items before saving the playlist.
 */
export default function PlaylistBuilder({ playlist, onSave, onBack }) {
  const navigate = useNavigate()
  const [items, setItems] = useState(playlist?.items || [])
  const [title, setTitle] = useState(playlist?.title || 'My custom course')

  const totalSec = items.reduce((s, i) => s + (i.segment.end_sec - i.segment.start_sec), 0)
  const courseSet = new Set(items.map(i => i.segment.courseId))

  const removeAt = (idx) => setItems(items.filter((_, i) => i !== idx))

  const handleSave = () => {
    if (items.length === 0) return
    const reordered = items.map((it, i) => ({ ...it, position: i + 1 }))
    reorderPlaylist(playlist.id, reordered)
    /* Update title in localStorage */
    const all = JSON.parse(localStorage.getItem('nexus_custom_playlists') || '[]')
    const idx = all.findIndex(p => p.id === playlist.id)
    if (idx !== -1) {
      all[idx].title = title
      all[idx].items = reordered
      all[idx].segmentCount = reordered.length
      all[idx].totalSeconds = reordered.reduce((s, i) => s + (i.segment.end_sec - i.segment.start_sec), 0)
      localStorage.setItem('nexus_custom_playlists', JSON.stringify(all))
    }
    onSave?.(playlist.id)
    navigate(`/custom-course/${playlist.id}`)
  }

  if (!playlist) return null

  return (
    <div>
      {onBack && (
        <button onClick={onBack}
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      )}

      <div className="rounded-3xl bg-white border border-gray-100 shadow-lg overflow-hidden">
        {/* Header */}
        <div className="p-6 relative overflow-hidden text-white"
             style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-yellow-300" /> Custom Playlist
            </p>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-2xl font-bold mb-2 focus:outline-none placeholder:text-white/40"
              style={{ fontFamily: 'Playfair Display, serif' }}
              placeholder="Name your custom course"
            />
            <div className="flex items-center gap-4 text-xs text-white/70">
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {fmt(totalSec)}</span>
              <span>·</span>
              <span>{items.length} segments</span>
              <span>·</span>
              <span>From {courseSet.size} module{courseSet.size !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Items list (drag to reorder) */}
        {items.length === 0 ? (
          <div className="p-10 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 font-semibold mb-1">No segments matched your syllabus</p>
            <p className="text-xs text-gray-400 mb-5">
              Try a more detailed syllabus or check the topic keywords match Nexus 101's catalog.
            </p>
            <button onClick={onBack} className="btn-primary text-xs">Try again</button>
          </div>
        ) : (
          <Reorder.Group
            as="div"
            axis="y"
            values={items}
            onReorder={setItems}
            className="divide-y divide-gray-100"
          >
            {items.map((item, idx) => {
              const course = COURSES.find(c => c.id === item.segment.courseId)
              const uni = course && UNIVERSITIES.find(u => u.id === course.universityId)
              return (
                <Reorder.Item key={item.segment.id} value={item}
                              className="bg-white hover:bg-blue-50/30 transition-colors cursor-grab active:cursor-grabbing">
                  <div className="p-4 flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-gray-300 flex-shrink-0" />
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center flex-shrink-0">
                      {idx + 1}
                    </span>
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-base flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${course?.gradientFrom || '#0047AB'}, ${course?.gradientTo || '#1a6fd4'})` }}
                    >
                      {course?.icon || '📺'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.segment.title}</p>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 mt-0.5 flex-wrap">
                        {uni && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {uni.shortName}
                          </span>
                        )}
                        <span>·</span>
                        <span>{course?.title}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {fmt(item.segment.end_sec - item.segment.start_sec)}
                        </span>
                        {item.matchScore && (
                          <>
                            <span>·</span>
                            <span className="text-green-600 font-semibold">
                              {Math.round(item.matchScore * 100)}% match
                            </span>
                          </>
                        )}
                      </div>
                      {item.aiReason && (
                        <p className="text-[11px] text-gray-400 italic mt-1">{item.aiReason}</p>
                      )}
                    </div>
                    <button onClick={() => removeAt(idx)}
                            className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </Reorder.Item>
              )
            })}
          </Reorder.Group>
        )}

        {/* Footer actions */}
        {items.length > 0 && (
          <div className="p-5 border-t border-gray-100 flex flex-col sm:flex-row items-center gap-3 justify-between">
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <GripVertical className="w-3 h-3" /> Drag to reorder · click ✕ to remove
            </p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={handleSave} className="btn-accent flex-1 sm:flex-initial justify-center">
                <Save className="w-4 h-4" /> Save & Play <Play className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
