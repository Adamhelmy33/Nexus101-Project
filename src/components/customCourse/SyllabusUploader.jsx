import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Sparkles, X, BookOpenCheck } from 'lucide-react'
import { SAMPLE_SYLLABI } from '../../lib/customCourse'

/**
 * SyllabusUploader — step 1 of the Custom Course Builder.
 * Lets the user drop a PDF or paste raw syllabus text.
 *
 * Calls onUploaded({ rawText, fileName }) when the user is ready to parse.
 */
export default function SyllabusUploader({ onUploaded }) {
  const [mode, setMode]   = useState('upload')   // 'upload' | 'paste' | 'sample'
  const [text, setText]   = useState('')
  const [file, setFile]   = useState(null)
  const [drag, setDrag]   = useState(false)
  const [busy, setBusy]   = useState(false)
  const inputRef = useRef(null)

  const handleFile = async (f) => {
    if (!f) return
    setFile(f)
    setBusy(true)
    /* For demo: read PDF as text using FileReader (won't actually parse PDF binary on the frontend,
       but we capture the file name + a marker so the mock pipeline can work).
       In production, the file is uploaded to Supabase Storage and the Edge Function parses it. */
    let raw = ''
    try {
      if (f.type === 'application/pdf') {
        raw = `[PDF: ${f.name}] — Engineering Mathematics, Programming Fundamentals, Mechanics, Digital Electronics`
      } else {
        raw = await f.text()
      }
    } catch { raw = `[File: ${f.name}]` }
    setBusy(false)
    onUploaded?.({ rawText: raw, fileName: f.name })
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  return (
    <div>
      {/* Mode tabs */}
      <div className="inline-flex rounded-xl bg-gray-100 p-1 mb-6 text-sm">
        <TabBtn active={mode === 'upload'} onClick={() => setMode('upload')}>📄 Upload PDF</TabBtn>
        <TabBtn active={mode === 'paste'}  onClick={() => setMode('paste')}>✍️ Paste text</TabBtn>
        <TabBtn active={mode === 'sample'} onClick={() => setMode('sample')}>✨ Use sample</TabBtn>
      </div>

      {mode === 'upload' && (
        <div
          onDragEnter={() => setDrag(true)}
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative rounded-3xl border-2 border-dashed p-10 sm:p-14 text-center cursor-pointer transition-all ${
            drag ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-gray-200 hover:border-primary/40 bg-white'
          }`}
        >
          <input ref={inputRef} type="file" accept=".pdf,.txt,.md" hidden
                 onChange={(e) => handleFile(e.target.files?.[0])} />
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #0047AB, #1a6fd4)' }}>
            <Upload className="w-7 h-7 text-white" />
          </div>
          <h3 className="font-bold text-gray-900 mb-1" style={{ fontFamily: 'Playfair Display, serif' }}>
            Drop your syllabus here
          </h3>
          <p className="text-sm text-gray-500 mb-3">PDF, TXT, or Markdown · max 10 MB</p>
          {file ? (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-primary text-xs font-semibold">
              <FileText className="w-3.5 h-3.5" />
              {file.name}
              <button onClick={(e) => { e.stopPropagation(); setFile(null) }}>
                <X className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Click to browse, or drag and drop</p>
          )}
          {busy && (
            <p className="text-xs text-primary mt-3 animate-pulse">Reading file…</p>
          )}
        </div>
      )}

      {mode === 'paste' && (
        <div className="rounded-3xl border border-gray-200 bg-white p-6">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
            <FileText className="w-3 h-3" /> Paste syllabus text
          </p>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Module Outline:
1. Engineering Mathematics — differentiation, integration…
2. Programming Fundamentals — variables, control flow…
3. …"
            className="w-full p-4 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 resize-none"
          />
          <button
            onClick={() => onUploaded?.({ rawText: text, fileName: 'pasted-syllabus.txt' })}
            disabled={text.trim().length < 30}
            className="mt-4 btn-primary w-full justify-center disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Parse this syllabus
          </button>
        </div>
      )}

      {mode === 'sample' && (
        <div className="space-y-3">
          {SAMPLE_SYLLABI.map(s => (
            <motion.button
              key={s.id}
              whileHover={{ y: -2 }}
              onClick={() => onUploaded?.({ rawText: s.text, fileName: `${s.id}.txt` })}
              className="w-full text-left rounded-2xl bg-white border border-gray-200 hover:border-primary/40 hover:shadow-lg transition-all p-5 flex items-start gap-4"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                   style={{ background: 'linear-gradient(135deg, #f0a500, #d97706)' }}>
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{s.label}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 font-mono">
                  {s.text.slice(0, 140)}…
                </p>
              </div>
              <Sparkles className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-1" />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
        active ? 'bg-white text-primary shadow' : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}
