import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  COURSES as STATIC_COURSES,
  UNIVERSITIES as STATIC_UNIVERSITIES,
  INSTRUCTORS as STATIC_INSTRUCTORS,
} from '../data/constants'

// ── Gradient fallback palette for DB rows missing gradient columns ─────────────
const GRADIENTS = [
  ['#003F87', '#0047AB'], ['#0047AB', '#1a6fd4'], ['#7A0019', '#a30024'],
  ['#0066B3', '#0047AB'], ['#a30024', '#7A0019'], ['#0066B3', '#005091'],
  ['#005091', '#0066B3'], ['#dc2626', '#991b1b'], ['#991b1b', '#7f1d1d'],
]
function gradientFor(idx) {
  const g = GRADIENTS[idx % GRADIENTS.length]
  return { gradientFrom: g[0], gradientTo: g[1] }
}

// ── Normalizers ────────────────────────────────────────────────────────────────

function normalizeDbCourse(row, idx) {
  const staticMatch = STATIC_COURSES.find(c => c.id === row.slug)
  const from = row.gradient_from ?? staticMatch?.gradientFrom ?? gradientFor(idx).gradientFrom
  const to = row.gradient_to ?? staticMatch?.gradientTo ?? gradientFor(idx).gradientTo
  return {
    id: row.slug,
    universityId: row.university?.slug ?? '',
    title: row.title,
    subtitle: row.subtitle ?? '',
    description: row.description ?? '',
    icon: row.icon ?? staticMatch?.icon ?? '📚',
    gradientFrom: from,
    gradientTo: to,
    price: row.price_egp ?? row.price_points ?? staticMatch?.price ?? 0,
    oldPrice: row.old_price_egp ?? staticMatch?.oldPrice ?? null,
    currency: row.currency ?? 'EGP',

    modules: row.module_count ?? staticMatch?.modules ?? 0,
    hours: row.hours ?? staticMatch?.hours ?? 0,
    students: row.student_count ?? staticMatch?.students ?? 0,
    subject: row.subject ?? staticMatch?.subject ?? '',
    studyLevel: row.study_level ?? staticMatch?.studyLevel ?? '',
    level: row.level ?? staticMatch?.level ?? '',
    features: Array.isArray(row.features) && row.features.length ? row.features : (staticMatch?.features ?? []),
    topics: Array.isArray(row.topics_list) && row.topics_list.length ? row.topics_list : (staticMatch?.topics ?? []),
    badge: row.badge ?? staticMatch?.badge ?? null,
    bundlePrice: row.bundle_price_egp ?? null,
    buy_form_url: row.buy_form_url ?? staticMatch?.buy_form_url ?? null,
    free_revision_youtube_url: row.free_revision_youtube_url ?? null,
    instructors: (row.course_instructors && row.course_instructors.length > 0)
      ? row.course_instructors.map(ci => ci.instructor).filter(Boolean).map(ins => ({
          id: ins.slug,
          name: ins.name,
          initials: ins.initials,
        }))
      : (staticMatch?.instructors ?? []),
    _fromDb: true,
  }
}

function normalizeDbUniversity(row) {
  const s = STATIC_UNIVERSITIES.find(u => u.id === row.slug)
  return {
    id: row.slug,
    name: row.name,
    shortName: row.short_name ?? s?.shortName ?? '',
    tagline: row.tagline ?? s?.tagline ?? '',
    description: row.description ?? s?.description ?? '',
    color: row.color ?? s?.color ?? '#0047AB',
    accentColor: row.accent_color ?? s?.accentColor ?? '#f0a500',
    location: row.location ?? s?.location ?? '',
    icon: row.icon ?? s?.icon ?? '🎓',
    _fromDb: true,
  }
}

function normalizeDbInstructor(row, idx) {
  const s = STATIC_INSTRUCTORS.find(i => i.id === row.slug)
  const from = row.gradient_from ?? s?.gradientFrom ?? gradientFor(idx).gradientFrom
  const to = row.gradient_to ?? s?.gradientTo ?? gradientFor(idx).gradientTo
  return {
    id: row.slug,
    name: row.name,
    role: row.role ?? s?.role ?? '',
    subject: row.subject ?? s?.subject ?? '',
    photo: row.photo_url ?? row.photo ?? s?.photo ?? '',
    initials: row.initials ?? row.name.split(' ').map(w => w[0]).join('').slice(0, 2),
    gradientFrom: from,
    gradientTo: to,
    universities: (row.instructor_universities ?? [])
      .map(iu => iu.university?.short_name)
      .filter(Boolean),
    rating: Number(row.rating) || s?.rating || 4.8,
    students: Number(row.students) || s?.students || 0,
    bio: row.bio ?? s?.bio ?? '',
    _fromDb: true,
  }
}

// ── Singleton cache — holds resolved data so subsequent mounts are instant ─────
// Stores { courses, universities, instructors } once fetched, null until then.
let _cache = null
let _promise = null

/* Each table is fetched independently — one failure (e.g. instructors RLS
   misconfigured) must never wipe the others. The public catalog is anonymous
   and does NOT depend on the auth session. Settled-results pattern keeps
   universities/instructors visible even on a logged-out refresh. */
async function fetchOne(promise, fallback, label) {
  try {
    const { data, error } = await promise
    if (error) {
      console.warn(`[useCatalog] ${label} fetch error:`, error.message)
      return fallback
    }
    return (data && data.length) ? data : fallback
  } catch (err) {
    console.warn(`[useCatalog] ${label} fetch threw:`, err)
    return fallback
  }
}

function fetchDbCatalog() {
  if (_cache) return Promise.resolve(_cache)
  if (_promise) return _promise

  _promise = Promise.all([
    fetchOne(
      supabase.from('courses')
        .select('*, university:universities(slug, short_name), course_instructors(instructor:instructors(*))')
        .eq('published', true)
        .order('created_at'),
      null, 'courses',
    ),
    fetchOne(
      supabase.from('universities')
        .select('*')
        .order('position'),
      null, 'universities',
    ),
    fetchOne(
      supabase.from('instructors')
        .select('*, instructor_universities(university:universities(short_name))')
        .order('created_at'),
      null, 'instructors',
    ),
  ]).then(([dbC, dbU, dbI]) => {
    const courses = dbC ? dbC.map(normalizeDbCourse) : STATIC_COURSES
    const universities = dbU ? dbU.map(normalizeDbUniversity) : STATIC_UNIVERSITIES
    const instructors = dbI ? dbI.map(normalizeDbInstructor) : STATIC_INSTRUCTORS

    _cache = { courses, universities, instructors }
    return _cache
  }).catch((err) => {
    console.warn('[useCatalog] catastrophic failure, using static fallback:', err)
    const fallback = {
      courses: STATIC_COURSES,
      universities: STATIC_UNIVERSITIES,
      instructors: STATIC_INSTRUCTORS,
    }
    _cache = fallback
    return fallback
  })

  return _promise
}

// Expose for dev HMR — Vite calls this when the module is replaced
if (import.meta.hot) {
  import.meta.hot.dispose(() => { _cache = null; _promise = null })
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCatalog() {
  const [state, setState] = useState(() => {
    // If cache is already warm (same-session navigation), use it synchronously
    // so there's zero loading flash on subsequent page visits.
    if (_cache) return { ..._cache, loading: false }
    return {
      courses: [],
      universities: [],
      instructors: [],
      loading: true,
    }
  })

  useEffect(() => {
    // Already warm — nothing to do
    if (!state.loading) return

    fetchDbCatalog().then(({ courses, universities, instructors }) => {
      setState({ courses, universities, instructors, loading: false })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return state
}
