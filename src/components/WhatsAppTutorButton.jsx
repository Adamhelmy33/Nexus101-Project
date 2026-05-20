import { MessageCircle } from 'lucide-react'
import { WHATSAPP_TUTOR_NUMBER } from '../data/constants'

/**
 * WhatsApp tutoring button — drops the user into a chat with the tutor
 * line, optionally pre-filled with a message about the lesson they're on.
 */
export default function WhatsAppTutorButton({
  message = "Hi! I have a question about my Nexus 101 revision.",
  className = '',
  variant = 'primary',
  size = 'md',
}) {
  const href = `https://wa.me/${WHATSAPP_TUTOR_NUMBER}?text=${encodeURIComponent(message)}`

  const styles = {
    primary: { background: '#25d366', color: '#ffffff' },
    outline: { background: 'transparent', color: '#25d366', border: '2px solid #25d366' },
    ghost:   { background: 'rgba(37,211,102,0.12)', color: '#25d366' },
  }[variant]

  const sizeClass = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3.5 text-base',
  }[size]

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all hover:scale-[1.03] hover:shadow-lg w-full sm:w-auto ${sizeClass} ${className}`}
      style={styles}
    >
      <MessageCircle className="w-4 h-4" />
      WhatsApp Tutoring
    </a>
  )
}
