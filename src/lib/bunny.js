/* ═══════════════════════════════════════════════
   Nexus 101 — Bunny.net signed-URL client
   ═══════════════════════════════════════════════
   Calls /api/bunny-signed-url (Vercel function) or the
   Supabase Edge Function `bunny-signed-url` to fetch a short-lived
   HMAC-signed CDN URL.

   Demo mode: when no backend is reachable, returns the public test
   stream so the player still works locally.
   ═══════════════════════════════════════════════ */

import nexusConfig from '../../nexus.config.js'

const ENDPOINT = '/api/bunny-signed-url'

/**
 * Fetch a signed URL for a video segment or whole video.
 * In demo mode (no backend), uses the segment's hlsUrl or the config fallback.
 *
 * @returns { url, expiresAt, demo }
 */
export async function getSignedUrl({ videoId, courseId, fallbackUrl } = {}) {
  /* Try real backend first */
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_id: videoId, course_id: courseId }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.url) return { url: data.url, expiresAt: data.expires_at, demo: !!data.demo }
    }
  } catch {
    /* fall through to demo */
  }

  /* Demo fallback */
  return {
    url:       fallbackUrl || nexusConfig.bunny.demoFallbackHls,
    expiresAt: Date.now() + nexusConfig.bunny.signedUrlTtlSec * 1000,
    demo:      true,
  }
}

/**
 * Build the signed iframe URL for embedding (alt to HLS.js).
 * Mostly here for completeness — HLS.js is preferred for our DRM overlay.
 */
export function buildIframeUrl({ libraryId, videoId, token, expires }) {
  return `https://iframe.mediadelivery.net/embed/${libraryId}/${videoId}?token=${token}&expires=${expires}`
}
