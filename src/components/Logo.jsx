import { useState } from 'react'

/**
 * Logo — uses /logo/logo-blue.png on light backgrounds and
 * /logo/logo-white.png on dark backgrounds. If the image file
 * is missing, gracefully falls back to a text logo.
 */
export default function Logo({ variant = 'blue', className = '', height = 32 }) {
  const [errored, setErrored] = useState(false)

  const src = variant === 'white' ? '/logo/logo-white.png' : '/logo/logo-blue.png'
  const textColor = variant === 'white' ? '#ffffff' : '#0047AB'

  if (errored) {
    return (
      <span
        className={`font-bold ${className}`}
        style={{ fontFamily: 'Playfair Display, serif', color: textColor, fontSize: height * 0.6 }}
      >
        Nexus <span style={{ color: '#f0a500' }}>101</span>
      </span>
    )
  }

  return (
    <img
      src={src}
      alt="Nexus 101"
      onError={() => setErrored(true)}
      className={className}
      style={{ height, width: 'auto', objectFit: 'contain' }}
    />
  )
}
