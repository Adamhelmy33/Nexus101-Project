// ═══════════════════════════════════════════════
// Edge Function: study-buddy-chat
// ═══════════════════════════════════════════════
// 1. Embed the user's question (OpenAI text-embedding-3-small)
// 2. Retrieve top-K chunks from course_chunks (pgvector)
// 3. Build a curriculum-grounded prompt
// 4. Stream back a Claude (Anthropic) response with citations
//
// Env vars to set:
//   ANTHROPIC_API_KEY
//   OPENAI_API_KEY
//   SUPABASE_URL                ← auto
//   SUPABASE_SERVICE_ROLE_KEY   ← auto

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
    const { question, courseId, history = [] } = await req.json()
    if (!question) return json({ error: 'Missing question' }, 400)

    /* 1. Embed question */
    const embRes = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: question }),
    })
    const embJson = await embRes.json()
    const embedding = embJson?.data?.[0]?.embedding
    if (!embedding) throw new Error('Embedding failed')

    /* 2. Retrieve top chunks from Postgres */
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: chunks } = await supabase.rpc('match_course_chunks', {
      p_query_embedding: embedding,
      p_course_id:       courseId || null,
      p_match_count:     5,
      p_min_score:       0.45,
    })

    /* 3. Build prompt */
    const context = (chunks || []).map((c: any, i: number) =>
      `--- Source ${i + 1} (score ${c.score?.toFixed(2)}) ---\n${c.content}\n`
    ).join('\n')

    const system = `You are the Nexus 101 Study Buddy.

Rules:
• ONLY answer using the SOURCE TEXT below. If the answer isn't there, say so honestly and suggest which module the student should review.
• Keep answers tight, exam-focused, and friendly. Bullet points and numbered steps are great.
• When citing, mention the source (e.g. "see source 2 above"). The frontend will render citation links.
• If the student asks for a quiz, write 1 multiple-choice question (4 options, mark the correct one).

SOURCE TEXT:
${context || '(no relevant material found — answer "I don\'t have material on that yet" honestly)'}`

    const messages = [
      ...history.slice(-6),
      { role: 'user', content: question },
    ]

    /* 4. Call Anthropic */
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'x-api-key':          Deno.env.get('ANTHROPIC_API_KEY')!,
        'anthropic-version':  '2023-06-01',
      },
      body: JSON.stringify({
        model:       'claude-3-5-sonnet-latest',
        max_tokens:  800,
        system,
        messages,
      }),
    })
    const claude = await claudeRes.json()
    const answer = claude?.content?.[0]?.text || "I don't have material on that yet."

    return json({
      ok: true,
      answer,
      citations: (chunks || []).map((c: any) => ({
        chunk_id:     c.id,
        module_id:    c.module_id,
        score:        c.score,
        excerpt:      String(c.content).slice(0, 140) + '…',
      })),
    })
  } catch (e) {
    console.error('[study-buddy-chat]', e)
    return json({ error: e.message || 'unknown error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}
