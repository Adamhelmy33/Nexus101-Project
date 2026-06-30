import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Mail, Phone, MapPin, MessageCircle, Send, AlertCircle,
  CheckCircle2, ChevronDown, Clock, Sparkles,
} from 'lucide-react'
import { WHATSAPP_NUMBER, SUPPORT_EMAIL } from '../data/constants'

const FAQS = [
  {
    q: 'What exactly do I get when I buy a revision module?',
    a: 'Lifetime access to a full set of HD video revisions, downloadable PDF revision sheets, past-paper walkthroughs, and direct WhatsApp tutoring support — all focused on the specific module you bought.',
  },
  {
    q: 'Are these meant to replace my university lectures?',
    a: 'No — they are designed to revise and reinforce what you already studied at university, so you walk into the exam confident and prepared. Think of us as your final-revision coach.',
  },
  {
    q: 'How does WhatsApp tutoring work?',
    a: 'Anywhere inside the platform you can tap "WhatsApp Tutoring" to message a real tutor. Send a screenshot, ask about a step, or get a quick concept clarified — usually within an hour.',
  },
  {
    q: 'Can I get a refund if I don\'t like the module?',
    a: 'Yes, we offer a 7-day money-back guarantee on all revision modules.',
  },
  {
    q: 'Which universities do you cover?',
    a: 'Currently University of Hertfordshire — with more universities on the way. Drop us a message if your university isn\'t listed yet.',
  },
]

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' })
  const [error, setError] = useState('')
  const [sent, setSent]   = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setError('') }

  const submit = (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setError('Please fill in your name, email, and message.')
      return
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email.')
      return
    }
    /* In production: POST this to your backend / serverless function. */
    setSent(true)
  }

  return (
    <div>
      {/* ── Hero ── */}
      <div className="pt-36 sm:pt-28 pb-16 text-center relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)' }}>
        <div className="absolute inset-0 opacity-5"
             style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-3xl mx-auto px-4">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="text-primary-light font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
            Talk to Us
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                     className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
                     style={{ fontFamily: 'Playfair Display, serif' }}>
            Get in Touch
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-white/65 text-base sm:text-lg px-2 sm:px-0">
            Questions about a module, payment, or your university? We're here.
          </motion.p>
        </div>
        <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 50" fill="none">
          <path d="M0 50L1440 50L1440 20C1200 45 960 55 720 40C480 25 240 10 0 30V50Z" fill="white" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── Quick channels ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          <ContactCard
            icon={MessageCircle}
            title="WhatsApp"
            subtitle="Fastest response · 24/7"
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hi Nexus 101!')}`}
            color="#25d366"
          />
          <ContactCard
            icon={Mail}
            title="Email"
            subtitle={SUPPORT_EMAIL}
            href={`mailto:${SUPPORT_EMAIL}`}
            color="#0047AB"
          />
          <ContactCard
            icon={Phone}
            title="Call"
            subtitle={`+${WHATSAPP_NUMBER}`}
            href={`tel:+${WHATSAPP_NUMBER}`}
            color="#f0a500"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Form ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
              Send us a message
            </h2>
            <p className="text-sm text-gray-500 mb-6">We typically reply within a few hours.</p>

            {sent ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                  <CheckCircle2 className="w-8 h-8 text-white" strokeWidth={3} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Message sent!
                </h3>
                <p className="text-sm text-gray-500 mb-5">We'll get back to you at <strong>{form.email}</strong>.</p>
                <button
                  onClick={() => { setSent(false); setForm({ name: '', email: '', phone: '', subject: '', message: '' }) }}
                  className="text-sm text-primary font-semibold hover:underline"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Full name *">
                    <input value={form.name} onChange={e => set('name', e.target.value)} placeholder="Ahmed Mohamed" className={inputClass} />
                  </Field>
                  <Field label="Email *">
                    <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@example.com" className={inputClass} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field label="Phone (optional)">
                    <input value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+20 1XX XXX XXXX" className={inputClass} />
                  </Field>
                  <Field label="Subject">
                    <select value={form.subject} onChange={e => set('subject', e.target.value)} className={inputClass}>
                      <option value="">Select a topic…</option>
                      <option>Question about a module</option>
                      <option>Payment / billing</option>
                      <option>Request a new module / university</option>
                      <option>Technical support</option>
                      <option>Other</option>
                    </select>
                  </Field>
                </div>
                <Field label="Your message *">
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={e => set('message', e.target.value)}
                    placeholder="Tell us how we can help…"
                    className={inputClass + ' resize-none'}
                  />
                </Field>

                {error && (
                  <div className="flex items-start gap-2 p-3 rounded-xl text-sm" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button type="submit" className="btn-primary justify-center mt-2">
                  <Send className="w-4 h-4" /> Send message
                </button>
              </form>
            )}
          </motion.div>

          {/* ── Side info: location, hours, FAQ ── */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="rounded-3xl p-7 shadow-lg relative overflow-hidden text-white"
              style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}
            >
              <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
              <div className="relative">
                <div className="flex items-center gap-2 text-yellow-200 text-xs font-semibold mb-3 uppercase tracking-widest">
                  <Sparkles className="w-3 h-3" /> Quick info
                </div>
                <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  We're online almost always.
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3"><MapPin className="w-4 h-4 mt-0.5 text-yellow-300 flex-shrink-0" /> Cairo, Egypt</li>
                  <li className="flex items-start gap-3"><Clock className="w-4 h-4 mt-0.5 text-yellow-300 flex-shrink-0" /> Support hours: Sat – Thu, 10 AM – 11 PM (Cairo time)</li>
                  <li className="flex items-start gap-3"><MessageCircle className="w-4 h-4 mt-0.5 text-yellow-300 flex-shrink-0" /> WhatsApp tutoring available 24/7 for enrolled students</li>
                </ul>
              </div>
            </motion.div>

            {/* FAQ */}
            <motion.div
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="bg-white rounded-3xl shadow-lg border border-gray-100 p-7"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                Frequently asked
              </h3>
              <div className="space-y-2">
                {FAQS.map((faq, i) => (
                  <div key={faq.q} className="rounded-xl border border-gray-100 overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(openFaq === i ? -1 : i)}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-blue-50/40 transition-colors"
                    >
                      <span className="text-sm font-semibold text-gray-900">{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${openFaq === i ? 'rotate-180' : ''}`} />
                    </button>
                    {openFaq === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        transition={{ duration: 0.2 }}
                        className="px-4 pb-3 text-sm text-gray-500 leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── helpers ─────────────────────────────────── */
const inputClass =
  'w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all bg-white placeholder-gray-400'

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-gray-700">{label}</label>
      {children}
    </div>
  )
}

function ContactCard({ icon: Icon, title, subtitle, href, color }) {
  return (
    <motion.a
      whileHover={{ y: -4 }}
      href={href}
      target={href.startsWith('http') ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="group bg-white rounded-2xl p-5 shadow-md border border-gray-100 flex items-center gap-4 transition-all hover:shadow-xl"
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white flex-shrink-0 group-hover:scale-110 transition-transform"
        style={{ background: color }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-500 truncate">{subtitle}</p>
      </div>
    </motion.a>
  )
}
