/* ═══════════════════════════════════════════════
   Nexus 101 — Application Data
   ═══════════════════════════════════════════════
   PRIMARY SOURCE OF TRUTH: Supabase database.
   useCatalog() fetches live data; these arrays are
   static fallbacks used when the DB is unavailable
   and by non-hook lib files (progress.js, etc.).

   To update universities/courses/instructors:
   edit the data in Supabase directly (or re-run
   seed.sql / seed_content.sql).

   • FOUNDERS       → the 2 co-founders
   • TEAM           → graphic designer + anyone else
   • SEED_USERS     → starting accounts (admin password etc.)
   ═══════════════════════════════════════════════ */

/* ── Brand colors (extracted from your blue logo) ─ */
export const BRAND = {
  blue: '#0047AB',   // Cobalt / royal blue from logo
  blueDark: '#003380',
  blueLight: '#1a6fd4',
  bluePale: '#e8f0fb',
  white: '#ffffff',
  accent: '#f0a500',   // Gold accent
  dark: '#0a1628',
}

/* ────────────────────────────────────────────────
   1️⃣  UNIVERSITIES — to change names/logos/colors,
       just edit the entries below.
   ──────────────────────────────────────────────── */
export const UNIVERSITIES = [
  {
    id: 'uh',
    name: 'University of Hertfordshire',
    shortName: 'UH',
    tagline: 'British excellence in Cairo',
    description: 'High-intensity revision packages for UH modules — pass with confidence.',
    color: '#003F87',         // primary brand color
    accentColor: '#FFD300',
    location: 'Hatfield · Cairo Hub',
    icon: '🎓',
  },
  {
    id: 'bue',
    name: 'British University in Egypt',
    shortName: 'BUE',
    tagline: 'Master your BUE modules',
    description: 'Targeted revisions aligned with the BUE syllabus — hit high marks.',
    color: '#7A0019',
    accentColor: '#D4AF37',
    location: 'El Sherouk City · Cairo',
    icon: '🏛️',
  },
  {
    id: 'guc',
    name: 'German University in Cairo',
    shortName: 'GUC',
    tagline: 'Engineered for GUC students',
    description: 'Crystal-clear revisions for GUC engineering and CS modules.',
    color: '#0066B3',
    accentColor: '#E30613',
    location: 'New Cairo',
    icon: '⚙️',
  },
  {
    id: 'coventry',
    name: 'The Knowledge Hub Univirsities',
    shortName: 'Coventry',
    tagline: 'Master your Coventry modules',
    description: 'Targeted revisions aligned with the Coventry syllabus — hit high marks.',
    color: '#ff000091',
    accentColor: '#370202',
    location: 'The New Administrative Capital of Egypt · Cairo',
    icon: '🏛️',
  },
]

/* ────────────────────────────────────────────────
   2️⃣  COURSES — revision modules per university.
       Each must have `universityId` matching one above.
   ──────────────────────────────────────────────── */
