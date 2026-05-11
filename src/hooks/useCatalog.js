import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import {
  COURSES      as STATIC_COURSES,
  UNIVERSITIES as STATIC_UNIVERSITIES,
  INSTRUCTORS  as STATIC_INSTRUCTORS,
} from '../data/constants'
import { hydrateCourseCache } from '../lib/courseCache'

// ── Normalizers: Supabase snake_case → constants.js camelCase shape ──────────

function normalizeDbCourse(row) {
  return {
    id:           row.slug,
    universityId: row.university?.slug ?? '',
    title:        row.title,
    subtitle:     row.subtitle     ?? '',
    description:  row.description  ?? '',
    icon:         row.icon         ?? '📚',
    gradientFrom: row.gradient_from ?? '#0047AB',
    gradientTo:   row.gradient_to   ?? '#1a6fd4',
    price:        row.price_egp,
    oldPrice:     row.old_price_egp,
    currency:     row.currency     ?? 'EGP',
    duration:     'Lifetime access',
    modules:      row.module_count  ?? 0,
    hours:        row.hours         ?? 0,
    students:     row.student_count ?? 0,
    level:        row.level         ?? '',
    features:     Array.isArray(row.features)    ? row.features    : [],
    topics:       Array.isArray(row.topics_list) ? row.topics_list : [],
    badge:        row.badge ?? null,
    _fromDb:      true,
  }
}

function normalizeDbUniversity(row) {
  return {
    id:          row.slug,
    name:        row.name,
    shortName:   row.short_name   ?? '',
    tagline:     row.tagline      ?? '',
    description: row.description  ?? '',
    color:       row.color        ?? '#0047AB',
    accentColor: row.accent_color ?? '#f0a500',
    location:    row.location     ?? '',
    icon:        row.icon         ?? '🎓',
    _fromDb:     true,
  }
}

function normalizeDbInstructor(row) {
  return {
    id:           row.slug,
    name:         row.name,
    role:         row.role    ?? '',
    subject:      row.subject ?? '',
    photo:        row.photo   ?? '',
    initials:     row.initials,
    gradientFrom: row.gradient_from ?? '#0047AB',
    gradientTo:   row.gradient_to   ?? '#1a6fd4',
    universities: (row.instructor_universities ?? [])
      .map(iu => iu.university?.short_name)
      .filter(Boolean),
    rating:       row.rating        ?? 4.8,
    students:     row.student_count ?? 0,
    bio:          row.bio           ?? '',
    _fromDb:      true,
  }
}

// ── Module-level singleton so multiple useCatalog() calls share one fetch ────
let _promise = null

function fetchDbCatalog() {
  if (_promise) return _promise
  _promise = Promise.all([
    supabase
      .from('courses')
      .select('*, university:universities(slug, short_name)')
      .eq('published', true),
    supabase
      .from('universities')
      .select('*')
      .order('position'),
    supabase
      .from('instructors')
      .select('*, instructor_universities(university:universities(short_name))'),
  ])
  return _promise
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useCatalog() {
  const [courses,      setCourses]      = useState(STATIC_COURSES)
  const [universities, setUniversities] = useState(STATIC_UNIVERSITIES)
  const [instructors,  setInstructors]  = useState(STATIC_INSTRUCTORS)
  const [loading,      setLoading]      = useState(true)

  useEffect(() => {
    fetchDbCatalog().then(([{ data: dbCourses }, { data: dbUnis }, { data: dbInstructors }]) => {
      // DB-only rows: those whose slug doesn't already exist in the static arrays.
      const staticCourseIds = new Set(STATIC_COURSES.map(c => c.id))
      const newCourses = (dbCourses ?? [])
        .map(normalizeDbCourse)
        .filter(c => !staticCourseIds.has(c.id))

      const staticUniIds = new Set(STATIC_UNIVERSITIES.map(u => u.id))
      const newUnis = (dbUnis ?? [])
        .map(normalizeDbUniversity)
        .filter(u => !staticUniIds.has(u.id))

      const staticInsIds = new Set(STATIC_INSTRUCTORS.map(i => i.id))
      const newInstructors = (dbInstructors ?? [])
        .map(normalizeDbInstructor)
        .filter(i => !staticInsIds.has(i.id))

      const merged = [...STATIC_COURSES, ...newCourses]
      setCourses(merged)
      setUniversities([...STATIC_UNIVERSITIES, ...newUnis])
      setInstructors([...STATIC_INSTRUCTORS, ...newInstructors])
      hydrateCourseCache(merged)   // keep pricing.js / wallet.js in sync
      setLoading(false)
    }).catch(() => {
      // DB unreachable — fall back gracefully to static data
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { courses, universities, instructors, loading }
}
