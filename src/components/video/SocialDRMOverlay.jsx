import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

/**
 * SocialDRMOverlay
 * ─────────────────
 * Drifts the student's email + name across the video at semi-transparent
 * opacity, repositioning every few seconds. Discourages screen recording
 * because the recording itself is now identifiable.
 *
 * Pure DOM overlay → must be rendered ON TOP of the <video> element
 * (impossible with iframe — that's why we use HLS.js).
 */
export default function SocialDRMOverlay({ email, name, intervalMs = 5000 }) {
  const [pos, setPos] = useState({ x: 30, y: 25, corner: 'tl' })

  useEffect(() => {
    const tick = () => {
      const corners = ['tl', 'tr', 'bl', 'br']
      const corner = corners[Math.floor(Math.random() * corners.length)]
      const xJitter = Math.random() * 20
      const yJitter = Math.random() * 20
      setPos({
        x: corner === 'tr' || corner === 'br' ? 70 + xJitter * 0.3 : 5 + xJitter,
        y: corner === 'bl' || corner === 'br' ? 70 + yJitter * 0.3 : 5 + yJitter,
        corner,
      })
    }
    tick()
    const id = setInterval(tick, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return (
    <motion.div
      animate={{ left: `${pos.x}%`, top: `${pos.y}%`, opacity: [0.18, 0.28, 0.18] }}
      transition={{ left: { duration: 2.5, ease: 'easeInOut' }, top: { duration: 2.5, ease: 'easeInOut' }, opacity: { duration: 3, repeat: Infinity } }}
      className="absolute pointer-events-none select-none z-30 text-white text-xs font-mono whitespace-nowrap"
      style={{ userSelect: 'none', textShadow: '0 1px 4px rgba(0,0,0,0.7)' }}
      aria-hidden
    >
      <div className="px-2 py-1 rounded backdrop-blur-sm" style={{ background: 'rgba(0,0,0,0.15)' }}>
        {name && <span className="font-semibold mr-2">{name}</span>}
        <span>{email}</span>
        <span className="ml-2 opacity-60">· Nexus 101</span>
      </div>
    </motion.div>
  )
}
