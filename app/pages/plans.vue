<template>
  <div class="page">
    <BottomNav active="plans" />

    <!-- Fixed PageHeader（含 tabs slot） -->
    <div class="header-wrapper">
      <PageHeader title="Plans">
        <template #tabs>
          <div class="tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="keeper-tab"
              :class="{ 'keeper-tab--active': activeTab === tab.key }"
              type="button"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
        </template>
      </PageHeader>
    </div>

    <!-- Scrollable Content -->
    <div class="main-content">

      <!-- 清單區 -->
      <div class="plan-list">
        <!-- 載入中 -->
        <p v-if="loading" class="empty-hint">載入中...</p>

        <!-- Habits / Long-term：PlanCard + Toggle -->
        <template v-else-if="activeTab === 'habits' || activeTab === 'longterm'">
          <PlanCard
            v-for="plan in currentPlans"
            :key="plan.id"
            :id="plan.id"
            :title="plan.title"
            :description="plan.description"
            :is-active="plan.isActive"
            @update:is-active="val => plan.isActive = val"
            @open-detail="selectedPlan = plan"
            @delete="deleteRemotePlan"
          />
          <p v-if="currentPlans.length === 0" class="empty-hint">尚無計畫</p>
        </template>

        <!-- Backlog：純標題 + 刪除 × -->
        <template v-else-if="activeTab === 'backlog'">
          <BaseCard
            v-for="item in plansData.backlog"
            :key="item.id"
            padding="sm"
            :opacity="80"
            class="backlog-card"
          >
            <div class="backlog-row">
              <span class="backlog-title">{{ item.title }}</span>
              <button class="delete-btn" type="button" @click="deleteBacklog(item.id)">×</button>
            </div>
          </BaseCard>
          <p v-if="plansData.backlog.length === 0" class="empty-hint">尚無計畫</p>
        </template>

        <!-- Notes：內容 + 垃圾桶 -->
        <template v-else-if="activeTab === 'notes'">
          <BaseCard
            v-for="note in notes"
            :key="note.id"
            padding="sm"
            :opacity="80"
            class="backlog-card"
          >
            <div class="backlog-row">
              <span class="note-text">{{ note.content }}</span>
              <button class="trash-btn" type="button" @click="deleteNote(note.id)">
                <Trash2 :size="16" />
              </button>
            </div>
          </BaseCard>
          <p v-if="notes.length === 0" class="empty-hint">還沒有任何 notes</p>
        </template>
      </div>
    </div>

    <!-- Backlog 輸入框 -->
    <div v-if="activeTab === 'backlog'" class="backlog-input-section">
      <div class="input-outer">
        <div class="input-inner">
          <textarea
            ref="backlogTextareaEl"
            v-model="newWishTitle"
            class="input-textarea"
            placeholder="Add new wish"
            @keydown.enter.exact.prevent="addToBacklog"
            @input="resizeBacklogTextarea"
          />
          <div class="input-actions">
            <AppButton label="Send" size="compact" @click="addToBacklog" />
          </div>
        </div>
      </div>
    </div>

    <!-- Notes 輸入框 -->
    <div v-if="activeTab === 'notes'" class="backlog-input-section">
      <div class="input-outer">
        <div class="input-inner">
          <textarea
            ref="notesTextareaEl"
            v-model="newNote"
            class="input-textarea"
            placeholder="Add a note..."
            @keydown.enter="handleNoteEnter"
            @input="resizeNotesTextarea"
          />
          <div class="input-actions">
            <AppButton label="Send" size="compact" @click="addNote" />
          </div>
        </div>
      </div>
    </div>

    <!-- Detail 彈窗（Habits / Long-term） -->
    <Teleport to="body">
      <div
        v-if="selectedPlan"
        class="overlay"
        @click.self="selectedPlan = null"
      >
        <BaseCard padding="lg" :opacity="100" class="modal-card">
          <button class="close-btn" type="button" @click="selectedPlan = null">×</button>
          <h2 class="modal-title">{{ selectedPlan.title }}</h2>
          <p v-if="selectedPlan.description" class="modal-desc">{{ selectedPlan.description }}</p>
        </BaseCard>
      </div>
    </Teleport>

    <!-- Toast -->
    <Teleport to="body">
      <div v-if="toast.show" class="toast">{{ toast.message }}</div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { Trash2 } from 'lucide-vue-next'

