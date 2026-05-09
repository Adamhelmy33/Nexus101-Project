/* ═══════════════════════════════════════════════
   Nexus 101 — AI Study Buddy client
   ═══════════════════════════════════════════════
   Calls /api/study-buddy (Vercel function) or, if absent, falls back
   to a curriculum-aware mock that gives helpful canned replies.
   When you deploy the Supabase Edge Function (or Vercel function)
   with an ANTHROPIC_API_KEY, this code automatically uses it.
   ═══════════════════════════════════════════════ */

import { COURSES, FOUNDERS, INSTRUCTORS, UNIVERSITIES } from '../data/constants'
import { TOPICS_BY_COURSE } from '../data/topics'

const API_PATH = '/api/study-buddy'

/* ── Local conversation history (not strictly needed, but nice for UX) ── */
const HISTORY_KEY = 'nexus_studybuddy_history'

export function loadHistory(userEmail) {
  const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
  return all[userEmail] || []
}
export function saveHistory(userEmail, messages) {
  const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
  all[userEmail] = messages.slice(-100)         // keep last 100 msgs per user
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all))
}
export function clearHistory(userEmail) {
  const all = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}')
  delete all[userEmail]
  localStorage.setItem(HISTORY_KEY, JSON.stringify(all))
}

/* ── Public: ask a question ──────────────────────── */
export async function askStudyBuddy({ question, courseId, history = [] }) {
  /* 1. Try the real backend first */
  try {
    const res = await fetch(API_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, courseId, history: history.slice(-6) }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.answer) return { ok: true, answer: data.answer, citations: data.citations || [], source: 'live' }
    }
  } catch {
    /* ignore — fall through to mock */
  }

  /* 2. Smart mock — keyword routing through course catalog */
  return { ok: true, answer: smartMockAnswer(question, courseId), citations: mockCitations(question, courseId), source: 'mock' }
}

/* ── Quiz question generator (mock version) ─────── */
export async function generateQuiz({ courseId, topicId }) {
  const course = COURSES.find(c => c.id === courseId)
  const topic = (TOPICS_BY_COURSE[courseId] || []).find(t => t.id === topicId)
  if (!topic) return { ok: false }

  /* Try live backend */
  try {
    const res = await fetch(API_PATH + '?action=quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, topicId }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.question) return { ok: true, ...data, source: 'live' }
    }
  } catch {}

  /* Mock quiz */
  return {
    ok: true,
    source: 'mock',
    question: `Quick check on "${topic.title}": which of these statements is most accurate?`,
    choices: [
      `${topic.title} is foundational to ${course?.title || 'this module'}.`,
      `${topic.title} only matters for advanced learners.`,
      `${topic.title} is unrelated to the exam.`,
      `${topic.title} is just memorisation, no understanding needed.`,
    ],
    correctIndex: 0,
    explanation: `Correct. ${topic.title} appears in past papers and underpins most of the harder questions in ${course?.title || 'this module'}.`,
  }
}

/* ────────────────────────────────────────────────
   Smart mock — pattern-matches the question to give
   helpful, on-brand answers without an API key.
   ──────────────────────────────────────────────── */
function smartMockAnswer(question, courseId) {
  const q = (question || '').toLowerCase().trim()
  const course = COURSES.find(c => c.id === courseId)
  const topics = courseId ? (TOPICS_BY_COURSE[courseId] || []) : []
  const courseLine = course ? `for **${course.title}**` : 'across the Nexus 101 catalog'

  /* Greetings */
  if (/^(hi|hey|hello|hola|salam|سلام)\b/i.test(q))
    return `Hi! 👋 I'm your Nexus 101 Study Buddy. I can quiz you on a topic, summarise a concept, or point you to the exact module to revise. What would you like help with ${courseLine}?`

  /* Explain X */
  const explainMatch = q.match(/(?:explain|what is|what's|tell me about|how does)\s+(.+?)(?:\?|$)/i)
  if (explainMatch) {
    const subject = explainMatch[1].trim()
    return `Great question — let me give you a quick study-buddy summary of "${subject}":\n\n• It's a core building block ${courseLine}.\n• In the exam it usually shows up in problem-solving questions.\n• Think of it as a tool for breaking complex problems into small, repeatable steps.\n\nIf you want a deeper walk-through, jump into the **${course?.title || 'matching'}** module — it has a 10-min revision video on this exact topic.`
  }

  /* Quiz me */
  if (/quiz|test me|practice|question/i.test(q)) {
    const t = topics[Math.floor(Math.random() * topics.length)] || { title: 'a topic' }
    return `Sure — let's quiz you on **${t.title}** ${courseLine}.\n\n_Q:_ Which is the most fundamental property of ${t.title}?\n  A) It's purely abstract\n  B) It's the foundation for solving exam problems\n  C) It's not in the syllabus\n  D) It's only for advanced topics\n\nReply with A / B / C / D.`
  }

  /* Stuck / struggling */
  if (/stuck|struggl|confused|don't (?:get|understand)|can't|hard/i.test(q)) {
    const t = topics[0] || { title: 'a foundational topic' }
    return `It's totally normal to get stuck — here's what works for most students:\n\n1. Pause the video and re-watch the last 60 seconds at 0.75× speed.\n2. Try one worked example from the PDF revision sheet.\n3. If still unclear, message a tutor on WhatsApp — they're usually live.\n\nIn this module, the topic students get stuck on the most is **${t.title}** — start there.`
  }

  /* Pricing / wallet */
  if (/price|cost|points|wallet|nxp|bundle|free course/i.test(q)) {
    return `Each revision module costs **1000 NXP**. The smallest bundle is **1200 NXP for 1200 EGP**, leaving you 200 residual every time. Stack 5 bundles → 1000 residual → unlock a **free 6th module**. Check your wallet for a live progress bar.`
  }

  /* Founders / who */
  if (/founder|who built|who made|nexus team/i.test(q)) {
    const names = FOUNDERS.map(f => f.name).join(' and ')
    return `Nexus 101 was built by ${names}. They're the educators behind the revision methodology. Meet the full team and our 6 instructors on the Team page.`
  }

  /* Universities */
  if (/university|universit|uh|bue|guc|coventry/i.test(q)) {
    const list = UNIVERSITIES.map(u => `**${u.shortName}** (${u.name})`).join(', ')
    return `We currently cover ${UNIVERSITIES.length} target universities: ${list}. Each has its own dedicated revision modules in the Store, aligned to the actual syllabus.`
  }

  /* Catch-all */
  const topicHint = topics.length
    ? ` In **${course.title}** the most common revision topics are: ${topics.slice(0, 4).map(t => t.title).join(', ')}.`
    : ''
  return `That's a great question.${topicHint} I'm running in offline study-mode right now (no API key configured). When the backend is connected, I can give you syllabus-grounded, cited answers. Meanwhile, browse the Store for the matching module — or ask a tutor directly on WhatsApp.`
}

function mockCitations(question, courseId) {
  if (!courseId) return []
  const course = COURSES.find(c => c.id === courseId)
  if (!course) return []
  const topics = (TOPICS_BY_COURSE[courseId] || []).slice(0, 2)
  return topics.map(t => ({
    courseId,
    courseTitle: course.title,
    topicId: t.id,
    topicTitle: t.title,
    score: 0.7 + Math.random() * 0.2,
  }))
}
