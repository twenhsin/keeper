<template>
  <div class="page">
    <BottomNav active="home" />

    <div ref="mainContentEl" class="main-content">
      <!-- 對話區 -->
      <div ref="chatEl" class="chat-area">
        <!-- 督促提醒文字（非對話模式） -->
        <template v-if="!isChatMode">
          <p class="ai-reminder">
            {{ isLoadingReminder ? '...' : reminderText }}
          </p>
        </template>

        <!-- 對話訊息列表（對話模式） -->
        <template v-else>
          <div v-for="(msg, i) in messages" :key="i" class="msg-row">
            <ChatBubble
              v-if="msg.role === 'user'"
              align="right"
              :content="msg.content"
            />
            <p v-else class="ai-text" style="white-space: pre-line">{{ msg.content }}</p>
          </div>
          <!-- AI 載入中氣泡 -->
          <p v-if="isLoadingChat" class="ai-text loading-dots">...</p>
        </template>
      </div>
    </div>

    <!-- 底部 Input 區 -->
    <div class="input-section">
      <!-- 外層：漸層背景 + border + shadow -->
      <div class="input-outer">
        <div class="input-inner">
          <textarea
            ref="textareaEl"
            v-model="inputText"
            class="input-textarea"
            placeholder="Reply"
            @input="resizeTextarea"
            @focus="enterChatMode"
          />
          <div class="input-actions">
            <button v-if="!isLoadingChat" class="send-btn" type="button" aria-label="Send" @click="sendMessage">
              <ArrowUp :size="16" :stroke-width="2" />
            </button>
            <button v-else class="send-btn" type="button" aria-label="Stop" @click="stopMessage">
              <Square :size="16" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toastText" class="toast">{{ toastText }}</div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ArrowUp, Square } from 'lucide-vue-next'

const supabase = useSupabaseClient()

/* ===== 狀態 ===== */
const userId = ref('')
const apiKey = ref('')
const messages = ref([])
const reminderText = ref('')
const isLoadingReminder = ref(true)
const isLoadingChat = ref(false)
const isChatMode = ref(false)
const toastText = ref('')

const inputText = ref('')
const mainContentEl = ref(null)
const textareaEl = ref(null)
const MIN_HEIGHT = 44
let toastTimer = null
const abortController = ref(null)

// iOS Safari 鍵盤收起後強制修正高度
function onFocusOut() {
  setTimeout(() => { window.scrollTo(0, 0) }, 100)
}

const today = new Date().toLocaleDateString('zh-TW', {
  timeZone: 'Asia/Taipei',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
}).replace(/\//g, '-')

/* ===== onMounted：取得用戶資料 → 還原對話 → 拉提醒 ===== */
onMounted(async () => {
  window.addEventListener('focusout', onFocusOut)

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    reminderText.value = '請先登入以使用 Keeper'
    isLoadingReminder.value = false
    return
  }
  userId.value = user.id

  const { data: userData } = await supabase
    .from('users')
    .select('api_key, today_messages, messages_date')
    .eq('id', user.id)
    .single()

  if (!userData?.api_key) {
    reminderText.value = '請先至 Setting 設定有效的 Claude API Key'
    isLoadingReminder.value = false
    return
  }
  apiKey.value = userData.api_key

  // ===== 還原當天對話記錄 =====
  console.log('today:', today, 'messages_date:', userData.messages_date)
  if (userData.messages_date === today) {
    messages.value = userData.today_messages ?? []
  } else {
    messages.value = []
    await supabase.from('users').update({ today_messages: [], messages_date: today }).eq('id', user.id)
  }

  // ===== 拉督促提醒 =====
  try {
    const res = await $fetch('/api/chat', {
      method: 'POST',
      body: { mode: 'reminder', messages: [], userId: userId.value, apiKey: apiKey.value }
    })
    reminderText.value = res.content
  } catch (err) {
    if (err?.statusCode === 401) {
      reminderText.value = '請先至 Setting 設定有效的 Claude API Key'
    } else {
      reminderText.value = '無法載入提醒，請稍後再試'
    }
  } finally {
    isLoadingReminder.value = false
  }
})

onBeforeUnmount(() => {
  clearTimeout(toastTimer)
  window.removeEventListener('focusout', onFocusOut)
})

/* ===== 送出訊息 ===== */
async function sendMessage() {
  const content = inputText.value.trim()
  if (!content || isLoadingChat.value) return

  inputText.value = ''
  messages.value.push({ role: 'user', content })
  isLoadingChat.value = true
  await nextTick()
  resizeTextarea()
  scrollToBottom()

  abortController.value = new AbortController()

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      signal: abortController.value.signal,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        mode: 'chat',
        messages: messages.value.map(m => ({ role: m.role, content: m.content })),
        userId: userId.value,
        apiKey: apiKey.value
      })
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      if (res.status === 401) {
        messages.value.push({ role: 'assistant', content: '請先至 Setting 設定有效的 Claude API Key' })
      } else {
        messages.value.push({ role: 'assistant', content: '發生錯誤，請稍後再試' })
      }
    } else {
      const data = await res.json()
      const displayContent = await processAssistantContent(data.content)
      messages.value.push({ role: 'assistant', content: displayContent })
      await saveMessages()
    }
  } catch (e) {
    if (e.name === 'AbortError') return
    messages.value.push({ role: 'assistant', content: '發生錯誤，請稍後再試' })
  } finally {
    abortController.value = null
    isLoadingChat.value = false
    nextTick(scrollToBottom)
  }
}

