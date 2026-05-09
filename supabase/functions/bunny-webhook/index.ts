// ═══════════════════════════════════════════════
// Edge Function: bunny-webhook
// ═══════════════════════════════════════════════
// Bunny.net calls this when a video finishes encoding.
// We:
//   1. Verify the webhook signature (Bunny sends an Authorization header)
//   2. Insert/update the row in `videos`
//   3. Pull the auto-generated transcript from Bunny
//   4. Optionally re-transcribe with Whisper for quality
//   5. Auto-segment via Claude (split by topic shifts)
//   6. For each segment: embed text → store in video_segments
//
// Set this URL in Bunny.net dashboard → Stream Library → Settings → Webhooks
//
// Env vars:
//   BUNNY_WEBHOOK_SECRET        ← from Bunny dashboard
//   BUNNY_API_KEY               ← from Bunny → Account Settings → API Keys
//   ANTHROPIC_API_KEY
//   OPENAI_API_KEY
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    /* ── 1. Verify Bunny webhook signature ── */
    const expectedSecret = Deno.env.get('BUNNY_WEBHOOK_SECRET')
    const provided = req.headers.get('authorization') || req.headers.get('x-bunny-secret')
    if (expectedSecret && provided !== expectedSecret) {
      return new Response('Forbidden', { status: 403 })
    }

    const event = await req.json()
    /* Expected shape: { VideoLibraryId, VideoGuid, Status, … } */
    const libraryId = String(event.VideoLibraryId || '')
    const videoId   = String(event.VideoGuid || '')
    const status    = Number(event.Status)               // 4 = Finished

    if (!libraryId || !videoId) return new Response('Missing video metadata', { status: 400 })

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    /* ── 2. Upsert the video row ── */
    /* Most fields filled by a separate fetch to Bunny's REST API. */
    const meta = await fetchBunnyVideoMeta(libraryId, videoId)
    await supabase.from('videos').upsert({
      bunny_library_id: libraryId,
      bunny_video_id:   videoId,
      title:            meta.title || event.Title || 'Untitled',
      duration_sec:     meta.duration || 0,
      hls_path:         `/${videoId}/playlist.m3u8`,
      thumbnail_url:    meta.thumbnail,
      status:           status === 4 ? 'ready' : 'processing',
      meta:             { bunny: meta },
    }, { onConflict: 'bunny_library_id,bunny_video_id' })

    /* If not yet finished, stop here — we'll get another webhook later */
    if (status !== 4) return Response.json({ ok: true, waiting: true })

    /* ── 3-6. Fetch transcript, segment, embed ── */
    /* This part deliberately runs async (fire-and-forget) so we ack
       the webhook fast. In production move to a queue if you have many uploads. */
    queueMicrotask(() => ingestVideo({ libraryId, videoId, supabase }))

    return Response.json({ ok: true })
  } catch (e) {
    console.error('[bunny-webhook]', e)
    return new Response('error', { status: 500 })
  }
})

/* ────────── Bunny REST helpers ────────── */
async function fetchBunnyVideoMeta(libraryId: string, videoId: string) {
  const apiKey = Deno.env.get('BUNNY_API_KEY')
  if (!apiKey) return {}
  try {
    const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
      headers: { AccessKey: apiKey },
    })
    if (!res.ok) return {}
    const v = await res.json()
    return {
      title:     v.title,
      duration:  v.length,
      thumbnail: v.thumbnailFileName
        ? `https://${Deno.env.get('BUNNY_PULL_ZONE_HOSTNAME')}/${videoId}/${v.thumbnailFileName}`
        : null,
    }
  } catch { return {} }
}

async function fetchBunnyTranscript(libraryId: string, videoId: string): Promise<string | null> {
  const apiKey = Deno.env.get('BUNNY_API_KEY')
  if (!apiKey) return null
  try {
    /* Bunny stores captions as VTT under /captions/<lang>.vtt */
    const res = await fetch(
      `https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/captions/en`,
      { headers: { AccessKey: apiKey } },
    )
    if (!res.ok) return null
    const vtt = await res.text()
    return vtt
  } catch { return null }
}

/* ────────── Ingestion pipeline ────────── */
async function ingestVideo({ libraryId, videoId, supabase }: any) {
  const vtt = await fetchBunnyTranscript(libraryId, videoId)
  if (!vtt) {
    console.warn('[ingest] no transcript yet for', videoId)
    return
  }

  /* 1. Parse VTT into [{start, end, text}] cues */
  const cues = parseVtt(vtt)
  if (cues.length === 0) return

  /* 2. Ask Claude to group cues into topic-coherent segments */
  const claudeResp = await callAnthropic({
    system:
`You group video subtitles into topic-coherent segments for an educational platform.
Given a list of cues with timestamps, return ONLY a JSON array:
[{ "start_sec": int, "end_sec": int, "title": "short topic title (5-7 words)",
   "subject": "math"|"physics"|"cs", "difficulty": 1-5 }]
No prose, no markdown, just JSON.`,
    user: JSON.stringify(cues.slice(0, 200)),  // cap input length
  })
  let segments
  try { segments = JSON.parse(claudeResp) } catch { segments = [] }
  if (!Array.isArray(segments) || segments.length === 0) return

  /* 3. Look up the videos row id */
  const { data: video } = await supabase
    .from('videos')
    .select('id, course_id')
    .eq('bunny_library_id', libraryId)
    .eq('bunny_video_id', videoId)
    .single()
  if (!video) return

  /* 4. For each segment: extract transcript + embed + insert */
  for (const seg of segments) {
    const transcript = cues
      .filter(c => c.start >= seg.start_sec && c.end <= seg.end_sec)
      .map(c => c.text)
      .join(' ')
      .slice(0, 8000)

    const embedding = await embed(transcript || seg.title)

    await supabase.from('video_segments').insert({
      video_id:   video.id,
      course_id:  video.course_id,
      start_sec:  seg.start_sec,
      end_sec:    seg.end_sec,
      title:      seg.title,
      subject:    seg.subject || 'mixed',
      difficulty: seg.difficulty || 3,
      transcript,
      embedding,
    })
  }
}

/* ────────── AI helpers ────────── */
async function callAnthropic({ system, user }: { system: string; user: string }) {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type':       'application/json',
      'x-api-key':          apiKey,
      'anthropic-version':  '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-sonnet-latest',
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  return data?.content?.[0]?.text || ''
}

async function embed(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text }),
  })
  const data = await res.json()
  return data?.data?.[0]?.embedding || null
}

/* ────────── VTT parser ────────── */
function parseVtt(vtt: string) {
  const cues: { start: number; end: number; text: string }[] = []
  const lines = vtt.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/(\d+):(\d+):(\d+)\.\d+\s+-->\s+(\d+):(\d+):(\d+)\.\d+/)
    if (!m) continue
    const start = +m[1]*3600 + +m[2]*60 + +m[3]
    const end   = +m[4]*3600 + +m[5]*60 + +m[6]
    let text = ''
    while (++i < lines.length && lines[i].trim() !== '') text += lines[i].trim() + ' '
    cues.push({ start, end, text: text.trim() })
  }
  return cues
}
