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
            @click.stop="deleteCard(i)"
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
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { Save, Trash2 } from 'lucide-vue-next'

const isComposing = ref(false)
const inputText = ref('')
const textareaEl = ref(null)
const cardRefs = []
const MIN_HEIGHT = 24
let nextId = 3

const quotes = ref([
  { id: 1, text: '成功不是終點，失敗也不是終結，唯有繼續前進的勇氣才最重要。', editing: false },
  { id: 2, text: '每一天都是一個新的機會，讓自己變得更好。', editing: false }
])

function addQuote() {
  const text = inputText.value.trim()
  if (!text) return
  quotes.value.unshift({ id: nextId++, text, editing: false })
  inputText.value = ''
  nextTick(resizeTextarea)
}

function startEdit(i) {
  if (quotes.value[i].editing) return
  quotes.value[i].editing = true
  nextTick(() => cardRefs[i]?.focus())
}

function saveCard(i) {
  quotes.value[i].editing = false
}

function deleteCard(i) {
  quotes.value.splice(i, 1)
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
</style>