export const COURSES = [
  /* ─── University of Hertfordshire ─── */
  {
    id: 'uh-eng-math',
    universityId: 'uh',
    title: 'Engineering Mathematics',
    subtitle: 'UH Module — Foundations & Applications',
    icon: '∑',
    gradientFrom: '#003F87',
    gradientTo: '#0047AB',
    price: 899, oldPrice: 1299, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 8, hours: 24, students: 320,
    level: 'Year 1 · UH',
    description: 'High-intensity revision of UH Engineering Mathematics — exam-style problems, walkthroughs, and revision sheets to maximize your grade.',
    features: [
      '24h of focused revision videos',
      'Past-paper walkthroughs',
      'PDF revision summaries',
      'Watch unlimited replays',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Differentiation & Integration',
      'Vectors & Matrices',
      'Complex Numbers',
      'Differential Equations',
      'Statistics & Probability',
    ],
    badge: 'Most Popular',
  },
  {
    id: 'uh-prog-fund',
    universityId: 'uh',
    title: 'Programming Fundamentals',
    subtitle: 'UH Module — Core Programming Concepts',
    icon: '</>',
    gradientFrom: '#0047AB',
    gradientTo: '#1a6fd4',
    price: 999, oldPrice: 1399, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 10, hours: 30, students: 280,
    level: 'Year 1 · UH',
    description: 'Crush the UH Programming Fundamentals module — clear walkthroughs of every concept that lands in the exam.',
    features: [
      '30h of revision videos',
      'Live-coded examples',
      'Past-paper code solutions',
      'Lifetime replays',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Variables, Types & Operators',
      'Control Flow',
      'Functions & Scope',
      'Arrays & Lists',
      'Object-Oriented Basics',
    ],
    badge: null,
  },
  {
    id: 'uh-digital-electronics',
    universityId: 'uh',
    title: 'Digital Electronics',
    subtitle: 'UH Module — Logic & Circuits',
    icon: '⚡',
    gradientFrom: '#1a6fd4',
    gradientTo: '#003F87',
    price: 899, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 7, hours: 22, students: 195,
    level: 'Year 1-2 · UH',
    description: 'Master logic gates, Boolean algebra, and digital circuits — exam-ready in a fraction of the time.',
    features: [
      '22h of revision videos',
      'Worked-circuit examples',
      'Truth-table cheat sheets',
      'Past-paper solutions',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Number Systems',
      'Boolean Algebra',
      'Logic Gates',
      'Combinational Circuits',
      'Sequential Circuits',
    ],
    badge: null,
  },

  /* ─── British University in Egypt ─── */
  {
    id: 'bue-calculus',
    universityId: 'bue',
    title: 'Calculus 1 & 2',
    subtitle: 'BUE Module — Differential & Integral Calculus',
    icon: '∫',
    gradientFrom: '#7A0019',
    gradientTo: '#a30024',
    price: 899, oldPrice: 1299, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 9, hours: 26, students: 240,
    level: 'Year 1 · BUE',
    description: 'Pass BUE Calculus with clear, exam-focused revisions covering everything from limits to multivariable integration.',
    features: [
      '26h of HD revisions',
      'Step-by-step problem solutions',
      'Past-exam walkthroughs',
      'Revision summary sheets',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Limits & Continuity',
      'Differentiation Rules',
      'Integration Techniques',
      'Series & Sequences',
      'Multivariable Basics',
    ],
    badge: 'New',
  },
  {
    id: 'bue-mechanics',
    universityId: 'bue',
    title: 'Mechanics & Vibrations',
    subtitle: 'BUE Module — Engineering Mechanics',
    icon: '🔧',
    gradientFrom: '#a30024',
    gradientTo: '#7A0019',
    price: 899, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 8, hours: 24, students: 175,
    level: 'Year 1-2 · BUE',
    description: 'Tackle BUE Mechanics with confidence — every formula, every typical exam question, all explained clearly.',
    features: [
      '24h of revision videos',
      'Force-diagram walkthroughs',
      'Vibrations problem sets',
      'Formula cheat sheets',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Statics & Equilibrium',
      'Newton\'s Laws',
      'Energy & Momentum',
      'Rotational Dynamics',
      'Simple Harmonic Motion',
    ],
    badge: null,
  },
  {
    id: 'bue-cpp',
    universityId: 'bue',
    title: 'Programming with C++',
    subtitle: 'BUE Module — OOP in C++',
    icon: '💻',
    gradientFrom: '#7A0019',
    gradientTo: '#5c0014',
    price: 999, oldPrice: 1399, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 10, hours: 28, students: 158,
    level: 'Year 1 · BUE',
    description: 'Ace the BUE C++ programming course with hands-on revisions, code walkthroughs, and OOP mastery.',
    features: [
      '28h of revision videos',
      'Live coding sessions',
      'Past-paper code solutions',
      'OOP design patterns',
      'WhatsApp tutoring access',
    ],
    topics: [
      'C++ Syntax & Types',
      'Classes & Objects',
      'Inheritance & Polymorphism',
      'Templates & STL',
      'Memory Management',
    ],
    badge: null,
  },

  /* ─── German University in Cairo ─── */
  {
    id: 'guc-physics',
    universityId: 'guc',
    title: 'Engineering Physics',
    subtitle: 'GUC Module — Physics for Engineers',
    icon: '⚛️',
    gradientFrom: '#0066B3',
    gradientTo: '#0047AB',
    price: 899, oldPrice: 1299, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 8, hours: 25, students: 215,
    level: 'Year 1 · GUC',
    description: 'GUC Physics revision — laser-focused on the topics that always show up in the final exam.',
    features: [
      '25h of revision videos',
      'Worked example library',
      'Past-paper solutions',
      'Formula reference sheets',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Mechanics & Forces',
      'Waves & Oscillations',
      'Thermodynamics',
      'Electromagnetism',
      'Modern Physics',
    ],
    badge: null,
  },
  {
    id: 'guc-discrete',
    universityId: 'guc',
    title: 'Discrete Mathematics',
    subtitle: 'GUC Module — Logic, Sets & Graphs',
    icon: '🧮',
    gradientFrom: '#0066B3',
    gradientTo: '#005091',
    price: 899, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 7, hours: 22, students: 188,
    level: 'Year 1 · GUC',
    description: 'Discrete Math revision built specifically around the GUC syllabus — clear, fast, exam-ready.',
    features: [
      '22h of revision videos',
      'Proof-by-example library',
      'Past-paper solutions',
      'Notation cheat sheets',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Logic & Proofs',
      'Sets & Functions',
      'Counting & Combinatorics',
      'Graph Theory',
      'Recurrence Relations',
    ],
    badge: null,
  },
  {
    id: 'guc-dsa',
    universityId: 'guc',
    title: 'Data Structures & Algorithms',
    subtitle: 'GUC Module — Core CS Foundations',
    icon: '🗂️',
    gradientFrom: '#005091',
    gradientTo: '#0066B3',
    price: 1099, oldPrice: 1499, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 12, hours: 32, students: 152,
    level: 'Year 2 · GUC',
    description: 'GUC DSA revision — every data structure and algorithm explained with code, diagrams, and exam tips.',
    features: [
      '32h of revision videos',
      'Visualised algorithms',
      'Coding exercises',
      'Big-O cheat sheet',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Arrays & Linked Lists',
      'Trees & Graphs',
      'Sorting & Searching',
      'Hash Tables',
      'Dynamic Programming',
    ],
    badge: 'Hot',
  },

  /* ─── Coventry @ The Knowledge Hub ─── */
  {
    id: 'cov-programming',
    universityId: 'coventry',
    title: 'Programming Foundations',
    subtitle: 'Coventry Module — Core Programming with Python',
    icon: '💻',
    gradientFrom: '#dc2626',
    gradientTo: '#991b1b',
    price: 850, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 9, hours: 26, students: 140,
    level: 'Year 1 · Coventry',
    description: 'Pass Coventry Programming Foundations — clear walkthroughs of every concept and code pattern that lands in the exam.',
    features: [
      '26h of revision videos',
      'Live-coded Python examples',
      'Past-paper code solutions',
      'Lifetime replays',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Variables & Data Types',
      'Control Flow & Loops',
      'Functions & Modules',
      'Lists, Dicts & Tuples',
      'OOP Fundamentals',
    ],
    badge: 'New',
  },
  {
    id: 'cov-eng-math',
    universityId: 'coventry',
    title: 'Engineering Mathematics',
    subtitle: 'Coventry Module — Calculus, Algebra & Stats',
    icon: '∑',
    gradientFrom: '#991b1b',
    gradientTo: '#7f1d1d',
    price: 850, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 8, hours: 24, students: 125,
    level: 'Year 1 · Coventry',
    description: 'High-intensity revision of Coventry Engineering Maths — laser-focused on the topics that actually appear on the exam.',
    features: [
      '24h of revision videos',
      'Worked-example library',
      'Past-paper walkthroughs',
      'Formula reference sheets',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Differentiation Rules',
      'Integration Techniques',
      'Linear Algebra',
      'Differential Equations',
      'Statistics & Probability',
    ],
    badge: null,
  },
  {
    id: 'cov-networks',
    universityId: 'coventry',
    title: 'Computer Networks',
    subtitle: 'Coventry Module — TCP/IP, Routing & Protocols',
    icon: '🌐',
    gradientFrom: '#dc2626',
    gradientTo: '#7f1d1d',
    price: 950, oldPrice: 1299, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 10, hours: 28, students: 95,
    level: 'Year 2 · Coventry',
    description: 'Master Coventry Networking — every protocol, every diagram, every typical exam question, all explained clearly.',
    features: [
      '28h of revision videos',
      'Packet-level walkthroughs',
      'Wireshark demos',
      'Past-paper solutions',
      'WhatsApp tutoring access',
    ],
    topics: [
      'OSI Model & TCP/IP',
      'IP Addressing & Subnetting',
      'Routing Protocols',
      'HTTP & Application Layer',
      'Network Security Basics',
    ],
    badge: null,
  },

]

