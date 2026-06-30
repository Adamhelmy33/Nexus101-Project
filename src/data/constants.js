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
    color: '#003F87',
    accentColor: '#FFD300',
    location: 'Hatfield · Cairo Hub',
    icon: '🎓',
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

  {
    id: 'uh-physics',
    universityId: 'uh',
    title: 'Physics',
    subtitle: 'UH Module — Mechanics, Waves & Modern Physics',
    icon: '⚛️',
    gradientFrom: '#1a6fd4',
    gradientTo: '#003F87',
    price: 899, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 8, hours: 24, students: 0,
    level: 'Year 1 · UH',
    description: 'High-intensity revision of UH Physics — every formula, every exam-style problem, all explained clearly by your dedicated instructor.',
    features: [
      '24h of focused revision videos',
      'Past-paper walkthroughs',
      'PDF revision summaries',
      'Watch unlimited replays',
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
    id: 'uh-bio-science',
    universityId: 'uh',
    title: 'Biological Science',
    subtitle: 'UH Module — Cell Biology, Genetics & Physiology',
    icon: '🧬',
    gradientFrom: '#0047AB',
    gradientTo: '#1a6fd4',
    price: 899, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 7, hours: 22, students: 0,
    level: 'Year 1 · UH',
    description: 'Targeted revision of UH Biological Science — laser-focused on the topics that always land in the final exam.',
    features: [
      '22h of focused revision videos',
      'Past-paper walkthroughs',
      'PDF revision summaries',
      'Watch unlimited replays',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Cell Structure & Function',
      'Genetics & DNA',
      'Human Physiology',
      'Ecology & Evolution',
      'Molecular Biology',
    ],
    badge: null,
  },
  {
    id: 'uh-design-mech',
    universityId: 'uh',
    title: 'Introduction to Design & Mechanical Science',
    subtitle: 'UH Module — Engineering Design Principles & Mechanics',
    icon: '⚙️',
    gradientFrom: '#003380',
    gradientTo: '#0066B3',
    price: 899, oldPrice: 1199, currency: 'EGP',
    duration: 'Lifetime access',
    modules: 8, hours: 24, students: 0,
    level: 'Year 1 · UH',
    description: 'Clear, exam-ready revision of UH Design & Mechanical Science — from statics and stress analysis to the design process itself.',
    features: [
      '24h of focused revision videos',
      'Worked-example library',
      'Past-paper solutions',
      'Formula reference sheets',
      'WhatsApp tutoring access',
    ],
    topics: [
      'Statics & Equilibrium',
      'Stress & Strain',
      'Material Properties',
      'Engineering Design Process',
      'Mechanical Systems',
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
    photo: null,
    initials: 'AH',
    gradientFrom: '#0047AB',
    gradientTo: '#1a6fd4',
    bio: 'Web developer focused on building and improving the Nexus 101 platform experience, frontend systems, and scalable educational infrastructure.',
  },
]

/* ────────────────────────────────────────────────
   5️⃣  INSTRUCTORS — 5 UH instructors (ins-7–11).
       Photo files go at  public/instructors/<id>.jpg
   ──────────────────────────────────────────────── */
export const INSTRUCTORS = [
  {
    id: 'ins-7',
    name: 'Judy Ayman',
    role: 'Physics Instructor',
    subject: 'Physics',
    photo: '/instructors/ins-7.jpg',
    initials: 'JA',
    gradientFrom: '#0047AB', gradientTo: '#003380',
    universities: ['UH'],
    rating: 4.9, students: 0,
    bio: 'Physics specialist dedicated to making UH Physics exams straightforward and achievable.',
  },
  {
    id: 'ins-8',
    name: 'Ahmed Essam El-Din',
    role: 'Mathematics Instructor',
    subject: 'Engineering Mathematics',
    photo: null,
    initials: 'AE',
    gradientFrom: '#003F87', gradientTo: '#0047AB',
    universities: ['UH'],
    rating: null, students: null,
    bio: 'Mechatronics Engineering student at the University of Hertfordshire, national gold medalist in mathematics, and experienced coding instructor with a 90% student completion rate.',
  },
  {
    id: 'ins-9',
    name: 'Youssif Ahmed Saqr',
    role: 'Digital Electronics & Programming Instructor',
    subject: 'Digital Electronics & Computer Programming',
    photo: null,
    initials: 'YS',
    gradientFrom: '#0066B3', gradientTo: '#005091',
    universities: ['UH'],
    rating: null, students: null,
    bio: 'Experienced educator with two years as an English teaching assistant. Focuses on bringing clarity and efficiency into the classroom through hands-on solutions and concise notes.',
  },
  {
    id: 'ins-10',
    name: 'Ahmed Alaa',
    role: 'Biological Science Instructor',
    subject: 'Biological Science',
    photo: '/instructors/ins-10.jpg',
    initials: 'AA',
    gradientFrom: '#1a6fd4', gradientTo: '#003380',
    universities: ['UH'],
    rating: 4.9, students: 0,
    bio: 'Biology specialist focused on making UH Biological Science exams manageable and high-scoring.',
  },
  {
    id: 'ins-11',
    name: 'Abdelrahman Saleh',
    role: 'Design & Mechanical Science Instructor',
    subject: 'Introduction to Design & Mechanical Science',
    photo: '/instructors/ins-11.jpg',
    initials: 'AS',
    gradientFrom: '#003380', gradientTo: '#0066B3',
    universities: ['UH'],
    rating: 4.9, students: 0,
    bio: 'Mechanical engineering expert who breaks down design principles into exam-ready clarity.',
  },
]

/* ── Stats shown on homepage ───────────────────── */
export const STATS = [
  { id: 'students', label: 'Students Helped', value: 2000, suffix: '+', description: 'and counting' },
  { id: 'hours', label: 'Revision Hours', value: 500, suffix: '+', description: 'of expert teaching' },
  { id: 'success', label: 'Pass Rate', value: 98, suffix: '%', description: 'students pass their modules' },
  { id: 'universities', label: 'Target University', value: 1, suffix: '', description: 'University of Hertfordshire' },
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
