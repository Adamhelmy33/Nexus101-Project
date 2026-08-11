import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ShoppingCart, Sparkles,
  Package, Tag, Loader2, PlayCircle,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useCatalog } from '../hooks/useCatalog'

const ITEM_ICONS = { 'test-1': '📝', 'test-2': '📋', final: '🎯' }

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}
const stagger = { show: { transition: { staggerChildren: 0.08 } } }

export default function CourseDetail() {
  const { courseId }  = useParams()
  const { courses, loading: catalogLoading } = useCatalog()

  const [items, setItems]       = useState([])
  const [itemsLoading, setItemsLoading] = useState(true)
  const [freeRevisionUrl, setFreeRevisionUrl] = useState(null)

  const course = courses.find(c => c.id === courseId) ?? null

  /* ── Fetch real course_items from Supabase ── */
  useEffect(() => {
    if (!courseId) return
    setItemsLoading(true)

    async function fetchItems() {
      // Need the UUID of the courses row (slug → id) plus the free revision URL
      const { data: courseRow, error: courseErr } = await supabase
        .from('courses')
        .select('id, free_revision_youtube_url')
        .eq('slug', courseId)
        .maybeSingle()

      if (courseErr || !courseRow) {
        setItems([])
        setItemsLoading(false)
        return
      }

      setFreeRevisionUrl(courseRow.free_revision_youtube_url ?? null)

      const { data, error } = await supabase
        .from('course_items')
        .select('id, slug, title, price_egp, order_index')
        .eq('course_id', courseRow.id)
        .eq('published', true)
        .order('order_index')

      setItems(error ? [] : (data ?? []))
      setItemsLoading(false)
    }

    fetchItems()
  }, [courseId])

  /* ── Loading / not-found guards ── */
  if (catalogLoading || itemsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8faff' }}>
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8faff' }}>
        <div className="text-center">
          <p className="text-gray-500 mb-4">Course not found.</p>
          <Link to="/store" className="btn-primary">← Back to Store</Link>
        </div>
      </div>
    )
  }

  /* ── Bundle logic ── */
  const showBundle    = items.length > 1 && course.bundlePrice != null
  const bundlePrice   = course.bundlePrice
  const itemsTotal    = items.reduce((sum, it) => sum + Number(it.price_egp || 0), 0)
  const bundleSaving  = showBundle ? itemsTotal - bundlePrice : 0
  const bundlePct     = showBundle && itemsTotal > 0 ? Math.round((bundleSaving / itemsTotal) * 100) : 0

  const buyFormUrl    = course.buy_form_url ?? null

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#f8faff' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          to={-1}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        {/* Course hero */}
        <div
          className="rounded-3xl overflow-hidden mb-8 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
        >
          <div className="px-8 py-10 relative">
            <div className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="absolute -right-12 -top-12 w-52 h-52 rounded-full bg-white/10" />
            <div className="relative z-10">
              <span className="text-6xl select-none">{course.icon}</span>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mt-4 mb-2"
                style={{ fontFamily: 'Playfair Display, serif' }}>
                {course.title}
              </h1>
              <p className="text-white/70 text-sm">{course.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Bundle offer */}
        <AnimatePresence>
          {showBundle && (
            <motion.div
              key="bundle"
              variants={fadeUp} initial="hidden" animate="show"
              className="mb-6 rounded-3xl overflow-hidden shadow-md"
              style={{ border: '2px solid #f0a500' }}
            >
              <div className="h-1.5" style={{ background: 'linear-gradient(90deg, #f0a500, #fbbf24)' }} />
              <div className="p-6 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg, #f0a500, #fbbf24)' }}>
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1.5 mb-1 text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#fef3c7', color: '#92400e' }}>
                      <Sparkles className="w-3 h-3" /> Best Value
                    </div>
                    <h2 className="font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                      Complete Bundle — All {items.length} Tests
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Unlock every test for this module in one go.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="text-right">
                    {bundleSaving > 0 && (
                      <p className="text-xs text-gray-400 line-through mb-0.5">
                        {itemsTotal.toLocaleString()} EGP
                      </p>
                    )}
                    <p className="text-2xl font-bold text-gray-900">{bundlePrice?.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-widest">EGP</p>
                    {bundleSaving > 0 && (
                      <p className="text-xs font-bold mt-1" style={{ color: '#16a34a' }}>
                        Save {bundleSaving.toLocaleString()} EGP
                        {bundlePct > 0 && ` · ${bundlePct}% off`}
                      </p>
                    )}
                  </div>
                  {buyFormUrl ? (
                    <a
                      href={buyFormUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.03] shadow-md"
                      style={{ background: 'linear-gradient(135deg, #f0a500, #d97706)' }}
                    >
                      <ShoppingCart className="w-4 h-4" /> Buy Bundle
                    </a>
                  ) : (
                    <button
                      disabled
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all shadow-md opacity-50 cursor-not-allowed"
                      style={{ background: '#e5e7eb', color: '#6b7280' }}
                    >
                      <ShoppingCart className="w-4 h-4" /> Coming soon
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Free Revision card ── */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-6">
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-5 p-6">
              {/* Icon */}
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 select-none"
                style={{ background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)' }}
              >
                🎬
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-bold text-gray-900 text-base">Free Revision Session</p>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-emerald-100 text-emerald-700">
                    Free
                  </span>
                </div>
                <p className="text-xs text-gray-400">Preview — watch before you buy</p>
              </div>

              {/* Action */}
              <div className="flex-shrink-0">
                {freeRevisionUrl ? (
                  <a
                    href={freeRevisionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.04] shadow"
                    style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)' }}
                  >
                    <PlayCircle className="w-4 h-4" /> Watch Free
                  </a>
                ) : (
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow opacity-50 cursor-not-allowed"
                    style={{ background: '#e5e7eb', color: '#6b7280' }}
                  >
                    <PlayCircle className="w-4 h-4" /> Coming soon
                  </button>
                )}
              </div>
            </div>

            {/* Green accent bar */}
            <div className="h-0.5" style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }} />
          </div>
        </motion.div>

        {/* Item cards */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: 'Playfair Display, serif' }}>
            {items.length === 1 ? 'Available Test' : `Individual Tests (${items.length})`}
          </h2>
          {showBundle && (
            <p className="text-xs text-gray-400">Or buy each test individually</p>
          )}
        </div>

        {items.length === 0 ? (
          <div className="rounded-3xl bg-white shadow-md border border-gray-100 py-16 px-6 text-center">
            <div className="text-5xl mb-4 select-none">🔜</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
              Not available yet
            </h3>
            <p className="text-gray-500 text-sm">Tests for this module are being prepared — check back soon.</p>
          </div>
        ) : (
          <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-4">
            {items.map(item => {
              return (
                <motion.div key={item.id} variants={fadeUp}
                  className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
                  <div className="flex items-center gap-5 p-6">
                    {/* Icon */}
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 select-none"
                      style={{ background: `linear-gradient(135deg, ${course.gradientFrom}22, ${course.gradientTo}33)` }}
                    >
                      {ITEM_ICONS[item.slug] ?? '📄'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-base">{item.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5 capitalize">{item.slug.replace('-', ' ')}</p>
                    </div>

                    {/* Price + action */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{Number(item.price_egp).toLocaleString()}</p>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1 justify-end">
                          <Tag className="w-2.5 h-2.5" /> EGP
                        </p>
                      </div>
                      {buyFormUrl ? (
                        <a
                          href={buyFormUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.04] shadow"
                          style={{ background: `linear-gradient(135deg, ${course.gradientFrom}, ${course.gradientTo})` }}
                        >
                          <ShoppingCart className="w-4 h-4" /> Buy
                        </a>
                      ) : (
                        <button
                          disabled
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow opacity-50 cursor-not-allowed"
                          style={{ background: '#e5e7eb', color: '#6b7280' }}
                        >
                          <ShoppingCart className="w-4 h-4" /> Coming soon
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Colour accent bar */}
                  <div className="h-0.5"
                    style={{ background: `linear-gradient(90deg, ${course.gradientFrom}, ${course.gradientTo})` }}
                  />
                </motion.div>
              )
            })}
          </motion.div>
        )}

      </div>
    </div>
  )
}
