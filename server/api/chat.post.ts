import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { mode, messages, userId, apiKey, notes } = body as {
    mode: 'reminder' | 'chat' | 'task_creation'
    messages: { role: 'user' | 'assistant'; content: string }[]
    userId: string
    apiKey: string
    notes?: { id: string; content: string }[]
  }

  if (!mode || !userId || !apiKey) {
    throw createError({ statusCode: 400, statusMessage: 'Missing required fields' })
  }

  // ===== Supabase（service role，不受 RLS 限制） =====
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const [userRes, habitsRes, plansRes, taskCardsRes, summariesRes, refBooksRes, weeklySummariesRes, monthlySummariesRes] = await Promise.all([
    supabase
      .from('users')
      .select('personal_summary, supervisor_style')
      .eq('id', userId)
      .single(),
    supabase
      .from('habits')
      .select('id, title, description, frequency_days, notify_time, created_at')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('plans')
      .select('id, title, description, total_phases, current_phase, created_at')
      .eq('user_id', userId)
      .eq('is_active', true),
    supabase
      .from('task_cards')
      .select('ref_id, task_type, scheduled_date, is_completed')
      .eq('user_id', userId)
      .gte('scheduled_date', sevenDaysAgo)
      .order('scheduled_date', { ascending: false }),
    supabase
      .from('conversation_summaries')
      .select('summary, created_at')
      .eq('user_id', userId)
      .gte('created_at', sevenDaysAgo)
      .order('created_at', { ascending: false }),
    supabase
      .from('reference_books')
      .select('title')
      .eq('user_id', userId),
    supabase
      .from('weekly_summaries')
      .select('summary, week_start')
      .eq('user_id', userId)
      .gte('created_at', twentyEightDaysAgo)
      .order('week_start', { ascending: false }),
    supabase
      .from('monthly_summaries')
      .select('summary, month_start')
      .eq('user_id', userId)
      .gte('created_at', ninetyDaysAgo)
      .order('month_start', { ascending: false })
  ])

  // ===== 組裝 System Prompt =====
  const user = userRes.data
  const habits = habitsRes.data ?? []
  const plans = plansRes.data ?? []
  const taskCards = taskCardsRes.data ?? []
  const summaries = summariesRes.data ?? []
  const refBooks = refBooksRes.data ?? []
  const weeklySummaries = weeklySummariesRes.data ?? []
  const monthlySummaries = monthlySummariesRes.data ?? []

  const habitsBlock = habits.length > 0
    ? habits.map(h => {
        const createdDate = new Date(h.created_at).toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei' }).replace(/\//g, '-')
        return `- ${h.title} | 每 ${h.frequency_days} 天 | 通知 ${h.notify_time ?? '未設定'} | 建立日期：${createdDate} | ${h.description ?? ''}`
      }).join('\n')
    : '（目前無啟用中的習慣任務）'

  const plansBlock = plans.length > 0
    ? plans.map(p =>
        `- ${p.title} | Phase ${p.current_phase}/${p.total_phases} | ${p.description ?? ''}`
      ).join('\n')
    : '（目前無啟用中的長期任務）'

  const taskCardsBlock = taskCards.length > 0
    ? taskCards.map(t => {
        const date = new Date(t.scheduled_date).toLocaleDateString('zh-TW')
        const status = t.is_completed ? '✓ 完成' : '✗ 未完成'
        return `- ${t.task_type === 'habit' ? '習慣' : '長期'}任務 ${t.ref_id} | ${date} | ${status}`
      }).join('\n')
    : '（近七天無任務記錄）'

  const summariesBlock = summaries.length > 0
    ? summaries.map(s => {
        const date = new Date(s.created_at).toLocaleDateString('zh-TW')
        return `- ${date}：${s.summary}`
      }).join('\n')
    : '（近七天無對話摘要）'

  const modeInstruction: Record<string, string> = {
    reminder: '請根據以上所有資料（包含習慣任務、長期任務、生活觀察紀錄）生成用戶當前應看到的督促提醒。\n根據當前時間判斷最相關的提醒內容，不需要每項都提，選擇此刻最重要的 1-2 件事。\n若有生活觀察紀錄，請在適當時間點納入提醒（例如：早上提醒早餐、晚上提醒睡眠）。\n語氣直接、不廢話。此提醒不計入對話記錄。',
    chat: `現在進入對話模式，根據用戶輸入給予督導回應。

當對話中涉及建立新習慣或長期任務，且以下資訊已經確認完整時，在回應末尾輸出 JSON：
- 習慣任務需要：任務名稱、執行頻率（幾天一次）、通知時間
- 長期任務需要：任務名稱、總 Phase 數、早晚通知時間

資訊不足時繼續對話收集，不要提前輸出 JSON。

確認輸出時，JSON 格式如下，放在回應末尾，前後用 \`\`\`json 標記：

欄位說明：
- description：必填。用繁體中文撰寫，100字以內，包含具體執行內容、時長、頻率，以及用戶提到的任何重要細節。
- notify_time / notify_morning / notify_evening：填入用戶希望收到提醒的時間，不是執行時間。例如用戶七點運動但希望六點半提醒，填 06:30。
- card_mode（習慣任務專用）：
  - "daily"：執行日彈性，用戶可任意一天執行（例如「一週兩次，隨便哪天」、「有空就去」）
  - "scheduled"：固定執行日，只在特定星期幾執行（例如「每週日」、「每週三和週六」且沒有提到補執行）

習慣任務：
\`\`\`json
{"type":"habit","title":"","description":"","frequency_days":0,"notify_time":"HH:MM","card_mode":"daily|scheduled"}
\`\`\`

長期任務：
\`\`\`json
{"type":"long_term","title":"","description":"","total_phases":0,"current_phase":1,"notify_morning":"HH:MM","notify_evening":"HH:MM"}
\`\`\``
  }

  const systemPrompt = `你是用戶的個人督導 Keeper。

你的語氣與行為規則：
- 直接、不客氣、不廢話
- 語氣根據缺席天數分三級：正常執行（鼓勵但簡潔）、缺席1-2天（直接施壓）、缺席3天以上（嚴厲追責）
- 不閒聊、不回應與任務無關的話題
- 不過度安慰、不替用戶找藉口
- 當用戶給藉口時，不接受、直接回到行動要求

任務建立協商規則：
- 用戶提出限制或偏好時，接受作為起點，不重複施壓同一個點
- 在用戶條件內要求具體承諾
- 一次只確認一個變數（頻率、時間、內容擇一）
- 用戶說「就這樣」或給出完整資訊時，立即輸出 JSON

## 關於用戶
${user?.personal_summary ?? '（尚未設定個人資料）'}

${refBooks.length > 0 ? `## 參考書籍概念
用戶希望你在互動中適時引用以下書籍的核心概念，根據用戶當前狀況自然帶入，不需要每次都引用，判斷何時相關再使用：
${refBooks.map(b => `- ${b.title}`).join('\n')}

