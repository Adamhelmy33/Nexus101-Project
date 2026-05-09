import { useEffect, useRef, useState, useCallback } from 'react'
import Hls from 'hls.js'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Pause, Volume2, VolumeX, Maximize2, Minimize2,
  Loader2, AlertTriangle, ShieldCheck, Settings,
} from 'lucide-react'
import SocialDRMOverlay from './SocialDRMOverlay'
import useSignedBunnyUrl from './useSignedBunnyUrl'

/**
 * BunnyVideoPlayer
 * ─────────────────
 * HLS.js-based custom video player for Bunny.net Stream.
 *
 * Why HLS.js (not the iframe embed):
 *   • The Social-DRM overlay can sit ON TOP of the <video> element
 *     (impossible inside an iframe — recording captures clean video).
 *   • Custom controls + segment chapters + transcript sync.
 *
 * Props:
 *   videoId       — the videos table id (used to fetch signed URL)
 *   courseId      — for ownership check + demo fallback
 *   fallbackUrl   — optional override (e.g. for Custom Course playlist segments)
 *   user          — { name, email } for the watermark
 *   chapters      — [{ start_sec, end_sec, title }] for the seek-bar markers
 *   startAt       — seek to this timestamp (in seconds) when playback begins
 *   stopAt        — pause at this timestamp (in seconds) — for atomic segments
 *   onSegmentEnd  — fired when stopAt is reached (used by CustomCoursePlayer)
 *   onTimeUpdate  — fired with current playback time (for transcript sync)
 *   onEnded       — fired when video ends naturally
 *   onWatchedSeconds — fired periodically with delta seconds for progress tracking
 */
