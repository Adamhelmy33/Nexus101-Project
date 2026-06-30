/* ═══════════════════════════════════════════════
   Nexus 101 — Pricing helpers
   ═══════════════════════════════════════════════
   All pricing is direct EGP. The only file you
   ever edit to change prices is nexus.config.js.
   ═══════════════════════════════════════════════ */

import config from '../../nexus.config.js'
import { findCachedCourse } from './courseCache'


/* ── Resolve a course's EGP price ───────────────
   Priority: per-course override → per-university default → global default.
   Accepts either a course object OR a courseId string. */
export function priceEgpFor(courseOrId) {
  const course = typeof courseOrId === 'string'
    ? findCachedCourse(courseOrId)
    : courseOrId
  if (!course) return config.defaultCoursePriceEgp

  if (config.coursePricesEgp?.[course.id] != null) return config.coursePricesEgp[course.id]
  const uni = config.universities?.[course.universityId]
  if (uni?.defaultCoursePriceEgp != null) return uni.defaultCoursePriceEgp
  return config.defaultCoursePriceEgp
}
