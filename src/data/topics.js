/* ═══════════════════════════════════════════════
   Skill topics per course — drives the Skill Heatmap
   ═══════════════════════════════════════════════
   To add or change topics: edit the arrays below.
   • subject: 'math' | 'physics' | 'cs'  (group color)
   • difficulty: 1 (easy) … 5 (hard)
   ═══════════════════════════════════════════════ */

export const TOPICS_BY_COURSE = {
  /* ─── UH ─── */
  'uh-eng-math': [
    { id: 't1', title: 'Differentiation',     subject: 'math', difficulty: 3 },
    { id: 't2', title: 'Integration',         subject: 'math', difficulty: 4 },
    { id: 't3', title: 'Vectors',             subject: 'math', difficulty: 2 },
    { id: 't4', title: 'Matrices',            subject: 'math', difficulty: 3 },
    { id: 't5', title: 'Complex Numbers',     subject: 'math', difficulty: 3 },
    { id: 't6', title: 'ODEs',                subject: 'math', difficulty: 5 },
    { id: 't7', title: 'Statistics',          subject: 'math', difficulty: 2 },
    { id: 't8', title: 'Probability',         subject: 'math', difficulty: 3 },
  ],
  'uh-prog-fund': [
    { id: 't1', title: 'Variables & Types',   subject: 'cs',   difficulty: 1 },
    { id: 't2', title: 'Operators',           subject: 'cs',   difficulty: 2 },
    { id: 't3', title: 'Control Flow',        subject: 'cs',   difficulty: 2 },
    { id: 't4', title: 'Functions',           subject: 'cs',   difficulty: 3 },
    { id: 't5', title: 'Arrays & Lists',      subject: 'cs',   difficulty: 3 },
    { id: 't6', title: 'OOP Basics',          subject: 'cs',   difficulty: 4 },
    { id: 't7', title: 'Recursion',           subject: 'cs',   difficulty: 4 },
    { id: 't8', title: 'Debugging',           subject: 'cs',   difficulty: 2 },
  ],
  'uh-digital-electronics': [
    { id: 't1', title: 'Number Systems',      subject: 'cs',   difficulty: 2 },
    { id: 't2', title: 'Boolean Algebra',     subject: 'math', difficulty: 3 },
    { id: 't3', title: 'Logic Gates',         subject: 'cs',   difficulty: 2 },
    { id: 't4', title: 'Combinational',       subject: 'cs',   difficulty: 3 },
    { id: 't5', title: 'Sequential',          subject: 'cs',   difficulty: 4 },
    { id: 't6', title: 'Karnaugh Maps',       subject: 'math', difficulty: 3 },
    { id: 't7', title: 'Flip-Flops',          subject: 'cs',   difficulty: 4 },
  ],

  /* ─── BUE ─── */
  'bue-calculus': [
    { id: 't1', title: 'Limits',              subject: 'math', difficulty: 2 },
    { id: 't2', title: 'Continuity',          subject: 'math', difficulty: 2 },
    { id: 't3', title: 'Derivatives',         subject: 'math', difficulty: 3 },
    { id: 't4', title: 'Integration',         subject: 'math', difficulty: 4 },
    { id: 't5', title: 'Series',              subject: 'math', difficulty: 4 },
    { id: 't6', title: 'Sequences',           subject: 'math', difficulty: 3 },
    { id: 't7', title: 'Multivariable',       subject: 'math', difficulty: 5 },
    { id: 't8', title: 'Applications',        subject: 'math', difficulty: 3 },
    { id: 't9', title: "L'Hôpital's Rule",    subject: 'math', difficulty: 3 },
  ],
  'bue-mechanics': [
    { id: 't1', title: 'Statics',             subject: 'physics', difficulty: 2 },
    { id: 't2', title: 'Newton\'s Laws',      subject: 'physics', difficulty: 3 },
    { id: 't3', title: 'Energy',              subject: 'physics', difficulty: 3 },
    { id: 't4', title: 'Momentum',            subject: 'physics', difficulty: 3 },
    { id: 't5', title: 'Rotational Dynamics', subject: 'physics', difficulty: 4 },
    { id: 't6', title: 'SHM',                 subject: 'physics', difficulty: 4 },
    { id: 't7', title: 'Vibrations',          subject: 'physics', difficulty: 5 },
    { id: 't8', title: 'Damping',             subject: 'physics', difficulty: 4 },
  ],
  'bue-cpp': [
    { id: 't1', title: 'C++ Syntax',          subject: 'cs', difficulty: 2 },
    { id: 't2', title: 'Pointers',            subject: 'cs', difficulty: 4 },
    { id: 't3', title: 'Classes',             subject: 'cs', difficulty: 3 },
    { id: 't4', title: 'Inheritance',         subject: 'cs', difficulty: 4 },
    { id: 't5', title: 'Polymorphism',        subject: 'cs', difficulty: 4 },
    { id: 't6', title: 'Templates',           subject: 'cs', difficulty: 5 },
    { id: 't7', title: 'STL',                 subject: 'cs', difficulty: 4 },
    { id: 't8', title: 'Memory Mgmt',         subject: 'cs', difficulty: 5 },
    { id: 't9', title: 'Operators',           subject: 'cs', difficulty: 3 },
    { id: 't10', title: 'File I/O',           subject: 'cs', difficulty: 3 },
  ],

  /* ─── GUC ─── */
  'guc-physics': [
    { id: 't1', title: 'Kinematics',          subject: 'physics', difficulty: 2 },
    { id: 't2', title: 'Forces',              subject: 'physics', difficulty: 3 },
    { id: 't3', title: 'Waves',               subject: 'physics', difficulty: 3 },
    { id: 't4', title: 'Optics',              subject: 'physics', difficulty: 3 },
    { id: 't5', title: 'Thermodynamics',      subject: 'physics', difficulty: 4 },
    { id: 't6', title: 'Electromagnetism',    subject: 'physics', difficulty: 4 },
    { id: 't7', title: 'Modern Physics',      subject: 'physics', difficulty: 5 },
    { id: 't8', title: 'Oscillations',        subject: 'physics', difficulty: 3 },
  ],
  'guc-discrete': [
    { id: 't1', title: 'Logic',               subject: 'math', difficulty: 2 },
    { id: 't2', title: 'Proofs',              subject: 'math', difficulty: 4 },
    { id: 't3', title: 'Sets',                subject: 'math', difficulty: 2 },
    { id: 't4', title: 'Functions',           subject: 'math', difficulty: 3 },
    { id: 't5', title: 'Counting',            subject: 'math', difficulty: 3 },
    { id: 't6', title: 'Combinatorics',       subject: 'math', difficulty: 4 },
    { id: 't7', title: 'Graph Theory',        subject: 'math', difficulty: 4 },
  ],
  'guc-dsa': [
    { id: 't1', title: 'Arrays',              subject: 'cs', difficulty: 2 },
    { id: 't2', title: 'Linked Lists',        subject: 'cs', difficulty: 3 },
    { id: 't3', title: 'Stacks & Queues',     subject: 'cs', difficulty: 3 },
    { id: 't4', title: 'Trees',               subject: 'cs', difficulty: 4 },
    { id: 't5', title: 'Graphs',              subject: 'cs', difficulty: 4 },
    { id: 't6', title: 'Sorting',             subject: 'cs', difficulty: 3 },
    { id: 't7', title: 'Searching',           subject: 'cs', difficulty: 3 },
    { id: 't8', title: 'Hash Tables',         subject: 'cs', difficulty: 4 },
    { id: 't9', title: 'Dynamic Prog.',       subject: 'cs', difficulty: 5 },
    { id: 't10', title: 'Big-O',              subject: 'cs', difficulty: 3 },
    { id: 't11', title: 'Recursion',          subject: 'cs', difficulty: 4 },
    { id: 't12', title: 'Greedy',             subject: 'cs', difficulty: 4 },
  ],

  /* ─── Coventry @ The Knowledge Hub ─── */
  'cov-programming': [
    { id: 't1', title: 'Variables & Types',   subject: 'cs', difficulty: 1 },
    { id: 't2', title: 'Control Flow',        subject: 'cs', difficulty: 2 },
    { id: 't3', title: 'Loops',               subject: 'cs', difficulty: 2 },
    { id: 't4', title: 'Functions',           subject: 'cs', difficulty: 3 },
    { id: 't5', title: 'Lists & Dicts',       subject: 'cs', difficulty: 3 },
    { id: 't6', title: 'OOP Basics',          subject: 'cs', difficulty: 4 },
    { id: 't7', title: 'File I/O',            subject: 'cs', difficulty: 3 },
    { id: 't8', title: 'Error Handling',      subject: 'cs', difficulty: 3 },
    { id: 't9', title: 'Modules & Imports',   subject: 'cs', difficulty: 2 },
  ],
  'cov-eng-math': [
    { id: 't1', title: 'Differentiation',     subject: 'math', difficulty: 3 },
    { id: 't2', title: 'Integration',         subject: 'math', difficulty: 4 },
    { id: 't3', title: 'Linear Algebra',      subject: 'math', difficulty: 3 },
    { id: 't4', title: 'Vectors',             subject: 'math', difficulty: 2 },
    { id: 't5', title: 'Differential Eqs',    subject: 'math', difficulty: 5 },
    { id: 't6', title: 'Probability',         subject: 'math', difficulty: 3 },
    { id: 't7', title: 'Statistics',          subject: 'math', difficulty: 3 },
    { id: 't8', title: 'Numerical Methods',   subject: 'math', difficulty: 4 },
  ],
  'cov-networks': [
    { id: 't1',  title: 'OSI Model',          subject: 'cs', difficulty: 2 },
    { id: 't2',  title: 'TCP / IP Stack',     subject: 'cs', difficulty: 3 },
    { id: 't3',  title: 'IP Addressing',      subject: 'cs', difficulty: 3 },
    { id: 't4',  title: 'Subnetting',         subject: 'cs', difficulty: 4 },
    { id: 't5',  title: 'Routing Protocols',  subject: 'cs', difficulty: 4 },
    { id: 't6',  title: 'HTTP / HTTPS',       subject: 'cs', difficulty: 3 },
    { id: 't7',  title: 'DNS',                subject: 'cs', difficulty: 2 },
    { id: 't8',  title: 'Sockets',            subject: 'cs', difficulty: 4 },
    { id: 't9',  title: 'Network Security',   subject: 'cs', difficulty: 4 },
    { id: 't10', title: 'Wireshark',          subject: 'cs', difficulty: 3 },
  ],
}

export const SUBJECTS = {
  math:    { label: 'Mathematics',     color: '#0047AB', bg: '#dbeafe' },
  physics: { label: 'Physics',         color: '#7c3aed', bg: '#ede9fe' },
  cs:      { label: 'Computer Science', color: '#0891b2', bg: '#cffafe' },
}

export function getAllTopicsForUser(userPurchases) {
  const owned = new Set((userPurchases || []).map(p => p.courseId))
  const out = []
  for (const [courseId, topics] of Object.entries(TOPICS_BY_COURSE)) {
    if (!owned.has(courseId)) continue
    for (const t of topics) {
      out.push({ ...t, courseId, key: `${courseId}:${t.id}` })
    }
  }
  return out
}