/* ────────────────────────────────────────────────
   3️⃣  FOUNDERS — only 2 founders.
       Replace "Founder Name" with your real name once ready.
   ──────────────────────────────────────────────── */
export const FOUNDERS = [
  {
    id: 'farag',
    name: 'Mohamed Farag',                     // ← replace with your name
    role: 'Co-Founder & CEO',
    subject: 'Mathematics',
    photo: '/founders/farag.jpg',           // ← place your photo here
    initials: 'MF',
    gradientFrom: '#0047AB',
    gradientTo: '#003380',
    bio: 'Co-founder of Nexus 101. On a mission to help every Egyptian university student pass their hardest modules with confidence.',
    quote: '"Every student deserves a clear path to passing — without burning out."',
    achievements: [
      'Co-founded Nexus 101 in 2025',
      'Built the high-intensity revision methodology',
      'Mentored 800+ university students',
      'Specialist in math & physics tutoring',
    ],
    subjects: ['Mathematics', 'Revisions'],
    linkedin: 'https://www.linkedin.com/in/mohamed-farag-209847337/',
    twitter: '#',
  },
  {
    id: 'nagdy',
    name: 'Mohamed Nagdy',
    role: 'Co-Founder & Lead Tutor',
    subject: 'Physics & Computer Science',
    photo: '/founders/nagdy.jpg',
    initials: 'MN',
    gradientFrom: '#003F87',
    gradientTo: '#0066B3',
    bio: 'Co-founder of Nexus 101. Specialist in physics and Computer Science revisions with an obsession for crystal-clear explanations.',
    quote: '"The right revision turns confusion into a passing grade."',
    achievements: [
      'IEEE UH GAF Solid-State Circuits Society Founder and Chairman',
      'Specialist in physics & Computer Science',
      'Designed the Nexus 101 revision curriculum',
      'Tutor to hundreds of UH students',
    ],
    subjects: ['Physics', 'Computer Science', 'Digital Electronics'],
    linkedin: 'https://www.linkedin.com/in/mohamed-nagdy/',
    twitter: '#',
  },
]

