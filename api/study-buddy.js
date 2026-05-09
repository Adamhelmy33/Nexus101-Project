/**
 * Vercel/Node serverless route for the Study Buddy.
 * Acts as a curriculum-grounded fallback when Supabase isn't connected.
 *
 * Set ANTHROPIC_API_KEY in your .env (or Vercel project env vars).
 * The frontend calls /api/study-buddy automatically.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(503).json({ error: 'ANTHROPIC_API_KEY not set' })

  const { question, courseId, history = [] } = req.body
  if (!question) return res.status(400).json({ error: 'Missing question' })

  try {
    const claude = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-3-5-sonnet-latest',
        max_tokens: 800,
        system: `You are the Nexus 101 Study Buddy — a tutor for university students at UH, BUE, and GUC.
Keep answers tight, exam-focused, friendly. Use bullet points and numbered steps.
If the student asks for a quiz, write 1 multiple-choice question (4 options, mark the correct one).
If the student needs to revise something, suggest which Nexus 101 module would help most.
${courseId ? `Current module context: ${courseId}` : ''}`.trim(),
        messages: [
          ...history.slice(-6),
          { role: 'user', content: question },
        ],
      }),
    })
    const data = await claude.json()
    const answer = data?.content?.[0]?.text
    if (!answer) throw new Error(data?.error?.message || 'No answer')

    return res.status(200).json({ ok: true, answer, citations: [] })
  } catch (err) {
    console.error('[study-buddy]', err)
    return res.status(500).json({ error: err.message })
  }
}
