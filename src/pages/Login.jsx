import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState({ email: '', password: '', name: '' })
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)

  const { login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from || '/my-courses'

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')

    const fn  = mode === 'login' ? login : register
    const res = mode === 'login'
      ? login(form.email, form.password)
      : register(form)

    setBusy(false)
    if (!res.ok) { setError(res.error); return }

    // Admin → admin dashboard, everyone else → wherever they came from
    if (res.user.isAdmin) navigate('/admin-nexus', { replace: true })
    else navigate(redirectTo, { replace: true })
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)' }}
    >
      {/* decorative shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="animate-float absolute top-20 right-20 w-72 h-72 rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.15), transparent)' }} />
        <div className="animate-float-rev absolute bottom-20 left-20 w-72 h-72 rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(240,165,0,0.15), transparent)' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo variant="white" height={40} />
          </Link>
        </div>

        <div className="glass-light rounded-3xl p-8 shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
          {/* Mode tabs */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: '#f1f5f9' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                  mode === m
                    ? 'bg-white text-primary shadow'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                {mode === 'login' ? 'Welcome back' : 'Create your account'}
              </h1>
              <p className="text-sm text-gray-500 mb-6">
                {mode === 'login'
                  ? 'Sign in to access your purchased revision modules.'
                  : 'Sign up to buy and watch revision modules.'}
              </p>

              <form onSubmit={submit} className="flex flex-col gap-4">
                {mode === 'register' && (
                  <Field icon={User} label="Full name">
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => set('name', e.target.value)}
                      placeholder="Ahmed Mohamed"
                      className={inputClass}
                      autoComplete="name"
                    />
                  </Field>
                )}

                <Field icon={Mail} label="Email address">
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@example.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </Field>

                <Field icon={Lock} label="Password">
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                      className={inputClass + ' pr-12'}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy} className="btn-primary justify-center mt-2 disabled:opacity-60">
                  {busy ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {mode === 'login' && (
                <div className="mt-6 p-4 rounded-xl text-xs" style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
                  <p className="font-semibold text-gray-700 mb-1">Demo accounts (for testing):</p>
                  <p className="text-gray-500">Admin: <code className="font-mono text-primary">admin@nexus101.com</code> / <code className="font-mono text-primary">nexus2025</code></p>
                  <p className="text-gray-500">Student: <code className="font-mono text-primary">demo@student.com</code> / <code className="font-mono text-primary">demo123</code></p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-white/50 text-xs mt-6">
          <Link to="/" className="hover:text-white transition-colors">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  )
}

/* ── helpers ─────────────────────────────────── */
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all bg-white placeholder-gray-400'

function Field({ icon: Icon, label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Icon className="w-4 h-4 text-primary" />
        {label}
      </label>
      {children}
    </div>
  )
}
