/* ═══════════════════════════════════════════════
   Nexus 101 — Demo video segments (Atomic Tagging seed)
   ═══════════════════════════════════════════════
   In production these come from Supabase `video_segments`.
   Here we ship a hand-written demo set so the entire UI
   (player chapters, Custom Course Generator, transcript panel)
   is fully clickable without a real Bunny library.

   Each segment carries:
     • The course it belongs to (also drives subject)
     • A start/end second (relative to its source video)
     • A topic title + transcript blurb
     • A keyword bag — used by the demo "RAG" matcher in
       lib/customCourse.js to score syllabus topics against segments.
   ═══════════════════════════════════════════════ */

/* All demo videos point to the same public test stream so the player
   actually plays in the local demo. In production, each video has its
   own Bunny.net HLS URL via lib/bunny.js. */
export const DEMO_HLS_URL = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'

export const DEMO_VIDEOS = {
  /* one demo "video" per course — id matches courseId so chapters render in CourseViewer */
  'uh-eng-math':           { id: 'v-uh-eng',   title: 'UH Engineering Math — Master Class' },
  'uh-prog-fund':          { id: 'v-uh-prog',  title: 'UH Programming Fundamentals — Master Class' },
  'uh-digital-electronics':{ id: 'v-uh-de',    title: 'UH Digital Electronics — Master Class' },
  'bue-calculus':          { id: 'v-bue-cal',  title: 'BUE Calculus — Master Class' },
  'bue-mechanics':         { id: 'v-bue-mech', title: 'BUE Mechanics — Master Class' },
  'bue-cpp':               { id: 'v-bue-cpp',  title: 'BUE C++ — Master Class' },
  'guc-physics':           { id: 'v-guc-phy',  title: 'GUC Physics — Master Class' },
  'guc-discrete':          { id: 'v-guc-dis',  title: 'GUC Discrete Math — Master Class' },
  'guc-dsa':               { id: 'v-guc-dsa',  title: 'GUC DSA — Master Class' },
  'cov-programming':       { id: 'v-cov-prog', title: 'Coventry Programming Foundations — Master Class' },
  'cov-eng-math':          { id: 'v-cov-math', title: 'Coventry Engineering Math — Master Class' },
  'cov-networks':          { id: 'v-cov-net',  title: 'Coventry Computer Networks — Master Class' },
}

/**
 * Each entry is one atomic taggable segment.
 * keywords drive the demo RAG matcher (case-insensitive substring).
 */
