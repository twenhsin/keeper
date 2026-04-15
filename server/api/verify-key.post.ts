import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { apiKey, userId } = await readBody(event)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'hi' }]
      })
    })

    if (res.ok && userId) {
      const supabase = createClient(
        process.env.SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )
      await supabase
        .from('users')
        .upsert({ id: userId, api_key: apiKey }, { onConflict: 'id' })
    }

    return { valid: res.ok }
  } catch {
    return { valid: false }
  }
})
