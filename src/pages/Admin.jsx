import { useState, useMemo, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Users, Activity, BookOpen, Search, Download,
  TrendingUp, Calendar, ShoppingCart, Eye, ChevronDown, LogOut,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { getAllUsers, getAdminMetrics, getActiveViewers } from '../lib/auth'
import { COURSES } from '../data/constants'
import Logo from '../components/Logo'

export default function Admin() {
  const { user, logout } = useAuth()
  const [tick, setTick] = useState(0)   // re-render every 10s for "active viewers"
  const [search, setSearch]         = useState('')
  const [filterCourse, setFilterCourse] = useState('all')

  /* ── Live refresh ── */
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 10_000)
    return () => clearInterval(id)
  }, [])

  /* ── Crunch numbers ── */
  const { metrics, allUsers, allPurchases, activeViewers } = useMemo(() => {
    const allUsers = getAllUsers()
    const metrics  = getAdminMetrics(COURSES)
    const allPurchases = allUsers.flatMap(u =>
      (u.purchases || []).map(p => ({ ...p, email: u.email, name: u.name }))
    )
    return { metrics, allUsers, allPurchases, activeViewers: getActiveViewers() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])

  /* ── Filter user-purchase rows ── */
  const filteredPurchases = allPurchases.filter(p => {
    if (filterCourse !== 'all' && p.courseId !== filterCourse) return false
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return p.email.toLowerCase().includes(q) || p.name?.toLowerCase().includes(q)
  })

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
          <p className="text-sm text-gray-500">Real-time overview of revenue, students, and active sessions.</p>
        </motion.div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={DollarSign}
            label="Total Revenue"
            value={`${metrics.totalRevenue.toLocaleString()} EGP`}
            sub={`from ${allPurchases.length} sale${allPurchases.length !== 1 ? 's' : ''}`}
            gradient="linear-gradient(135deg, #0047AB, #1a6fd4)"
            light={false}
          />
          <StatCard
            icon={Users}
            label="Subscribers"
            value={metrics.subscriberCount.toLocaleString()}
            sub={`${metrics.totalUsers} total accounts`}
            gradient="#f8faff"
            border
            light
            iconBg="rgba(0,71,171,0.1)"
            iconColor="#0047AB"
          />
          <StatCard
            icon={Activity}
            label="Active Viewers"
            value={activeViewers.length.toString()}
            sub="logged in within 5 min"
            gradient="linear-gradient(135deg, #16a34a, #22c55e)"
            light={false}
          />
          <StatCard
            icon={BookOpen}
            label="Modules Live"
            value={COURSES.length.toString()}
            sub={`${COURSES.reduce((s, c) => s + c.modules, 0)} total lessons`}
            gradient="#f8faff"
            border
            light
            iconBg="rgba(240,165,0,0.15)"
            iconColor="#f0a500"
          />
        </div>

        {/* ── Per-course breakdown ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              Revenue by module
            </h2>
            <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metrics.perCourse.map(c => (
              <div key={c.id} className="rounded-2xl p-4" style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${c.gradientFrom}, ${c.gradientTo})` }}
                  >
                    {c.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.title}</p>
                    <p className="text-xs text-gray-400">{c.sales} sale{c.sales !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {c.revenue.toLocaleString()} <span className="text-xs text-gray-400 font-medium">EGP</span>
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Purchases table ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <div>
              <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Student Purchases
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredPurchases.length} of {allPurchases.length} record{allPurchases.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search students…"
                  className="pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm w-full sm:w-56 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div className="relative">
                <select
                  value={filterCourse}
                  onChange={e => setFilterCourse(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="all">All courses</option>
                  {COURSES.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {filteredPurchases.length === 0 ? (
            <div className="text-center py-14 text-gray-400">
              <ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No purchases found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#f8faff' }}>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="px-6 py-3 font-semibold">Student</th>
                    <th className="px-6 py-3 font-semibold">Course</th>
                    <th className="px-6 py-3 font-semibold">Method</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPurchases.map((p, i) => {
                    const course = COURSES.find(c => c.id === p.courseId)
                    return (
                      <tr key={i} className="border-t border-gray-100 hover:bg-blue-50/40 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                 style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                              {(p.name || p.email)[0].toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{p.name || '—'}</p>
                              <p className="text-xs text-gray-400 truncate">{p.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{course?.icon}</span>
                            <span className="text-gray-700">{course?.title || p.courseId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <span className="text-xs px-2 py-1 rounded-full font-medium"
                                style={{ background: p.method === 'wallet' ? '#fef2f2' : '#eff6ff',
                                         color:      p.method === 'wallet' ? '#b91c1c' : '#1e3a8a' }}>
                            {p.method === 'wallet' ? 'Vodafone Cash' : 'Card'}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-gray-500 text-xs">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            {new Date(p.purchasedAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <span className="font-bold text-primary">{p.amount.toLocaleString()}</span>
                          <span className="text-xs text-gray-400 ml-1">EGP</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        {/* ── All users list ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-8">
          <div className="p-6" style={{ borderBottom: '1px solid #f1f5f9' }}>
            <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              All registered users
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{allUsers.length} total</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead style={{ background: '#f8faff' }}>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-6 py-3 font-semibold">Name / Email</th>
                  <th className="px-6 py-3 font-semibold">Modules owned</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Registered</th>
                </tr>
              </thead>
              <tbody>
                {allUsers.map((u, i) => {
                  const isLive = activeViewers.includes(u.email)
                  return (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-6 py-3">
                        <p className="font-medium text-gray-900 text-sm">{u.name || '—'}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-gray-700 font-semibold">{(u.purchases || []).length}</span>
                        <span className="text-xs text-gray-400 ml-1">module{(u.purchases || []).length !== 1 ? 's' : ''}</span>
                      </td>
                      <td className="px-6 py-3">
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
                      <td className="px-6 py-3 text-gray-500 text-xs">
                        {new Date(u.registeredAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
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
