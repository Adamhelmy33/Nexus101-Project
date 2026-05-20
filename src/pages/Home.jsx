import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, useInView, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, ShoppingCart, Users, Clock, Trophy, Layers,
  CheckCircle2, ChevronRight, Star, Linkedin, Twitter,
  Zap, Target, Award, GraduationCap, Sparkles,
} from 'lucide-react'
import AnimatedCounter from '../components/AnimatedCounter'
import Avatar from '../components/Avatar'
import ParallaxBackground from '../components/ParallaxBackground'
import WhatsAppTutorButton from '../components/WhatsAppTutorButton'
import { FOUNDERS, STATS } from '../data/constants'
import { useCatalog } from '../hooks/useCatalog'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.12 } } }

function Section({ children, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'} className={className}>
      {children}
    </motion.div>
  )
}

const STAT_ICONS = {
  students:     <Users className="w-7 h-7" />,
  hours:        <Clock className="w-7 h-7" />,
  success:      <Trophy className="w-7 h-7" />,
  universities: <GraduationCap className="w-7 h-7" />,
}

/* ─── University card ─────────────────────────── */
function UniversityCard({ uni, idx, courses }) {
  const moduleCount = courses.filter(c => c.universityId === uni.id).length
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -6 }}
      className="group rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100 transition-shadow hover:shadow-2xl"
    >
      <div
        className="h-48 relative overflow-hidden flex flex-col items-center justify-center p-6"
        style={{ background: `linear-gradient(135deg, ${uni.color}, ${uni.color}dd)` }}
      >
        <div className="absolute inset-0 opacity-15"
             style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-white/10" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full" style={{ background: `${uni.accentColor}25` }} />

        <div className="relative z-10 text-center">
          <div className="text-6xl mb-2 select-none">{uni.icon}</div>
          <p className="text-white/70 text-xs font-mono tracking-widest uppercase mb-1">{uni.shortName}</p>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {uni.name}
        </h3>
        <p className="text-xs text-gray-400 mb-4">{uni.location}</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-5">{uni.description}</p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className="flex items-center gap-1.5 text-xs text-gray-500">
            <Layers className="w-3.5 h-3.5 text-primary" /> {moduleCount} modules
          </span>
          <Link to={`/store?uni=${uni.id}`} className="text-sm font-semibold text-primary group-hover:gap-2 flex items-center gap-1 transition-all">
            View modules <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Instructor card (mini) ──────────────────── */
function InstructorMiniCard({ ins }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="rounded-2xl bg-white shadow-md border border-gray-100 p-5 flex flex-col items-center text-center transition-shadow hover:shadow-xl"
    >
      <Avatar
        photo={ins.photo}
        initials={ins.initials}
        name={ins.name}
        gradientFrom={ins.gradientFrom}
        gradientTo={ins.gradientTo}
        size={80}
        rounded="rounded-full"
        className="mb-3"
      />
      <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Playfair Display, serif' }}>
        {ins.name}
      </p>
      <p className="text-xs font-semibold text-primary uppercase tracking-wide mt-0.5">{ins.role}</p>
      <p className="text-xs text-gray-400 mt-1 mb-3">{ins.subject}</p>

      <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
        <span className="font-semibold text-gray-700">{ins.rating}</span>
        <span className="text-gray-400">· {ins.students.toLocaleString()} students</span>
      </div>

      <div className="flex flex-wrap gap-1 mt-3 justify-center">
        {ins.universities.map(u => (
          <span key={u} className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-primary/10 text-primary">{u}</span>
        ))}
      </div>
    </motion.div>
  )
}

/* ─── Founder card (Home) ─────────────────────── */
function FounderHero({ founder }) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 transition-shadow hover:shadow-2xl"
    >
      <div className="relative h-56 sm:h-64 overflow-hidden flex items-center justify-center"
           style={{ background: `linear-gradient(135deg, ${founder.gradientFrom}, ${founder.gradientTo})` }}>
        <div className="absolute inset-0 opacity-15"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <Avatar
          photo={founder.photo}
          initials={founder.initials}
          name={founder.name}
          gradientFrom="rgba(255,255,255,0.2)"
          gradientTo="rgba(255,255,255,0.1)"
          size={140}
          rounded="rounded-full"
          className="relative z-10"
        />
      </div>

      <div className="p-6">
        <h3 className="font-bold text-gray-900 text-xl mb-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>
          {founder.name}
        </h3>
        <p className="text-xs font-semibold text-primary mb-4 uppercase tracking-wider">{founder.role}</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4">{founder.bio}</p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {founder.subjects.map(s => (
            <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{s}</span>
          ))}
        </div>

        <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
          <a href={founder.linkedin} className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-blue-50">
            <Linkedin className="w-4 h-4" />
          </a>
          <a href={founder.twitter} className="text-gray-400 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-blue-50">
            <Twitter className="w-4 h-4" />
          </a>
          <Link to="/team" className="ml-auto text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all">
            Read more <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════ */
