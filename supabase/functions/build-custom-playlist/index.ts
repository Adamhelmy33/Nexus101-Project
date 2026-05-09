// ═══════════════════════════════════════════════
// Edge Function: build-custom-playlist
// ═══════════════════════════════════════════════
// Takes a parsed syllabus and builds a stitched playlist of video segments
// from the Atomic Tagging database.
//
// Body: { syllabus_id, title?, max_segments? }
// Returns: { playlist_id, segment_count, total_seconds }
//
// Env vars: ANTHROPIC_API_KEY, OPENAI_API_KEY, SUPABASE_*

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

    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: auth } } },
    )
    const { data: { user }, error: authErr } = await supabaseUser.auth.getUser()
    if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { syllabus_id, title, max_segments = 12 } = await req.json()
    if (!syllabus_id) return json({ error: 'Missing syllabus_id' }, 400)

    /* ── 1. Load parsed syllabus ── */
    const { data: syllabus, error: sErr } = await supabase
      .from('parsed_syllabi')
      .select('id, user_id, parsed_topics')
      .eq('id', syllabus_id)
      .single()
    if (sErr || !syllabus) return json({ error: 'Syllabus not found' }, 404)
    if (syllabus.user_id !== user.id) return json({ error: 'Forbidden' }, 403)

    const topics = (syllabus.parsed_topics as any[]) || []
    if (topics.length === 0) return json({ error: 'Syllabus has no topics' }, 400)

    /* ── 2. Create the playlist row (status = building) ── */
    const { data: playlist, error: pErr } = await supabase
      .from('custom_playlists')
      .insert({
        user_id:     user.id,
        title:       title || 'Custom syllabus course',
        source:      'syllabus_upload',
        syllabus_id: syllabus.id,
        status:      'building',
      })
      .select('id')
      .single()
    if (pErr || !playlist) throw pErr || new Error('Insert failed')

    /* ── 3. For each topic: embed → match_video_segments ── */
    const allMatches: Array<{
      segment_id: string; match_score: number;
      ai_reason: string; syllabus_position: number;
    }> = []

    for (let i = 0; i < topics.length; i++) {
      const t = topics[i]
      const queryText = `${t.title}. ${t.description || ''} ${(t.keywords || []).join(', ')}`
      const embedding = await embed(queryText)
      if (!embedding) continue

      const { data: matches } = await supabase.rpc('match_video_segments', {
        p_query_embedding: embedding,
        p_subject:         t.subject && t.subject !== 'mixed' ? t.subject : null,
        p_min_score:       0.45,
        p_match_count:     3,
      })

      for (const m of matches || []) {
        allMatches.push({
          segment_id: m.segment_id,
          match_score: m.score * (t.weight || 3) / 3,        // weight by syllabus importance
          ai_reason:  `Matches "${t.title}" — ${m.title}`,
          syllabus_position: i,
        })
      }
    }

    /* ── 4. Stitch via DB function (dedupe + order + status='ready') ── */
    const { data: stitched } = await supabase.rpc('stitch_playlist_items', {
      p_playlist_id: playlist.id,
      p_segments:    allMatches.slice(0, max_segments * 3),  // give the stitcher headroom
    })

    /* ── 5. Re-fetch totals ── */
    const { data: final } = await supabase
      .from('custom_playlists')
      .select('id, segment_count, total_seconds, status')
      .eq('id', playlist.id)
      .single()

    return json({
      ok:           true,
      playlist_id:  playlist.id,
      segment_count: final?.segment_count ?? 0,
      total_seconds: final?.total_seconds ?? 0,
      status:        final?.status ?? 'failed',
    })
  } catch (e) {
    console.error('[build-custom-playlist]', e)
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

async function embed(text: string): Promise<number[] | null> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return null
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: text.slice(0, 4000) }),
  })
  const data = await res.json()
  return data?.data?.[0]?.embedding || null
}
