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
          <button v-show="hasApiKeyInput && !isMaskedDisplay" class="icon-delete-btn" type="button" @click="saveApiKey">
            <Save :size="18" :stroke-width="2" />
          </button>
          <button v-show="isMaskedDisplay" class="icon-delete-btn" type="button" @click="confirmDelete(clearApiKey)">
            <Trash2 :size="18" :stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- 區塊二：About Me -->
      <div class="section">
        <h2 class="section-title">About Me</h2>
        <div class="about-wrapper">
          <textarea
            v-model="aboutMe"
            class="about-textarea"
            placeholder="描述你自己，讓 AI 更了解你的習慣與目標…"
            @input="handleAboutInput"
          />
          <button
            v-show="aboutSaveState !== 'disabled'"
            class="icon-delete-btn-abs"
            type="button"
            @click="aboutSaveState === 'saved' ? confirmDelete(clearAboutMe) : saveAboutMe()"
          >
            <Trash2 v-if="aboutSaveState === 'saved'" :size="18" :stroke-width="2" />
            <Save v-else :size="18" :stroke-width="2" />
          </button>
        </div>
      </div>

      <!-- 區塊三：Reference Books -->
      <div class="section">
        <h2 class="section-title">Reference Books</h2>
        <div class="ref-book-list">
          <div v-for="(book, index) in refBooks" :key="index" class="ref-book-row">
            <input
              v-if="book.saved"
              :value="book.editing ? book.editTitle : book.title"
              type="text"
              class="ref-book-input"
              :readonly="!book.editing"
              @focus="book.editing = true; book.editTitle = book.title"
              @input="book.editTitle = $event.target.value"
              @keydown.enter.prevent="saveEditRefBook(index)"
            />
            <input
              v-else
              v-model="book.title"
              type="text"
              class="ref-book-input"
              placeholder="輸入你想引用的書籍概念"
              @keydown="(e) => handleRefBookEnter(e, index)"
            />
            <button
              v-show="book.saved || book.title.trim()"
              :class="book.saved ? 'icon-delete-btn' : 'ref-book-btn'"
              type="button"
              @click="book.saved && book.editing ? saveEditRefBook(index) : book.saved ? confirmDelete(() => deleteRefBook(index)) : saveRefBook(index)"
            >
              <Save v-if="book.saved && book.editing" :size="18" :stroke-width="2" />
              <Trash2 v-else-if="book.saved" :size="18" :stroke-width="2" />
              <Save v-else :size="18" :stroke-width="2" />
            </button>
          </div>
        </div>
      </div>

      <!-- 區塊四：Project -->
      <div class="section">
        <div class="section-header">
          <h2 class="section-title">Project</h2>
          <button class="add-btn" type="button" @click="triggerFileInput">+</button>
        </div>
        <div v-if="projectFiles.length > 0" class="project-list">
          <div
            v-for="project in projectFiles"
            :key="project.id"
            class="project-row"
            @click="openProjectModal(project)"
          >
            <div class="project-info">
              <span class="project-filename">{{ project.filename }}</span>
              <span class="project-date">{{ formatDate(project.created_at) }}</span>
            </div>
            <div class="project-actions" @click.stop>
              <button
                :class="['toggle-btn', { active: project.is_active }]"
                type="button"
                @click="toggleProject(project)"
              />
            </div>
          </div>
        </div>
        <div class="about-wrapper">
          <textarea
            v-model="newProjectContent"
            class="about-textarea"
            placeholder="第一行將為檔案名稱"
          />
          <button
            v-show="newProjectContent.trim()"
            class="icon-delete-btn-abs"
            type="button"
            @click="saveNewProject"
          >
            <Save :size="18" :stroke-width="2" />
          </button>
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

    <!-- ConfirmDialog -->
    <ConfirmDialog
      v-model="showConfirm"
      message="確定刪除？"
      @confirm="executeDelete"
    />

    <!-- Project Edit Modal -->
    <Teleport to="body">
      <div v-if="showProjectModal" class="modal-overlay" @click.self="showProjectModal = false">
        <div class="modal-card">
          <div class="modal-header">
            <h3 class="modal-title">Edit Project</h3>
            <button class="modal-close" type="button" @click="showProjectModal = false">×</button>
          </div>
          <textarea v-model="editingProjectContent" class="modal-textarea" />
          <div class="modal-footer">
            <button class="modal-delete-btn" type="button" @click="confirmDelete(deleteProject)">刪除</button>
            <button
              class="modal-save-btn"
              type="button"
              :disabled="editingProjectContent === editingProject?.content"
              @click="saveProjectEdit"
            >儲存</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Toast -->
    <Transition name="toast">
      <div v-if="toastMsg" class="toast">{{ toastMsg }}</div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Save, Check, Trash2 } from 'lucide-vue-next'

