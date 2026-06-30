import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  BarChart3, Sparkles, Trophy, BookOpen, ArrowRight,
  Plus, Target, Activity, MessageCircle, Database, Wand2,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getProgressSummary, seedDemoProgress } from '../lib/progress'
import { WHATSAPP_TUTOR_NUMBER } from '../data/constants'
import SkillHeatmap from '../components/dashboard/SkillHeatmap'
import HoursChart   from '../components/dashboard/HoursChart'

export default function Dashboard() {
  const { user } = useAuth()

  const purchases = user?.purchases || []
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!user || !purchases.length) return
    seedDemoProgress(user.email, purchases)
    setTick(t => t + 1)
    // eslint-disable-next-line
  }, [user?.email, purchases.length])

  const summary = useMemo(() => {
    if (!user) return null
    return getProgressSummary(user.email, purchases)
    // eslint-disable-next-line
  }, [user?.email, purchases.length, tick])

  if (!user || !summary) return null

  const masteredTopics = summary.topicMastery.filter(t => t.mastery >= 0.8).length
  const totalTopics    = summary.topicMastery.length

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#f8faff' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> My Dashboard
          </p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Hi {user.name?.split(' ')[0] || 'student'} 👋
              </h1>
              <p className="text-gray-500">Your revision command center.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/store" className="btn-primary text-xs">
                <Plus className="w-3.5 h-3.5" /> Browse modules
              </Link>
            </div>
          </div>
        </motion.div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <Kpi icon={BookOpen} label="Modules"         value={purchases.length}                          accent="#0047AB" />
          <Kpi icon={Activity} label="Hours studied"   value={summary.totalHours.toFixed(1)}              accent="#0891b2" />
          <Kpi icon={Trophy}   label="Topics mastered" value={`${masteredTopics}/${totalTopics || '–'}`}  accent="#16a34a" />
        </div>

        {/* Top row: WhatsApp tutoring */}
        <div className="mb-6">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                      className="rounded-2xl p-5 relative overflow-hidden text-white"
                      style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)' }}>
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-white/10" />
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-2 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5" /> 24/7 Tutoring
                </p>
                <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Stuck on something?
                </h3>
                <p className="text-xs text-white/80 leading-relaxed">
                  Ask a real tutor on WhatsApp — usually replies within an hour.
                </p>
              </div>
              <a href={`https://wa.me/${WHATSAPP_TUTOR_NUMBER}?text=${encodeURIComponent('Hi! I need help with…')}`}
                 target="_blank" rel="noopener noreferrer"
                 className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white text-green-700 hover:scale-105 transition-transform flex-shrink-0">
                Open chat <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </motion.div>
        </div>

        {/* Heatmap + chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                      className="lg:col-span-2">
            <SkillHeatmap topicMastery={summary.topicMastery} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <HoursChart perCourse={summary.perCourse} totalHours={summary.totalHours} subjectHours={summary.subjectHours} />
          </motion.div>
        </div>

        {/* Custom Course Builder CTA */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="rounded-2xl p-6 mb-6 relative overflow-hidden text-white"
                    style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0047AB 100%)' }}>
          <div className="absolute -right-12 -top-12 w-56 h-56 rounded-full bg-white/5" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 rounded-full" style={{ background: 'rgba(240,165,0,0.18)' }} />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/15 flex-shrink-0">
              <Wand2 className="w-7 h-7 text-yellow-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/80 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-300" /> NEW · AI-powered
              </p>
              <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                Got a syllabus from another university?
              </h3>
              <p className="text-sm text-white/75">
                Drop it in our Custom Course Builder — AI stitches the perfect playlist from our atomic-tagged library.
              </p>
            </div>
            <Link to="/custom-course"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold flex-shrink-0 transition-all hover:scale-105"
                  style={{ background: '#f0a500', color: '#0a1628' }}>
              <Wand2 className="w-4 h-4" /> Build a course
            </Link>
          </div>
        </motion.div>

        {/* Continue watching */}
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Continue watching
              </h2>
              <p className="text-xs text-gray-400">{summary.perCourse.length} active module{summary.perCourse.length !== 1 ? 's' : ''}</p>
            </div>
            <Link to="/my-courses" className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
              Open library <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {summary.perCourse.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-10 h-10 mx-auto mb-2 text-yellow-400 opacity-60" />
              <p className="text-gray-500 font-semibold mb-1">No modules yet</p>
              <p className="text-xs text-gray-400 mb-4">Buy your first revision module to get started.</p>
              <Link to="/store" className="btn-primary text-xs">Browse store</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {summary.perCourse.map(c => (
                <Link key={c.id} to={`/learn/${c.id}`} className="group rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
                  <div className="h-20 flex items-end p-3 relative" style={{ background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})` }}>
                    <span className="text-2xl">{c.icon}</span>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm text-gray-900 truncate group-hover:text-primary transition-colors">{c.title}</p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-2 mt-1">
                      <span>{c.watchedHours}h watched</span>
                      <span className="font-bold text-primary">{c.progressPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.progressPct}%`, background: 'linear-gradient(90deg, #0047AB, #1a6fd4)' }} />
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-500">
                      <Target className="w-3 h-3" />
                      Mastery: {Math.round(c.masteryAvg * 100)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </motion.div>

        {/* Footer info */}
        <div className="rounded-2xl p-5 flex items-start gap-3" style={{ background: '#f8faff', border: '1px dashed #c2d5f1' }}>
          <Database className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Data note —</strong> right now your dashboard runs on local browser storage so you can demo it instantly.
            The exact same shape of data flows when you connect Supabase
            (see <code className="font-mono text-primary">supabase/migrations/</code>) — just swap <code className="font-mono">src/lib/progress.js</code> to use Supabase RPC calls.
          </div>
        </div>
      </div>
    </div>
  )
}

function Kpi({ icon: Icon, label, value, accent }) {
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <p className="text-[11px] text-gray-400 uppercase tracking-widest font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold" style={{ color: accent }}>{value}</p>
    </div>
  )
}
