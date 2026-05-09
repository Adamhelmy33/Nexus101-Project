/* ═══════════════════════════════════════════════
   Nexus 101 — LocalStorage Auth Helpers
   ═══════════════════════════════════════════════
   Beginner note:
   This is a CLIENT-SIDE auth system that stores users in the browser
   (localStorage). Perfect for development & demo. When you launch
   for real, swap these helpers with calls to your real backend
   (Supabase, Firebase, your own Node API, etc.). The components
   that use them won't need to change.
*/

import { SEED_USERS } from '../data/constants'

const USERS_KEY     = 'nexus_users_db'
const SESSION_KEY   = 'nexus_session'
const VIEWERS_KEY   = 'nexus_active_viewers'

/* ── Initialise the local "database" ─────────── */
export function initAuthDB() {
  if (!localStorage.getItem(USERS_KEY)) {
    localStorage.setItem(USERS_KEY, JSON.stringify(SEED_USERS))
  }
}

/* ── Helpers ─────────────────────────────────── */
function readUsers() {
  initAuthDB()
  return JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
}
function writeUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

/* ── Session ─────────────────────────────────── */
export function getCurrentUser() {
  const session = localStorage.getItem(SESSION_KEY)
  if (!session) return null
  try {
    const { email } = JSON.parse(session)
    const user = readUsers().find(u => u.email === email)
    return user ? { ...user, password: undefined } : null
  } catch {
    return null
  }
}

/* ── Login / Logout ──────────────────────────── */
export function login(email, password) {
  const users = readUsers()
  const user  = users.find(
    u => u.email.toLowerCase() === email.toLowerCase().trim() &&
         u.password === password
  )
  if (!user) return { ok: false, error: 'Invalid email or password.' }
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email: user.email }))
  pingActiveViewer(user.email)
  return { ok: true, user: { ...user, password: undefined } }
}

export function logout() {
  const session = localStorage.getItem(SESSION_KEY)
  if (session) {
    try {
      const { email } = JSON.parse(session)
      removeActiveViewer(email)
    } catch {}
  }
  localStorage.removeItem(SESSION_KEY)
}

/* ── Register ────────────────────────────────── */
export function register({ email, password, name }) {
  const users = readUsers()
  email = email.toLowerCase().trim()

  if (!email || !password || !name)
    return { ok: false, error: 'Please fill in all fields.' }
  if (!/\S+@\S+\.\S+/.test(email))
    return { ok: false, error: 'Please enter a valid email.' }
  if (password.length < 6)
    return { ok: false, error: 'Password must be at least 6 characters.' }
  if (users.some(u => u.email === email))
    return { ok: false, error: 'An account with this email already exists.' }

  const newUser = {
    email, password, name,
    isAdmin: false,
    purchases: [],
    registeredAt: new Date().toISOString(),
  }
  writeUsers([...users, newUser])
  localStorage.setItem(SESSION_KEY, JSON.stringify({ email }))
  pingActiveViewer(email)
  return { ok: true, user: { ...newUser, password: undefined } }
}

/* ── Purchase a course (records into user.purchases) ── */
export function recordPurchase(courseId, paymentMeta = {}) {
  const session = localStorage.getItem(SESSION_KEY)
  if (!session) return { ok: false, error: 'Not logged in.' }

  const { email } = JSON.parse(session)
  const users = readUsers()
  const idx   = users.findIndex(u => u.email === email)
  if (idx === -1) return { ok: false, error: 'User not found.' }

  if (users[idx].purchases.some(p => p.courseId === courseId))
    return { ok: false, error: 'You already own this course.' }

  users[idx].purchases.push({
    courseId,
    purchasedAt: new Date().toISOString(),
    amount:      paymentMeta.amount || 0,
    method:      paymentMeta.method || 'card',
    txnId:       paymentMeta.txnId  || `NEX-${Date.now()}`,
  })
  writeUsers(users)
  return { ok: true, user: { ...users[idx], password: undefined } }
}

export function hasPurchased(user, courseId) {
  if (!user) return false
  if (user.isAdmin) return true   // admins can preview everything
  return (user.purchases || []).some(p => p.courseId === courseId)
}

/* ── Active viewers tracking (for admin dashboard) ── */
export function pingActiveViewer(email) {
  const viewers = JSON.parse(localStorage.getItem(VIEWERS_KEY) || '{}')
  viewers[email] = Date.now()
  localStorage.setItem(VIEWERS_KEY, JSON.stringify(viewers))
}
export function removeActiveViewer(email) {
  const viewers = JSON.parse(localStorage.getItem(VIEWERS_KEY) || '{}')
  delete viewers[email]
  localStorage.setItem(VIEWERS_KEY, JSON.stringify(viewers))
}
export function getActiveViewers() {
  const viewers = JSON.parse(localStorage.getItem(VIEWERS_KEY) || '{}')
  const now    = Date.now()
  const FIVE_MIN = 5 * 60 * 1000
  return Object.entries(viewers)
    .filter(([_, ts]) => now - ts < FIVE_MIN)
    .map(([email]) => email)
}

/* ── Admin: list every user (no password leaked) ── */
export function getAllUsers() {
  return readUsers().map(u => ({ ...u, password: undefined }))
}

/* ── Admin metrics ───────────────────────────── */
export function getAdminMetrics(courses) {
  const users = readUsers()
  const allPurchases = users.flatMap(u => u.purchases || [])

  const totalRevenue = allPurchases.reduce((sum, p) => sum + (p.amount || 0), 0)
  const subscriberCount = users.filter(u => !u.isAdmin && u.purchases?.length > 0).length
  const activeViewers   = getActiveViewers().length

  // per-course breakdown
  const perCourse = (courses || []).map(c => {
    const sales = allPurchases.filter(p => p.courseId === c.id)
    return {
      ...c,
      sales: sales.length,
      revenue: sales.reduce((s, p) => s + (p.amount || 0), 0),
    }
  })

  return { totalRevenue, subscriberCount, activeViewers, perCourse, totalUsers: users.filter(u => !u.isAdmin).length }
}
