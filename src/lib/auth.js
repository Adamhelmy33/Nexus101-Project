/* ═══════════════════════════════════════════════
   Nexus 101 — Supabase Auth Helpers
   ═══════════════════════════════════════════════
   Authentication, profiles, purchases — all live in Supabase.
   No localStorage user database. The Owner Dashboard reads
   straight from `profiles` and `purchases`.
*/

import { supabase } from './supabase'

const VIEWERS_KEY = 'nexus_active_viewers'   // ephemeral presence only — local

/* ── No-op kept for backwards compatibility with AuthContext mount ── */
export function initAuthDB() { /* nothing to seed; Supabase owns the data */ }

/* ── Session ─────────────────────────────────── */
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) { console.warn('[auth] getSession failed:', error.message); return null }
    if (!session?.user) return null
    return await loadUserWithProfile(session.user)
  } catch (err) {
    console.warn('[auth] getCurrentUser failed:', err)
    return null
  }
}

/* Build a usable user object from the auth.users row even if profile/purchases
   queries fail. We never throw — the UI gets a degraded-but-valid user instead
   of being kicked back to the login screen on a transient network blip. */
async function loadUserWithProfile(authUser) {
  let profile = null
  let purchases = []

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('email, name, role')
      .eq('id', authUser.id)
      .maybeSingle()
    if (error) console.warn('[auth] profile fetch failed:', error.message)
    else profile = data
  } catch (err) {
    console.warn('[auth] profile fetch threw:', err)
  }

  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('course_id, item_id, purchased_at, amount, method, txn_id')
      .eq('user_id', authUser.id)
      .order('purchased_at', { ascending: false })
    if (error) console.warn('[auth] purchases fetch failed:', error.message)
    else purchases = data || []
  } catch (err) {
    console.warn('[auth] purchases fetch threw:', err)
  }

  return {
    id:           authUser.id,
    email:        profile?.email || authUser.email,
    name:         profile?.name || authUser.user_metadata?.name || '',
    isAdmin:      profile?.role === 'admin',
    purchases:    purchases.map(p => ({
      courseId:    p.course_id,
      itemId:      p.item_id ?? null,
      purchasedAt: p.purchased_at,
      amount:      p.amount,
      method:      p.method,
      txnId:       p.txn_id,
    })),
    registeredAt: authUser.created_at,
  }
}

/* ── Login / Logout ──────────────────────────── */
export async function login(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: (email || '').toLowerCase().trim(),
      password,
    })
    if (error) return { ok: false, error: error.message || 'Invalid email or password.' }
    if (!data?.user) return { ok: false, error: 'Login failed. Please try again.' }
    const user = await loadUserWithProfile(data.user)
    pingActiveViewer(user.email)
    return { ok: true, user }
  } catch (err) {
    console.warn('[auth] login threw:', err)
    return { ok: false, error: 'Network error. Please try again.' }
  }
}

export async function logout() {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user?.email) removeActiveViewer(session.user.email)
    await supabase.auth.signOut()
  } catch (err) {
    console.warn('[auth] logout threw:', err)
  }
}

/* ── Register ────────────────────────────────── */
export async function register({ email, password, name }) {
  email = (email || '').toLowerCase().trim()
  if (!email || !password || !name)
    return { ok: false, error: 'Please fill in all fields.' }
  if (!/\S+@\S+\.\S+/.test(email))
    return { ok: false, error: 'Please enter a valid email.' }
  if (password.length < 6)
    return { ok: false, error: 'Password must be at least 6 characters.' }

  let data, error
  try {
    ({ data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    }))
  } catch (err) {
    console.warn('[auth] signUp threw:', err)
    return { ok: false, error: 'Network error. Please try again.' }
  }
  if (error) return { ok: false, error: error.message }
  if (!data?.user) return { ok: false, error: 'Could not create account.' }

  // The handle_new_user() trigger creates the profiles row server-side.
  // If email confirmation is enabled, session may be null until the user verifies.
  const user = data.session
    ? await loadUserWithProfile(data.user)
    : {
        id:        data.user.id,
        email,
        name,
        isAdmin:   false,
        purchases: [],
        registeredAt: data.user.created_at,
      }

  if (data.session) pingActiveViewer(email)
  return { ok: true, user, needsConfirmation: !data.session }
}



