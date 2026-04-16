import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const { data: userIds } = await supabase
    .from('weekly_summaries')
    .select('user_id')
    .gte('created_at', thirtyDaysAgo)

  if (!userIds || userIds.length === 0) return { ok: true, processed: 0 }

  const uniqueUserIds = [...new Set(userIds.map(r => r.user_id))]
  let processed = 0

  for (const userId of uniqueUserIds) {
    const { data: user } = await supabase
      .from('users')
      .select('api_key')
      .eq('id', userId)
      .single()

    if (!user?.api_key) continue

    const { data: summaries } = await supabase
      .from('weekly_summaries')
      .select('summary, week_start')
      .eq('user_id', userId)
      .gte('created_at', thirtyDaysAgo)
      .order('week_start', { ascending: true })

    if (!summaries || summaries.length === 0) continue

    const summaryText = summaries
      .map(s => `週開始 ${s.week_start}：${s.summary}`)
      .join('\n')

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': user.api_key,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 400,
          messages: [{
            role: 'user',
            content: `以下是用戶過去四週的每週摘要。請用繁體中文，200字以內，摘要本月重點：長期行為模式、進步或退步的趨勢、持續出現的課題。只輸出摘要文字，不要其他內容。\n\n${summaryText}`
          }]
        })
      })

      if (!res.ok) continue
      const data = await res.json()
      const summary = data.content?.[0]?.text ?? ''
      if (!summary) continue

      const monthStart = new Date()
      monthStart.setDate(1)
      const monthStartStr = monthStart.toISOString().split('T')[0]

      await supabase.from('monthly_summaries').insert({
        user_id: userId,
        summary,
        month_start: monthStartStr
      })

      processed++
    } catch {
      continue
    }
  }

  return { ok: true, processed }
})