export const DEMO_SEGMENTS = [
  /* ── UH Engineering Math ── */
  s('uh-eng-math', 0,    180,  'Differentiation rules walkthrough',  'math', 3, ['differentiation','derivative','chain rule','product rule']),
  s('uh-eng-math', 180,  360,  'Integration techniques',             'math', 4, ['integration','integral','substitution','by parts']),
  s('uh-eng-math', 360,  520,  'Vectors & dot products',             'math', 2, ['vector','dot product','magnitude','direction']),
  s('uh-eng-math', 520,  720,  'Matrices & determinants',            'math', 3, ['matrix','determinant','transpose','inverse']),
  s('uh-eng-math', 720,  920,  'Differential equations 101',         'math', 5, ['differential equation','ode','first order','separable']),

  /* ── UH Programming Fundamentals ── */
  s('uh-prog-fund', 0,   200,  'Variables, types & operators',       'cs', 1, ['variable','data type','operator','assignment']),
  s('uh-prog-fund', 200, 380,  'Control flow & loops',               'cs', 2, ['if','else','while','for','loop','condition']),
  s('uh-prog-fund', 380, 600,  'Functions & scope',                  'cs', 3, ['function','scope','parameter','return','closure']),
  s('uh-prog-fund', 600, 820,  'OOP basics — classes & objects',     'cs', 4, ['class','object','oop','instance','inheritance','method']),

  /* ── UH Digital Electronics ── */
  s('uh-digital-electronics', 0,   200, 'Number systems & conversion', 'cs', 2, ['binary','hex','octal','number system']),
  s('uh-digital-electronics', 200, 420, 'Boolean algebra & laws',      'math', 3, ['boolean','algebra','de morgan','simplification']),
  s('uh-digital-electronics', 420, 640, 'Logic gates & truth tables',  'cs', 2, ['and','or','not','xor','gate','truth table']),
  s('uh-digital-electronics', 640, 880, 'Sequential circuits',         'cs', 4, ['flip flop','latch','sequential','clock']),

  /* ── BUE Calculus ── */
  s('bue-calculus', 0,   200, 'Limits & continuity',                 'math', 2, ['limit','continuity','one-sided','epsilon']),
  s('bue-calculus', 200, 420, 'Derivative rules — the toolbox',       'math', 3, ['derivative','rule','differentiate','tangent']),
  s('bue-calculus', 420, 660, 'Integration by parts deep dive',       'math', 4, ['integration by parts','udv','integral']),
  s('bue-calculus', 660, 900, 'Series & sequences for exams',         'math', 4, ['series','sequence','convergence','divergence','taylor']),

  /* ── BUE Mechanics ── */
  s('bue-mechanics', 0,   180, 'Statics & equilibrium',                'physics', 2, ['static','equilibrium','force','moment']),
  s('bue-mechanics', 180, 380, "Newton's laws walkthrough",            'physics', 3, ['newton','law','force','mass','acceleration']),
  s('bue-mechanics', 380, 580, 'Energy conservation problems',         'physics', 3, ['energy','kinetic','potential','conservation']),
  s('bue-mechanics', 580, 800, 'Simple harmonic motion (SHM)',         'physics', 4, ['shm','harmonic','spring','oscillation','period']),

  /* ── BUE C++ ── */
  s('bue-cpp', 0,   220, 'C++ syntax & types refresher',             'cs', 2, ['c++','cpp','syntax','type','int','float']),
  s('bue-cpp', 220, 460, 'Pointers without the pain',                'cs', 4, ['pointer','reference','dereference','memory']),
  s('bue-cpp', 460, 700, 'Inheritance & polymorphism',               'cs', 4, ['inheritance','polymorphism','virtual','override']),
  s('bue-cpp', 700, 960, 'Templates & STL essentials',               'cs', 5, ['template','stl','vector','map','iterator']),

  /* ── GUC Physics ── */
  s('guc-physics', 0,   200, 'Kinematics in one dimension',          'physics', 2, ['kinematics','velocity','acceleration','displacement']),
  s('guc-physics', 200, 420, 'Forces & free-body diagrams',          'physics', 3, ['force','free body','diagram','newton']),
  s('guc-physics', 420, 640, 'Waves & oscillations',                 'physics', 3, ['wave','oscillation','frequency','wavelength']),
  s('guc-physics', 640, 880, 'Electromagnetism essentials',          'physics', 4, ['electric','magnetic','field','flux','maxwell']),

  /* ── GUC Discrete Math ── */
  s('guc-discrete', 0,   200, 'Logic & truth tables',                 'math', 2, ['logic','proposition','truth table','tautology']),
  s('guc-discrete', 200, 420, 'Proof techniques (induction, contradiction)', 'math', 4, ['proof','induction','contradiction','contrapositive']),
  s('guc-discrete', 420, 640, 'Sets, functions & cardinality',        'math', 3, ['set','function','injection','bijection','cardinality']),
  s('guc-discrete', 640, 860, 'Graph theory crash course',            'math', 4, ['graph','vertex','edge','tree','spanning']),

  /* ── GUC DSA ── */
  s('guc-dsa', 0,   200, 'Arrays & linked lists',                    'cs', 2, ['array','linked list','node','pointer']),
  s('guc-dsa', 200, 400, 'Stacks, queues & deques',                  'cs', 3, ['stack','queue','deque','lifo','fifo']),
  s('guc-dsa', 400, 660, 'Trees, BSTs & traversal',                  'cs', 4, ['tree','bst','traversal','dfs','bfs']),
  s('guc-dsa', 660, 920, 'Sorting algorithms compared',              'cs', 3, ['sort','sorting','quicksort','mergesort','heap']),
  s('guc-dsa', 920, 1180, 'Dynamic programming patterns',            'cs', 5, ['dp','dynamic programming','memoization','tabulation']),
  s('guc-dsa', 1180, 1380, 'Big-O analysis cheat sheet',              'cs', 3, ['big o','complexity','time','space','analysis']),

  /* ── Coventry Programming ── */
  s('cov-programming', 0,   220, 'Variables, data types & operators', 'cs', 1, ['variable','data type','operator','assignment','python']),
  s('cov-programming', 220, 440, 'Loops & control flow',              'cs', 2, ['for','while','if','else','loop']),
  s('cov-programming', 440, 660, 'Functions, scope & modules',        'cs', 3, ['function','def','module','import','scope']),
  s('cov-programming', 660, 880, 'Lists, dicts & tuples',             'cs', 3, ['list','dict','tuple','collection','iterate']),
  s('cov-programming', 880, 1100, 'OOP with classes & inheritance',   'cs', 4, ['class','object','inheritance','method','self']),

  /* ── Coventry Engineering Math ── */
  s('cov-eng-math', 0,   200, 'Differentiation in engineering contexts', 'math', 3, ['differentiation','derivative','engineering','rate of change']),
  s('cov-eng-math', 200, 420, 'Definite & indefinite integration',       'math', 4, ['integration','integral','definite','indefinite','antiderivative']),
  s('cov-eng-math', 420, 640, 'Linear algebra & matrices',                'math', 3, ['linear algebra','matrix','vector','eigenvalue']),
  s('cov-eng-math', 640, 860, 'Differential equations for engineers',     'math', 5, ['differential equation','ode','separable','linear']),
  s('cov-eng-math', 860, 1080, 'Statistics & probability essentials',     'math', 3, ['statistics','probability','mean','variance','distribution']),

  /* ── Coventry Networks ── */
  s('cov-networks', 0,   220, 'OSI model & TCP/IP stack',              'cs', 2, ['osi','tcp','ip','stack','layer','protocol']),
  s('cov-networks', 220, 440, 'IP addressing & subnetting',             'cs', 4, ['ip','address','subnet','cidr','netmask']),
  s('cov-networks', 440, 660, 'Routing protocols (RIP, OSPF, BGP)',     'cs', 4, ['routing','ospf','rip','bgp','router']),
  s('cov-networks', 660, 880, 'HTTP, HTTPS & application layer',        'cs', 3, ['http','https','tls','application','request','response']),
  s('cov-networks', 880, 1100, 'DNS & name resolution',                  'cs', 2, ['dns','domain','resolve','record','a record','cname']),
  s('cov-networks', 1100, 1320, 'Network security fundamentals',          'cs', 4, ['security','firewall','vpn','encryption','attack']),
]

function s(courseId, start, end, title, subject, difficulty, keywords) {
  const v = DEMO_VIDEOS[courseId]
  return {
    id: `seg-${courseId}-${start}`,
    courseId,
    videoId:  v?.id || courseId,
    videoTitle: v?.title || courseId,
    start_sec: start,
    end_sec:   end,
    title,
    subject,
    difficulty,
    keywords,
    transcript: `[Demo transcript for "${title}" from ${start}s to ${end}s — ` +
                `key concepts: ${keywords.slice(0, 4).join(', ')}.] ` +
                `In production this comes from Bunny.net's caption track or Whisper.`,
    hlsUrl: DEMO_HLS_URL,
  }
}

/* ── Helpers used by lib/customCourse.js ── */
export function getSegmentsForCourse(courseId) {
  return DEMO_SEGMENTS.filter(s => s.courseId === courseId)
}
export function getAllSegments() {
  return DEMO_SEGMENTS
}
export function getSegmentById(id) {
  return DEMO_SEGMENTS.find(s => s.id === id)
}
