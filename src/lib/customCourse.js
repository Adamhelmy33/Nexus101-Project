/* ═══════════════════════════════════════════════
   Nexus 101 — Custom Course Generator (frontend client)
   ═══════════════════════════════════════════════
   In production this calls the Supabase Edge Functions
   `parse-syllabus` and `build-custom-playlist`.

   Demo mode (no backend): runs the entire pipeline locally with:
     • A keyword-based mock parser (or built-in sample syllabi)
     • A keyword-overlap RAG matcher against DEMO_SEGMENTS
     • localStorage persistence for the user's playlists
   ═══════════════════════════════════════════════ */

import { DEMO_SEGMENTS, getSegmentById } from '../data/segments'
import nexusConfig from '../../nexus.config.js'

const PARSE_PATH    = '/api/parse-syllabus'
const BUILD_PATH    = '/api/build-custom-playlist'
const PLAYLISTS_KEY = 'nexus_custom_playlists'
const SYLLABI_KEY   = 'nexus_parsed_syllabi'

/* ── Sample syllabi for the demo "Use a sample" buttons ── */
export const SAMPLE_SYLLABI = [
  {
    id: 'sample-engineering-y1',
    label: 'Year 1 Engineering (UK template)',
    text:
`UNIVERSITY OF EXAMPLE — Engineering Foundations 1A
Module Outline:

1. Engineering Mathematics — differentiation, integration, vectors, matrices,
   complex numbers, basic differential equations.
2. Programming Fundamentals — variables, control flow, functions, arrays,
   intro to object-oriented programming with Python.
3. Mechanics — Newton's laws, energy conservation, momentum, simple harmonic motion.
4. Digital Electronics — number systems, Boolean algebra, logic gates, combinational circuits.
5. Engineering communication and ethics (not covered in revisions).

Assessment: 70% final exam + 30% coursework.`,
  },
  {
    id: 'sample-cs-y2',
    label: 'Year 2 Computer Science',
    text:
`COVENTRY @ KNOWLEDGE HUB — Computer Science Year 2
Module list:

CS201  Data Structures & Algorithms — arrays, linked lists, stacks, queues, trees,
       graphs, sorting, searching, hash tables, dynamic programming, big-O.
CS202  Computer Networks — OSI model, TCP/IP, IP addressing, subnetting, routing
       protocols, HTTP, DNS, application layer, network security.
CS203  Discrete Mathematics — logic, proofs (induction & contradiction), sets,
       functions, counting, combinatorics, graph theory.
CS204  C++ Programming — syntax, classes, inheritance, polymorphism, templates,
       STL, pointers, memory management.

Final exams in May. Past papers available on the student portal.`,
  },
]

/* ── 1. PARSE A SYLLABUS ───────────────────────────────────
   Returns { syllabusId, topics: [...] }                                    */
export async function parseSyllabus({ rawText, fileName, onProgress }) {
  /* Try real backend */
  try {
    const res = await fetch(PARSE_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw_text: rawText, file_name: fileName }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.topics?.length) {
        persistSyllabus(data.syllabus_id || `local-${Date.now()}`, rawText, data.topics)
        return { ok: true, syllabusId: data.syllabus_id, topics: data.topics }
      }
    }
  } catch { /* fall through to mock */ }

  /* Mock pipeline — animate progress */
  const steps = ['Reading syllabus…', 'Detecting topics…', 'Scoring importance…']
  for (const step of steps) {
    onProgress?.(step)
    await sleep(700)
  }
  const topics = mockParseTopics(rawText || '')
  const syllabusId = `local-${Date.now()}`
  persistSyllabus(syllabusId, rawText, topics)
  return { ok: true, syllabusId, topics, source: 'mock' }
}

/* ── 2. BUILD A PLAYLIST FROM PARSED TOPICS ───────────────
   Returns { playlistId, items: [...], totalSeconds }                       */
