<template>
  <div class="page">
    <BottomNav active="setting" />

    <!-- Fixed PageHeader -->
    <div class="header-wrapper">
      <PageHeader title="Setting" />
    </div>

    <!-- Scrollable Content -->
    <div class="main-content">

      <!-- 區塊一：Claude API KEY -->
      <div class="section">
        <h2 class="section-title">Claude API KEY</h2>
        <div class="api-box">
          <input
            v-model="apiKeyInput"
            type="text"
            class="api-input"
            placeholder="貼上你的 Claude API Key"
            @input="handleApiKeyInput"
          />
          <button class="upload-btn" type="button" @click="saveApiKey">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 15V4M12 4L8 8M12 4L16 8" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M4 17v1a2 2 0 002 2h12a2 2 0 002-2v-1" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 區塊二：About Me -->
      <div class="section">
        <h2 class="section-title">About Me</h2>
        <div class="about-wrapper">
          <textarea
            ref="aboutTextareaEl"
            v-model="aboutMe"
            class="about-textarea"
            placeholder="描述你自己，讓 AI 更了解你的習慣與目標…"
            @input="handleAboutInput"
          />
          <button
            class="save-btn"
            type="button"
            :disabled="aboutSaveState === 'disabled'"
            :class="{ 'save-btn--disabled': aboutSaveState === 'disabled' }"
            @click="saveAboutMe"
          >
            <Check v-if="aboutSaveState === 'saved'" :size="18" :stroke-width="2" color="white" />
            <Save v-else :size="18" :stroke-width="2" color="white" />
          </button>
        </div>
      </div>

      <!-- 區塊三：Project -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Project</h2>
          <button class="add-btn" type="button" @click="triggerFileInput">+</button>
        </div>
        <div class="file-list">
          <FileCard
            v-for="file in projectFiles"
            :key="file.id"
            :filename="file.filename"
            :type="file.type"
            deletable
            @delete="deleteFile(file.id)"
          />
        </div>
      </div>

    </div>

    <!-- 隱藏 file input -->
    <input
      ref="fileInputEl"
      type="file"
      accept=".md"
      class="hidden-input"
      @change="handleFileUpload"
    />

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import { Save, Check } from 'lucide-vue-next'

definePageMeta({ middleware: 'setting' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// ===== API Key =====
const apiKeyInput = ref('')
const rawApiKey = ref('')
const isMaskedDisplay = ref(false)

function maskKey(key) {
  if (!key || key.length <= 5) return key
  return key.slice(0, 5) + '*'.repeat(Math.min(key.length - 5, 24))
}

function handleApiKeyInput() {
  isMaskedDisplay.value = false
}

async function saveApiKey() {
  const keyToSave = isMaskedDisplay.value ? rawApiKey.value : apiKeyInput.value.trim()
  if (!keyToSave) return
  try {
    localStorage.setItem('keeper_api_key', btoa(keyToSave))
    rawApiKey.value = keyToSave
    apiKeyInput.value = maskKey(keyToSave)
    isMaskedDisplay.value = true
  } catch {
    showToast('儲存失敗，請重試')
    return
  }

  // 驗證 API Key（透過 server route 避免 CORS）
  try {
    const { data: { user: currentUser } } = await supabase.auth.getUser()
    const res = await $fetch('/api/verify-key', {
      method: 'POST',
      body: { apiKey: keyToSave, userId: currentUser?.id ?? '' }
    })
    if (res.valid) {
      showToast('API Key 驗證成功')
    } else {
      showToast('API Key 無效，請確認')
    }
  } catch {
    showToast('API Key 無效，請確認')
  }
}

// ===== About Me =====
const aboutMe = ref('')
const aboutTextareaEl = ref(null)
// 'disabled'（無文字）| 'save'（可儲存）| 'saved'（已儲存）
const aboutSaveState = ref('disabled')

function resizeAboutTextarea() {
  const el = aboutTextareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.max(180, el.scrollHeight) + 'px'
}

function handleAboutInput() {
  resizeAboutTextarea()
  aboutSaveState.value = aboutMe.value.trim() ? 'save' : 'disabled'
}

async function saveAboutMe() {
  if (aboutSaveState.value === 'disabled') return
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return
  const { error } = await supabase
    .from('users')
    .upsert({ id: userId, personal_summary: aboutMe.value })
  if (!error) {
    aboutSaveState.value = 'saved'
    showToast('已儲存')
  }
}

// ===== Project Files =====
const projectFiles = ref([])
const fileInputEl = ref(null)

function triggerFileInput() {
  console.log('triggerFileInput called, ref:', fileInputEl.value)
  fileInputEl.value?.click()
}

async function handleFileUpload(event) {
  console.log('handleFileUpload triggered, files:', event.target.files)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return
  const file = event.target.files?.[0]
  if (!file) return

  const content = await file.text()
  const filename = file.name
  const ext = filename.split('.').pop()
  const type = ext ? ext.toUpperCase() : 'MD'

  const { error: insertError } = await supabase
    .from('project_files')
    .insert({ filename, content, user_id: userId, type })

  console.log('[project_files] insert error:', insertError)
  console.log('[project_files] insert payload:', { filename, user_id: userId, type })

  if (insertError) {
    event.target.value = ''
    return
  }

  // insert 成功後重新撈取清單
  await fetchProjectFiles()

  // reset input 以允許重複上傳同名檔案
  event.target.value = ''
}

async function fetchProjectFiles() {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return

  const { data, error } = await supabase
    .from('project_files')
    .select('id, filename, type')
    .eq('user_id', userId)
    .order('created_at')

  if (error) {
    console.error('[project_files] fetch error:', error)
    return
  }
  projectFiles.value = data ?? []
}

async function deleteFile(fileId) {
  const { error } = await supabase
    .from('project_files')
    .delete()
    .eq('id', fileId)

  if (!error) {
    projectFiles.value = projectFiles.value.filter(f => f.id !== fileId)
  }
}

// ===== Toast =====
const toastMsg = ref('')
let toastTimer = null

function showToast(msg) {
  toastMsg.value = msg
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMsg.value = '' }, 3000)
}