export default function BunnyVideoPlayer({
  videoId,
  courseId,
  fallbackUrl,
  user,
  chapters = [],
  startAt = 0,
  stopAt = null,
  onSegmentEnd,
  onTimeUpdate,
  onEnded,
  onWatchedSeconds,
  title,
}) {
  const videoRef     = useRef(null)
  const hlsRef       = useRef(null)
  const containerRef = useRef(null)
  const lastReportRef = useRef(Date.now())

  const [playing, setPlaying]       = useState(false)
  const [muted, setMuted]           = useState(false)
  const [volume, setVolume]         = useState(0.9)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration]     = useState(0)
  const [buffered, setBuffered]     = useState(0)
  const [fullscreen, setFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [hovered, setHovered]       = useState(false)
  const [error, setError]           = useState(null)
  const hideTimer = useRef(null)

  /* ── Fetch signed HLS URL (with auto-refresh) ── */
  const { url: hlsUrl, loading: urlLoading, demo, error: urlError } =
    useSignedBunnyUrl({ videoId, courseId, fallbackUrl })

  /* ── Initialise HLS.js when URL is ready ── */
  useEffect(() => {
    if (!hlsUrl || !videoRef.current) return
    const video = videoRef.current
    setError(null)

    /* Native HLS support (Safari) */
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl
    } else if (Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: false })
      hls.loadSource(hlsUrl)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) setError(data.details || 'Playback error')
      })
      hlsRef.current = hls
    } else {
      setError('Your browser does not support HLS playback.')
    }

    return () => {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null }
    }
  }, [hlsUrl])

  /* ── Apply startAt once metadata is loaded ── */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const onMeta = () => { if (startAt > 0) video.currentTime = startAt }
    video.addEventListener('loadedmetadata', onMeta)
    return () => video.removeEventListener('loadedmetadata', onMeta)
  }, [startAt, hlsUrl])

  /* ── Wire video events → state ── */
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handlers = {
      play:  () => setPlaying(true),
      pause: () => setPlaying(false),
      timeupdate: () => {
        const t = video.currentTime
        setCurrentTime(t)
        onTimeUpdate?.(t)

        /* Watch-progress reporting (every ~5s of playback) */
        const now = Date.now()
        if (now - lastReportRef.current > 5000) {
          const delta = (now - lastReportRef.current) / 1000
          onWatchedSeconds?.(delta)
          lastReportRef.current = now
        }

        /* Atomic stopAt — pause precisely at the end of a custom-course segment */
        if (stopAt && t >= stopAt) {
          video.pause()
          onSegmentEnd?.()
        }
      },
      durationchange: () => setDuration(video.duration || 0),
      progress: () => {
        const b = video.buffered
        if (b.length > 0) setBuffered(b.end(b.length - 1))
      },
      ended: () => { onEnded?.(); setPlaying(false) },
      volumechange: () => { setMuted(video.muted); setVolume(video.volume) },
    }
    Object.entries(handlers).forEach(([k, fn]) => video.addEventListener(k, fn))
    return () => Object.entries(handlers).forEach(([k, fn]) => video.removeEventListener(k, fn))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopAt, onSegmentEnd, onTimeUpdate, onWatchedSeconds, onEnded])

  /* ── Anti-piracy: block right-click + common save shortcuts ── */
  useEffect(() => {
    const block = (e) => e.preventDefault()
    const blockKeys = (e) => {
      if ((e.ctrlKey && ['s','u','p'].includes(e.key.toLowerCase())) || e.key === 'F12') e.preventDefault()
    }
    const node = containerRef.current
    node?.addEventListener('contextmenu', block)
    document.addEventListener('keydown', blockKeys)
    return () => {
      node?.removeEventListener('contextmenu', block)
      document.removeEventListener('keydown', blockKeys)
    }
  }, [])

  /* ── Auto-hide controls after 2s of no movement ── */
  const showAndAutoHide = useCallback(() => {
    setShowControls(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { if (playing && !hovered) setShowControls(false) }, 2200)
  }, [playing, hovered])

  /* ── Fullscreen tracking ── */
  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onFs)
    return () => document.removeEventListener('fullscreenchange', onFs)
  }, [])

  /* ── Imperative actions ── */
  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) v.play().catch(() => {}); else v.pause()
  }
  const toggleMute = () => { const v = videoRef.current; if (v) v.muted = !v.muted }
  const seekTo = (t) => { const v = videoRef.current; if (v) v.currentTime = Math.max(0, Math.min(t, v.duration || t)) }
  const onSeekClick = (e) => {
    const r = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - r.left) / r.width
    seekTo(pct * (duration || 0))
  }
  const onVolume = (e) => { const v = videoRef.current; if (v) v.volume = Number(e.target.value) }
  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen?.()
  }

  /* ── Render ── */
  const buf = duration > 0 ? (buffered / duration) * 100 : 0
  const pct = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-black overflow-hidden group select-none"
      style={{ aspectRatio: '16/9', userSelect: 'none' }}
      onMouseMove={showAndAutoHide}
      onMouseEnter={() => { setHovered(true); setShowControls(true) }}
      onMouseLeave={() => { setHovered(false); if (playing) setShowControls(false) }}
      onContextMenu={e => e.preventDefault()}
    >
      <video
        ref={videoRef}
        className="w-full h-full block"
        playsInline
        controlsList="nodownload noremoteplayback"
        disablePictureInPicture
        onClick={togglePlay}
      />

      {/* ── Social-DRM watermark ── */}
      {user?.email && <SocialDRMOverlay email={user.email} name={user.name} />}

      {/* ── Loading state ── */}
      {urlLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-primary-light" />
        </div>
      )}

      {/* ── Error state ── */}
      {(error || urlError) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white text-center px-6">
          <AlertTriangle className="w-10 h-10 text-red-400 mb-3" />
          <p className="font-semibold mb-1">Playback error</p>
          <p className="text-xs text-white/60 max-w-md">{error || urlError}</p>
        </div>
      )}

      {/* ── Big play button when paused (and not loading) ── */}
      {!playing && !urlLoading && !error && hlsUrl && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center group/play"
          aria-label="Play"
        >
          <div className="w-20 h-20 rounded-full flex items-center justify-center backdrop-blur-md transition-transform group-hover/play:scale-110"
               style={{ background: 'rgba(0,71,171,0.85)', boxShadow: '0 8px 32px rgba(0,71,171,0.4)' }}>
            <Play className="w-9 h-9 text-white ml-1" fill="currentColor" />
          </div>
        </button>
      )}

      {/* ── Top bar ── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between text-white z-20 pointer-events-none"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6), transparent)' }}
          >
            <p className="font-semibold text-sm truncate pointer-events-auto" style={{ fontFamily: 'Playfair Display, serif' }}>
              {title || 'Nexus 101'}
            </p>
            <div className="flex items-center gap-2 pointer-events-auto">
              {demo && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest bg-yellow-400 text-yellow-900 flex items-center gap-1">
                  <Settings className="w-2.5 h-2.5" /> Demo
                </span>
              )}
              <span className="text-[10px] flex items-center gap-1 text-white/65">
                <ShieldCheck className="w-3 h-3 text-green-400" /> DRM watermarked
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom controls ── */}
      <AnimatePresence>
        {showControls && hlsUrl && !error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 z-20"
            style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.7), transparent)' }}
          >
            {/* Seek bar */}
            <div
              onClick={onSeekClick}
              className="relative h-1.5 rounded-full bg-white/20 cursor-pointer mb-3 group/seek"
            >
              <div className="absolute inset-y-0 left-0 bg-white/30 rounded-full" style={{ width: `${buf}%` }} />
              <div className="absolute inset-y-0 left-0 rounded-full"
                   style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #0047AB, #1a6fd4)' }} />
              {/* Chapter markers */}
              {chapters.map((ch, i) => {
                const left = duration > 0 ? (ch.start_sec / duration) * 100 : 0
                const w    = duration > 0 ? ((ch.end_sec - ch.start_sec) / duration) * 100 : 0
                return (
                  <div key={i}
                       className="absolute top-1/2 -translate-y-1/2 h-3 border-l-2 border-yellow-300/80 group/marker"
                       style={{ left: `${left}%` }}
                       title={ch.title}
                       onClick={(e) => { e.stopPropagation(); seekTo(ch.start_sec) }}
                  >
                    <div className="hidden group-hover/marker:block absolute bottom-5 left-0 -translate-x-1/2 whitespace-nowrap text-[10px] px-2 py-1 rounded bg-black/85 text-white">
                      {ch.title}
                    </div>
                  </div>
                )
              })}
              {/* Scrubber dot */}
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover/seek:opacity-100 transition-opacity"
                   style={{ left: `${pct}%`, boxShadow: '0 0 8px rgba(0,0,0,0.5)' }} />
            </div>

            <div className="flex items-center gap-3 text-white">
              <button onClick={togglePlay} className="hover:scale-110 transition-transform" aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause className="w-5 h-5" fill="currentColor" /> : <Play className="w-5 h-5" fill="currentColor" />}
              </button>

              <div className="flex items-center gap-2 group/vol">
                <button onClick={toggleMute} aria-label={muted ? 'Unmute' : 'Mute'}>
                  {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </button>
                <input
                  type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
                  onChange={onVolume}
                  className="w-0 group-hover/vol:w-20 transition-all duration-300 accent-white"
                />
              </div>

              <div className="text-xs font-mono text-white/85 select-none">
                {fmt(currentTime)} <span className="text-white/45">/ {fmt(duration)}</span>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform" aria-label="Fullscreen">
                  {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function fmt(sec) {
  if (!isFinite(sec)) return '0:00'
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60).toString().padStart(2, '0')
  return `${m}:${s}`
}