export async function buildPlaylist({ syllabusId, topics, title, onProgress }) {
  /* Try real backend */
  try {
    const res = await fetch(BUILD_PATH, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syllabus_id: syllabusId, title }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.playlist_id) return { ok: true, ...data, source: 'live' }
    }
  } catch { /* fall through to mock */ }

  /* Mock pipeline */
  const steps = [
    `Querying ${DEMO_SEGMENTS.length}-segment library…`,
    'Scoring matches by topic relevance…',
    'Stitching segments into playlist…',
  ]
  for (const step of steps) {
    onProgress?.(step)
    await sleep(700)
  }

  const items = mockBuildItems(topics)
  const totalSeconds = items.reduce((s, i) => s + (i.segment.end_sec - i.segment.start_sec), 0)
  const playlist = {
    id:           `pl-${Date.now()}`,
    syllabusId,
    title:        title || 'Custom syllabus course',
    items,
    totalSeconds,
    segmentCount: items.length,
    createdAt:    new Date().toISOString(),
    status:       'ready',
  }
  persistPlaylist(playlist)
  return { ok: true, ...playlist, source: 'mock' }
}

/* ── 3. CRUD on local playlists ─────────────────────────── */
export function getMyPlaylists() {
  return JSON.parse(localStorage.getItem(PLAYLISTS_KEY) || '[]')
                 .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
export function getPlaylistById(id) {
  return getMyPlaylists().find(p => p.id === id)
}
export function deletePlaylist(id) {
  const all = getMyPlaylists().filter(p => p.id !== id)
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(all))
}
export function reorderPlaylist(id, newItems) {
  const all = getMyPlaylists()
  const idx = all.findIndex(p => p.id === id)
  if (idx === -1) return
  all[idx].items = newItems
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(all))
}

/* ────────── INTERNAL HELPERS ────────── */
function persistSyllabus(id, text, topics) {
  const all = JSON.parse(localStorage.getItem(SYLLABI_KEY) || '[]')
  all.push({ id, text, topics, createdAt: new Date().toISOString() })
  localStorage.setItem(SYLLABI_KEY, JSON.stringify(all.slice(-20)))
}
function persistPlaylist(p) {
  const all = getMyPlaylists()
  all.unshift(p)
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(all.slice(0, 50)))
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

