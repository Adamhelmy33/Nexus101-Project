import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users, Activity, LogOut, MessageCircle,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, getActiveViewers } from '../lib/auth'
import Logo from '../components/Logo'

const MAJOR_GROUPS = [
  { id: 'eng-ifp', title: 'Engineering — IFP', subject: 'engineering', level: 'ifp' },
  { id: 'eng-l4', title: 'Engineering — Level 4', subject: 'engineering', level: 'level-4' },
  { id: 'phys-ifp', title: 'Physiotherapy — IFP', subject: 'physiotherapy', level: 'ifp' },
  { id: 'phys-l4', title: 'Physiotherapy — Level 4', subject: 'physiotherapy', level: 'level-4' },
  { id: 'pharm-ifp', title: 'Pharmacy — IFP', subject: 'pharmacy', level: 'ifp' },
  { id: 'unspecified', title: 'Not specified', isUnspecified: true },
]

const HIGH_SCHOOL_LABELS = {
  igcse: 'IGCSE',
  american: 'American',
  thanweya_amma: 'Thanweya Amma',
  ib: 'IB',
  other: 'Other',
}

const REFERRAL_LABELS = {
  friend_referral: 'Friend / Referral',
  whatsapp_group: 'WhatsApp Group',
  instagram: 'Instagram',
  email: 'Email',
  other: 'Other',
}

function formatHighSchool(slug) {
  if (!slug) return '—'
  return HIGH_SCHOOL_LABELS[slug] || slug
}

function formatReferral(slug) {
  if (!slug) return '—'
  return REFERRAL_LABELS[slug] || slug
}

export default function Admin() {
  const { user, logout } = useAuth()
  const [allUsers, setAllUsers]    = useState([])
  const [activeViewers, setActive] = useState([])
  const [loading, setLoading]      = useState(true)

  /* ── Group users by major_subject + major_study_level ── */
  const groupedUsers = MAJOR_GROUPS.map(group => {
    let users
    if (group.isUnspecified) {
      users = allUsers.filter(u =>
        !u.majorSubject ||
        !u.majorStudyLevel ||
        !MAJOR_GROUPS.some(g => !g.isUnspecified && g.subject === u.majorSubject && g.level === u.majorStudyLevel)
      )
    } else {
      users = allUsers.filter(u => u.majorSubject === group.subject && u.majorStudyLevel === group.level)
    }
    return { ...group, users }
  })

  /* ── Fetch live data from Supabase, refresh every 10s ── */
  useEffect(() => {
    let alive = true
    async function fetchAll() {
      const users = await getAllUsers()
      if (!alive) return
      setAllUsers(users)
      setActive(getActiveViewers())
      setLoading(false)
    }
    fetchAll()
    const id = setInterval(fetchAll, 10_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#f8faff' }}>

      {/* ── Header ── */}
      <header className="bg-white shadow-sm" style={{ borderBottom: '1px solid #e2ecf9' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo variant="blue" height={32} />
            <span className="hidden sm:inline-block text-xs font-bold uppercase tracking-widest text-gray-400 px-2 py-1 rounded"
                  style={{ background: '#f1f5f9' }}>
              Admin
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ background: '#dcfce7', color: '#15803d' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              {activeViewers.length} live
            </div>
            <span className="text-sm text-gray-600 hidden md:inline">
              {user.name} <span className="text-gray-400">· {user.email}</span>
            </span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page title ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Owner Dashboard
          </h1>
          <p className="text-sm text-gray-500">Real-time overview of registered students and active sessions.</p>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 max-w-2xl gap-4 mb-8">
          <StatCard
            icon={Activity}
            label="Active Viewers"
            value={activeViewers.length.toString()}
            sub="logged in within 5 min"
            gradient="linear-gradient(135deg, #16a34a, #22c55e)"
            light={false}
          />
          <StatCard
            icon={Users}
            label="Registered Students"
            value={allUsers.length.toString()}
            sub="total registered accounts"
            gradient="linear-gradient(135deg, #0047AB, #1a6fd4)"
            light={false}
          />
        </div>

        {/* ── All users list grouped by major ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="mt-8 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                All registered users
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">{allUsers.length} total users across majors</p>
            </div>
          </div>

          {groupedUsers.map(group => (
            <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 flex items-center justify-between" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {group.title}
                </h3>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-primary border border-blue-100">
                  {group.users.length} student{group.users.length !== 1 ? 's' : ''}
                </span>
              </div>
              {group.users.length === 0 ? (
                <div className="p-6 text-center text-xs text-gray-400">
                  No students registered in this group yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead style={{ background: '#f8faff' }}>
                      <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">Name / Email</th>
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">WhatsApp</th>
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">Returning</th>
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">Referral</th>
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">High School</th>
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">Status</th>
                        <th className="px-6 py-3 font-semibold whitespace-nowrap">Registered</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.users.map((u, i) => {
                        const isLive = activeViewers.includes(u.email)
                        const cleanPhone = u.whatsappNumber ? u.whatsappNumber.replace(/[^0-9+]/g, '') : null
                        const waLink = cleanPhone ? `https://wa.me/${cleanPhone.replace('+', '')}` : null

                        return (
                          <tr key={i} className="border-t border-gray-100 hover:bg-slate-50/50 transition-colors">
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              <p className="font-medium text-gray-900 text-sm">{u.name || '—'}</p>
                              <p className="text-xs text-gray-400">{u.email}</p>
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              {waLink ? (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>{u.whatsappNumber}</span>
                                </a>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              {u.isReturningStudent === true ? (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  Yes
                                </span>
                              ) : u.isReturningStudent === false ? (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-50 text-gray-600 border border-gray-200">
                                  No
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              {u.referralSource ? (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  {formatReferral(u.referralSource)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              {u.highSchoolSystem ? (
                                <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-100">
                                  {formatHighSchool(u.highSchoolSystem)}
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 whitespace-nowrap">
                              {u.isAdmin ? (
                                <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: '#fef3c7', color: '#92400e' }}>Admin</span>
                              ) : isLive ? (
                                <span className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium w-fit" style={{ background: '#dcfce7', color: '#15803d' }}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                  Online
                                </span>
                              ) : (
                                <span className="text-xs text-gray-400">Offline</span>
                              )}
                            </td>
                            <td className="px-6 py-3.5 text-gray-500 text-xs whitespace-nowrap">
                              {new Date(u.registeredAt).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

/* ── helpers ─────────────────────────────────── */
function StatCard({ icon: Icon, label, value, sub, gradient, light = false, border = false, iconBg, iconColor }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-5 relative overflow-hidden card-hover"
      style={{
        background: gradient,
        border: border ? '1px solid #e2ecf9' : 'none',
      }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-3"
        style={{
          background: light ? iconBg : 'rgba(255,255,255,0.18)',
          color:       light ? iconColor : '#ffffff',
        }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className={`text-3xl font-bold mb-0.5 ${light ? 'text-gray-900' : 'text-white'}`}>{value}</p>
      <p className={`text-sm font-semibold ${light ? 'text-gray-700' : 'text-white/90'}`}>{label}</p>
      <p className={`text-xs ${light ? 'text-gray-400' : 'text-white/55'}`}>{sub}</p>
    </motion.div>
  )
}