export default function Home() {
  const { courses, universities, instructors, loading } = useCatalog()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY     = useTransform(scrollYProgress, [0, 1], [0, 200])
  const heroFade  = useTransform(scrollYProgress, [0, 1], [1, 0])

  return (
    <div className="relative">
      <ParallaxBackground />

      <div className="relative" style={{ zIndex: 1 }}>

        {/* ────── HERO ────── */}
        <section
          ref={heroRef}
          className="relative isolate flex flex-col justify-center overflow-hidden"
          style={{
            background: 'radial-gradient(ellipse at 55% 45%, #0d1e3d 0%, #06101f 100%)',
            minHeight: '100svh',
          }}
        >
          {/* ── Background logo ── */}
          <img
            src="/logo/logo-white.png"
            alt=""
            aria-hidden="true"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[140%] sm:max-w-full opacity-[0.13] blur-[2px] object-contain pointer-events-none select-none"
            style={{ zIndex: -1 }}
          />

          <motion.div style={{ y: heroY, opacity: heroFade }} className="absolute inset-0 pointer-events-none select-none">
            <div className="animate-float absolute top-20 right-4 sm:right-16 w-40 sm:w-64 h-40 sm:h-64 rounded-full opacity-10"
                 style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
            <div className="animate-float-rev absolute bottom-32 left-4 sm:left-10 w-32 sm:w-48 h-32 sm:h-48 rounded-full opacity-10"
                 style={{ background: 'radial-gradient(circle, #f0a500, transparent)' }} />
            <div className="animate-float-slow absolute top-1/2 left-1/3 w-60 sm:w-96 h-60 sm:h-96 rounded-full opacity-5"
                 style={{ background: 'radial-gradient(circle, #ffffff, transparent)' }} />
            <div className="absolute inset-0 opacity-5"
                 style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          </motion.div>

          <div className="relative w-full max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 py-24 sm:py-28 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.6 }}
                          className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 sm:mb-8">
                <Zap className="w-3.5 h-3.5 text-yellow-300" />
                <span className="text-white/90 text-xs sm:text-sm font-medium">High-Intensity University Revisions · Lifetime Access</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.7 }}
                className="font-bold text-white mb-5 sm:mb-7 md:mb-8 text-balance"
                style={{ fontSize: 'clamp(2rem, 7vw, 4.5rem)', lineHeight: 1.15 }}
              >
                Pass Your <span style={{ color: '#f0a500' }}>University</span> Modules.
                <br />Excel in your exams.
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35, duration: 0.6 }}
                        className="text-white/75 max-w-2xl mx-auto mb-8 sm:mb-10 md:mb-12 leading-relaxed"
                        style={{ fontSize: 'clamp(0.95rem, 2.5vw, 1.25rem)' }}>
                Focused, high-intensity revision packages for <strong className="text-white">UH, BUE, and GUC</strong> modules —
                designed to help you pass and achieve the highest marks.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }}
                          className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-2 sm:px-0">
                <Link to="/store" className="btn-accent text-base px-7 py-3.5 w-full sm:w-auto justify-center">
                  <ShoppingCart className="w-4 h-4" /> Browse Modules
                </Link>
                <WhatsAppTutorButton size="lg" message="Hi Nexus 101! I'm interested in your revision modules." variant="outline" />
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.75, duration: 0.6 }}
                          className="mt-10 sm:mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-white/60 text-sm">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {['MN', 'AH', 'SM', 'KT'].map((i, idx) => (
                      <div key={idx} className="w-7 h-7 rounded-full border-2 border-white/30 flex items-center justify-center text-xs font-semibold text-white"
                           style={{ background: `hsl(${220 + idx * 30}, 70%, 45%)` }}>
                        {i}
                      </div>
                    ))}
                  </div>
                  <span>2,000+ students helped</span>
                </div>
                <span className="hidden sm:block opacity-40">|</span>
                <div className="flex items-center gap-1.5">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}
                  <span>4.9/5 average rating</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 80L60 69C120 58 240 36 360 30C480 24 600 36 720 44C840 52 960 56 1080 52C1200 48 1320 36 1380 30L1440 24V80H0Z" fill="white" />
            </svg>
          </div>
        </section>

        {/* ────── STATS BENTO ────── */}
        <section className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Section>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Our Impact</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Numbers that <span className="gradient-text">speak for themselves</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Every statistic here represents a real student who chose to invest in their grades.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
                {STATS.map((stat, i) => (
                  <motion.div key={stat.id} variants={fadeUp}
                    className={`card-hover rounded-2xl p-6 relative overflow-hidden ${i === 0 ? 'sm:col-span-2 lg:col-span-2' : ''}`}
                    style={{
                      background: i === 0 ? 'linear-gradient(135deg, #0047AB, #1a6fd4)'
                               : i === 2 ? 'linear-gradient(135deg, #0a1628, #003380)' : '#f8faff',
                      border: i === 1 || i === 3 ? '1px solid #e2ecf9' : 'none',
                    }}
                  >
                    {(i === 0 || i === 2) && (
                      <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-10" style={{ background: 'white' }} />
                    )}
                    <div className="relative z-10">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        i === 0 || i === 2 ? 'text-white bg-white/15' : 'text-primary bg-primary/10'
                      }`}>
                        {STAT_ICONS[stat.id]}
                      </div>
                      <div className={`text-5xl font-bold mb-1 ${i === 0 || i === 2 ? 'text-white' : 'text-primary-dark'}`}>
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} duration={1800} />
                      </div>
                      <div className={`text-lg font-semibold mb-1 ${i === 0 || i === 2 ? 'text-white' : 'text-gray-800'}`}>
                        {stat.label}
                      </div>
                      <div className={`text-sm ${i === 0 || i === 2 ? 'text-white/65' : 'text-gray-400'}`}>
                        {stat.description}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <motion.div variants={fadeUp} className="rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-3 gap-6"
                          style={{ background: '#f8faff', border: '1px solid #e2ecf9' }}>
                {[
                  { icon: <Target className="w-6 h-6 text-primary" />, title: 'Targeted Revisions',  desc: 'Every module is built around your university\'s actual syllabus.' },
                  { icon: <Zap className="w-6 h-6 text-primary" />,    title: 'High-Intensity',     desc: 'Tight, focused content — no fluff, no filler, only what\'s on the exam.' },
                  { icon: <Trophy className="w-6 h-6 text-primary" />, title: 'Built to Pass',      desc: 'Designed by tutors who know what high-mark answers look like.' },
                ].map(item => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-white shadow-sm">{item.icon}</div>
                    <div>
                      <p className="font-semibold text-gray-900 mb-0.5">{item.title}</p>
                      <p className="text-sm text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </Section>
          </div>
        </section>

        {/* ────── 3 TARGET UNIVERSITIES ────── */}
        <section className="py-20 relative" style={{ background: '#f8faff' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Section>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                  <GraduationCap className="w-4 h-4" /> 3 Target Universities
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Built for your university,<br />
                  <span className="gradient-text">aligned with your modules.</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Every revision is mapped to the exact syllabus of your university — no wasted hours.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading
                  ? [...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-3xl overflow-hidden bg-white shadow-md border border-gray-100 animate-pulse">
                        <div className="h-48 bg-gray-200" />
                        <div className="p-6 space-y-3">
                          <div className="h-5 bg-gray-200 rounded w-3/4" />
                          <div className="h-3 bg-gray-100 rounded w-1/2" />
                          <div className="h-3 bg-gray-100 rounded w-full" />
                          <div className="h-3 bg-gray-100 rounded w-5/6" />
                        </div>
                      </div>
                    ))
                  : universities.map((uni, idx) => <UniversityCard key={uni.id} uni={uni} idx={idx} courses={courses} />)
                }
              </div>

              <motion.div variants={fadeUp} className="text-center mt-10">
                <Link to="/store" className="btn-primary">
                  Browse all modules <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </Section>
          </div>
        </section>

        {/* ────── INSTRUCTORS ────── */}
        <section className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Section>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
                  <Award className="w-4 h-4" /> Our Instructors
                </p>
                <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Learn from <span className="gradient-text">expert tutors</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Six specialists. Each obsessed with one thing: getting you a passing grade.
                </p>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                {loading
                  ? [...Array(6)].map((_, i) => (
                      <div key={i} className="rounded-2xl bg-white shadow-md border border-gray-100 p-5 flex flex-col items-center animate-pulse">
                        <div className="w-20 h-20 rounded-full bg-gray-200 mb-3" />
                        <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
                        <div className="h-3 bg-gray-100 rounded w-16 mb-1" />
                        <div className="h-3 bg-gray-100 rounded w-20" />
                      </div>
                    ))
                  : instructors.map(ins => <InstructorMiniCard key={ins.id} ins={ins} />)
                }
              </div>

              <motion.div variants={fadeUp} className="text-center mt-10">
                <Link to="/team" className="btn-primary">
                  Meet the Team <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </Section>
          </div>
        </section>

        {/* ────── FOUNDERS ────── */}
        <section className="py-20 relative" style={{ background: '#f8faff' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <Section>
              <motion.div variants={fadeUp} className="text-center mb-12">
                <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Our Founders</p>
                <h2 className="text-4xl font-bold text-gray-900 mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
                  Built by Egyptian educators,<br />
                  <span className="gradient-text">for university students.</span>
                </h2>
                <p className="text-gray-500 text-lg max-w-xl mx-auto">
                  Two passionate founders behind every video and revision sheet.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                {FOUNDERS.map((f) => <FounderHero key={f.id} founder={f} />)}
              </div>
            </Section>
          </div>
        </section>

        {/* ────── ABOUT ────── */}
        <section className="py-20 bg-white relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Section className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
              <motion.div variants={fadeUp} className="relative">
                <div className="rounded-3xl overflow-hidden aspect-square flex items-center justify-center relative"
                     style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
                  <div className="glass rounded-2xl p-8 text-center">
                    <div className="text-7xl mb-4 select-none">🎯</div>
                    <p className="text-white font-bold text-xl mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>Nexus 101</p>
                    <p className="text-white/70 text-sm">University Revision Specialists</p>
                    <div className="mt-6 grid grid-cols-2 gap-3">
                      {[
                        { label: 'Founded', value: '2023' },
                        { label: 'Founders', value: '2' },
                        { label: 'Universities', value: '3' },
                        { label: 'Rating', value: '4.9 ★' },
                      ].map(item => (
                        <div key={item.label} className="glass rounded-xl p-3 text-center">
                          <div className="text-white font-bold text-lg">{item.value}</div>
                          <div className="text-white/60 text-xs">{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="absolute -top-4 -right-4 glass-light rounded-2xl px-4 py-2.5 shadow-xl"
                       style={{ border: '1px solid rgba(0,71,171,0.1)' }}>
                    <p className="text-primary font-bold text-lg">98%</p>
                    <p className="text-gray-500 text-xs">Pass Rate</p>
                  </div>
                  <div className="absolute -bottom-4 -left-4 glass-light rounded-2xl px-4 py-2.5 shadow-xl"
                       style={{ border: '1px solid rgba(0,71,171,0.1)' }}>
                    <p className="text-primary font-bold text-lg">2000+</p>
                    <p className="text-gray-500 text-xs">Students</p>
                  </div>
                </div>
              </motion.div>

              <div>
                <motion.p variants={fadeUp} className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">
                  Why Nexus 101
                </motion.p>
                <motion.h2 variants={fadeUp} className="text-4xl font-bold text-gray-900 mb-6 leading-tight"
                           style={{ fontFamily: 'Playfair Display, serif' }}>
                  We exist to help you <span className="gradient-text">pass and excel.</span>
                </motion.h2>
                <motion.p variants={fadeUp} className="text-gray-600 text-lg leading-relaxed mb-6">
                  University modules can feel overwhelming — endless slides, dense textbooks, and exam pressure.
                  Nexus 101 strips that down to <strong>only what matters</strong> for your exam.
                </motion.p>
                <motion.p variants={fadeUp} className="text-gray-600 leading-relaxed mb-8">
                  Our high-intensity revision packages give you tightly-focused content, past-paper walkthroughs,
                  PDF revision sheets, and direct WhatsApp tutoring — so you walk into the exam confident and prepared.
                </motion.p>

                <motion.ul variants={stagger} className="space-y-3 mb-8">
                  {[
                    'High-intensity, exam-targeted revisions',
                    'Aligned to UH, BUE, and GUC syllabi',
                    'WhatsApp tutoring with real instructors',
                    'Lifetime access — pay once, watch forever',
                  ].map(point => (
                    <motion.li key={point} variants={fadeUp} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{point}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                  <Link to="/store" className="btn-primary text-sm">
                    See modules <ChevronRight className="w-4 h-4" />
                  </Link>
                  <WhatsAppTutorButton variant="outline" size="md" message="Hi Nexus 101! I want to know more about your revision packages." />
                </motion.div>
              </div>
            </Section>
          </div>
        </section>

        {/* ────── CTA ────── */}
        <section className="hero-gradient py-20 relative">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Section>
              <motion.p variants={fadeUp} className="text-white/70 font-semibold text-sm uppercase tracking-widest mb-4">
                <Sparkles className="w-3 h-3 inline mr-1" /> Ready to start?
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-4xl sm:text-5xl font-bold text-white mb-6"
                         style={{ fontFamily: 'Playfair Display, serif' }}>
                Join 2,000+ students<br />
                <span style={{ color: '#f0a500' }}>passing their modules.</span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-white/70 text-lg mb-10 max-w-xl mx-auto">
                One-time payment. Lifetime access. 7-day money-back guarantee.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/store" className="btn-accent text-base px-8 py-4">
                  <ShoppingCart className="w-5 h-5" /> Buy a Module
                </Link>
                <Link to="/contact" className="btn-outline text-base px-8 py-4">
                  Talk to us <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </Section>
          </div>
        </section>
      </div>
    </div>
  )
}