/* ────────────────────────────────────────────────
   4️⃣  TEAM — supporting team (designers, ops…).
   ──────────────────────────────────────────────── */
export const TEAM = [
  {
    id: 'yehia',
    name: 'Yehia Adel',
    role: 'Graphic Designer',
    department: 'Brand & Visual Design',
    photo: '/team/yehia.jpg',                 // ← place his photo here
    initials: 'YA',
    gradientFrom: '#f0a500',
    gradientTo: '#d4920a',
    bio: 'The eye behind every visual on Nexus 101 — from the logo and brand identity to course thumbnails. Yehia turns our mission into the brand students recognise.',
  },
  {
    id: 'adam',
    name: 'Adam Helmy',
    role: 'Web Developer',
    department: 'Platform Development & Systems',
    photo: '/team/adam.jpg',
    initials: 'AH',
    gradientFrom: '#0047AB',
    gradientTo: '#1a6fd4',
    bio: 'Web developer focused on building and improving the Nexus 101 platform experience, frontend systems, and scalable educational infrastructure.',
  },
]

/* ────────────────────────────────────────────────
   5️⃣  INSTRUCTORS — the 6 tutors. Replace names,
       subjects and photo paths with your own.
       Photo files go at  public/instructors/<id>.jpg
   ──────────────────────────────────────────────── */