/* ── Mock topic parser — keyword extraction from raw text ── */
function mockParseTopics(text) {
  const t = text.toLowerCase()
  /* Roster of topic candidates the demo can recognize from sample syllabi */
  const candidates = [
    { kw: ['integration', 'integral'],          title: 'Integration Techniques',     subject: 'math',    weight: 5 },
    { kw: ['differentiation', 'derivative'],    title: 'Differentiation',            subject: 'math',    weight: 5 },
    { kw: ['linear algebra', 'matrices', 'matrix'], title: 'Linear Algebra & Matrices', subject: 'math', weight: 4 },
    { kw: ['vector', 'dot product'],            title: 'Vectors',                    subject: 'math',    weight: 3 },
    { kw: ['differential equation', 'ode'],     title: 'Differential Equations',     subject: 'math',    weight: 5 },
    { kw: ['statistics', 'probability'],        title: 'Statistics & Probability',   subject: 'math',    weight: 3 },
    { kw: ['logic', 'proof', 'induction'],      title: 'Logic & Proofs',             subject: 'math',    weight: 4 },
    { kw: ['set', 'function', 'cardinality'],   title: 'Sets, Functions & Cardinality', subject: 'math', weight: 3 },
    { kw: ['graph theory', 'graph'],            title: 'Graph Theory',               subject: 'math',    weight: 4 },
    { kw: ['boolean'],                          title: 'Boolean Algebra',            subject: 'math',    weight: 3 },

    { kw: ['variable', 'control flow', 'loop'], title: 'Variables, Loops & Control Flow', subject: 'cs', weight: 3 },
    { kw: ['function', 'scope', 'module'],      title: 'Functions & Scope',          subject: 'cs',      weight: 3 },
    { kw: ['oop', 'class', 'inheritance', 'polymorphism'], title: 'Object-Oriented Programming', subject: 'cs', weight: 4 },
    { kw: ['array', 'list', 'linked list'],     title: 'Arrays & Linked Lists',      subject: 'cs',      weight: 3 },
    { kw: ['stack', 'queue'],                   title: 'Stacks & Queues',            subject: 'cs',      weight: 3 },
    { kw: ['tree', 'bst'],                      title: 'Trees & BSTs',               subject: 'cs',      weight: 4 },
    { kw: ['sort'],                             title: 'Sorting Algorithms',         subject: 'cs',      weight: 3 },
    { kw: ['hash table', 'hashtable', 'hash'],  title: 'Hash Tables',                subject: 'cs',      weight: 3 },
    { kw: ['dynamic programming', 'dp'],        title: 'Dynamic Programming',        subject: 'cs',      weight: 5 },
    { kw: ['big-o', 'big o', 'complexity'],     title: 'Big-O Analysis',             subject: 'cs',      weight: 3 },
    { kw: ['c++', 'cpp', 'pointer', 'template', 'stl'], title: 'C++ Essentials',     subject: 'cs',      weight: 4 },
    { kw: ['number system', 'binary', 'hex'],   title: 'Number Systems',             subject: 'cs',      weight: 2 },
    { kw: ['logic gate', 'truth table'],        title: 'Logic Gates',                subject: 'cs',      weight: 3 },
    { kw: ['flip flop', 'sequential'],          title: 'Sequential Circuits',        subject: 'cs',      weight: 4 },
    { kw: ['osi', 'tcp', 'ip stack'],           title: 'OSI & TCP/IP Stack',         subject: 'cs',      weight: 4 },
    { kw: ['subnet', 'cidr', 'ip address'],     title: 'IP Addressing & Subnetting', subject: 'cs',      weight: 4 },
    { kw: ['routing', 'ospf', 'bgp', 'rip'],    title: 'Routing Protocols',          subject: 'cs',      weight: 4 },
    { kw: ['http', 'https', 'tls'],             title: 'HTTP & Application Layer',   subject: 'cs',      weight: 3 },
    { kw: ['dns'],                              title: 'DNS & Name Resolution',      subject: 'cs',      weight: 2 },
    { kw: ['security', 'firewall', 'encryption'], title: 'Network Security Basics',  subject: 'cs',      weight: 4 },

    { kw: ["newton", 'force', 'mass', 'acceleration'], title: "Newton's Laws of Motion", subject: 'physics', weight: 4 },
    { kw: ['energy', 'kinetic', 'potential', 'conservation'], title: 'Energy Conservation', subject: 'physics', weight: 3 },
    { kw: ['momentum'],                         title: 'Momentum & Collisions',      subject: 'physics', weight: 3 },
    { kw: ['shm', 'simple harmonic'],           title: 'Simple Harmonic Motion',     subject: 'physics', weight: 4 },
    { kw: ['wave', 'oscillation', 'frequency'], title: 'Waves & Oscillations',       subject: 'physics', weight: 3 },
    { kw: ['electric', 'magnetic', 'flux'],     title: 'Electromagnetism',           subject: 'physics', weight: 4 },
  ]

  const detected = candidates
    .filter(c => c.kw.some(k => t.includes(k)))
    .map(c => ({
      title: c.title,
      description: `Auto-detected from your syllabus: ${c.kw.slice(0, 3).join(', ')}.`,
      keywords: c.kw,
      weight:   c.weight,
      subject:  c.subject,
    }))

  /* Fallback: if nothing matched, give a generic top-level mix so the demo never empties */
  if (detected.length === 0) {
    return [
      { title: 'Engineering Mathematics', description: 'General math foundations.', keywords: ['math'], weight: 4, subject: 'math' },
      { title: 'Programming Fundamentals', description: 'General programming.',     keywords: ['programming'], weight: 4, subject: 'cs' },
    ]
  }
  return detected.slice(0, 12)
}

/* ── Mock RAG matcher — keyword overlap × topic weight ── */
function mockBuildItems(topics) {
  const items = []
  const seen = new Set()
  let position = 0

  topics.forEach((topic, syllabusPosition) => {
    const tk = (topic.keywords || []).map(k => k.toLowerCase())
    /* Score every segment by keyword overlap */
    const scored = DEMO_SEGMENTS.map(seg => {
      const sk = seg.keywords.map(k => k.toLowerCase())
      const overlap = tk.filter(k => sk.some(s => s.includes(k) || k.includes(s))).length
      const subjectBonus = seg.subject === topic.subject ? 0.2 : 0
      const baseScore = (overlap / Math.max(tk.length, 1)) + subjectBonus
      return { seg, score: baseScore * (topic.weight || 3) / 3 }
    })
    .filter(x => x.score >= 0.35)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)

    for (const { seg, score } of scored) {
      if (seen.has(seg.id)) continue
      seen.add(seg.id)
      position += 1
      items.push({
        position,
        segment:    seg,
        matchScore: +score.toFixed(2),
        aiReason:   `Matches "${topic.title}" — ${seg.title}`,
        syllabusPosition,
      })
    }
  })

  /* Cap at config max */
  return items.slice(0, nexusConfig.customCourse.maxSegmentsPerPlaylist)
}
