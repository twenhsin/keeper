<template>
  <div class="page">
    <BottomNav active="records" />

    <!-- Fixed PageHeader -->
    <div class="header-wrapper">
      <PageHeader title="Records" />
    </div>

    <!-- Scrollable Content -->
    <div class="main-content">
      <!-- 載入中 -->
      <p v-if="loading" class="empty-hint">載入中...</p>

      <!-- 區塊一：今日待確認 -->
      <div v-if="checkInCards.length > 0" class="checkin-list">
        <BaseCard
          v-for="card in checkInCards"
          :key="card.id"
          padding="lg"
          :opacity="80"
          class="checkin-card"
        >
          <p class="checkin-title">
            {{ card.title }}
            <span v-if="card.isExtra" class="extra-badge">＋加分</span>
          </p>
          <AppButton label="Check in" class="checkin-action-btn" @click="checkIn(card)" />
        </BaseCard>
      </div>

      <!-- 區塊二：待補打卡 -->
      <div v-if="makeupCards.length > 0" class="section">
        <h2 class="section-title">待補打卡 {{ makeupCards.length }}</h2>
        <div class="checkin-list">
          <BaseCard
            v-for="card in makeupCards"
            :key="card.id + card.scheduledDate"
            padding="lg"
            :opacity="80"
            class="checkin-card"
          >
            <p class="checkin-title">{{ card.title }}</p>
            <p class="checkin-date">補 {{ card.scheduledDate.slice(5).replace('-', '/') }}</p>
            <AppButton label="Check in" class="checkin-action-btn" @click="checkIn(card)" />
          </BaseCard>
        </div>
      </div>

      <!-- 空狀態 -->
      <p v-if="!loading && checkInCards.length === 0 && makeupCards.length === 0 && progressItems.length === 0" class="empty-hint">
        目前沒有進行中的任務
      </p>

      <!-- 區塊二：Progress report -->
      <div v-if="progressItems.length > 0" class="section">
        <h2 class="section-title">Progress report</h2>
        <div class="progress-list">
          <div
            v-for="item in progressItems"
            :key="item.id"
            class="progress-card-link"
            @click="navigateTo(`/records-detail-${item.id}`)"
          >
            <BaseCard padding="sm" :opacity="80" class="progress-card">
              <p class="progress-name">{{ item.title }}</p>
              <div class="progress-stats">
                <div class="stat-col">
                  <span class="stat-label">This week</span>
                  <span class="stat-value">{{ item.weekDone }}<span class="stat-slash">/</span>{{ item.weekTotal }}</span>
                </div>
                <div class="stat-col">
                  <span class="stat-label">This month</span>
                  <span class="stat-value">{{ item.monthDone }}<span class="stat-slash">/</span>{{ item.monthTotal }}</span>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const supabase = useSupabaseClient()

const loading = ref(true)
const checkInCards = ref([])
const makeupCards = ref([])
const progressItems = ref([])

/* ===== 日期工具 ===== */
function getTodayStr() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getWeekStart() {
  const now = new Date()
  const day = now.getDay() // 0=Sun
  const diff = day === 0 ? 6 : day - 1 // 週一為起點
  const monday = new Date(now)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(now.getDate() - diff)
  return monday.toISOString()
}

function getMonthStart() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
}

function getDaysInMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) { loading.value = false; return }
  const userId = user.id

  const weekStart = getWeekStart()
  const monthStart = getMonthStart()
  const monthDays = getDaysInMonth()

  // ===== 打卡卡片：前端動態生成 =====
  const { data: activeHabits } = await supabase
    .from('habits')
    .select('id, title, required_weekdays, period_days, allow_extra, allow_makeup, card_show_time, created_at')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (activeHabits && activeHabits.length > 0) {
    const todayStr = getTodayStr()
    const todayWeekday = new Date().getDay()
    const currentTime = new Date().toTimeString().slice(0, 5)

    // 各 habit 最近一筆完成記錄
    const { data: lastDoneRows } = await supabase
      .from('task_cards')
      .select('ref_id, confirmed_at')
      .eq('user_id', userId)
      .eq('task_type', 'habit')
      .eq('is_completed', true)
      .order('confirmed_at', { ascending: false })

    const lastDoneMap = {}
    for (const row of (lastDoneRows ?? [])) {
      if (!lastDoneMap[row.ref_id]) {
        lastDoneMap[row.ref_id] = row.confirmed_at.slice(0, 10)
      }
    }

    // 今日已打卡 ids
    const { data: todayDone } = await supabase
      .from('task_cards')
      .select('ref_id')
      .eq('user_id', userId)
      .eq('task_type', 'habit')
      .eq('scheduled_date', todayStr)
      .eq('is_completed', true)

    const doneSet = new Set((todayDone ?? []).map(r => r.ref_id))

    // 今日卡片
    const todayCards = []
    for (const h of activeHabits) {
      if (doneSet.has(h.id)) continue

      const showTime = h.card_show_time ? h.card_show_time.slice(0, 5) : null
      if (showTime && currentTime < showTime) continue

      const hasRequired = h.required_weekdays?.length > 0
      const hasPeriod = h.period_days > 0

      let isFixed = hasRequired && h.required_weekdays.includes(todayWeekday)

      let isPeriodDue = false
      if (hasPeriod) {
        const baseStr = lastDoneMap[h.id] ?? h.created_at.slice(0, 10)
        const base = new Date(baseStr); base.setHours(0, 0, 0, 0)
        const today = new Date(); today.setHours(0, 0, 0, 0)
        isPeriodDue = Math.round((today - base) / 86400000) >= h.period_days
      }

      if (isFixed) {
        todayCards.push({ id: h.id, title: h.title, isExtra: false, scheduledDate: todayStr, slotIndex: 0 })
        continue
      }
      if (h.allow_extra && hasRequired && !h.required_weekdays.includes(todayWeekday)) {
        todayCards.push({ id: h.id, title: h.title, isExtra: true, scheduledDate: todayStr, slotIndex: 0 })
        continue
      }
      if (isPeriodDue) {
        todayCards.push({ id: h.id, title: h.title, isExtra: false, scheduledDate: todayStr, slotIndex: 0 })
      }
    }
    checkInCards.value = todayCards

    // 補打卡
    const yesterdayStr = (() => {
      const d = new Date(); d.setDate(d.getDate() - 1)
      return d.toISOString().slice(0, 10)
    })()

    const { data: yesterdayDone } = await supabase
      .from('task_cards')
      .select('ref_id')
      .eq('user_id', userId)
      .eq('task_type', 'habit')
      .eq('scheduled_date', yesterdayStr)
      .eq('is_completed', true)

    const yesterdayDoneSet = new Set((yesterdayDone ?? []).map(r => r.ref_id))
    const yesterdayWeekday = new Date(yesterdayStr).getDay()
    const makeupList = []

    for (const h of activeHabits) {
      if (!h.allow_makeup) continue
      if (yesterdayDoneSet.has(h.id)) continue

      const hasRequired = h.required_weekdays?.length > 0
      const hasPeriod = h.period_days > 0
      let shouldHaveAppeared = false

      if (hasRequired && h.required_weekdays.includes(yesterdayWeekday)) {
        shouldHaveAppeared = true
      }
      if (hasPeriod && !shouldHaveAppeared) {
        const baseStr = lastDoneMap[h.id] ?? h.created_at.slice(0, 10)
        const base = new Date(baseStr); base.setHours(0, 0, 0, 0)
        const yesterday = new Date(yesterdayStr); yesterday.setHours(0, 0, 0, 0)
        if (Math.round((yesterday - base) / 86400000) >= h.period_days) shouldHaveAppeared = true
      }

      if (shouldHaveAppeared) {
        makeupList.push({ id: h.id, title: h.title, isExtra: false, scheduledDate: yesterdayStr, slotIndex: 0 })
      }
    }
    makeupCards.value = makeupList
  }

  // ===== Progress Report：啟用中任務 =====
  const [habitsActiveRes, plansActiveRes] = await Promise.all([
    supabase.from('habits').select('id, title').eq('user_id', userId).eq('is_active', true),
    supabase.from('plans').select('id, title').eq('user_id', userId).eq('is_active', true)
  ])

  const activeTasks = [
    ...(habitsActiveRes.data ?? []).map(h => ({ id: h.id, title: h.title, type: 'habit' })),
    ...(plansActiveRes.data  ?? []).map(p => ({ id: p.id, title: p.title, type: 'plan'  }))
  ]

  if (activeTasks.length > 0) {
    const allRefIds = activeTasks.map(t => t.id)

    const [weekRes, monthRes] = await Promise.all([
      supabase.from('task_cards')
        .select('ref_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('ref_id', allRefIds)
        .gte('scheduled_date', weekStart),
      supabase.from('task_cards')
        .select('ref_id')
        .eq('user_id', userId)
        .eq('is_completed', true)
        .in('ref_id', allRefIds)
        .gte('scheduled_date', monthStart)
    ])

    // 計算每個任務的完成筆數
    const weekCount  = {}
    const monthCount = {}
    ;(weekRes.data  ?? []).forEach(r => { weekCount[r.ref_id]  = (weekCount[r.ref_id]  ?? 0) + 1 })
    ;(monthRes.data ?? []).forEach(r => { monthCount[r.ref_id] = (monthCount[r.ref_id] ?? 0) + 1 })

    progressItems.value = activeTasks.map(t => ({
      id: t.id,
      title: t.title,
      weekDone:   weekCount[t.id]  ?? 0,
      weekTotal:  7,
      monthDone:  monthCount[t.id] ?? 0,
      monthTotal: monthDays
    }))
  }

  loading.value = false
})

