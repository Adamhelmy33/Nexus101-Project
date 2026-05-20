import { useState } from 'react'

/**
 * Avatar — shows a photo if available, otherwise shows
 * the person's initials inside a gradient circle.
 *
 * Callers apply the white ring via Tailwind `ring-4 ring-white`
 * on the className prop — no internal border is added here so
 * there is no double-border conflict.
 *
 * @param {string} objectPosition — override for face centering (default: 'center 25%')
 */
export default function Avatar({
  photo, initials, name = '',
  gradientFrom = '#0047AB', gradientTo = '#1a6fd4',
  size = 96, className = '', rounded = 'rounded-full',
  objectPosition = 'center 25%',
}) {
  const [errored, setErrored] = useState(false)

  const showInitials = errored || !photo

  return (
    <div
      className={`${rounded} overflow-hidden flex items-center justify-center text-white font-bold flex-shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: showInitials
          ? `linear-gradient(135deg, ${gradientFrom}, ${gradientTo})`
          : '#f0f4f8',
        fontSize: size * 0.34,
        fontFamily: 'Playfair Display, serif',
        letterSpacing: showInitials ? '0.04em' : undefined,
        textShadow: showInitials ? '0 1px 3px rgba(0,0,0,0.2)' : undefined,
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
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            display: 'block',
          }}
        />
      )}
    </div>
  )
}
