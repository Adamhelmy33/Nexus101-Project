// ═══════════════════════════════════════════════
// Edge Function: bunny-signed-url
// ═══════════════════════════════════════════════
// Returns a short-lived, HMAC-signed URL for a Bunny.net Stream video.
//
// Flow:
//   1. Verify the JWT (Supabase Auth)
//   2. Look up the video, check the user owns the parent course (or is admin)
//   3. Build the signed URL using SHA-256(SECURITY_KEY + path + expires)
//
// Body: { video_id: uuid }
// Returns: { url, expires_at, hls, video }
//
// Env vars:
//   BUNNY_PULL_ZONE_HOSTNAME    e.g. vz-12345.b-cdn.net
//   BUNNY_SECURITY_KEY          from Bunny dashboard → Pull Zone → Security
//   BUNNY_TOKEN_TTL_SEC         default 3600
//   SUPABASE_URL                auto
//   SUPABASE_ANON_KEY           auto

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST')    return json({ error: 'Method not allowed' }, 405)

  try {
    const auth = req.headers.get('authorization')
    if (!auth) return json({ error: 'Missing Authorization' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    )

    /* ── Auth: who is calling? ── */
    const { data: { user }, error: authErr } = await supabase.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    /* ── Body ── */
    const { video_id } = await req.json()
    if (!video_id) return json({ error: 'Missing video_id' }, 400)

    /* ── Fetch video + verify ownership ── */
    const { data: video, error: vErr } = await supabase
      .from('videos')
      .select('id, bunny_video_id, bunny_library_id, hls_path, course_id, title, duration_sec')
      .eq('id', video_id)
      .single()
    if (vErr || !video) return json({ error: 'Video not found' }, 404)

    /* User must own the course (or be admin). */
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const isAdmin = profile?.role === 'admin'

    if (!isAdmin && video.course_id) {
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('user_id', user.id)
        .eq('course_id', video.course_id)
        .maybeSingle()
      if (!enrollment) return json({ error: 'You do not own this course' }, 403)
    }

    /* ── Build signed URL ── */
    const cdnHost  = Deno.env.get('BUNNY_PULL_ZONE_HOSTNAME')
    const secret   = Deno.env.get('BUNNY_SECURITY_KEY')
    const ttlSec   = parseInt(Deno.env.get('BUNNY_TOKEN_TTL_SEC') || '3600', 10)

    if (!cdnHost || !secret) {
      /* Demo mode — return a public test stream so the player still works */
      return json({
        ok: true,
        demo: true,
        url:  'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        expires_at: Date.now() + ttlSec * 1000,
        video,
      })
    }

    const path = video.hls_path || `/${video.bunny_video_id}/playlist.m3u8`
    const expires = Math.floor(Date.now() / 1000) + ttlSec

    const enc = new TextEncoder()
    const data = enc.encode(secret + path + expires)
    const hashBuf = await crypto.subtle.digest('SHA-256', data)
    const token = base64UrlEncode(new Uint8Array(hashBuf))

    const url = `https://${cdnHost}${path}?token=${token}&expires=${expires}`

    return json({
      ok: true,
      url,
      expires_at: expires * 1000,
      hls: 'm3u8',
      video,
    })
  } catch (e) {
    console.error('[bunny-signed-url]', e)
    return json({ error: e.message || 'unknown error' }, 500)
  }
})

/* ─── Helpers ─── */
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = ''
  for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
