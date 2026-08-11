import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mail, Lock, User, ArrowRight, AlertCircle, Eye, EyeOff,
  Phone, HelpCircle, GraduationCap, BookOpen, RotateCcw,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import Logo from '../components/Logo'

const INITIAL_FORM = {
  email: '',
  password: '',
  name: '',
  whatsappNumber: '',
  isReturningStudent: '',
  referralSource: '',
  highSchoolSystem: '',
  major: '',
}

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [form, setForm] = useState(INITIAL_FORM)
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

    if (mode === 'register') {
      if (!form.name.trim()) {
        setError('Please enter your full name.')
        setBusy(false)
        return
      }
      const cleanEmail = form.email.trim().toLowerCase()
      if (!cleanEmail || !cleanEmail.endsWith('@gmail.com')) {
        setError('Registration requires a @gmail.com email address.')
        setBusy(false)
        return
      }
      if (!form.whatsappNumber.trim()) {
        setError('Please enter your WhatsApp number.')
        setBusy(false)
        return
      }
      if (!form.password || form.password.length < 6) {
        setError('Password must be at least 6 characters.')
        setBusy(false)
        return
      }
      if (!form.isReturningStudent) {
        setError('Please select whether you are a returning student.')
        setBusy(false)
        return
      }
      if (!form.referralSource) {
        setError('Please select how you heard about us.')
        setBusy(false)
        return
      }
      if (!form.highSchoolSystem) {
        setError('Please select your high school system.')
        setBusy(false)
        return
      }
      if (!form.major) {
        setError('Please select your major.')
        setBusy(false)
        return
      }
    }

    let res
    try {
      res = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form)
    } catch (err) {
      console.warn('[Login] submit threw:', err)
      setBusy(false)
      setError('Something went wrong. Please try again.')
      return
    } finally {
      setBusy(false)
    }

    if (!res?.ok) { setError(res?.error || 'Login failed.'); return }

    if (res.needsConfirmation) {
      setError('Check your email to confirm your account before signing in.')
      return
    }

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
        className={`w-full relative z-10 transition-all duration-300 ${mode === 'register' ? 'max-w-xl' : 'max-w-md'}`}
      >
        {/* Logo */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <Logo variant="white" height={40} />
          </Link>
        </div>

        <div className="glass-light rounded-3xl p-6 sm:p-8 shadow-2xl" style={{ border: '1px solid rgba(255,255,255,0.2)' }}>
          {/* Mode tabs */}
          <div className="flex p-1 rounded-xl mb-6" style={{ background: '#f1f5f9' }}>
            {['login', 'register'].map(m => (
              <button
                key={m}
                type="button"
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
                  : 'Fill in your details to create your Nexus 101 student profile.'}
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

                <Field icon={Mail} label="Email address" sublabel={mode === 'register' ? '(Must end in @gmail.com)' : ''}>
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    placeholder="you@gmail.com"
                    className={inputClass}
                    autoComplete="email"
                  />
                </Field>

                {mode === 'register' && (
                  <Field icon={Phone} label="WhatsApp number">
                    <input
                      type="tel"
                      value={form.whatsappNumber}
                      onChange={e => set('whatsappNumber', e.target.value)}
                      placeholder="+20 100 000 0000"
                      className={inputClass}
                    />
                  </Field>
                )}

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

                {mode === 'register' && (
                  <>
                    <RadioField
                      icon={RotateCcw}
                      label="Have you subscribed to a Nexus 101 revision before?"
                      name="isReturningStudent"
                      selected={form.isReturningStudent}
                      onChange={val => set('isReturningStudent', val)}
                      options={[
                        { value: 'yes', label: 'Yes, returning student' },
                        { value: 'no', label: 'No, first time' },
                      ]}
                    />

                    <RadioField
                      icon={HelpCircle}
                      label="How did you hear about us?"
                      name="referralSource"
                      selected={form.referralSource}
                      onChange={val => set('referralSource', val)}
                      options={[
                        { value: 'friend_referral', label: 'Friend / Referral' },
                        { value: 'whatsapp_group', label: 'WhatsApp Group' },
                        { value: 'instagram', label: 'Instagram' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />

                    <RadioField
                      icon={GraduationCap}
                      label="High School System"
                      name="highSchoolSystem"
                      selected={form.highSchoolSystem}
                      onChange={val => set('highSchoolSystem', val)}
                      options={[
                        { value: 'igcse', label: 'IGCSE' },
                        { value: 'american', label: 'American' },
                        { value: 'thanweya_amma', label: 'Thanweya Amma' },
                        { value: 'ib', label: 'IB' },
                        { value: 'other', label: 'Other' },
                      ]}
                    />

                    <RadioField
                      icon={BookOpen}
                      label="Choose Your Major"
                      name="major"
                      selected={form.major}
                      onChange={val => set('major', val)}
                      options={[
                        { value: 'engineering/ifp', label: 'Engineering (IFP)' },
                        { value: 'engineering/level-4', label: 'Engineering (Level 4)' },
                        { value: 'physiotherapy/ifp', label: 'Physiotherapy (IFP)' },
                        { value: 'physiotherapy/level-4', label: 'Physiotherapy (Level 4)' },
                        { value: 'pharmacy/ifp', label: 'Pharmacy (IFP)' },
                      ]}
                    />
                  </>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-sm mt-1" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" disabled={busy} className="btn-primary justify-center mt-2 disabled:opacity-60">
                  {busy ? 'Please wait…' : (mode === 'login' ? 'Sign In' : 'Create Account')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
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

function Field({ icon: Icon, label, sublabel, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center justify-between text-sm font-semibold text-gray-700">
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-primary" />}
          {label}
        </span>
        {sublabel && <span className="text-xs text-primary/80 font-normal">{sublabel}</span>}
      </label>
      {children}
    </div>
  )
}

function RadioField({ icon: Icon, label, name, selected, onChange, options }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        {Icon && <Icon className="w-4 h-4 text-primary" />}
        {label}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map(opt => {
          const isChecked = selected === opt.value
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all text-xs font-medium ${
                isChecked
                  ? 'border-primary bg-primary/5 text-primary font-semibold shadow-sm'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={isChecked}
                onChange={() => onChange(opt.value)}
                className="w-4 h-4 text-primary focus:ring-primary/20 accent-primary"
              />
              <span>{opt.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