/* ===== 切換到對話模式 ===== */
function enterChatMode() {
  if (isChatMode.value) return
  isChatMode.value = true
  nextTick(scrollToBottom)
}

/* ===== 寫回 Supabase ===== */
async function saveMessages() {
  if (!userId.value) return
  await supabase.from('users').update({
    today_messages: messages.value,
    messages_date: today
  }).eq('id', userId.value)
}

/* ===== 暫停訊息 ===== */
function stopMessage() {
  abortController.value?.abort()
  abortController.value = null
  isLoadingChat.value = false
}

/* ===== 偵測 JSON → 寫入 Supabase ===== */
async function processAssistantContent(content) {
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) return content

  try {
    const parsed = JSON.parse(jsonMatch[1])
    const { type, title } = parsed

    if (type === 'habit') {
      await supabase.from('habits').insert({
        user_id: userId.value,
        title: parsed.title,
        description: parsed.description ?? '',
        frequency_days: parsed.frequency_days,
        notify_time: parsed.notify_time,
        is_active: true
      })
    } else if (type === 'long_term') {
      await supabase.from('plans').insert({
        user_id: userId.value,
        title: parsed.title,
        description: parsed.description ?? '',
        total_phases: parsed.total_phases,
        current_phase: parsed.current_phase,
        notify_morning: parsed.notify_morning,
        notify_evening: parsed.notify_evening,
        is_active: true
      })
    }

    showToast(`已建立任務：${title}`)
    return content.replace(jsonMatch[0], `✓ 已建立任務：${title}`)
  } catch {
    return content
  }
}

/* ===== Toast ===== */
function showToast(text) {
  toastText.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastText.value = '' }, 3000)
}

/* ===== UI helpers ===== */
function resizeTextarea() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  // 強制 reflow 後再讀 scrollHeight，確保空值時高度正確收縮
  void el.offsetHeight
  el.style.height = Math.max(MIN_HEIGHT, el.scrollHeight) + 'px'
}

function scrollToBottom() {
  const el = mainContentEl.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}
</script>

<style scoped>
/* ===== 頁面容器 ===== */
.page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
  padding-bottom: 60px; /* BottomNav 高度，讓 flex 內容不被蓋住 */
}

/* ===== 主內容區（可捲動） ===== */
.main-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
  padding: 24px;
}

/* ===== 對話內容區 ===== */
.chat-area {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-chat);
}
/* AI 督促提醒文字（空狀態） */
.ai-reminder {
  font-size: var(--typography-ai-size);
  font-weight: var(--typography-ai-weight);
  line-height: var(--typography-ai-line-height);
  color: var(--text-primary);
  margin: 0;
  white-space: pre-line;
}

/* AI 訊息（無氣泡） */
.ai-text {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  margin: 0;
}

/* ===== Input 區 ===== */
.input-section {
  flex-shrink: 0;
  padding: 8px 24px 12px;
}

/* 外層：漸層背景 + border + shadow + 8px padding */
.input-outer {
  background: linear-gradient(to right, #F4EED1, #F8E3DA, #DBE7F7);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 24px rgba(122, 64, 153, 0.15);
  padding: 8px;
}

.input-inner {
  background: rgba(255, 255, 255, 1.0);
  border-radius: 20px;
  padding: 16px 16px 12px;
}

.input-textarea {
  display: block;
  width: 100%;
  min-height: 44px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  padding: 0;
  font-family: inherit;
  font-size: 16px;
  color: var(--text-primary);
  line-height: var(--typography-body-line-height);
  overflow-y: hidden;
  box-sizing: border-box;
}

.input-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.send-btn {
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background: var(--gradient-brand);
  border: none;
  border-radius: var(--core-radius-300); /* 12px */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
}

.input-textarea::placeholder {
  color: var(--text-placeholder); /* #868385 */
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  top: 24px;
  left: var(--spacing-page-x);
  right: var(--spacing-page-x);
  z-index: 300;
  background: var(--gradient-brand);
  color: var(--text-inverse);
  border-radius: var(--radius-toast);
  padding: var(--core-spacing-300) var(--core-spacing-600);
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  text-align: center;
  pointer-events: none;
}

/* ===== Desktop (≥ 768px) ===== */
@media (min-width: 768px) {
  .page {
    padding-left: 80px;
    padding-bottom: 0;
  }

  .main-content {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    padding-bottom: 0;
  }

  /* Desktop: input 在 flex flow 內，非 fixed */
  .input-section {
    max-width: 800px;
    margin: 0 auto;
    width: 100%;
    padding: 0 var(--spacing-page-x) var(--spacing-page-bottom);
  }

  /* Desktop: chat-area 恢復正常 padding-bottom */
  .chat-area {
    padding-bottom: var(--spacing-gap-chat);
  }
}
</style>