const supabase = useSupabaseClient()

const tabs = [
  { key: 'habits',   label: 'Habits' },
  { key: 'longterm', label: 'Long-term' },
  { key: 'backlog',  label: 'Backlog' },
  { key: 'notes',    label: 'Notes' }
]

const activeTab = ref('habits')
const loading = ref(false)

const plansData = reactive({
  habits: [],
  longterm: [],
  backlog: [
    { id: 101, title: '瑜珈伸展' },
    { id: 102, title: '畫圖' }
  ]
})

const currentPlans = computed(() => plansData[activeTab.value] ?? [])

/* ===== Supabase fetch ===== */
onMounted(async () => {
  loading.value = true
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    loading.value = false
    return
  }
  currentUserId = user.id

  const [habitsRes, longtermRes, notesRes] = await Promise.all([
    supabase.from('habits').select('id, title, description, is_active, card_mode').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('plans').select('id, title, description, is_active').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('notes').select('id, content').eq('user_id', user.id).order('created_at', { ascending: true })
  ])

  if (habitsRes.data) {
    plansData.habits = habitsRes.data.map(r => ({ id: r.id, title: r.title, description: r.description ?? '', isActive: r.is_active }))
  }
  if (longtermRes.data) {
    plansData.longterm = longtermRes.data.map(r => ({ id: r.id, title: r.title, description: r.description ?? '', isActive: r.is_active }))
  }
  if (notesRes.data) {
    notes.value = notesRes.data
  }

  loading.value = false
})

/* ===== Detail modal ===== */
const selectedPlan = ref(null)

/* ===== Backlog input ===== */
const newWishTitle = ref('')
const backlogTextareaEl = ref(null)

function addToBacklog() {
  const title = newWishTitle.value.trim()
  if (!title) return
  plansData.backlog.push({ id: Date.now(), title })
  newWishTitle.value = ''
  nextTick(() => resizeBacklogTextarea())
  showToastMsg('新增一則計畫')
}

function resizeBacklogTextarea() {
  const el = backlogTextareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.max(44, el.scrollHeight) + 'px'
}

/* ===== Notes ===== */
const notes = ref([])
const newNote = ref('')
const notesTextareaEl = ref(null)
let currentUserId = null

async function addNote() {
  const content = newNote.value.trim()
  if (!content) return

  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    currentUserId = user.id
  }

  const { data, error } = await supabase
    .from('notes')
    .insert({ user_id: currentUserId, content })
    .select('id, content')
    .single()

  if (error) {
    showToastMsg('新增失敗，請再試一次')
    return
  }
  notes.value.push(data)
  newNote.value = ''
  nextTick(() => resizeNotesTextarea())
}

async function deleteNote(id) {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) {
    showToastMsg('刪除失敗，請再試一次')
    return
  }
  const idx = notes.value.findIndex(n => n.id === id)
  if (idx !== -1) notes.value.splice(idx, 1)
}

function handleNoteEnter(e) {
  if (e.shiftKey || e.metaKey || e.ctrlKey) return
  e.preventDefault()
  addNote()
}

function resizeNotesTextarea() {
  const el = notesTextareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.max(44, el.scrollHeight) + 'px'
}

/* ===== Backlog delete + Toast ===== */
const toast = reactive({ show: false, message: '' })
let toastTimer = null

function deleteBacklog(id) {
  const idx = plansData.backlog.findIndex(item => item.id === id)
  if (idx !== -1) plansData.backlog.splice(idx, 1)
  showToastMsg('刪除一則願望')
}

async function deleteRemotePlan(id) {
  const table = activeTab.value === 'habits' ? 'habits' : 'plans'
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) {
    showToastMsg('刪除失敗，請再試一次')
    return
  }
  const list = plansData[activeTab.value]
  const idx = list.findIndex(item => item.id === id)
  if (idx !== -1) list.splice(idx, 1)
  showToastMsg('已刪除')
}

function showToastMsg(message) {
  toast.message = message
  toast.show = true
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.show = false }, 3000)
}

onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<style scoped>
/* ===== 頁面容器 ===== */
.page {
  height: 100dvh;
}