// ===== Init =====
onMounted(async () => {
  // API Key
  const stored = localStorage.getItem('keeper_api_key')
  if (stored) {
    try {
      rawApiKey.value = atob(stored)
      apiKeyInput.value = maskKey(rawApiKey.value)
      isMaskedDisplay.value = true
    } catch {}
  }

  // 直接用 getUser() 撈 Supabase 資料，不等 watch(user)
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  if (!currentUser?.id) return

  const { data: userData } = await supabase
    .from('users')
    .select('personal_summary')
    .eq('id', currentUser.id)
    .maybeSingle()

  if (userData?.personal_summary) {
    aboutMe.value = userData.personal_summary
    aboutSaveState.value = 'save'
    await nextTick()
    resizeAboutTextarea()
  }

  await fetchProjectFiles()
})
</script>

<style scoped>
/* ===== 頁面容器 ===== */
.page {
  height: 100dvh;
}

/* ===== Fixed PageHeader ===== */
.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: var(--spacing-page-top) var(--spacing-page-x) 0;
  background: transparent;
}

/* ===== 主內容捲動區 ===== */
.main-content {
  position: fixed;
  top: 110px;
  bottom: 90px;
  left: 0;
  right: 0;
  padding: 0 var(--spacing-page-x) var(--spacing-page-x);
  overflow-y: auto;
  scrollbar-width: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

/* ===== Section ===== */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-section-title); /* 12px */
}

.section + .section {
  margin-top: var(--core-spacing-700); /* 32px */
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title {
  font-size: var(--typography-heading-size);
  font-weight: var(--typography-heading-weight);
  line-height: var(--typography-heading-line-height);
  color: var(--text-primary);
  margin: 0;
}

/* ===== Claude API KEY ===== */
.api-box {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--core-radius-300); /* 12px */
  padding: var(--core-spacing-200); /* 8px */
}

.api-input {
  flex: 1;
  height: 36px;
  background: transparent;
  border: none;
  padding: 0 var(--core-spacing-200);
  font-family: inherit;
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  outline: none;
  min-width: 0;
}

.api-input::placeholder {
  color: var(--text-placeholder);
}

.upload-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: var(--gradient-brand);
  border: none;
  border-radius: var(--core-radius-300); /* 12px */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== + 按鈕（Project） ===== */
.add-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: var(--gradient-brand);
  border: none;
  border-radius: var(--core-radius-300); /* 12px */
  color: var(--text-inverse);
  font-size: 2rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--core-spacing-200); /* 8px */
}

/* ===== About Me Wrapper + Textarea ===== */
.about-wrapper {
  position: relative;
}

.about-textarea {
  display: block;
  width: 100%;
  min-height: 180px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);    /* 20px */
  padding: var(--core-spacing-400);
  padding-bottom: 60px;
  font-family: inherit;
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  resize: none;
  outline: none;
  overflow-y: hidden;
  box-sizing: border-box;
}

.about-textarea::placeholder {
  color: var(--text-placeholder);
}

.save-btn {
  position: absolute;
  bottom: var(--core-spacing-300); /* 12px */
  right: var(--core-spacing-300);  /* 12px */
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: var(--gradient-brand);
  border: none;
  border-radius: var(--core-radius-300); /* 12px */
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s ease;
}

.save-btn--disabled {
  opacity: 0.5;
  cursor: default;
}

/* ===== File 列表 ===== */
.file-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-gap-card);
}

/* ===== Hidden file input ===== */
.hidden-input {
  display: none;
}

/* ===== Toast ===== */
.toast {
  position: fixed;
  top: var(--spacing-page-x);    /* 24px */
  left: var(--spacing-page-x);   /* 24px */
  right: var(--spacing-page-x);  /* 24px */
  background: var(--gradient-brand);
  color: var(--toast-text);
  padding: var(--core-spacing-300) var(--core-spacing-400);
  border-radius: var(--toast-radius);
  font-size: var(--typography-body-size);
  text-align: center;
  z-index: 300;
  pointer-events: none;
}

.toast-enter-active,
.toast-leave-active {
  transition: opacity 0.25s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
}

/* ===== Desktop (≥ 768px) ===== */
@media (min-width: 768px) {
  .header-wrapper {
    left: max(80px, calc(80px + (100vw - 880px) / 2));
    right: max(0px, calc((100vw - 880px) / 2));
  }

  .main-content {
    left: max(80px, calc(80px + (100vw - 880px) / 2));
    right: max(0px, calc((100vw - 880px) / 2));
    bottom: 32px;
  }

  .file-list {
    grid-template-columns: repeat(6, 1fr);
  }
}
</style>