` : ''}## 當前啟用中的習慣任務
${habitsBlock}

## 當前啟用中的長期任務
${plansBlock}

${(notes && notes.length > 0) ? `---
【生活觀察紀錄】
以下是用戶記錄的生活狀態觀察，請根據當前時間與對話情境，在適當時機自然帶入提醒，不需要每次都提，判斷何時相關再提：
${notes.map(n => `- ${n.content}`).join('\n')}

以上是用戶的生活觀察筆記（Notes）。這些不是正式任務，是用戶希望逐漸改善的生活狀態。
針對 Notes 的提醒風格應柔性為主：提供建議、心理開導、鼓勵分析，偶爾在用戶持續未改善時稍微數落，
並說明原因與重要性。不需要像習慣任務一樣嚴格要求執行。
---

` : ''}## 近期執行狀態（最近七天）
注意：若任務建立日期與當前日期相近（7天以內），表示任務剛建立，不應視為缺席。請根據建立日期與通知時間判斷是否真正缺席，而非單純看打卡記錄空白。
${taskCardsBlock}

## 最近七天對話摘要
${summariesBlock}

${weeklySummaries.length > 0 ? `## 近四週週摘要\n${weeklySummaries.map(s => `- 週開始 ${s.week_start}：${s.summary}`).join('\n')}\n` : ''}
${monthlySummaries.length > 0 ? `## 近三個月月摘要\n${monthlySummaries.map(s => `- ${s.month_start.slice(0, 7)}：${s.summary}`).join('\n')}\n` : ''}
當前時間：${new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'long' })}

${modeInstruction[mode]}`

  // ===== 呼叫 Claude API =====
  const apiMessages = messages.length > 0
    ? messages
    : [{ role: 'user', content: '請生成當前的督促提醒。' }]

  let claudeRes: Response
  try {
    claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: apiMessages
      })
    })
  } catch (err) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to reach Claude API' })
  }

  if (claudeRes.status === 401) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid API key' })
  }

  if (!claudeRes.ok) {
    const errBody = await claudeRes.text()
    throw createError({ statusCode: 500, statusMessage: `Claude API error: ${errBody}` })
  }

  const claudeData = await claudeRes.json() as {
    content: { type: string; text: string }[]
  }

  const content = claudeData.content.find(c => c.type === 'text')?.text ?? ''

  return { content, mode }
})