export const INSTRUCTORS = [
  {
    id: 'ins-1',
    name: 'Aya El hady',
    role: 'Mathematics Instructor',
    subject: 'Calculus & Linear Algebra',
    photo: '/instructors/ins-1.jpg',
    initials: 'AE',
    gradientFrom: '#0047AB', gradientTo: '#003380',
    universities: ['Coventry'],
    rating: 4.9, students: 320,
    bio: 'University-level math specialist with 4-GPA in the Module .',
  },
  {
    id: 'ins-2',
    name: 'Dr. Sara Mostafa',
    role: 'Physics Instructor',
    subject: 'Mechanics & Modern Physics',
    photo: '/instructors/ins-2.jpg',
    initials: 'SM',
    gradientFrom: '#7A0019', gradientTo: '#a30024',
    universities: ['BUE', 'GUC'],
    rating: 4.8, students: 245,
    bio: 'Makes the toughest physics concepts feel obvious — students love her diagrams.',
  },
  {
    id: 'ins-3',
    name: 'Eng. Khaled Tarek',
    role: 'Programming Instructor',
    subject: 'Python & C++ Programming',
    photo: '/instructors/ins-3.jpg',
    initials: 'KT',
    gradientFrom: '#0066B3', gradientTo: '#005091',
    universities: ['UH', 'GUC'],
    rating: 4.9, students: 290,
    bio: 'Software engineer turned revisions coach — turns abstract code into intuition.',
  },
  {
    id: 'ins-4',
    name: 'Dr. Mona Salah',
    role: 'CS Instructor',
    subject: 'Algorithms & Data Structures',
    photo: '/instructors/ins-4.jpg',
    initials: 'MS',
    gradientFrom: '#003F87', gradientTo: '#0047AB',
    universities: ['GUC'],
    rating: 4.9, students: 180,
    bio: 'PhD in algorithms. Specialty: making DSA exams feel almost easy.',
  },
  {
    id: 'ins-5',
    name: 'Eng. Tarek Younis',
    role: 'Electronics Instructor',
    subject: 'Digital Electronics & Circuits',
    photo: '/instructors/ins-5.jpg',
    initials: 'TY',
    gradientFrom: '#0047AB', gradientTo: '#1a6fd4',
    universities: ['UH'],
    rating: 4.7, students: 165,
    bio: 'Electronics engineer with a knack for breaking down logic-gate problems.',
  },
  {
    id: 'ins-6',
    name: 'Dr. Layla Ibrahim',
    role: 'Engineering Math Instructor',
    subject: 'Differential Equations & Statistics',
    photo: '/instructors/ins-6.jpg',
    initials: 'LI',
    gradientFrom: '#a30024', gradientTo: '#7A0019',
    universities: ['BUE', 'UH'],
    rating: 4.8, students: 210,
    bio: 'Engineering-math expert who built half of our flagship revision modules.',
  },
]

/* ── Stats shown on homepage ───────────────────── */
export const STATS = [
  { id: 'students', label: 'Students Helped', value: 2000, suffix: '+', description: 'and counting' },
  { id: 'hours', label: 'Revision Hours', value: 500, suffix: '+', description: 'of expert teaching' },
  { id: 'success', label: 'Pass Rate', value: 98, suffix: '%', description: 'students pass their modules' },
  { id: 'universities', label: 'Target Universities', value: 3, suffix: '', description: 'UH · BUE · GUC' },
]

/* ── Contact ──────────────────────────────────── */
export const WHATSAPP_NUMBER = '201223262295'   // ← change to your real number
export const WHATSAPP_TUTOR_NUMBER = '201223262295'   // ← can be the same or a separate tutor line
export const SUPPORT_EMAIL = 'mathsphys101@gmail.com'

/* ── Demo accounts (seed the localStorage DB) ─── */
export const SEED_USERS = [
  {
    email: 'admin@nexus101.com',
    password: 'nexus2025',                 // ← change before going live!
    name: 'Admin',
    isAdmin: true,
    purchases: [],
    registeredAt: '2025-01-01T00:00:00.000Z',
  },
  {
    email: 'demo@student.com',
    password: 'demo123',
    name: 'Demo Student',
    isAdmin: false,
    purchases: [],
    registeredAt: '2025-01-15T00:00:00.000Z',
  },
]
