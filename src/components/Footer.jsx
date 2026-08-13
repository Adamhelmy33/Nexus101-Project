import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '../data/constants'
import Logo from './Logo'

const FOOTER_LINKS = {
  Platform: [
    { label: 'Home',          to: '/' },
    { label: 'Revision Store', to: '/store' },
    { label: 'Our Team',      to: '/team' },
  ],
  Modules: [
    { label: 'Mathematics',      to: '/store' },
    { label: 'Physics',          to: '/store' },
    { label: 'Computer Science', to: '/store' },
  ],
  Support: [
    { label: 'WhatsApp Support', href: `https://wa.me/${WHATSAPP_NUMBER}` },
    { label: 'Email Us',         href: `mailto:${SUPPORT_EMAIL}` },
  ],
}

export default function Footer() {
  return (
    <footer style={{ background: '#0a1628' }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Top ── */}
        <div className="py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">

          {/* Brand col */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-5 group">
              <Logo variant="white" height={36} className="transition-transform group-hover:scale-105" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed max-w-xs">
              World-class Math, Physics & Computer Science education, built for Egyptian students by Egyptian educators.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Mail className="w-4 h-4 text-primary-light flex-shrink-0" />
                {SUPPORT_EMAIL}
              </a>
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4 text-primary-light flex-shrink-0" />
                +{WHATSAPP_NUMBER}
              </a>
              <span className="flex items-center gap-3 text-gray-400 text-sm">
                <MapPin className="w-4 h-4 text-primary-light flex-shrink-0" />
                Cairo, Egypt
              </span>
            </div>
          </div>

          {/* Link cols */}
          {Object.entries(FOOTER_LINKS).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-widest mb-4">
                {section}
              </h3>
              <ul className="space-y-3">
                {links.map(link => (
                  <li key={link.label}>
                    {link.to ? (
                      <Link
                        to={link.to}
                        className="text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors text-sm"
                      >
                        {link.label}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p>© {new Date().getFullYear()} Nexus 101. All rights reserved.</p>
          <p>Made with ❤️ for Egyptian students</p>
        </div>
      </div>
    </footer>
  )
}
