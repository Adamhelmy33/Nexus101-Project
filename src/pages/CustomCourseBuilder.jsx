import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, ArrowLeft, Loader2, CheckCircle2, AlertCircle, Trash2,
  Play, Clock, Layers, Wand2, Zap,
} from 'lucide-react'
import SyllabusUploader from '../components/customCourse/SyllabusUploader'
import PlaylistBuilder  from '../components/customCourse/PlaylistBuilder'
import { parseSyllabus, buildPlaylist, getMyPlaylists, deletePlaylist } from '../lib/customCourse'
import { useAuth } from '../contexts/AuthContext'
import { COURSES } from '../data/constants'

const STEPS = ['Upload syllabus', 'AI parse + build', 'Review playlist']

export default function CustomCourseBuilder() {
  const { user } = useAuth()
  const [step, setStep]           = useState(0)
  const [progress, setProgress]   = useState('')
  const [topics, setTopics]       = useState([])
  const [syllabusId, setSyllabusId] = useState(null)
  const [playlist, setPlaylist]   = useState(null)
  const [error, setError]         = useState('')
  const [running, setRunning]     = useState(false)

  const myPlaylists = getMyPlaylists()

  const reset = () => {
    setStep(0); setTopics([]); setPlaylist(null); setError(''); setProgress(''); setSyllabusId(null)
  }

  const runPipeline = async ({ rawText, fileName }) => {
    setStep(1); setError(''); setRunning(true)
    try {
      /* 1. Parse syllabus */
      const parsed = await parseSyllabus({ rawText, fileName, onProgress: setProgress })
      if (!parsed.ok || !parsed.topics?.length) {
        setError('Could not detect any topics in that syllabus. Try a more detailed one.')
        setRunning(false)
        return
      }
      setTopics(parsed.topics); setSyllabusId(parsed.syllabusId)

      /* 2. Build playlist */
      const built = await buildPlaylist({
        syllabusId: parsed.syllabusId,
        topics:     parsed.topics,
        title:      `Custom course from ${fileName.replace(/\.[^.]+$/, '')}`,
        onProgress: setProgress,
      })
      if (!built.ok) {
        setError(built.error || 'Playlist build failed.')
        setRunning(false)
        return
      }
      setPlaylist(built)
      setStep(2)
    } catch (e) {
      setError(e.message || 'Unexpected error.')
    } finally {
      setRunning(false); setProgress('')
    }
  }

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#f8faff' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Dashboard
          </Link>
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
            <Wand2 className="w-4 h-4" /> Custom Course Builder
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
            Turn your syllabus into a custom course
          </h1>
          <p className="text-gray-500">
            Upload your university's syllabus and our AI stitches together the perfect revision playlist
            from Nexus 101's atomic-tagged video library.
          </p>
        </motion.div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-8 max-w-md">
          {STEPS.map((label, i) => {
            const done   = i < step
            const active = i === step
            return (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    done ? 'bg-green-500 text-white' :
                    active ? 'text-white shadow-lg' :
                    'bg-gray-200 text-gray-400'
                  }`} style={active ? { background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' } : {}}>
                    {done ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-[10px] font-medium ${active ? 'text-primary' : done ? 'text-green-600' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="h-0.5 flex-1 mx-1 mb-4" style={{ background: done ? '#22c55e' : '#e5e7eb' }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Body */}
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="step0" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <SyllabusUploader onUploaded={runPipeline} />

              {/* Existing playlists */}
              {myPlaylists.length > 0 && (
                <div className="mt-10">
                  <h2 className="text-sm font-bold text-gray-700 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" /> Your custom courses
                  </h2>
                  <div className="space-y-3">
                    {myPlaylists.map(p => (
                      <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                             style={{ background: 'linear-gradient(135deg, #f0a500, #d97706)' }}>
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{p.title}</p>
                          <p className="text-xs text-gray-400">
                            {p.segmentCount} segments · {fmt(p.totalSeconds)} · {new Date(p.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Link to={`/custom-course/${p.id}`}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-105"
                              style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                          <Play className="w-3 h-3 inline mr-1" /> Play
                        </Link>
                        <button onClick={() => { deletePlaylist(p.id); window.location.reload() }}
                                className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                        className="rounded-3xl bg-white border border-gray-100 shadow-lg p-10 text-center">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                AI is building your course…
              </h3>
              <p className="text-sm text-gray-500 mb-6 min-h-[1.5rem]">{progress || 'Working…'}</p>
              <div className="space-y-2 max-w-sm mx-auto text-left">
                {[
                  'Extracted topics from syllabus',
                  'Embedding topic vectors',
                  `Searching ${COURSES.length}-course atomic-tagged library`,
                  'Stitching matching segments into playlist',
                ].map((msg, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                    <Zap className="w-3 h-3 text-primary" /> {msg}
                  </div>
                ))}
              </div>

              {error && (
                <div className="mt-6 inline-flex items-start gap-2 p-3 rounded-xl text-sm text-left"
                     style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
                </div>
              )}
              {error && (
                <button onClick={reset} className="mt-4 btn-primary text-xs">Try again</button>
              )}
            </motion.div>
          )}

          {step === 2 && playlist && (
            <motion.div key="step2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}>
              <div className="mb-4 flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-green-600 font-semibold">Playlist generated</span>
                <span className="text-gray-400">· {topics.length} topics → {playlist.segmentCount} segments matched</span>
              </div>
              <PlaylistBuilder playlist={playlist} onBack={reset} onSave={() => {}} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function fmt(sec) {
  const m = Math.floor(sec / 60)
  return `${m} min`
}
