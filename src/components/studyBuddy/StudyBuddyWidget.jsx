import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useLocation } from 'react-router-dom'
import {
  Sparkles, X, Send, Bot, User, Trash2, ArrowRight,
  BookOpen, Loader2, AlertCircle, Lightbulb,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { askStudyBuddy, loadHistory, saveHistory, clearHistory } from '../../lib/studyBuddy'
import { COURSES } from '../../data/constants'

const SUGGESTIONS = [
  { icon: '✨', text: 'Quiz me on a topic' },
  { icon: '📖', text: 'Summarise the last lesson' },
  { icon: '🎯', text: "I'm stuck — help me" },
  { icon: '🧠', text: 'What should I revise next?' },
]

export default function StudyBuddyWidget() {
  const { user } = useAuth()
  const location = useLocation()
  const [open, setOpen]         = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput]       = useState('')
  const [busy, setBusy]         = useState(false)
  const [unread, setUnread]     = useState(0)
  const scrollRef = useRef(null)

  /* Detect what course we're in (drives the AI context) */
  const courseId = location.pathname.match(/^\/module\/([^\/]+)/)?.[1] || null
  const course   = courseId && COURSES.find(c => c.id === courseId)

  /* Load history when user changes */
  useEffect(() => {
    if (!user) { setMessages([]); return }
    setMessages(loadHistory(user.email))
  }, [user?.email])

  /* Scroll to bottom on new message */
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  /* Reset unread when opened */
  useEffect(() => { if (open) setUnread(0) }, [open])

  if (!user) return null   // study buddy is for logged-in users only

  const send = async (textOverride) => {
    const text = (textOverride ?? input).trim()
    if (!text || busy) return
    const userMsg = { id: 'u-' + Date.now(), role: 'user', content: text, at: Date.now() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setBusy(true)

    const res = await askStudyBuddy({
      question: text,
      courseId,
      history: next.slice(-6).map(m => ({ role: m.role, content: m.content })),
    })

    const aiMsg = {
      id: 'a-' + Date.now(),
      role: 'assistant',
      content: res.answer,
      citations: res.citations || [],
      source: res.source,
      at: Date.now(),
    }
    const final = [...next, aiMsg]
    setMessages(final)
    saveHistory(user.email, final)
    setBusy(false)
    if (!open) setUnread(u => u + 1)
  }

  const handleClear = () => {
    setMessages([])
    clearHistory(user.email)
  }

  return (
    <>
      {/* ── Launcher ── */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: 'spring' }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-24 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl text-white"
        style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}
        aria-label="Open Study Buddy"
      >
        <motion.div animate={open ? { rotate: 90 } : { rotate: 0 }} transition={{ duration: 0.2 }}>
          {open ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6 text-yellow-300" />}
        </motion.div>
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
            {unread}
          </span>
        )}
      </motion.button>

      {/* ── Panel ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0,  scale: 1 }}
            exit={{ opacity: 0, y: 16,    scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-4 sm:right-6 z-40 w-[calc(100vw-2rem)] sm:w-[400px] max-h-[78vh] flex flex-col bg-white rounded-3xl shadow-2xl overflow-hidden"
            style={{ border: '1px solid rgba(0,71,171,0.15)' }}
          >
            {/* Header */}
            <div className="relative p-4 text-white" style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
              <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/15 flex-shrink-0">
                  <Bot className="w-5 h-5 text-yellow-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
                    Study Buddy
                  </h3>
                  <p className="text-[11px] text-white/65 flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    {course ? `Tutoring ${course.title}` : 'Ready to help'}
                  </p>
                </div>
                {messages.length > 0 && (
                  <button onClick={handleClear} title="Clear chat"
                          className="p-2 rounded-lg hover:bg-white/15 text-white/70 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Body */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: '#f8faff' }}>
              {messages.length === 0 ? (
                <Welcome onPick={send} />
              ) : (
                messages.map(m => <ChatBubble key={m.id} m={m} />)
              )}
              {busy && <ChatBubble m={{ role: 'assistant', content: null, busy: true }} />}
            </div>

            {/* Suggestion chips (only when no chat yet) */}
            {messages.length === 0 && (
              <div className="px-4 pb-2 flex flex-wrap gap-1.5">
                {SUGGESTIONS.map(s => (
                  <button key={s.text} onClick={() => send(s.text)}
                          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 hover:border-primary hover:bg-primary/5 hover:text-primary transition-colors">
                    {s.icon} {s.text}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form onSubmit={e => { e.preventDefault(); send() }} className="p-3 border-t border-gray-100 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
                  }}
                  placeholder={course ? `Ask about ${course.title}…` : 'Ask anything…'}
                  rows={1}
                  className="flex-1 resize-none px-3 py-2 rounded-xl text-sm border border-gray-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 max-h-32"
                />
                <button type="submit" disabled={!input.trim() || busy}
                        className="p-2.5 rounded-xl text-white disabled:opacity-40 transition-opacity flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5 px-1 flex items-center gap-1">
                <AlertCircle className="w-2.5 h-2.5" />
                Answers grounded in Nexus 101 curriculum only.
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

/* ── Subcomponents ───────────────────────────── */
function Welcome({ onPick }) {
  return (
    <div className="text-center py-6 px-4">
      <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
        <Sparkles className="w-7 h-7 text-yellow-300" />
      </div>
      <h4 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
        Hi! I'm your Study Buddy.
      </h4>
      <p className="text-xs text-gray-500 leading-relaxed">
        I can quiz you, summarise concepts, or point you to the right module.<br />
        Try one of the suggestions below.
      </p>
    </div>
  )
}

function ChatBubble({ m }) {
  const isUser = m.role === 'user'
  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-sm px-3 py-2 text-white text-sm whitespace-pre-wrap"
             style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
          {m.content}
        </div>
        <div className="ml-2 w-7 h-7 rounded-full flex items-center justify-center bg-gray-100 text-gray-500 flex-shrink-0">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    )
  }
  return (
    <div className="flex">
      <div className="mr-2 w-7 h-7 rounded-full flex items-center justify-center text-yellow-500 flex-shrink-0"
           style={{ background: 'rgba(0,71,171,0.1)' }}>
        <Bot className="w-3.5 h-3.5" />
      </div>
      <div className="max-w-[80%]">
        <div className="rounded-2xl rounded-bl-sm px-3 py-2 bg-white text-gray-800 text-sm whitespace-pre-wrap shadow-sm border border-gray-100">
          {m.busy ? (
            <div className="flex items-center gap-1.5 text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          ) : (
            renderRich(m.content)
          )}
        </div>
        {/* Citations */}
        {m.citations?.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {m.citations.map((c, i) => (
              <Link key={i} to={`/module/${c.courseId}`}
                    className="text-[10px] px-2 py-1 rounded-full bg-blue-50 text-primary border border-blue-100 hover:bg-blue-100 transition-colors flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />
                {c.topicTitle} <ArrowRight className="w-2.5 h-2.5" />
              </Link>
            ))}
          </div>
        )}
        {m.source === 'mock' && (
          <p className="mt-1 text-[10px] text-gray-400 flex items-center gap-1 px-1">
            <Lightbulb className="w-2.5 h-2.5" /> Offline study mode — connect Anthropic key for live answers
          </p>
        )}
      </div>
    </div>
  )
}

/* Tiny markdown-lite: bold + italic */
function renderRich(text) {
  if (!text) return null
  const parts = text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g).filter(Boolean)
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>
    if (p.startsWith('_') && p.endsWith('_'))   return <em key={i}>{p.slice(1, -1)}</em>
    return <span key={i}>{p}</span>
  })
}
