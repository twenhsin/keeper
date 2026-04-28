<template>
  <div class="page-header">
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

  <div class="page-content">

      <!-- 清單區 -->
      <div class="plan-list">
        <!-- 載入中 -->
        <LoadingDots v-if="loading" />

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
            @delete="(id) => confirmDelete(() => deleteRemotePlan(id))"
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
            <textarea
              v-if="editingBacklogId === item.id"
              v-model="editingBacklogTitle"
              class="edit-textarea"
              @keydown.enter.exact.prevent="saveEditBacklog(item)"
            />
            <span v-else class="backlog-title" @click="startEditBacklog(item)">{{ item.title }}</span>
            <button
              class="delete-btn"
              type="button"
              @click="editingBacklogId === item.id ? saveEditBacklog(item) : confirmDelete(() => deleteBacklog(item.id))"
            >
              <Save v-if="editingBacklogId === item.id" :size="20" :stroke-width="2" />
              <Trash2 v-else :size="20" :stroke-width="2" />
            </button>
          </BaseCard>
          <BaseCard padding="sm" :opacity="80" class="backlog-card">
            <textarea
              v-model="newWishTitle"
              class="edit-textarea new-entry-textarea"
              placeholder="新增計畫..."
              rows="1"
              @input="autoResize($event)"
              @keydown.enter.exact.prevent="addToBacklog"
            />
            <button
              v-if="newWishTitle.trim()"
              class="delete-btn"
              type="button"
              @click="addToBacklog"
            >
              <Save :size="20" :stroke-width="2" />
            </button>
          </BaseCard>
        </template>

        <!-- Notes：內容 + 垃圾桶 -->
        <template v-else-if="activeTab === 'notes'">
          <BaseCard v-for="note in notes" :key="note.id" padding="sm" :opacity="80" class="backlog-card">
            <textarea
              v-if="editingNoteId === note.id"
              v-model="editingNoteContent"
              class="edit-textarea"
              @keydown.enter.exact.prevent="saveEditNote(note)"
            />
            <span v-else class="note-text" @click="startEditNote(note)">{{ note.content }}</span>
            <button
              class="delete-btn"
              type="button"
              @click="editingNoteId === note.id ? saveEditNote(note) : confirmDelete(() => deleteNote(note.id))"
            >
              <Save v-if="editingNoteId === note.id" :size="20" :stroke-width="2" />
              <Trash2 v-else :size="20" :stroke-width="2" />
            </button>
          </BaseCard>
          <BaseCard padding="sm" :opacity="80" class="backlog-card">
            <textarea
              v-model="newNote"
              class="edit-textarea new-entry-textarea"
              placeholder="新增 note..."
              rows="1"
              @input="autoResize($event)"
              @keydown.enter.exact.prevent="addNote"
            />
            <button
              v-if="newNote.trim()"
              class="delete-btn"
              type="button"
              @click="addNote"
            >
              <Save :size="20" :stroke-width="2" />
            </button>
          </BaseCard>
        </template>
      </div>
    </div>


    <!-- ConfirmDialog -->
    <ConfirmDialog
      v-model="showConfirm"
      message="確定刪除？"
      @confirm="executeDelete"
    />

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
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { Trash2, Save } from 'lucide-vue-next'

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

  const [habitsRes, longtermRes, notesRes, backlogRes] = await Promise.all([
    supabase.from('habits').select('id, title, description, is_active, card_mode').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('plans').select('id, title, description, is_active').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('notes').select('id, content').eq('user_id', user.id).order('created_at', { ascending: true }),
    supabase.from('backlog').select('id, title').eq('user_id', user.id).order('created_at', { ascending: true })
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
  if (backlogRes.data) {
    plansData.backlog = backlogRes.data.map(r => ({ id: r.id, title: r.title }))
  }

  loading.value = false
})

/* ===== Detail modal ===== */
const selectedPlan = ref(null)

/* ===== Backlog input ===== */
const newWishTitle = ref('')

const editingBacklogId = ref(null)
const editingBacklogTitle = ref('')

function startEditBacklog(item) {
  editingBacklogId.value = item.id
  editingBacklogTitle.value = item.title
}

async function saveEditBacklog(item) {
  const title = editingBacklogTitle.value.trim()
  if (!title) return
  const { error } = await supabase
    .from('backlog')
    .update({ title })
    .eq('id', item.id)
  if (error) {
    showToastMsg('更新失敗，請再試一次')
    return
  }
  item.title = title
  editingBacklogId.value = null
  editingBacklogTitle.value = ''
}

async function addToBacklog() {
  const title = newWishTitle.value.trim()
  if (!title) return
  if (!currentUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    currentUserId = user.id
  }
  const { data, error } = await supabase
    .from('backlog')
    .insert({ user_id: currentUserId, title })
    .select('id, title')
    .single()
  if (error) {
    showToastMsg('新增失敗，請再試一次')
    return
  }
  plansData.backlog.push({ id: data.id, title: data.title })
  newWishTitle.value = ''
  showToastMsg('新增一則計畫')
}

/* ===== Notes ===== */
const notes = ref([])
const newNote = ref('')
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
}

const editingNoteId = ref(null)
const editingNoteContent = ref('')

function startEditNote(note) {
  editingNoteId.value = note.id
  editingNoteContent.value = note.content
}

async function saveEditNote(note) {
  const content = editingNoteContent.value.trim()
  if (!content) return
  const { error } = await supabase
    .from('notes')
    .update({ content })
    .eq('id', note.id)
  if (error) {
    showToastMsg('更新失敗，請再試一次')
    return
  }
  note.content = content
  editingNoteId.value = null
  editingNoteContent.value = ''
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


/* ===== Backlog delete + Toast ===== */
const toast = reactive({ show: false, message: '' })
let toastTimer = null

async function deleteBacklog(id) {
  const { error } = await supabase.from('backlog').delete().eq('id', id)
  if (error) {
    showToastMsg('刪除失敗，請再試一次')
    return
  }
  const idx = plansData.backlog.findIndex(item => item.id === id)
  if (idx !== -1) plansData.backlog.splice(idx, 1)
  showToastMsg('已刪除')
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

onBeforeUnmount(() => clearTimeout(toastTimer))
</script>

<style scoped>
/* ===== PageHeader 區 ===== */
.page-header {
  flex-shrink: 0;
  padding-top: 8px;
}

/* ===== 主內容捲動區 ===== */
.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0 24px;
  scrollbar-width: none;
}

.page-content::-webkit-scrollbar {
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
  position: relative;
  padding-right: 36px;
}

.backlog-title {
  font-size: var(--typography-label-size);
  font-weight: var(--typography-label-weight);
  line-height: var(--typography-label-line-height);
  color: var(--text-primary);
}

.edit-textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  font-family: inherit;
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  line-height: var(--typography-body-line-height);
  padding: 0;
  padding-right: 36px;
  overflow-y: hidden;
  min-height: unset;
  height: auto;
}

.note-text {
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  line-height: var(--typography-body-line-height);
}

.delete-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  padding: 0;
  color: #FF7FDC;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
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

</style>
