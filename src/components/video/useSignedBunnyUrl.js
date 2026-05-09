import { useState, useEffect, useRef } from 'react'
import { getSignedUrl } from '../../lib/bunny'
import nexusConfig from '../../../nexus.config.js'

/**
 * useSignedBunnyUrl
 * ─────────────────
 * Fetches a signed HLS URL for a Bunny.net video and auto-refreshes
 * before expiry so playback never breaks mid-lesson.
 *
 * If the backend isn't reachable, falls back to the configured demo stream.
 *
 * @param {string} videoId   — uuid in the videos table
 * @param {string} courseId  — needed for the demo fallback
 * @param {string} fallbackUrl — optional override (used by Custom Course Player)
 */
export default function useSignedBunnyUrl({ videoId, courseId, fallbackUrl } = {}) {
  const [state, setState] = useState({ url: null, loading: true, error: null, demo: false, expiresAt: 0 })
  const refreshTimer = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function fetchUrl() {
      setState(s => ({ ...s, loading: true, error: null }))
      try {
        const { url, expiresAt, demo } = await getSignedUrl({ videoId, courseId, fallbackUrl })
        if (cancelled) return
        setState({ url, expiresAt, loading: false, error: null, demo })

        /* Schedule refresh before expiry (refreshAtSecRemaining) */
        const refreshIn = expiresAt - Date.now() - nexusConfig.bunny.refreshAtSecRemaining * 1000
        if (refreshIn > 0) {
          clearTimeout(refreshTimer.current)
          refreshTimer.current = setTimeout(fetchUrl, refreshIn)
        }
      } catch (e) {
        if (!cancelled) setState({ url: null, loading: false, error: e.message, demo: false, expiresAt: 0 })
      }
    }

    fetchUrl()
    return () => { cancelled = true; clearTimeout(refreshTimer.current) }
  }, [videoId, courseId, fallbackUrl])

  return state
}
