import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  COURSES      as STATIC_COURSES,
  UNIVERSITIES as STATIC_UNIVERSITIES,
  INSTRUCTORS  as STATIC_INSTRUCTORS,
} from '../data/constants'
import { hydrateCourseCache } from '../lib/courseCache'

// ── Gradient palette: assigned by position so DB courses always get a colour ──
const GRADIENTS = [
  ['#003F87', '#0047AB'],
  ['#0047AB', '#1a6fd4'],
  ['#7A0019', '#a30024'],
  ['#0066B3', '#0047AB'],
  ['#a30024', '#7A0019'],
  ['#0066B3', '#005091'],
  ['#005091', '#0066B3'],
  ['#dc2626', '#991b1b'],
  ['#991b1b', '#7f1d1d'],
]

function gradientFor(idx) {
  const g = GRADIENTS[idx % GRADIENTS.length]
  return { gradientFrom: g[0], gradientTo: g[1] }
}

// ── Normalizers: Supabase snake_case → shape the UI components expect ─────────

function normalizeDbCourse(row, idx) {
  // Static data has gradient colours; DB rows don't — assign by position.
  const staticMatch = STATIC_COURSES.find(c => c.id === row.slug)
  const { gradientFrom, gradientTo } = staticMatch ?? gradientFor(idx)

  return {
    id:           row.slug,
    universityId: row.university?.slug ?? '',
    title:        row.title,
    subtitle:     row.subtitle      ?? '',
    description:  row.description   ?? '',
    icon:         staticMatch?.icon  ?? '📚',
    gradientFrom,
    gradientTo,
    // Price shown in EGP on the card — price_points is the NXP cost used by pointsCostFor()
    price:        row.price_points,
    oldPrice:     null,
    currency:     'EGP',
    duration:     'Lifetime access',
    modules:      row.hours ? Math.round(row.hours / 3) : 0,
    hours:        row.hours     ?? 0,
    students:     staticMatch?.students ?? 0,
    level:        row.level     ?? '',
    // topics_list column doesn't exist yet — fall back to static or empty
    features:     staticMatch?.features ?? [],
    topics:       staticMatch?.topics   ?? [],
    badge:        row.badge ?? null,
    _fromDb:      true,
  }
}

function normalizeDbUniversity(row) {
  const staticMatch = STATIC_UNIVERSITIES.find(u => u.id === row.slug)
  return {
    id:          row.slug,
    name:        row.name,
    shortName:   row.short_name   ?? '',
    tagline:     staticMatch?.tagline     ?? '',
    description: row.description  ?? staticMatch?.description ?? '',
    color:       row.color        ?? staticMatch?.color ?? '#0047AB',
    accentColor: row.accent_color ?? staticMatch?.accentColor ?? '#f0a500',
    location:    staticMatch?.location ?? '',
    icon:        row.icon         ?? staticMatch?.icon ?? '🎓',
    _fromDb:     true,
  }
}

function normalizeDbInstructor(row, idx) {
  const staticMatch = STATIC_INSTRUCTORS.find(i => i.id === row.slug)
  const { gradientFrom, gradientTo } = staticMatch ?? gradientFor(idx)
  return {
    id:           row.slug,
    name:         row.name,
    role:         row.role     ?? '',
    subject:      row.subject  ?? '',
    photo:        row.photo_url ?? staticMatch?.photo ?? '',
    initials:     row.initials  ?? row.name.split(' ').map(w => w[0]).join('').slice(0, 2),
    gradientFrom,
    gradientTo,
    universities: (row.instructor_universities ?? [])
      .map(iu => iu.university?.short_name)
      .filter(Boolean),
    rating:       Number(row.rating)   || staticMatch?.rating   || 4.8,
    students:     Number(row.students) || staticMatch?.students || 0,
    bio:          row.bio ?? staticMatch?.bio ?? '',
    _fromDb:      true,
  }
}

// ── Module-level singleton so multiple useCatalog() calls share one fetch ─────
let _promise = null

function fetchDbCatalog() {
  if (_promise) return _promise
  _promise = Promise.all([
    supabase
      .from('courses')
      .select('*, university:universities(slug, short_name)')
      .eq('published', true)
      .order('created_at'),
    supabase
      .from('universities')
      .select('*')
      .order('position'),
    supabase
      .from('instructors')
      .select('*, instructor_universities(university:universities(short_name))')
      .order('created_at'),
  ])
  return _promise
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useCatalog() {
  // Start empty so nothing renders until we know where the data comes from
  const [courses,      setCourses]      = useState([])
  const [universities, setUniversities] = useState([])
  const [instructors,  setInstructors]  = useState([])
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    fetchDbCatalog()
      .then(([{ data: dbCourses, error: ce }, { data: dbUnis, error: ue }, { data: dbInstructors, error: ie }]) => {
        const hasDbCourses = !ce && dbCourses?.length > 0
        const hasDbUnis    = !ue && dbUnis?.length    > 0
        const hasDbIns     = !ie && dbInstructors?.length > 0

        const resolvedCourses      = hasDbCourses ? dbCourses.map(normalizeDbCourse)      : STATIC_COURSES
        const resolvedUniversities = hasDbUnis    ? dbUnis.map(normalizeDbUniversity)     : STATIC_UNIVERSITIES
        const resolvedInstructors  = hasDbIns     ? dbInstructors.map(normalizeDbInstructor) : STATIC_INSTRUCTORS

        setCourses(resolvedCourses)
        setUniversities(resolvedUniversities)
        setInstructors(resolvedInstructors)
        hydrateCourseCache(resolvedCourses)
        setLoading(false)
      })
      .catch(() => {
        // Network failure — fall back to static data so the site still works
        setCourses(STATIC_COURSES)
        setUniversities(STATIC_UNIVERSITIES)
        setInstructors(STATIC_INSTRUCTORS)
        hydrateCourseCache(STATIC_COURSES)
        setLoading(false)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { courses, universities, instructors, loading }
}
