export default function Logo({ variant = 'blue', className = '', height = 32 }) {
  const isDark = variant === 'white'

  const nexusColor = isDark ? '#ffffff' : '#0a1628'
  const accentColor = isDark ? '#38bdf8' : '#f0a500'

  const fontSize = Math.round(height * 0.52)

  return (
    <span
      className={`inline-flex items-center select-none ${className}`}
      style={{
        fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
        fontSize,
        lineHeight: 1,
        letterSpacing: '0.07em',
      }}
    >
      <span style={{ color: nexusColor, fontWeight: 800 }}>NEXUS</span>
      <span
        style={{
          color: accentColor,
          fontWeight: 600,
          marginLeft: '0.3em',
          letterSpacing: '0.04em',
        }}
      >
        101
      </span>
    </span>
  )
}
