// TEMPORARY - remove when told to
import React from 'react'

export default function TrollOverlay() {
  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-gray-950/95 backdrop-blur-md p-6 text-center select-none pointer-events-auto overflow-hidden"
      style={{ isolation: 'isolate' }}
    >
      <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight tracking-tight drop-shadow-lg max-w-4xl">
        الراجل ده نصاب محدش يشترك
      </h1>
    </div>
  )
}