/* ===== Check in =====  */
async function checkIn(card) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { error } = await supabase
    .from('task_cards')
    .insert({
      user_id: user.id,
      task_type: 'habit',
      ref_id: card.id,
      scheduled_date: card.scheduledDate,
      is_completed: true,
      is_extra: card.isExtra ?? false,
      slot_index: card.slotIndex ?? 0,
      confirmed_at: new Date().toISOString()
    })

  if (!error) {
    checkInCards.value = checkInCards.value.filter(c => c.id !== card.id)
    makeupCards.value = makeupCards.value.filter(c => !(c.id === card.id && c.scheduledDate === card.scheduledDate))
  }
}
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
  top: 110px（header 78px + gap 32px）
  bottom: 90px（BottomNav top 58px + gap 32px）
*/
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

/* ===== 空狀態 / 載入 ===== */
.empty-hint {
  font-size: var(--typography-ai-size);
  font-weight: var(--typography-ai-weight);
  line-height: var(--typography-ai-line-height);
  color: var(--text-primary);
  text-align: center;
  margin: var(--spacing-gap-section) 0 0;
}

/* ===== 打卡卡片列 ===== */
.checkin-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-card);
  margin-bottom: var(--spacing-gap-section);
}

.checkin-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-gap-task-btn);
}

:deep(.checkin-action-btn) {
  height: 40px;
  padding-top: 0;
  padding-bottom: 0;
}

.checkin-title {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.extra-badge {
  font-size: var(--typography-caption-size, 0.75rem);
  color: var(--text-brand);
  margin-left: 0.25rem;
}

.checkin-date {
  font-size: var(--typography-caption-size, 0.75rem);
  color: var(--text-secondary, var(--text-primary));
  margin: 0;
  text-align: center;
  opacity: 0.7;
}

/* ===== Section ===== */
.section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-section-title);
}

.section-title {
  font-size: var(--typography-heading-size);
  font-weight: var(--typography-heading-weight);
  line-height: var(--typography-heading-line-height);
  color: var(--text-primary);
  margin: 0;
}

/* ===== Progress 清單 ===== */
.progress-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-card);
}

.progress-card-link {
  cursor: pointer;
}

.progress-card {
  display: flex;
  flex-direction: column;
  gap: var(--core-spacing-400);
}

.progress-name {
  font-size: var(--typography-label-size);
  font-weight: var(--typography-label-weight);
  line-height: var(--typography-label-line-height);
  color: var(--text-primary);
  margin: 0;
}

.progress-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.stat-col {
  display: flex;
  align-items: baseline;
  gap: var(--core-spacing-200);
}

.stat-label {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
}

.stat-value {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-brand);
}

.stat-slash {
  color: var(--text-primary);
}

/* ===== Desktop (≥ 768px) ===== */
@media (min-width: 768px) {
  .checkin-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--spacing-gap-card);
  }

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
  }
}
</style>
