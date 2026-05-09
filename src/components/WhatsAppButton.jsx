import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X } from 'lucide-react'
import { WHATSAPP_NUMBER } from '../data/constants'

export default function WhatsAppButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {/* ── Tooltip card ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="wa-card"
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="glass-light rounded-2xl p-4 w-64 shadow-2xl"
            style={{ border: '1px solid rgba(0,71,171,0.12)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#25d366' }}
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm text-gray-900">Nexus 101 Support</p>
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Online now
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              Hi there! 👋 Have a question about our courses or need help enrolling?
            </p>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Nexus%20101%2C%20I%20have%20a%20question%20about%20your%20courses.`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: '#25d366' }}
            >
              <MessageCircle className="w-4 h-4" />
              Start Chat
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FAB ── */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(v => !v)}
        className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl relative"
        style={{ background: '#25d366' }}
        aria-label="WhatsApp support"
      >
        {/* pulse ring */}
        {!open && (
          <span
            className="absolute inset-0 rounded-full animate-pulse-ring"
            style={{ background: 'rgba(37,211,102,0.4)' }}
          />
        )}
        <motion.div
          key={open ? 'x' : 'wa'}
          initial={{ rotate: -90, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {open ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <MessageCircle className="w-6 h-6 text-white" />
          )}
        </motion.div>
      </motion.button>
    </div>
  )
}
