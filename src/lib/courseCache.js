// Module-level singleton. Imported synchronously by pricing.js and wallet.js
// so they keep their sync call signatures while still seeing DB-sourced courses.
// Hydrated immediately with static data (so pricing works at module load time),
// then overwritten by useCatalog once the Supabase fetch resolves.
import { COURSES as STATIC_COURSES } from '../data/constants'

let _courses = [...STATIC_COURSES]

export function hydrateCourseCache(courses) { _courses = courses }
export function getCachedCourses()          { return _courses }
export function findCachedCourse(id)        { return _courses.find(c => c.id === id) ?? null }
