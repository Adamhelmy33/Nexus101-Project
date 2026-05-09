import { useState } from 'react'

/**
 * Avatar — shows a photo if available, otherwise shows
 * the person's initials inside a gradient card.
 */
export default function Avatar({
  photo, initials, name = '',
  gradientFrom = '#0047AB', gradientTo = '#1a6fd4',
  size = 96, className = '', rounded = 'rounded-2xl',
  border = true,
}) {
  const [errored, setErrored] = useState(false)

  const showInitials = errored || !photo

  return (
    <div
      className={`${rounded} overflow-hidden flex items-center justify-center text-white font-bold ${className}`}
      style={{
        width: size, height: size,
        background: showInitials
          ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
          : '#1a6fd4',
        fontSize: size * 0.32,
        fontFamily: 'Playfair Display, serif',
        border: border ? '3px solid rgba(255,255,255,0.4)' : 'none',
        boxShadow: '0 8px 24px rgba(0,71,171,0.18)',
        flexShrink: 0,
      }}
      title={name}
    >
      {showInitials ? (
        initials
      ) : (
        <img
          src={photo}
          alt={name}
          onError={() => setErrored(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}
