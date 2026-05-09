/* ═══════════════════════════════════════════════
   Nexus 101 — Wallet & Loyalty (Nexus Points)
   ═══════════════════════════════════════════════
   ALL prices and bundles come from `nexus.config.js` via `lib/pricing.js`.
   This file contains zero hardcoded numbers.

   Today this runs on localStorage. The functions below mirror the SQL
   RPCs in supabase/migrations/0003_wallet_functions.sql so swapping
   to Supabase later is just changing the implementation, not the API.

   Key invariants:
   • The ledger is APPEND-ONLY. Never edit a past row.
   • Every credit/debit goes through one function so the balance is
     always derivable from the ledger.
   • Idempotency keys block duplicate credits from webhook retries.
   • The course's purchase_price is SNAPSHOTTED in the ledger meta
     so historical receipts stay accurate even if config changes later.
   ═══════════════════════════════════════════════ */

import { COURSES } from '../data/constants'
import {
  pointsCostFor, recommendedBundleFor, getTierForLifetime, getNextTier,
} from './pricing'
import nexusConfig from '../../nexus.config.js'

const LEDGER_KEY = 'nexus_wallet_ledger'   // append-only history
const USERS_KEY  = 'nexus_users_db'        // (already used by auth.js)

/* ── Internal helpers ─────────────────────────────────── */
function readLedger() { return JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]') }
function writeLedger(rows) { localStorage.setItem(LEDGER_KEY, JSON.stringify(rows)) }
function readUsers()  { return JSON.parse(localStorage.getItem(USERS_KEY) || '[]') }
function writeUsers(users) { localStorage.setItem(USERS_KEY, JSON.stringify(users)) }

/* ── Public read API ──────────────────────────────────── */
export function getWalletState(userEmail) {
  const rows = readLedger().filter(r => r.userEmail === userEmail)

  let balance = 0
  let lifetimeDeposited = 0
  let lifetimeSpent = 0
  for (const r of rows) {
    balance += r.deltaPoints
    if (r.deltaPoints > 0) lifetimeDeposited += r.deltaPoints
    else                   lifetimeSpent     += -r.deltaPoints
  }

  const tier     = getTierForLifetime(lifetimeDeposited)
  const nextTier = getNextTier(lifetimeDeposited)

  /* Bundle count = how many bundle_purchase ledger entries we've seen. */
  const bundlesPurchased     = rows.filter(r => r.kind === 'bundle_purchase').length
  const coursesEnrolledCount = rows.filter(r => r.kind === 'course_enrollment').length

  return {
    balance,
    lifetimeDeposited,
    lifetimeSpent,
    tier, nextTier,
    bundlesPurchased,
    coursesEnrolledCount,
    ledger: rows.slice().reverse(),  // newest first
  }
}

/* ── Append a ledger row + recompute balance ──────────── */
function appendLedger(entry) {
  /* Idempotency check: same key already present? Skip silently (return existing). */
  const all = readLedger()
  if (entry.idempotencyKey) {
    const dup = all.find(r => r.idempotencyKey === entry.idempotencyKey)
    if (dup) return { ok: true, skipped: true, row: dup, balance: dup.balanceAfter }
  }

  const userRows = all.filter(r => r.userEmail === entry.userEmail)
  const balanceBefore = userRows.reduce((s, r) => s + r.deltaPoints, 0)
  const balanceAfter  = balanceBefore + entry.deltaPoints

  if (balanceAfter < 0) {
    return { ok: false, error: 'Insufficient Nexus Points balance.' }
  }

  const row = {
    id: `lg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    userEmail:    entry.userEmail,
    deltaPoints:  entry.deltaPoints,
    kind:         entry.kind,
    referenceId:  entry.referenceId || null,
    balanceAfter,
    idempotencyKey: entry.idempotencyKey || null,
    meta:         entry.meta || {},
    createdAt:    new Date().toISOString(),
  }
  writeLedger([...all, row])
  return { ok: true, row, balance: balanceAfter }
}

/* ── Credit wallet (called after successful Paymob payment) ──
   Always idempotent — webhook retries are safe. */
export function creditWallet({ userEmail, points, paymobTxnId, integration = 'card', amountEgp }) {
  if (!points || points <= 0) return { ok: false, error: 'Invalid amount.' }
  return appendLedger({
    userEmail,
    deltaPoints: points,
    kind: 'bundle_purchase',
    referenceId: paymobTxnId,
    idempotencyKey: paymobTxnId ? `paymob:${paymobTxnId}` : null,
    meta: {
      integration,
      bundlePoints: points,
      amountEgp:    amountEgp ?? Math.round(points * nexusConfig.exchangeRate),
      exchangeRate: nexusConfig.exchangeRate,
    },
  })
}

/* ── Redeem a course (deduct points, record enrollment) ──
   Snapshots the current price into the ledger so historical
   records stay accurate even if config changes. */
export function redeemCourse({ userEmail, courseId }) {
  const course = COURSES.find(c => c.id === courseId)
  if (!course) return { ok: false, error: 'Course not found.' }

  const purchasePrice = pointsCostFor(course)   // 🔑 snapshot at the moment of purchase

  /* Already enrolled? Block double-buys. */
  const users = readUsers()
  const userIdx = users.findIndex(u => u.email === userEmail)
  if (userIdx === -1) return { ok: false, error: 'User not found.' }
  const alreadyOwns = (users[userIdx].purchases || []).some(p => p.courseId === courseId)
  if (alreadyOwns) return { ok: false, error: 'You already own this module.' }

  /* Append the spend ledger row (this also enforces sufficient balance) */
  const ledgerRes = appendLedger({
    userEmail,
    deltaPoints: -purchasePrice,
    kind: 'course_enrollment',
    referenceId: courseId,
    idempotencyKey: `enroll:${userEmail}:${courseId}`,
    meta: {
      courseId,
      coursePricePoints: purchasePrice,             // historical snapshot
      universityId:      course.universityId,
      exchangeRate:      nexusConfig.exchangeRate,
    },
  })
  if (!ledgerRes.ok) return ledgerRes

  /* Mirror the enrollment into the existing user record. */
  users[userIdx].purchases.push({
    courseId,
    purchasedAt:    new Date().toISOString(),
    amount:         0,                              // EGP — not used in the points era
    pointsSpent:    purchasePrice,
    purchasePrice,                                  // snapshot — same as pointsSpent
    method:         'wallet',
    txnId:          ledgerRes.row.id,
  })
  writeUsers(users)

  return {
    ok: true,
    balanceAfter: ledgerRes.balance,
    ledgerId:     ledgerRes.row.id,
    purchasePrice,
  }
}

/* ── Admin reset (handy in development) ─────────────────── */
export function clearWalletForUser(userEmail) {
  const all = readLedger()
  writeLedger(all.filter(r => r.userEmail !== userEmail))
}

/* ── Convenience re-exports so older imports keep working ── */
export { pointsCostFor, recommendedBundleFor, getTierForLifetime } from './pricing'
