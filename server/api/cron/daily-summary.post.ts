import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  )

  // 取得所有今天有對話記錄的用戶
  const { data: users } = await supabase
    .from('users')
    .select('id, api_key, today_messages, messages_date')
    .not('today_messages', 'eq', '[]')
    .not('today_messages', 'is', null)

  if (!users || users.length === 0) return { ok: true, processed: 0 }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toLocaleDateString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).replace(/\//g, '-')

  let processed = 0

  for (const user of users) {
    if (!user.api_key || !user.today_messages?.length) continue
    // 只處理昨天的對話
    if (user.messages_date !== yesterdayStr) continue

    // 組成摘要 prompt
    const conversationText = user.today_messages
      .map((m: any) => `${m.role === 'user' ? '用戶' : 'Keeper'}：${m.content}`)
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
            content: `以下是用戶昨天與 Keeper 的對話記錄。請用繁體中文，100字以內，摘要重點：用戶的狀態、執行情況、任何重要決定或模式。只輸出摘要文字，不要其他內容。\n\n${conversationText}`
          }]
        })
      })

      if (!res.ok) continue
      const data = await res.json()
      const summary = data.content?.[0]?.text ?? ''
      if (!summary) continue

      // 寫入 conversation_summaries
      await supabase.from('conversation_summaries').insert({
        user_id: user.id,
        summary,
        created_at: new Date().toISOString()
      })

      // 清空 today_messages
      await supabase.from('users').update({
        today_messages: [],
        messages_date: null
      }).eq('id', user.id)

      processed++
    } catch {
      continue
    }
  }

  return { ok: true, processed }
})
