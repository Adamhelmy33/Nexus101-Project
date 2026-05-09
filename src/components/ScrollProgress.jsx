import { motion, useScroll, useSpring } from 'framer-motion'

/**
 * ScrollProgress — a thin progress bar at the top of the page that fills
 * as the user scrolls. Sits above the navbar.
 */
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 })

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: '0% 50%',
        background: 'linear-gradient(90deg, #0047AB 0%, #1a6fd4 50%, #f0a500 100%)',
      }}
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] pointer-events-none"
      aria-hidden
    />
  )
}
