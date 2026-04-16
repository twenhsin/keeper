import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  // 取得過去七天有每日摘要的用戶清單
  const { data: userIds } = await supabase
    .from('conversation_summaries')
    .select('user_id')
    .gte('created_at', sevenDaysAgo)

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
      .from('conversation_summaries')
      .select('summary, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: true })

    if (!summaries || summaries.length === 0) continue

    const summaryText = summaries
      .map(s => `${new Date(s.created_at).toLocaleDateString('zh-TW')}：${s.summary}`)
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
          max_tokens: 300,
          messages: [{
            role: 'user',
            content: `以下是用戶過去七天的每日對話摘要。請用繁體中文，150字以內，摘要本週重點：整體執行趨勢、重複出現的模式、重要決定。只輸出摘要文字，不要其他內容。\n\n${summaryText}`
          }]
        })
      })

      if (!res.ok) continue
      const data = await res.json()
      const summary = data.content?.[0]?.text ?? ''
      if (!summary) continue

      // 計算本週週一
      const monday = new Date()
      monday.setDate(monday.getDate() - monday.getDay() + 1)
      const weekStart = monday.toISOString().split('T')[0]

      await supabase.from('weekly_summaries').insert({
        user_id: userId,
        summary,
        week_start: weekStart
      })

      processed++
    } catch {
      continue
    }
  }

  return { ok: true, processed }
})
