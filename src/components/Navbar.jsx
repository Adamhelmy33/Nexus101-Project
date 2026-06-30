import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu, X, ShoppingCart, BookOpen, LogOut, LayoutDashboard, ChevronDown,
  BarChart3,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const PUBLIC_LINKS = [
  { path: '/',        label: 'Home' },
  { path: '/store',   label: 'Store' },
  { path: '/team',    label: 'Team' },
  { path: '/contact', label: 'Contact Us' },
]

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false)
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()
  const { user, isLoggedIn, isAdmin, logout } = useAuth()

  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false); setAccountOpen(false) }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) setAccountOpen(false)
    }
    if (accountOpen) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [accountOpen])

  /* Await logout so user state is cleared BEFORE we navigate. Navigating
     while still logged-in means the OLD protected page re-renders once
     with user=null mid-animation, which used to white-screen. */
  const handleLogout = async () => {
    setAccountOpen(false)
    setMobileOpen(false)
    navigate('/', { replace: true })
    await logout()
  }

  /* ── Logo logic ──
     Home: ALWAYS white logo. Navbar background goes from transparent → dark glass on scroll
           (so the white logo stays readable over both the dark hero AND the white content below).
     Other pages: light glass navbar with the blue logo.
  */
  const onHomeDark =
    isHome && !scrolled                                    // hero — fully transparent nav
  const onHomeScrolled =
    isHome && scrolled                                     // home but scrolled past hero
  const onLight =
    !isHome                                                // any other page

  let navBg = 'bg-transparent'
  if (onHomeScrolled) navBg = 'shadow-lg shadow-blue-100/30 backdrop-blur-md'
  if (onLight)        navBg = scrolled ? 'glass-light shadow-lg shadow-blue-100/40' : 'glass-light shadow-sm'

  const navInlineStyle = onHomeScrolled
    ? { background: 'linear-gradient(180deg, rgba(10,22,40,0.85) 0%, rgba(0,51,128,0.78) 100%)', borderBottom: '1px solid rgba(255,255,255,0.08)' }
    : {}

  const linkColor = isHome ? 'text-white/90' : 'text-gray-700'

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}
        style={navInlineStyle}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">

            {/* ── Logo ── */}
            <Link
              to="/"
              className="flex items-center hover:opacity-75 transition-opacity duration-200"
            >
              <span
                style={{
                  fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  letterSpacing: '0.07em',
                  lineHeight: 1,
                  color: isHome ? '#ffffff' : '#0a1628',
                }}
              >
                NEXUS
              </span>
              <span
                style={{
                  fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '1.75rem',
                  fontWeight: 300,
                  letterSpacing: '0.07em',
                  lineHeight: 1,
                  marginLeft: '0.3em',
                  color: isHome ? '#ffffff' : '#0047AB',
                }}
              >
                101
              </span>
            </Link>

            {/* ── Desktop nav ── */}
            <div className="hidden md:flex items-center gap-1">
              {PUBLIC_LINKS.map(link => {
                const isActive = location.pathname === link.path
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-primary text-white shadow-md'
                        : `${linkColor} hover:bg-primary hover:text-white`
                    }`}
                  >
                    {link.label}
                  </Link>
                )
              })}
              {isLoggedIn && (
                <Link
                  to="/my-courses"
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                    location.pathname.startsWith('/my-courses') || location.pathname.startsWith('/learn')
                      ? 'bg-primary text-white shadow-md'
                      : `${linkColor} hover:bg-primary hover:text-white`
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  My Courses
                </Link>
              )}
            </div>

            {/* ── Right side ── */}
            <div className="flex items-center gap-2">

              {!isLoggedIn ? (
                <>
                  <Link
                    to="/login"
                    className={`hidden md:inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                      isHome ? 'text-white/90 hover:text-white' : 'text-gray-700 hover:text-primary'
                    }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/store"
                    className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200"
                    style={{ background: '#f0a500', color: '#0a1628', boxShadow: '0 4px 14px rgba(240,165,0,0.35)' }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Buy Access
                  </Link>
                </>
              ) : (
                <div className="hidden md:block relative" ref={accountRef}>
                  <button
                    onClick={() => setAccountOpen(o => !o)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-colors ${
                      isHome ? 'hover:bg-white/15' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                         style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                      {(user.name || user.email)[0].toUpperCase()}
                    </div>
                    <span className={`text-sm font-medium ${isHome ? 'text-white/90' : 'text-gray-700'}`}>
                      {user.name?.split(' ')[0] || 'Account'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHome ? 'text-white/60' : 'text-gray-400'} ${accountOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {accountOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-60 glass-light rounded-2xl shadow-2xl py-2 overflow-hidden"
                        style={{ border: '1px solid rgba(0,71,171,0.1)' }}
                      >
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user.email}</p>
                        </div>
                        <Link to="/my-courses" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50">
                          <BookOpen className="w-4 h-4 text-primary" /> My Courses
                        </Link>
                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50">
                          <BarChart3 className="w-4 h-4 text-primary" /> My Dashboard
                        </Link>
{isAdmin && (
                          <Link to="/admin-nexus" className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50">
                            <LayoutDashboard className="w-4 h-4 text-primary" /> Admin Dashboard
                          </Link>
                        )}
                        <button
                          onClick={handleLogout}
                          className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 border-t border-gray-100"
                        >
                          <LogOut className="w-4 h-4" /> Sign out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile burger */}
              <button
                onClick={() => setMobileOpen(v => !v)}
                className={`md:hidden p-2 rounded-xl transition-colors ${
                  isHome ? 'text-white hover:bg-white/15' : 'text-gray-700 hover:bg-gray-100'
                }`}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── Mobile drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="fixed top-20 left-0 right-0 z-40 glass-light shadow-xl md:hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-1">
              {PUBLIC_LINKS.map(link => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    location.pathname === link.path
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {isLoggedIn && (
                <>
                  <Link to="/my-courses" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary">
                    <BookOpen className="w-4 h-4" /> My Courses
                  </Link>
                  <Link to="/dashboard" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary">
                    <BarChart3 className="w-4 h-4" /> Dashboard
                  </Link>
{isAdmin && (
                    <Link to="/admin-nexus" className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary">
                      <LayoutDashboard className="w-4 h-4" /> Admin
                    </Link>
                  )}
                </>
              )}

              <div className="my-2 border-t border-gray-200" />

              {!isLoggedIn ? (
                <>
                  <Link to="/login" className="px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-primary/10 hover:text-primary">
                    Sign In
                  </Link>
                  <Link
                    to="/store"
                    className="mt-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm"
                    style={{ background: '#f0a500', color: '#0a1628' }}
                  >
                    <ShoppingCart className="w-4 h-4" /> Buy Access
                  </Link>
                </>
              ) : (
                <>
                  <div className="px-4 py-3 rounded-xl bg-gray-50">
                    <p className="text-xs text-gray-500">Signed in as</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
