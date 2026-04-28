<template>
  <div class="page">
    <div class="page-header">
      <PageHeader title="Quotes" />
    </div>

    <div class="page-content">
      <div class="quotes-list">
        <div v-for="(quote, i) in quotes" :key="quote.id" class="quote-card">
          <textarea
            :ref="el => { if (el) cardRefs[i] = el }"
            v-model="quote.text"
            class="quote-textarea"
            :readonly="!quote.editing"
            @click="startEdit(i)"
          />
          <button
            v-if="!quote.editing"
            class="card-btn"
            type="button"
            aria-label="Delete"
            @click.stop="requestDelete(i)"
          >
            <Trash2 :size="18" />
          </button>
          <button
            v-else-if="quote.text.trim()"
            class="card-btn"
            type="button"
            aria-label="Save"
            @click.stop="saveCard(i)"
          >
            <Save :size="18" />
          </button>
        </div>
      </div>
    </div>

    <div class="input-section">
      <div class="input-outer">
        <div class="input-inner">
          <textarea
            ref="textareaEl"
            v-model="inputText"
            class="input-textarea"
            placeholder="記下這句話…"
            @input="resizeTextarea"
            @keydown="handleInputKeyDown"
            @compositionstart="isComposing = true"
            @compositionend="isComposing = false"
          />
          <div class="input-actions">
            <button v-if="inputText.trim()" class="send-btn" type="button" aria-label="Save" @click="addQuote">
              <Save :size="16" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <ConfirmDialog v-model="showConfirm" message="確定刪除這則 Quote？" @confirm="confirmDelete" />

    <Teleport to="body">
      <div v-if="toastText" class="toast">{{ toastText }}</div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Save, Trash2 } from 'lucide-vue-next'

const supabase = useSupabaseClient()

const isComposing = ref(false)
const inputText = ref('')
const textareaEl = ref(null)
const cardRefs = []
const MIN_HEIGHT = 24

const userId = ref('')
const quotes = ref([])
const showConfirm = ref(false)
const pendingDeleteIndex = ref(-1)
const toastText = ref('')
let toastTimer = null

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  userId.value = user.id

  const { data } = await supabase
    .from('quotes')
    .select('id, content, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  quotes.value = (data ?? []).map(q => ({ id: q.id, text: q.content, editing: false }))
})

onBeforeUnmount(() => clearTimeout(toastTimer))

async function addQuote() {
  const content = inputText.value.trim()
  if (!content || !userId.value) return

  const { data, error } = await supabase
    .from('quotes')
    .insert({ user_id: userId.value, content })
    .select('id, content, created_at')
    .single()

  if (error || !data) return

  quotes.value.unshift({ id: data.id, text: data.content, editing: false })
  inputText.value = ''
  nextTick(resizeTextarea)
  showToast('已儲存')
}

function requestDelete(i) {
  pendingDeleteIndex.value = i
  showConfirm.value = true
}

async function confirmDelete() {
  const i = pendingDeleteIndex.value
  if (i === -1) return
  const quote = quotes.value[i]

  const { error } = await supabase
    .from('quotes')
    .delete()
    .eq('id', quote.id)
    .eq('user_id', userId.value)

  if (error) return
  quotes.value.splice(i, 1)
  pendingDeleteIndex.value = -1
}

async function saveCard(i) {
  const quote = quotes.value[i]
  const content = quote.text.trim()
  if (!content) return

  const { error } = await supabase
    .from('quotes')
    .update({ content })
    .eq('id', quote.id)
    .eq('user_id', userId.value)

  if (error) return
  quotes.value[i].text = content
  quotes.value[i].editing = false
}

function startEdit(i) {
  if (quotes.value[i].editing) return
  quotes.value[i].editing = true
  nextTick(() => cardRefs[i]?.focus())
}

function showToast(text) {
  toastText.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastText.value = '' }, 2500)
}

function resizeTextarea() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  void el.offsetHeight
  el.style.height = Math.max(MIN_HEIGHT, el.scrollHeight) + 'px'
}

function handleInputKeyDown(e) {
  if (e.key !== 'Enter') return
  if (isComposing.value) return
  if (window.matchMedia('(max-width: 767px)').matches) return
  if (e.shiftKey || e.metaKey || e.ctrlKey) return
  e.preventDefault()
  addQuote()
}
</script>

<style scoped>
.page {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding-bottom: 24px;
}

.page-header {
  flex-shrink: 0;
  padding-top: 24px;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
  padding: 16px 0 80px;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

.page-content::-webkit-scrollbar {
  display: none;
}

.quotes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quote-card {
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 1.0);
  border-radius: 20px;
  padding: 16px;
  position: relative;
}

.quote-textarea {
  display: block;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  padding: 0;
  padding-right: 48px;
  font-family: inherit;
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.5;
  min-height: 24px;
  field-sizing: content;
  box-sizing: border-box;
}

.quote-textarea[readonly] {
  cursor: default;
}

.card-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #FF7FDC;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== Input 區（同 index.vue） ===== */
.input-section {
  flex-shrink: 0;
  z-index: 50;
}

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
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  padding: 0;
  font-family: inherit;
  font-size: 16px;
  color: var(--text-primary);
  line-height: 1.5;
  min-height: 24px;
  overflow-y: hidden;
  box-sizing: border-box;
}

.input-textarea::placeholder {
  color: var(--text-placeholder);
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
  border-radius: var(--core-radius-300);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-inverse);
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
</style>
