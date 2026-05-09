import { useEffect, useRef, useState } from 'react'
import { useInView, useMotionValue, useSpring } from 'framer-motion'

export default function AnimatedCounter({ value, suffix = '', duration = 2000 }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const [displayed, setDisplayed] = useState(0)

  const motionValue = useMotionValue(0)
  const springValue = useSpring(motionValue, {
    duration,
    bounce: 0,
  })

  useEffect(() => {
    if (inView) motionValue.set(value)
  }, [inView, value, motionValue])

  useEffect(() => {
    return springValue.on('change', v => setDisplayed(Math.round(v)))
  }, [springValue])

  return (
    <span ref={ref}>
      {displayed.toLocaleString()}
      {suffix}
    </span>
  )
}
