/* ═══════════════════════════════════════════════
   Nexus 101 — Pricing helpers
   ═══════════════════════════════════════════════
   Every price/bundle/conversion computation in the app
   should go through ONE of these functions. That way the
   only thing you ever edit to change pricing is the root
   `nexus.config.js` file.
   ═══════════════════════════════════════════════ */

import config from '../../nexus.config.js'
import { COURSES } from '../data/constants'

/* ── Currency conversion ───────────────────────── */
export function pointsToEgp(points)      { return Math.round(points * config.exchangeRate) }
export function pointsToEgpCents(points) { return pointsToEgp(points) * 100 }
export function egpToPoints(egp)         { return Math.round(egp / config.exchangeRate) }


/* ── Resolve a course's points price ────────────
   Priority: per-course override → per-university default → global default.
   Accepts either a course object OR a courseId string. */
export function pointsCostFor(courseOrId) {
  const course = typeof courseOrId === 'string'
    ? COURSES.find(c => c.id === courseOrId)
    : courseOrId
  if (!course) return config.defaultCoursePoints

  if (config.coursePrices?.[course.id] != null) return config.coursePrices[course.id]
  const uni = config.universities?.[course.universityId]
  if (uni?.defaultCoursePoints != null) return uni.defaultCoursePoints
  return config.defaultCoursePoints
}


/* ── Recommended Paymob bundle for a SPECIFIC course ───
   Forces bundle = ceil(coursePrice × multiplier / step) × step.
   Default multiplier 4/3 means residual after one purchase = 1/3 of price,
   so 3 purchases unlock a free 4th course at the same price.
   Result is clamped to the Paymob min/max. */
export function recommendedBundleFor(courseOrId) {
  const price = pointsCostFor(courseOrId)
  const ideal = price * config.loyalty.bundleMultiplier
  const step  = config.loyalty.bundleRoundingStep
  let bundle  = Math.ceil(ideal / step) * step
  bundle = Math.max(bundle, config.paymob.minBundlePoints)
  bundle = Math.min(bundle, config.paymob.maxBundlePoints)
  return {
    points:    bundle,
    coursePrice: price,
    residual:  bundle - price,
    egp:       pointsToEgp(bundle),
    egpCents:  pointsToEgpCents(bundle),
  }
}


/* ── Best matching shelf bundle from config.bundles ──
   Returns the smallest pre-set bundle that covers the course.
   If no shelf bundle is large enough, falls back to the recommendation. */
export function bestShelfBundleFor(courseOrId) {
  const price = pointsCostFor(courseOrId)
  const valid = (config.bundles || []).filter(b => b.points >= price)
  if (valid.length === 0) {
    const r = recommendedBundleFor(courseOrId)
    return { id: 'auto', points: r.points, label: 'Recommended', auto: true }
  }
  return valid.sort((a, b) => a.points - b.points)[0]
}


/* ── All available shelf bundles (for the wallet page) ── */
export function allShelfBundles() {
  return (config.bundles || []).map(b => ({
    ...b,
    egp:      pointsToEgp(b.points),
    egpCents: pointsToEgpCents(b.points),
  }))
}


/* ── Find the cheapest unowned course in store (for "next free" target) ──
   Used by FreeCourseProgress and Dashboard to compute "X NXP from free course". */
export function getNextFreeTarget(userPurchases = []) {
  const owned = new Set(userPurchases.map(p => p.courseId))
  const candidates = COURSES
    .filter(c => !owned.has(c.id))
    .map(c => ({ course: c, price: pointsCostFor(c) }))
    .sort((a, b) => a.price - b.price)

  if (candidates.length > 0) return candidates[0]

  /* No unowned courses left — fall back to global default */
  const fallbackCourse = COURSES[0]
  return { course: fallbackCourse, price: fallbackCourse ? pointsCostFor(fallbackCourse) : config.defaultCoursePoints }
}


/* ── Cosmetic loyalty tier lookup (by lifetime deposited) ── */
export function getTierForLifetime(points) {
  const tiers = config.tiers || []
  return [...tiers].reverse().find(t => points >= t.min) || tiers[0]
}
export function getNextTier(points) {
  const tiers = config.tiers || []
  return tiers.find(t => t.min > points) || null
}


/* ── Free-course progress: how close to redeeming a specific target ──
   Returns { targetPrice, balance, pointsAway, pct, canRedeem, course } */
export function getFreeCourseProgress(balance, userPurchases = []) {
  const { course, price: targetPrice } = getNextFreeTarget(userPurchases)
  const pointsAway = Math.max(0, targetPrice - balance)
  const pct = targetPrice > 0
    ? Math.min(100, Math.round((Math.min(balance, targetPrice) / targetPrice) * 100))
    : 0
  return { targetPrice, course, balance, pointsAway, pct, canRedeem: balance >= targetPrice }
}


/* ── Re-export the raw config for components that need labels/tiers ── */
export { default as nexusConfig } from '../../nexus.config.js'