/* ── Active viewers tracking (local-only presence) ──
   Presence is per-tab and ephemeral; storing it server-side would
   require a heartbeat table and isn't worth the complexity. */
export function pingActiveViewer(email) {
  if (!email) return
  const viewers = JSON.parse(localStorage.getItem(VIEWERS_KEY) || '{}')
  viewers[email] = Date.now()
  localStorage.setItem(VIEWERS_KEY, JSON.stringify(viewers))
}
export function removeActiveViewer(email) {
  if (!email) return
  const viewers = JSON.parse(localStorage.getItem(VIEWERS_KEY) || '{}')
  delete viewers[email]
  localStorage.setItem(VIEWERS_KEY, JSON.stringify(viewers))
}
export function getActiveViewers() {
  const viewers = JSON.parse(localStorage.getItem(VIEWERS_KEY) || '{}')
  const now = Date.now()
  const FIVE_MIN = 5 * 60 * 1000
  return Object.entries(viewers)
    .filter(([_, ts]) => now - ts < FIVE_MIN)
    .map(([email]) => email)
}

/* ── Admin: list every user (live from Supabase) ── */
export async function getAllUsers() {
  let profiles = []
  let allPurchases = []

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, role, created_at')
      .order('created_at', { ascending: false })
    if (error) { console.warn('[auth] getAllUsers profiles failed:', error.message); return [] }
    profiles = data || []
  } catch (err) {
    console.warn('[auth] getAllUsers profiles threw:', err)
    return []
  }

  try {
    const { data, error } = await supabase
      .from('purchases')
      .select('user_id, course_id, item_id, purchased_at, amount, method, txn_id')
    if (error) console.warn('[auth] getAllUsers purchases failed:', error.message)
    else allPurchases = data || []
  } catch (err) {
    console.warn('[auth] getAllUsers purchases threw:', err)
  }

  const byUser = new Map()
  for (const p of (allPurchases || [])) {
    if (!byUser.has(p.user_id)) byUser.set(p.user_id, [])
    byUser.get(p.user_id).push({
      courseId:    p.course_id,
      itemId:      p.item_id ?? null,
      purchasedAt: p.purchased_at,
      amount:      p.amount,
      method:      p.method,
      txnId:       p.txn_id,
    })
  }

  return profiles.map(p => ({
    id:           p.id,
    email:        p.email,
    name:         p.name,
    isAdmin:      p.role === 'admin',
    registeredAt: p.created_at,
    purchases:    byUser.get(p.id) || [],
  }))
}

/* ── Admin metrics (computed from live Supabase data) ── */
export async function getAdminMetrics(courses) {
  const users = await getAllUsers()
  const allPurchases = users.flatMap(u =>
    (u.purchases || []).map(p => ({ ...p, email: u.email, name: u.name }))
  )

  // Revenue = amount (EGP paid directly via Paymob or demo flow)
  const revenueOf = p => (p.amount || 0)
  const totalRevenue   = allPurchases.reduce((sum, p) => sum + revenueOf(p), 0)
  const subscriberCount = users.filter(u => !u.isAdmin && u.purchases.length > 0).length
  const activeViewers   = getActiveViewers().length

  const perCourse = (courses || []).map(c => {
    const sales = allPurchases.filter(p => p.courseId === c.id)
    return {
      ...c,
      sales: sales.length,
      revenue: sales.reduce((s, p) => s + revenueOf(p), 0),
    }
  })

  return {
    totalRevenue,
    subscriberCount,
    activeViewers,
    perCourse,
    totalUsers: users.filter(u => !u.isAdmin).length,
    users,
    purchases: allPurchases,
  }
}
