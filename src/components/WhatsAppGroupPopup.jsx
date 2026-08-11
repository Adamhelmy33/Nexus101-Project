import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, MessageCircle } from 'lucide-react'

/**
 * WhatsAppGroupPopup
 *
 * Shown every time a student lands on a subject+track (modules) page.
 * - whatsappUrl set   → "Join the group" CTA
 * - whatsappUrl null  → "Coming soon" message, dismiss only
 *
 * Props
 * ─────
 * isOpen      boolean   — controlled open state
 * onClose     fn        — called when user dismisses
 * subjectName string    — e.g. "Engineering"
 * trackName   string    — e.g. "IFP"
 * whatsappUrl string|null
 */
export default function WhatsAppGroupPopup({
  isOpen,
  onClose,
  subjectName = '',
  trackName   = '',
  whatsappUrl = null,
}) {
  /* Close on Escape */
  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  /* Prevent scroll-behind on mobile */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  const hasGroup = Boolean(whatsappUrl)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="wa-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9998,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(3px)',
              WebkitBackdropFilter: 'blur(3px)',
            }}
            aria-hidden="true"
          />

          {/* ── Modal card ── */}
          <motion.div
            key="wa-modal"
            role="dialog"
            aria-modal="true"
            aria-label="WhatsApp group invitation"
            initial={{ opacity: 0, scale: 0.88, y: 32 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92,  y: 16 }}
            transition={{ type: 'spring', stiffness: 340, damping: 26 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              pointerEvents: 'none',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                pointerEvents: 'auto',
                background: '#fff',
                borderRadius: '1.5rem',
                maxWidth: '420px',
                width: '100%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {/* ── Green header strip ── */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #128C7E 0%, #25D366 100%)',
                  padding: '2rem 1.5rem 2.5rem',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* decorative circles */}
                <div style={{
                  position: 'absolute', top: '-24px', right: '-24px',
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.08)',
                }} />
                <div style={{
                  position: 'absolute', bottom: '-32px', left: '-16px',
                  width: '90px', height: '90px', borderRadius: '50%',
                  background: 'rgba(255,255,255,0.06)',
                }} />

                {/* X close button */}
                <button
                  id="wa-popup-close"
                  onClick={onClose}
                  aria-label="Close WhatsApp group popup"
                  style={{
                    position: 'absolute', top: '0.75rem', right: '0.75rem',
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none', borderRadius: '50%',
                    width: '32px', height: '32px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)' }}
                >
                  <X size={16} />
                </button>

                {/* WhatsApp icon */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  width: '64px', height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.18)',
                  marginBottom: '1rem',
                  position: 'relative', zIndex: 1,
                }}>
                  <MessageCircle size={34} color="#fff" fill="rgba(255,255,255,0.25)" />
                </div>

                <p style={{
                  color: 'rgba(255,255,255,0.82)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  marginBottom: '0.35rem',
                  position: 'relative', zIndex: 1,
                }}>
                  {subjectName}{trackName ? ` · ${trackName}` : ''}
                </p>

                <h2 style={{
                  color: '#fff',
                  fontSize: '1.35rem',
                  fontWeight: 800,
                  margin: 0,
                  lineHeight: 1.25,
                  position: 'relative', zIndex: 1,
                  fontFamily: 'Playfair Display, Georgia, serif',
                }}>
                  {hasGroup
                    ? `Join the ${subjectName} WhatsApp Group!`
                    : 'WhatsApp Group Coming Soon'}
                </h2>
              </div>

              {/* ── Body ── */}
              <div style={{ padding: '1.75rem 1.75rem 1.5rem', textAlign: 'center' }}>
                {hasGroup ? (
                  <>
                    <p style={{
                      color: '#4b5563',
                      fontSize: '0.9rem',
                      lineHeight: 1.65,
                      marginBottom: '1.5rem',
                    }}>
                      Stay updated with classmates, get reminders for upcoming tests, and share tips — all in one place. 🎓
                    </p>

                    <a
                      id="wa-popup-join-btn"
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.875rem 1.25rem',
                        borderRadius: '0.875rem',
                        background: 'linear-gradient(135deg, #128C7E, #25D366)',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textDecoration: 'none',
                        boxShadow: '0 4px 16px rgba(37,211,102,0.35)',
                        transition: 'transform 0.15s, box-shadow 0.15s',
                        marginBottom: '0.75rem',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = 'scale(1.02)'
                        e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,211,102,0.45)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,211,102,0.35)'
                      }}
                    >
                      <MessageCircle size={18} />
                      Join the WhatsApp Group
                    </a>

                    <button
                      id="wa-popup-dismiss-btn"
                      onClick={onClose}
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.6rem',
                        borderRadius: '0.75rem',
                        border: 'none',
                        background: 'transparent',
                        color: '#9ca3af',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        transition: 'color 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.color = '#6b7280' }}
                      onMouseLeave={e => { e.currentTarget.style.color = '#9ca3af' }}
                    >
                      Maybe later
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{
                      color: '#4b5563',
                      fontSize: '0.9rem',
                      lineHeight: 1.65,
                      marginBottom: '1.5rem',
                    }}>
                      We're setting up a WhatsApp group for{' '}
                      <strong>{subjectName}{trackName ? ` ${trackName}` : ''}</strong>{' '}
                      students. Check back shortly — it'll be worth the wait! 🙌
                    </p>

                    <button
                      id="wa-popup-got-it-btn"
                      onClick={onClose}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        width: '100%',
                        padding: '0.875rem 1.25rem',
                        borderRadius: '0.875rem',
                        border: '2px solid #25D366',
                        background: 'transparent',
                        color: '#128C7E',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s, color 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = 'rgba(37,211,102,0.08)'
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      Got it, thanks!
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