/* ===== Fixed PageHeader ===== */
/*
  padding-top 40px + h1 (3.2rem × 1.2) ≈ 38px = 78px total wrapper height
  content top = 78px + 32px gap = 110px
*/
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
/*
  top: 160px（header 128px + gap 32px）
    128px = padding-top 40px + h1 38px + gap 16px + tab 34px
  bottom: 90px（BottomNav top 58px + gap 32px）
  padding-bottom: 140px（為 backlog/notes 輸入框預留空間）
*/
.main-content {
  position: fixed;
  top: 160px;
  bottom: 90px;
  left: 0;
  right: 0;
  padding: 0 var(--spacing-page-x) 140px;
  overflow-y: auto;
  scrollbar-width: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

/* ===== Tabs（slot 傳入 PageHeader，樣式保留） ===== */
.tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--core-spacing-300);
}

/* ===== 清單區 ===== */
.plan-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-card);
}

/* 空狀態提示 */
.empty-hint {
  font-size: var(--typography-ai-size);
  font-weight: var(--typography-ai-weight);
  line-height: var(--typography-ai-line-height);
  color: var(--text-primary);
  text-align: center;
  margin: var(--spacing-gap-section) 0 0;
}


/* ===== Backlog / Notes 卡片 ===== */
.backlog-card {
  cursor: default;
}

.backlog-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--core-spacing-400);
}

.backlog-title {
  font-size: var(--typography-label-size);
  font-weight: var(--typography-label-weight);
  line-height: var(--typography-label-line-height);
  color: var(--text-primary);
}

.note-text {
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  line-height: var(--typography-body-line-height);
}

.delete-btn {
  background: none;
  border: none;
  padding: 0;
  font-size: 2rem;
  line-height: 1;
  color: var(--text-danger);
  cursor: pointer;
  flex-shrink: 0;
}

.trash-btn {
  background: none;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  color: var(--text-danger);
  cursor: pointer;
  flex-shrink: 0;
}

/* ===== 共用 Overlay ===== */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.2);
}

/* ===== Detail 彈窗（Habits/Long-term） ===== */
.modal-card {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 520px;
  max-width: calc(100% - 48px);
  z-index: 201;
}

/* 共用：彈窗關閉按鈕 */
.close-btn {
  position: absolute;
  top: var(--card-modal-padding);
  right: var(--card-modal-padding);
  background: none;
  border: none;
  padding: 0;
  font-size: 2rem;
  line-height: 1;
  color: var(--text-danger);
  cursor: pointer;
}

/* 共用：彈窗標題 */
.modal-title {
  font-size: var(--typography-subheading-size);
  font-weight: var(--typography-subheading-weight);
  line-height: var(--typography-subheading-line-height);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-gap-task-btn);
  padding-right: var(--core-spacing-700);
}

/* Detail modal 說明文 */
.modal-desc {
  font-size: 1.6rem;
  font-weight: 400;
  line-height: 1.6;
  color: #363134;
  margin: 16px 0 0;
  white-space: pre-line;
}

/* ===== Backlog / Notes 輸入框 ===== */
/* bottom: 74px（BottomNav top 58px + gap 16px） */
.backlog-input-section {
  position: fixed;
  bottom: 74px;
  left: var(--spacing-page-x);
  right: var(--spacing-page-x);
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
  min-height: 44px;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  padding: 0;
  font-family: inherit;
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  line-height: var(--typography-body-line-height);
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
  /*
    置中於 sidebar 右側空間（100vw - 80px），max-width 800px：
    left = 80px + max(0, (100vw - 880px) / 2)
    right = max(0, (100vw - 880px) / 2)
  */
  .header-wrapper {
    left: max(80px, calc(80px + (100vw - 880px) / 2));
    right: max(0px, calc((100vw - 880px) / 2));
  }

  .main-content {
    left: max(80px, calc(80px + (100vw - 880px) / 2));
    right: max(0px, calc((100vw - 880px) / 2));
    bottom: 32px;
    padding-bottom: 140px;
  }

  /* 對話框：content 邊界再內縮 page-x */
  .backlog-input-section {
    bottom: 32px;
    left: calc(max(80px, calc(80px + (100vw - 880px) / 2)) + var(--spacing-page-x));
    right: calc(max(0px, calc((100vw - 880px) / 2)) + var(--spacing-page-x));
  }

  .toast {
    left: max(calc(80px + var(--spacing-page-x)), calc((100vw - 672px) / 2));
    right: max(var(--spacing-page-x), calc((100vw - 832px) / 2));
  }
}
</style>
