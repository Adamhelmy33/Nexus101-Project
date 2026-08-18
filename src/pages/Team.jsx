import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import {
  Linkedin, BookOpen, ArrowRight, Star, Award,
  GraduationCap, Palette, Users, Code2, Share2, Instagram,
} from 'lucide-react'
import Avatar from '../components/Avatar'
import { FOUNDERS, TEAM } from '../data/constants'
import { useCatalog } from '../hooks/useCatalog'

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.12 } } }

/* ─── Founder card (full) ─────────────────────── */
function FounderCard({ founder }) {
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -4 }}
      className="rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 transition-shadow hover:shadow-2xl">
      <div className="relative h-64 flex flex-col items-center justify-center p-6 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${founder.gradientFrom}, ${founder.gradientTo})` }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10" />

        <Avatar
          photo={founder.photo}
          initials={founder.initials}
          name={founder.name}
          gradientFrom="rgba(255,255,255,0.2)"
          gradientTo="rgba(255,255,255,0.1)"
          size={150}
          rounded="rounded-full"
          objectPosition="center 20%"
          className="relative z-10 ring-4 ring-white/80 shadow-2xl"
        />
        <div className="flex items-center gap-1 mt-4 relative z-10">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />)}
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-0.5" style={{ fontFamily: 'Playfair Display, serif' }}>
          {founder.name}
        </h3>
        <p className="text-sm font-semibold text-primary mb-1 uppercase tracking-wide">{founder.role}</p>
        <p className="text-xs text-gray-400 mb-4 flex items-center gap-1.5">
          <GraduationCap className="w-3.5 h-3.5" /> {founder.subject}
        </p>

        <blockquote className="text-sm text-gray-600 italic leading-relaxed mb-5 p-4 rounded-xl"
          style={{ background: '#f8faff', borderLeft: `3px solid ${founder.gradientFrom}` }}>
          {founder.quote}
        </blockquote>

        <p className="text-sm text-gray-600 leading-relaxed mb-5">{founder.bio}</p>

        <div className="mb-5">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-primary" /> Highlights
          </p>
          <ul className="space-y-1.5">
            {founder.achievements.map(a => (
              <li key={a} className="flex items-start gap-2 text-xs text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: founder.gradientFrom }} />
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-primary" /> Teaches
          </p>
          <div className="flex flex-wrap gap-2">
            {founder.subjects.map(s => (
              <span key={s} className="text-xs px-3 py-1 rounded-full font-medium text-white"
                style={{ background: `linear-gradient(135deg, ${founder.gradientFrom}, ${founder.gradientTo})` }}>
                {s}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 pt-4" style={{ borderTop: '1px solid #f1f5f9' }}>
          {founder.linkedin && (
            <a href={founder.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
              <Linkedin className="w-3.5 h-3.5" /> LinkedIn
            </a>
          )}
          {founder.instagram && (
            <a href={founder.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-primary/5">
              <Instagram className="w-3.5 h-3.5" /> Instagram
            </a>
          )}
          <Link to="/store" className="ml-auto text-xs font-semibold text-primary hover:text-primary-dark transition-colors flex items-center gap-1">
            See Modules <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Team / designer card ────────────────────── */
function TeamMemberCard({ member }) {
  const roleLower = member.role.toLowerCase()
  const RoleIcon = roleLower.includes('developer') ? Code2
    : roleLower.includes('social') || roleLower.includes('media') ? Share2
      : Palette
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4 }}
      className="rounded-2xl bg-white shadow-md border border-gray-100 flex flex-col transition-shadow hover:shadow-xl"
    >
      {/* ── Compact gradient banner ── */}
      <div
        className="relative h-24 flex-shrink-0 rounded-t-2xl overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${member.gradientFrom}, ${member.gradientTo})` }}
      >
        <div
          className="absolute inset-0 opacity-15"
          style={{
            backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/10" />
      </div>

      {/* ── Body — avatar gently overlapping the banner ── */}
      <div className="relative z-10 px-5 pb-5 pt-0 -mt-12 flex flex-col items-center text-center flex-1">
        <Avatar
          photo={member.photo}
          initials={member.initials}
          name={member.name}
          gradientFrom={member.gradientFrom}
          gradientTo={member.gradientTo}
          size={96}
          rounded="rounded-full"
          objectPosition="center 30%"
          className="mb-3 ring-4 ring-white shadow-xl"
        />
        <h3 className="font-bold text-gray-900 text-base leading-tight" style={{ fontFamily: 'Playfair Display, serif' }}>
          {member.name}
        </h3>
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">
          {member.role}
        </p>
        <p className="text-xs text-gray-400 mb-3">{member.department}</p>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1">{member.bio}</p>

        {/* ── Footer strip ── */}
        <div className="flex items-center justify-center gap-2 text-xs pt-3 border-t border-gray-100 w-full">
          <RoleIcon className="w-3.5 h-3.5 text-primary" />
          <span className="font-semibold text-gray-700">Nexus 101</span>
          <span className="text-gray-300">·</span>
          <span className="text-gray-500">Core Team</span>
        </div>
      </div>
    </motion.div>
  )
}

/* ─── Instructor card (full) ──────────────────── */
function InstructorCard({ ins }) {
  return (
    <motion.div variants={fadeUp}
      whileHover={{ y: -4 }}
      className="rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden flex flex-col transition-shadow hover:shadow-xl">
      <div className="relative h-36 flex items-end p-4 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${ins.gradientFrom}, ${ins.gradientTo})` }}>
        <div className="absolute inset-0 opacity-15"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-white/10" />
        <div className="flex flex-wrap gap-1 relative z-10">
          {ins.universities.map(u => (
            <span key={u} className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md backdrop-blur-sm text-white"
              style={{ background: 'rgba(0,0,0,0.25)' }}>
              {u}
            </span>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-5 -mt-14 flex flex-col items-center text-center">
        <Avatar
          photo={ins.photo}
          initials={ins.initials}
          name={ins.name}
          gradientFrom={ins.gradientFrom}
          gradientTo={ins.gradientTo}
          size={100}
          rounded="rounded-full"
          objectPosition="center 30%"
          className="mb-3 ring-4 ring-white shadow-xl"
        />
        <h3 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
          {ins.name}
        </h3>
        <p className="text-xs font-semibold text-primary uppercase tracking-wider mt-0.5">{ins.role}</p>
        <p className="text-xs text-gray-400 mb-3">{ins.subject}</p>
        <p className="text-sm text-gray-600 leading-relaxed">{ins.bio}</p>
      </div>
    </motion.div>
  )
}

export default function Team() {
  const { instructors, loading } = useCatalog()

  return (
    <div>
      {/* ── Hero ── */}
      <div className="pt-36 sm:pt-28 pb-16 text-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #003380 60%, #0047AB 100%)' }}>
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="relative max-w-3xl mx-auto px-4">
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="text-primary-light font-semibold text-xs sm:text-sm uppercase tracking-widest mb-4">
            The People
          </motion.p>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: 'Playfair Display, serif' }}>
            Meet the Team
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-white/65 text-base sm:text-lg px-2 sm:px-0">
            One founder, Ten instructors, one mission — your university success.
          </motion.p>
        </div>
        <svg className="absolute bottom-0 left-0 right-0" viewBox="0 0 1440 50" fill="none">
          <path d="M0 50L1440 50L1440 20C1200 45 960 55 720 40C480 25 240 10 0 30V50Z" fill="white" />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* ── Founders ── */}
        <section className="mb-20">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Founders</p>
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              The one who started Nexus 101
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="flex justify-center">
            <div className="w-full max-w-sm">
              {FOUNDERS.map(f => <FounderCard key={f.id} founder={f} />)}
            </div>
          </motion.div>
        </section>

        {/* ── Instructors (6) ── */}
        <section className="mb-20">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-12">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
              <Users className="w-4 h-4" /> Instructors
            </p>
            <h2 className="text-3xl font-bold text-gray-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Ten experts. One goal.
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Each instructor specialises in a slice of the curriculum — and they all want one thing: high marks for you.
            </p>
          </motion.div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-36 bg-gray-200" />
                  <div className="p-5 flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-gray-200 -mt-16" />
                    <div className="h-4 w-32 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-100 rounded" />
                    <div className="h-3 w-full bg-gray-100 rounded" />
                    <div className="h-3 w-5/6 bg-gray-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {instructors.map(ins => <InstructorCard key={ins.id} ins={ins} />)}
            </motion.div>
          )}
        </section>

        {/* ── Wider team / designer ── */}
        <section className="mb-20">
          <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-center mb-10">
            <p className="text-primary font-semibold text-sm uppercase tracking-widest mb-3">Wider Team</p>
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
              The talent behind the brand
            </h2>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {TEAM.map(member => <TeamMemberCard key={member.id} member={member} />)}
          </motion.div>
        </section>

        {/* ── Mission strip ── */}
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="rounded-3xl p-10 text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Playfair Display, serif' }}>
              Our Mission
            </h2>
            <p className="text-white/75 text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
              To make high-intensity, world-class university revisions accessible to every Egyptian student —
              no matter which university they attend.
            </p>
            <Link to="/store" className="btn-accent">
              Explore Modules <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
