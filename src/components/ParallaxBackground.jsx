import { useState } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

/**
 * ParallaxBackground
 * ──────────────────
 * Sits BEHIND every page section as the user scrolls.
 *  • Three soft geometric blobs that drift at different parallax speeds
 *  • A large blue Nexus 101 logo watermark that fades in after the hero
 *    and slowly drifts upward
 *
 * Has `pointer-events-none` so it never blocks any clicks.
 */
export default function ParallaxBackground() {
  const { scrollY } = useScroll()
  const [logoErrored, setLogoErrored] = useState(false)

  /* Three geometric shapes — different parallax speeds */
  const y1 = useTransform(scrollY, [0, 4000], [0, -1200])
  const y2 = useTransform(scrollY, [0, 4000], [0, -700])
  const y3 = useTransform(scrollY, [0, 4000], [0, -300])

  /* Subtle scroll-driven rotation */
  const rotate1 = useTransform(scrollY, [0, 4000], [0, 60])
  const rotate2 = useTransform(scrollY, [0, 4000], [0, -45])

  /* Blue logo watermark — fades in past hero, fades out near footer */
  const logoOpacity = useTransform(scrollY, [600, 1100, 4500, 5200], [0, 0.05, 0.05, 0])
  const logoY       = useTransform(scrollY, [0, 4000], [0, -500])
  const logoScale   = useTransform(scrollY, [600, 2000], [0.85, 1.05])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

      {/* ── Geometric blobs ── */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute -top-40 -right-40 w-[36rem] h-[36rem] rounded-full"
        aria-hidden
      >
        <div className="w-full h-full rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(0,71,171,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </motion.div>

      <motion.div
        style={{ y: y2, rotate: rotate2 }}
        className="absolute top-1/3 -left-32 w-[28rem] h-[28rem] rounded-full"
        aria-hidden
      >
        <div className="w-full h-full rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(240,165,0,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </motion.div>

      <motion.div
        style={{ y: y3 }}
        className="absolute bottom-1/4 right-1/4 w-[24rem] h-[24rem] rounded-full"
        aria-hidden
      >
        <div className="w-full h-full rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(26,111,212,0.10) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </motion.div>

      {/* ── Blue logo watermark ── */}
      {!logoErrored ? (
        <motion.img
          src="/logo/logo-blue.png"
          alt=""
          aria-hidden
          onError={() => setLogoErrored(true)}
          style={{ opacity: logoOpacity, y: logoY, scale: logoScale, maxWidth: '85vw', width: '900px' }}
          className="absolute top-[80vh] left-1/2 -translate-x-1/2 select-none"
          draggable={false}
        />
      ) : (
        /* Fallback: text watermark if logo file isn't there yet */
        <motion.div
          aria-hidden
          style={{ opacity: logoOpacity, y: logoY, scale: logoScale }}
          className="absolute top-[80vh] left-1/2 -translate-x-1/2 text-center select-none"
        >
          <span
            className="font-bold tracking-tight"
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: 'clamp(8rem, 22vw, 22rem)',
              color: '#0047AB',
              lineHeight: 1,
            }}
          >
            Nexus<span style={{ color: '#f0a500' }}>101</span>
          </span>
        </motion.div>
      )}
    </div>
  )
}