definePageMeta({ middleware: 'setting' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

// ===== API Key =====
const apiKeyInput = ref('')
const rawApiKey = ref('')
const isMaskedDisplay = ref(false)
const hasApiKeyInput = computed(() => apiKeyInput.value.trim().length > 0)

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

function clearApiKey() {
  localStorage.removeItem('keeper_api_key')
  rawApiKey.value = ''
  apiKeyInput.value = ''
  isMaskedDisplay.value = false
  showToast('已清除 API Key')
}

// ===== About Me =====
const aboutMe = ref('')
// 'disabled'（無文字）| 'save'（可儲存）| 'saved'（已儲存）
const aboutSaveState = ref('disabled')

function handleAboutInput() {
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

async function clearAboutMe() {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return
  await supabase.from('users').upsert({ id: userId, personal_summary: '' })
  aboutMe.value = ''
  aboutSaveState.value = 'disabled'
  showToast('已清除')
}

// ===== Reference Books =====
const refBooks = ref([])

async function fetchRefBooks() {
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return

  const { data } = await supabase
    .from('reference_books')
    .select('id, title')
    .eq('user_id', userId)
    .order('created_at')

  refBooks.value = (data ?? []).map(r => ({ id: r.id, title: r.title, saved: true, editing: false, editTitle: r.title }))
  refBooks.value.push({ id: null, title: '', saved: false })
}

async function saveRefBook(index) {
  const item = refBooks.value[index]
  const title = item.title.trim()
  if (!title) return

  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return

  const { data, error } = await supabase
    .from('reference_books')
    .insert({ user_id: userId, title })
    .select('id')
    .single()

  if (error) {
    showToast('儲存失敗，請再試一次')
    return
  }

  refBooks.value[index] = { id: data.id, title, saved: true }
  refBooks.value.push({ id: null, title: '', saved: false })
}

function handleRefBookEnter(e, index) {
  if (e.key !== 'Enter') return
  if (e.shiftKey || e.metaKey || e.ctrlKey) return
  e.preventDefault()
  saveRefBook(index)
}

async function saveEditRefBook(index) {
  const item = refBooks.value[index]
  const title = item.editTitle.trim()
  if (!title) return
  const { error } = await supabase
    .from('reference_books')
    .update({ title })
    .eq('id', item.id)
  if (error) {
    showToast('更新失敗，請再試一次')
    return
  }
  refBooks.value[index].title = title
  refBooks.value[index].editing = false
}

async function deleteRefBook(index) {
  const item = refBooks.value[index]
  if (!item.id) return

  const { error } = await supabase
    .from('reference_books')
    .delete()
    .eq('id', item.id)

  if (error) {
    showToast('刪除失敗，請再試一次')
    return
  }

  refBooks.value.splice(index, 1)
}

// ===== Project Files =====
const projectFiles = ref([])
const fileInputEl = ref(null)
const newProjectContent = ref('')
const editingProject = ref(null)
const showProjectModal = ref(false)
const editingProjectContent = ref('')

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
    .select('id, filename, content, is_active, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

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

async function toggleProject(project) {
  project.is_active = !project.is_active
  await supabase
    .from('project_files')
    .update({ is_active: project.is_active })
    .eq('id', project.id)
}

async function saveNewProject() {
  const content = newProjectContent.value.trim()
  if (!content) return
  const firstLine = content.split('\n')[0].trim()
  const filename = firstLine || '未命名'
  const { data: { user: currentUser } } = await supabase.auth.getUser()
  const userId = currentUser?.id
  if (!userId) return
  const { data } = await supabase
    .from('project_files')
    .insert({ user_id: userId, filename, content, is_active: true, type: 'MD' })
    .select()
    .single()
  projectFiles.value.unshift(data)
  newProjectContent.value = ''
  showToast('已儲存')
}

function openProjectModal(project) {
  editingProject.value = { ...project }
  editingProjectContent.value = project.content
  showProjectModal.value = true
}

async function saveProjectEdit() {
  await supabase
    .from('project_files')
    .update({ content: editingProjectContent.value })
    .eq('id', editingProject.value.id)
  const idx = projectFiles.value.findIndex(p => p.id === editingProject.value.id)
  if (idx !== -1) projectFiles.value[idx].content = editingProjectContent.value
  showProjectModal.value = false
  showToast('已儲存')
}

async function deleteProject() {
  await supabase
    .from('project_files')
    .delete()
    .eq('id', editingProject.value.id)
  projectFiles.value = projectFiles.value.filter(p => p.id !== editingProject.value.id)
  showProjectModal.value = false
  showToast('已刪除')
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// ===== Confirm Dialog =====
const showConfirm = ref(false)
const pendingDelete = ref(null)

function confirmDelete(action) {
  pendingDelete.value = action
  showConfirm.value = true
}

async function executeDelete() {
  if (pendingDelete.value) {
    await pendingDelete.value()
    pendingDelete.value = null
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
    aboutSaveState.value = 'saved'
  }

  await fetchProjectFiles()
  await fetchRefBooks()
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

/* 無背景刪除按鈕（inline，如 API Key、Reference Books） */
.icon-delete-btn {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  color: #FF7FDC;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 無背景刪除按鈕（absolute，如 About Me） */
.icon-delete-btn-abs {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 40px;
  height: 40px;
  background: none;
  border: none;
  padding: 0;
  color: #FF7FDC;
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
  height: 200px;
  max-height: 500px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);    /* 20px */
  padding: var(--core-spacing-400);
  padding-right: 48px;
  padding-bottom: 16px;
  font-family: inherit;
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  resize: none;
  outline: none;
  overflow-y: auto;
  box-sizing: border-box;
}

.about-textarea::placeholder {
  color: var(--text-placeholder);
}

/* ===== Reference Books ===== */
.ref-book-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-card); /* 12px */
}

.ref-book-row {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--core-radius-300); /* 12px */
  padding: var(--core-spacing-200); /* 8px */
  gap: var(--core-spacing-200); /* 8px */
}

.ref-book-input {
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

.ref-book-input::placeholder {
  color: var(--text-placeholder);
}

.ref-book-input:disabled {
  cursor: default;
  opacity: 1;
  -webkit-text-fill-color: var(--text-primary);
}

.ref-book-btn {
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

/* ===== Project 列表 ===== */
.project-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-card);
}

.project-row {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--core-radius-300);
  padding: var(--core-spacing-300) var(--core-spacing-400);
  gap: var(--core-spacing-200);
  cursor: pointer;
}

.project-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.project-filename {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-date {
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.project-actions {
  flex-shrink: 0;
}

/* Toggle switch */
.toggle-btn {
  width: 44px;
  height: 26px;
  border-radius: 13px;
  border: none;
  background: var(--card-border);
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;
  padding: 0;
}

.toggle-btn::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transition: transform 0.2s ease;
}

.toggle-btn.active {
  background: var(--gradient-brand);
}

.toggle-btn.active::after {
  transform: translateX(18px);
}

/* ===== Project Modal ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 0 var(--spacing-page-x) var(--spacing-page-x);
}

.modal-card {
  width: 100%;
  max-width: 800px;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--card-radius);
  padding: var(--core-spacing-500);
  display: flex;
  flex-direction: column;
  gap: var(--core-spacing-400);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: var(--typography-heading-size);
  font-weight: var(--typography-heading-weight);
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  width: 36px;
  height: 36px;
  background: none;
  border: none;
  font-size: 1.6rem;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 1;
}

.modal-textarea {
  display: block;
  width: 100%;
  height: 500px;
  background: transparent;
  border: 1px solid var(--card-border);
  border-radius: var(--core-radius-300);
  padding: var(--core-spacing-400);
  font-family: inherit;
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  resize: none;
  outline: none;
  overflow-y: auto;
  box-sizing: border-box;
  line-height: var(--typography-body-line-height);
}

.modal-footer {
  display: flex;
  gap: var(--core-spacing-300);
}

.modal-delete-btn {
  flex: 1;
  height: 48px;
  border-radius: var(--core-radius-300);
  background:
    linear-gradient(var(--card-bg), var(--card-bg)) padding-box,
    var(--gradient-brand) border-box;
  border: 1px solid transparent;
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  cursor: pointer;
}

.modal-save-btn {
  flex: 1;
  height: 48px;
  border-radius: var(--core-radius-300);
  background: var(--gradient-brand);
  border: none;
  color: var(--text-inverse);
  font-family: inherit;
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.modal-save-btn:disabled {
  opacity: 0.5;
  cursor: default;
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

  .modal-overlay {
    align-items: center;
    padding: var(--spacing-page-x);
  }
}
</style>
