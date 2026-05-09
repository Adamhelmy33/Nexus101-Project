// ═══════════════════════════════════════════════
// Edge Function: parse-syllabus
// ═══════════════════════════════════════════════
// Takes a syllabus PDF (from Supabase Storage) or raw text and extracts
// structured topics ready for the playlist builder.
//
// Body: { storage_path?: string, raw_text?: string }
// Returns: { syllabus_id, topics: [...] }
//
// Env vars:
//   ANTHROPIC_API_KEY
//   SUPABASE_URL  / SUPABASE_SERVICE_ROLE_KEY  (auto)

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { extractText, getDocumentProxy } from 'https://esm.sh/unpdf@0.12.1'

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

    /* ── 1. Get the raw text ── */
    const { storage_path, raw_text } = await req.json()
    let text = raw_text?.trim() || ''
    if (!text && storage_path) {
      const { data: blob, error } = await supabase.storage
        .from('syllabi')
        .download(storage_path)
      if (error || !blob) return json({ error: 'Could not fetch syllabus' }, 400)

      const buf = new Uint8Array(await blob.arrayBuffer())
      const pdf = await getDocumentProxy(buf)
      const extracted = await extractText(pdf, { mergePages: true })
      text = extracted.text || ''
    }
    if (!text) return json({ error: 'No syllabus content provided' }, 400)
    text = text.slice(0, 30000)  // cap input

    /* ── 2. Insert pending row ── */
    const { data: row, error: insErr } = await supabase
      .from('parsed_syllabi')
      .insert({
        user_id:    user.id,
        source_path: storage_path || null,
        raw_text:   text,
        status:     'parsing',
      })
      .select('id')
      .single()
    if (insErr || !row) throw insErr || new Error('Insert failed')

    /* ── 3. Ask Claude to structure the syllabus ── */
    const claudeResp = await callAnthropic({
      system:
`You parse university syllabi into structured topics for an educational platform.
Output ONLY a JSON array — no prose, no markdown:
[{ "title": "topic name (3-7 words)",
   "description": "1-sentence description",
   "keywords": ["term1", "term2", "term3"],
   "weight":   1-5,
   "subject":  "math" | "physics" | "cs" | "mixed" }]
Aim for 6 to 12 topics. Skip administrative content (grading policy, attendance, etc.) — only academic content.`,
      user: text,
    })

    let topics: any[] = []
    try { topics = JSON.parse(claudeResp) } catch {
      /* try to recover JSON if Claude wrapped it in code fences */
      const m = claudeResp.match(/\[[\s\S]*\]/)
      if (m) try { topics = JSON.parse(m[0]) } catch {}
    }

    /* ── 4. Save parsed topics ── */
    await supabase
      .from('parsed_syllabi')
      .update({
        parsed_topics: topics,
        status:        topics.length > 0 ? 'parsed' : 'failed',
        error_message: topics.length === 0 ? 'AI returned no topics' : null,
        parsed_at:     new Date().toISOString(),
      })
      .eq('id', row.id)

    return json({ ok: true, syllabus_id: row.id, topics })
  } catch (e) {
    console.error('[parse-syllabus]', e)
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
      max_tokens: 3000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
  })
  const data = await res.json()
  return data?.content?.[0]?.text || ''
}
