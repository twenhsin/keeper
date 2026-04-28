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

  const [userRes, summariesRes, refBooksRes, weeklySummariesRes, monthlySummariesRes] = await Promise.all([
    supabase
      .from('users')
      .select('personal_summary, supervisor_style')
      .eq('id', userId)
      .single(),
    mode === 'reminder'
      ? Promise.resolve({ data: [] })
      : supabase
          .from('conversation_summaries')
          .select('summary, created_at')
          .eq('user_id', userId)
          .gte('created_at', sevenDaysAgo)
          .order('created_at', { ascending: false }),
    supabase
      .from('reference_books')
      .select('title')
      .eq('user_id', userId),
    mode === 'reminder'
      ? Promise.resolve({ data: [] })
      : supabase
          .from('weekly_summaries')
          .select('summary, week_start')
          .eq('user_id', userId)
          .gte('created_at', twentyEightDaysAgo)
          .order('week_start', { ascending: false }),
    mode === 'reminder'
      ? Promise.resolve({ data: [] })
      : supabase
          .from('monthly_summaries')
          .select('summary, month_start')
          .eq('user_id', userId)
          .gte('created_at', ninetyDaysAgo)
          .order('month_start', { ascending: false })
  ])

  // ===== 組裝 System Prompt =====
  const user = userRes.data
  const habits: any[] = body.habits ?? []
  const plans: any[] = body.plans ?? []
  const taskCards: any[] = body.taskCards ?? []
  const summaries = summariesRes.data ?? []
  const refBooks = refBooksRes.data ?? []
  const weeklySummaries = weeklySummariesRes.data ?? []
  const monthlySummaries = monthlySummariesRes.data ?? []

  const weekdayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六']

  const habitsBlock = habits.length > 0
    ? habits.map(h => {
        const fixedDays = h.required_weekdays?.length
          ? h.required_weekdays.map((d: number) => weekdayNames[d]).join('、')
          : null
        const schedule = fixedDays
          ? `固定 ${fixedDays}`
          : h.period_days
            ? `每 ${h.period_days} 天`
            : '每天'
        const extra = h.allow_extra ? '｜可加分打卡' : ''
        const makeup = h.allow_makeup ? '｜可補打卡' : ''
        const notify = h.notify_times?.length ? h.notify_times.join('、') : '未設定'
        return `- [id:${h.id}] ${h.title} | ${schedule}${extra}${makeup} | 通知 ${notify} | ${h.description ?? ''}`
      }).join('\n')
    : '（目前無啟用中的習慣任務）'

  const plansBlock = plans.length > 0
    ? plans.map(p =>
        `- ${p.title} | Phase ${p.current_phase}/${p.total_phases} | ${p.description ?? ''}`
      ).join('\n')
    : '（目前無啟用中的長期任務）'

  const habitMap: Record<string, string> = {}
  for (const h of habits) habitMap[h.id] = h.title

  const planMap: Record<string, string> = {}
  for (const p of plans) planMap[p.id] = p.title

  const taskCardsBlock = taskCards.length > 0
    ? taskCards.map(t => {
        const date = new Date(t.scheduled_date).toLocaleDateString('zh-TW')
        const status = t.is_completed ? '✓ 完成' : '✗ 未完成'
        const name = t.task_type === 'habit'
          ? (habitMap[t.ref_id] ?? t.ref_id)
          : (planMap[t.ref_id] ?? t.ref_id)
        return `- ${name} | ${date} | ${status}`
      }).join('\n')
    : '（近七天無任務記錄）'

  const summariesBlock = summaries.length > 0
    ? summaries.map(s => {
        const date = new Date(s.created_at).toLocaleDateString('zh-TW')
        return `- ${date}：${s.summary}`
      }).join('\n')
    : '（近七天無對話摘要）'

  const modeInstruction: Record<string, string> = {
    reminder: '請根據以上所有資料（包含習慣任務、長期任務、生活觀察紀錄）生成用戶當前應看到的督促提醒。\n根據當前時間判斷最相關的提醒內容，不需要每項都提，選擇此刻最重要的 1-2 件事。\n若有生活觀察紀錄，請在適當時間點納入提醒（例如：早上提醒早餐、晚上提醒睡眠）。\n若用戶有設定參考書籍，從中擷取一句與當前狀態相關的概念或短語，作為提醒的開頭或結尾，語氣自然不刻意，一句話即可。\n語氣直接、不廢話。此提醒不計入對話記錄。',
    chat: `現在進入對話模式，根據用戶輸入給予督導回應。

當對話中涉及建立新習慣或長期任務，或修改現有習慣，流程分兩步驟，絕對不可合併：

第一步：資訊收集完整後，整理清單列出所有設定，最後問「這樣正確嗎？是否執行建立（或更新）？」
這一則回應絕對不能包含 JSON，只能有清單和確認問句。

第二步：用戶明確回覆確認（如「正確」、「好」、「確認」、「可以」、「就這樣」）後，
下一則回應只輸出 JSON，不重複清單，不再詢問。

違反以上順序（例如在列清單的同一則回應裡輸出 JSON）是錯誤行為。

JSON 格式如下，放在回應末尾，前後用 \`\`\`json 標記：

欄位說明：
- description：必填。用繁體中文撰寫，100字以內，包含具體執行內容、時長、頻率，以及用戶提到的任何重要細節。
- notify_morning / notify_evening：填入用戶希望收到提醒的時間，不是執行時間。例如用戶七點運動但希望六點半提醒，填 06:30。
- required_weekdays：固定執行的星期幾，0=週日、1=週一…6=週六，例 [3,0] 代表週三和週日。沒有固定日填 null
- period_days：週期卡，每 N 天出現一次。有 required_weekdays 時填 null
- allow_extra：非固定日是否也出現加分打卡卡片
- allow_makeup：錯過固定日或週期日，隔天是否補一張打卡卡片
- daily_slots：一天幾張卡，預設 1，早晚各一填 2
- card_show_time：卡片從幾點開始顯示，null 表示全天顯示
- notify_times：推播通知時間，陣列格式

習慣任務：
\`\`\`json
{"type":"habit","title":"","description":"","required_weekdays":[0,3],"period_days":null,"allow_extra":false,"allow_makeup":false,"daily_slots":1,"card_show_time":null,"notify_times":["HH:MM"]}
\`\`\`

長期任務：
\`\`\`json
{"type":"long_term","title":"","description":"","total_phases":0,"current_phase":1,"notify_morning":"HH:MM","notify_evening":"HH:MM"}
\`\`\``
  }

  const systemPrompt = `你是用戶的個人督導 Keeper。

你的語氣與行為規則：
語氣層級（每次回應前先判斷當前層級）：
- 層級 0：所有任務近期有打卡，非執行時段 → 友善、像朋友、可分享書籍觀念
- 層級 1：近期有打卡，沒有明顯缺席 → 簡潔平穩、帶鼓勵
- 層級 2：任何任務缺席 1-2 天 → 直接、輕微施壓
- 層級 3：任何任務缺席 3 天以上 → 嚴厲、明確要求

判斷順序：先看所有習慣與 Notes 的缺席狀況，缺席優先升級。
層級 0 和 1 時，可以給予鼓勵、安慰、分享書籍觀念，語氣像關心用戶的朋友。
層級 2 和 3 時，不接受藉口，直接回到行動要求。

其他規則：
- 每次回應前，把習慣任務、Notes、打卡記錄都看過，確保掌握用戶整體狀態
- Notes 與習慣任務同等重要，不可忽略任何一項
- 用戶分享事情或心情時，先理解、表示認同，再給建議或督促，不要直接否定
- 需要鼓勵時給鼓勵，需要安慰時給安慰，根據當前狀態判斷
- 不在用戶沒問的情況下持續給建議
- 當用戶給藉口時（層級 2-3），不接受、直接回到行動要求
- 當你在 reminder 中生成有影響力的概念句、或引用 reference books 的觀念時，用 [QUOTE]...[/QUOTE] 包起來。每次最多標記一句，不要整段都標記。

任務建立協商規則：
- 用戶提出限制或偏好時，接受作為起點，不重複施壓同一個點
- 在用戶條件內要求具體承諾
- 一次只確認一個變數（頻率、時間、內容擇一）
- 所有資訊確認完整後，先整理方案說明給用戶確認，詢問「這樣可以嗎？」或「確認這樣設定嗎？」，等用戶明確回覆同意後，才輸出 JSON
- 用戶回覆同意（如「可以」、「好」、「確認」、「就這樣」）後，立即輸出 JSON，不再重複詢問
- 習慣任務命名規則：頻率寫在前面，例如「一週三次健身房運動習慣」、「每日起床伸展操」
- 當用戶使用「調整」、「升級」、「改為」、「提升」等字眼描述現有習慣時，詢問：「這是要修改現有的〔習慣名稱〕，還是建立一個全新的習慣？」確認後再輸出 JSON
- 用戶確認修改現有習慣時，輸出 habit_update JSON（帶原有 habit id），格式如下，放在回應末尾，前後用 \`\`\`json 標記：
{"type":"habit_update","id":"現有habit的uuid","title":"","description":"","required_weekdays":[],"period_days":null,"allow_extra":false,"allow_makeup":false,"daily_slots":1,"card_show_time":null,"notify_times":["HH:MM"]}
- 若建立的習慣任務名稱與現有任務相同或相似，title 自動在後面加上括號說明以區別，例如「健身房運動習慣（一週三次）」，不要使用 v2 這類版本號

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
        messages: apiMessages,
        stream: true
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

  // 把 Claude 的 SSE stream 直接轉給前端
  const headers = new Headers({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Mode': mode
  })

  return new Response(claudeRes.body, { headers })
})
