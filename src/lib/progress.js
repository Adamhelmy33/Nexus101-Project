/* ═══════════════════════════════════════════════
   Nexus 101 — Progress & Mastery
   ═══════════════════════════════════════════════
   Tracks watch-session seconds and per-topic mastery (0-1 float).
   Mirrors the schema in supabase/migrations/0001_init_schema.sql.

   API designed so swapping the backend later only changes the
   inside of these functions, not their shape.
   ═══════════════════════════════════════════════ */

import { TOPICS_BY_COURSE } from '../data/topics'
import { COURSES } from '../data/constants'

const SESSIONS_KEY = 'nexus_watch_sessions'
const MASTERY_KEY  = 'nexus_topic_mastery'

function readSessions() { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]') }
function writeSessions(rows) { localStorage.setItem(SESSIONS_KEY, JSON.stringify(rows)) }
function readMastery() { return JSON.parse(localStorage.getItem(MASTERY_KEY) || '{}') }
function writeMastery(m) { localStorage.setItem(MASTERY_KEY, JSON.stringify(m)) }

/* ── Watch session tracking ───────────────────────── */
export function recordWatch({ userEmail, courseId, moduleId, seconds, completed = false }) {
  if (!userEmail || !seconds || seconds < 1) return { ok: false }
  const all = readSessions()
  all.push({
    id:          `ws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userEmail, courseId, moduleId,
    seconds:     Math.round(seconds),
    completed,
    createdAt:   new Date().toISOString(),
  })
  writeSessions(all)

  /* Bump mastery for whatever topic this module belongs to (if any).
     We don't have module→topic mapping yet, so we increment all topics
     in the course slightly. Real implementation hits topic_mastery RPC. */
  const topics = TOPICS_BY_COURSE[courseId] || []
  if (topics.length) {
    const m = readMastery()
    const userKey = userEmail
    if (!m[userKey]) m[userKey] = {}
    const minutesToBumpAcross = seconds / 60
    /* Distribute the watched minutes evenly across topics, weighted slightly higher
       for topics with lower current mastery (prioritise weak spots). */
    const totalCurrent = topics.reduce((s, t) => s + (m[userKey][`${courseId}:${t.id}`]?.mastery || 0), 0)
    for (const t of topics) {
      const key = `${courseId}:${t.id}`
      const cur = m[userKey][key] || { mastery: 0, hours: 0, lastAt: null }
      // Each minute watched bumps mastery by ~0.5% per topic (capped at 1.0)
      cur.mastery = Math.min(1, cur.mastery + (minutesToBumpAcross * 0.005))
      cur.hours   = (cur.hours || 0) + (minutesToBumpAcross / 60 / topics.length)
      cur.lastAt  = new Date().toISOString()
      m[userKey][key] = cur
    }
    writeMastery(m)
  }
  return { ok: true }
}

/* ── Read aggregates for the dashboard ─────────────── */
export function getProgressSummary(userEmail, userPurchases = []) {
  const sessions = readSessions().filter(s => s.userEmail === userEmail)
  const mastery  = readMastery()[userEmail] || {}

  /* Total watched seconds */
  const totalSeconds = sessions.reduce((s, r) => s + r.seconds, 0)
  const totalHours   = +(totalSeconds / 3600).toFixed(2)

  /* Hours per subject (math/physics/cs) — derived from courses watched */
  const subjectHours = { math: 0, physics: 0, cs: 0 }
  for (const s of sessions) {
    const course = COURSES.find(c => c.id === s.courseId)
    if (!course) continue
    /* A course can mix subjects; use the dominant subject per topic */
    const topics = TOPICS_BY_COURSE[s.courseId] || []
    if (!topics.length) continue
    const counts = topics.reduce((acc, t) => { acc[t.subject] = (acc[t.subject] || 0) + 1; return acc }, {})
    const total = topics.length
    const hoursThisSession = s.seconds / 3600
    for (const [subj, c] of Object.entries(counts)) {
      subjectHours[subj] = (subjectHours[subj] || 0) + hoursThisSession * (c / total)
    }
  }
  Object.keys(subjectHours).forEach(k => subjectHours[k] = +subjectHours[k].toFixed(2))

  /* Per-course aggregates */
  const ownedCourseIds = new Set(userPurchases.map(p => p.courseId))
  const perCourse = COURSES.filter(c => ownedCourseIds.has(c.id)).map(c => {
    const courseSessions = sessions.filter(s => s.courseId === c.id)
    const sec = courseSessions.reduce((s, r) => s + r.seconds, 0)
    const totalCourseSeconds = (c.hours || 1) * 3600
    const pct = Math.min(100, Math.round((sec / totalCourseSeconds) * 100))
    const topics = TOPICS_BY_COURSE[c.id] || []
    const masteryAvg = topics.length
      ? topics.reduce((s, t) => s + (mastery[`${c.id}:${t.id}`]?.mastery || 0), 0) / topics.length
      : 0
    return {
      ...c,
      watchedHours: +(sec / 3600).toFixed(2),
      progressPct:  pct,
      masteryAvg:   +masteryAvg.toFixed(2),
    }
  })

  /* Per-topic mastery flat list (for the heatmap) */
  const topicMastery = []
  for (const courseId of ownedCourseIds) {
    const tList = TOPICS_BY_COURSE[courseId] || []
    for (const t of tList) {
      const key = `${courseId}:${t.id}`
      const m = mastery[key] || { mastery: 0, hours: 0, lastAt: null }
      topicMastery.push({
        ...t,
        courseId,
        key,
        mastery: m.mastery,
        hours: m.hours,
        lastAt: m.lastAt,
      })
    }
  }

  return {
    totalHours,
    totalSeconds,
    subjectHours,
    perCourse,
    topicMastery,
    sessionCount: sessions.length,
  }
}

/* ── Demo helper: seed plausible progress for the demo student ─── */
export function seedDemoProgress(userEmail, userPurchases = []) {
  const sessions = readSessions().filter(s => s.userEmail === userEmail)
  if (sessions.length > 0) return // already seeded

  const mastery = readMastery()
  if (!mastery[userEmail]) mastery[userEmail] = {}

  const seedSessions = []
  for (const p of userPurchases) {
    const course = COURSES.find(c => c.id === p.courseId)
    if (!course) continue
    const topics = TOPICS_BY_COURSE[p.courseId] || []
    /* Pretend they've watched 30-60% of the course, with random topic mastery */
    const fraction = 0.3 + Math.random() * 0.3
    const sec = Math.round((course.hours || 24) * 3600 * fraction)
    seedSessions.push({
      id: `ws-seed-${Date.now()}-${course.id}`,
      userEmail,
      courseId: course.id,
      moduleId: 'm1',
      seconds: sec,
      completed: false,
      createdAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString(),
    })
    for (const t of topics) {
      mastery[userEmail][`${course.id}:${t.id}`] = {
        mastery: Math.max(0, Math.min(1, fraction + (Math.random() * 0.4 - 0.2))),
        hours: (sec / 3600) / topics.length,
        lastAt: new Date().toISOString(),
      }
    }
  }
  writeSessions([...readSessions(), ...seedSessions])
  writeMastery(mastery)
}
