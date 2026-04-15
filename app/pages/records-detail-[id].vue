<template>
  <div class="page">
    <BottomNav active="records" />

    <!-- Fixed PageHeader with back arrow -->
    <div class="header-wrapper">
      <PageHeader title="Records" :show-back="true" back-to="/records" />
    </div>

    <!-- Scrollable Content -->
    <div class="main-content">

      <!-- ===== id=1：習慣任務 detail ===== -->
      <template v-if="id === '1'">
        <BaseCard padding="lg" :opacity="80" class="detail-card">

          <!-- 任務標題 -->
          <h2 class="card-title">一週兩次運動習慣</h2>

          <!-- 折線圖（靜態 SVG） -->
          <!--
            viewBox 0 0 280 120
            Chart area x: 20–260, y: 10–90
            Month slots each 20px, centers: 30 50 70 90 110 ... 250
            Y scale: value/30 * 80; y = 90 - scaled
            Data: Jan(8)→68.7  Feb(12)→58  Mar(6)→74  Apr(10)→63.3
          -->
          <svg class="chart" viewBox="0 0 280 120" width="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chartLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#FF7FDC" />
                <stop offset="100%" stop-color="#FFBB8E" />
              </linearGradient>
            </defs>
            <!-- Grid lines -->
            <line x1="20" y1="10"   x2="260" y2="10"   stroke="#F0F0F0" stroke-width="1" />
            <line x1="20" y1="36.7" x2="260" y2="36.7" stroke="#F0F0F0" stroke-width="1" />
            <line x1="20" y1="63.3" x2="260" y2="63.3" stroke="#F0F0F0" stroke-width="1" />
            <line x1="20" y1="90"   x2="260" y2="90"   stroke="#F0F0F0" stroke-width="1" />
            <!-- Y-axis labels -->
            <text x="16" y="13"   font-size="8" text-anchor="end" fill="#868385">30</text>
            <text x="16" y="39.7" font-size="8" text-anchor="end" fill="#868385">20</text>
            <text x="16" y="66.3" font-size="8" text-anchor="end" fill="#868385">10</text>
            <text x="16" y="93"   font-size="8" text-anchor="end" fill="#868385">0</text>
            <!-- Data line -->
            <polyline
              points="30,68.7 50,58 70,74 90,63.3"
              fill="none"
              stroke="url(#chartLineGrad)"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            />
            <!-- Data points -->
            <circle cx="30" cy="68.7" r="3" fill="#FF7FDC" />
            <circle cx="50" cy="58"   r="3" fill="#FF99C4" />
            <circle cx="70" cy="74"   r="3" fill="#FFB0A0" />
            <circle cx="90" cy="63.3" r="3" fill="#FFBB8E" />
            <!-- X-axis month labels -->
            <text x="30"  y="108" font-size="7" text-anchor="middle" fill="#868385">Jan</text>
            <text x="50"  y="108" font-size="7" text-anchor="middle" fill="#868385">Feb</text>
            <text x="70"  y="108" font-size="7" text-anchor="middle" fill="#868385">Mar</text>
            <text x="90"  y="108" font-size="7" text-anchor="middle" fill="#868385">Apr</text>
            <text x="110" y="108" font-size="7" text-anchor="middle" fill="#868385">May</text>
            <text x="130" y="108" font-size="7" text-anchor="middle" fill="#868385">Jun</text>
            <text x="150" y="108" font-size="7" text-anchor="middle" fill="#868385">Jul</text>
            <text x="170" y="108" font-size="7" text-anchor="middle" fill="#868385">Aug</text>
            <text x="190" y="108" font-size="7" text-anchor="middle" fill="#868385">Sep</text>
            <text x="210" y="108" font-size="7" text-anchor="middle" fill="#868385">Oct</text>
            <text x="230" y="108" font-size="7" text-anchor="middle" fill="#868385">Nov</text>
            <text x="250" y="108" font-size="7" text-anchor="middle" fill="#868385">Dec</text>
          </svg>

          <!-- 年份 -->
          <p class="year-label">2026</p>
          <div class="divider" />

          <!-- 週列表 -->
          <div class="record-list">
            <!-- 3 week：空白（未執行，待確認） -->
            <div class="record-row">
              <span class="record-label">3 week｜3 次</span>
              <div class="checkbox checkbox--empty" />
            </div>
            <!-- 2 week：漸層勾選（Done） -->
            <div class="record-row">
              <span class="record-label">2 week｜3 次</span>
              <div class="checkbox checkbox--done">
                <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                  <path d="M3 8.5L6.5 12L13 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <!-- 1 week：灰色 X（未執行） -->
            <div class="record-row">
              <span class="record-label">1 week｜1 次</span>
              <div class="checkbox checkbox--miss">
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                  <path d="M4 4L12 12M12 4L4 12" stroke="white" stroke-width="2" stroke-linecap="round" />
                </svg>
              </div>
            </div>
          </div>

        </BaseCard>
      </template>

      <!-- ===== id=2：長期任務 detail ===== -->
      <template v-else-if="id === '2'">
        <BaseCard padding="lg" :opacity="80" class="detail-card">

          <!-- 任務標題 -->
          <h2 class="card-title">Filo</h2>

          <!-- Progress bar 1/10 = 10% -->
          <div class="progress-track">
            <div class="progress-fill" style="width: 10%" />
          </div>

          <!-- Phase 清單 -->
          <div class="record-list">
            <!-- Phase 1：漸層勾選 -->
            <div class="record-row">
              <span class="record-label">Phase 1</span>
              <div class="checkbox checkbox--done">
                <svg viewBox="0 0 16 16" width="11" height="11" fill="none">
                  <path d="M3 8.5L6.5 12L13 5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </div>
            </div>
            <!-- Phase 2–10：空白未勾選 -->
            <div v-for="n in 9" :key="n" class="record-row">
              <span class="record-label">Phase {{ n + 1 }}</span>
              <div class="checkbox checkbox--empty" />
            </div>
          </div>

        </BaseCard>
      </template>

    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const id = route.params.id
</script>

<style scoped>
/* ===== 頁面容器 ===== */
.page {
  height: 100dvh;
}

/* ===== Fixed PageHeader ===== */
/* padding-top 40px + h1 38px = 78px；content top = 78 + 32 = 110px */
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

/* ===== Detail 卡片 ===== */
.detail-card {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-task-btn); /* 24px */
}

/* 任務標題（20px Semibold） */
.card-title {
  font-size: var(--typography-subheading-size);
  font-weight: var(--typography-subheading-weight);
  line-height: var(--typography-subheading-line-height);
  color: var(--text-primary);
  margin: 0;
}

/* ===== 折線圖 ===== */
.chart {
  display: block;
}

/* ===== 年份標題 ===== */
.year-label {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  margin: 0;
}

/* ===== 分隔線 ===== */
.divider {
  height: 1px;
  background: var(--ui-divider);
  margin: calc(-1 * var(--core-spacing-300)) 0; /* 抵消部分 gap，讓分隔線視覺間距較窄 */
}

/* ===== Progress Bar（長期任務） ===== */
.progress-track {
  height: 8px;
  background: var(--ui-progress-track);
  border-radius: var(--radius-progress);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--gradient-brand);
  border-radius: var(--radius-progress);
}

/* ===== 紀錄列表 ===== */
.record-list {
  display: flex;
  flex-direction: column;
  gap: var(--core-spacing-300); /* 12px */
}

.record-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--core-spacing-400);
}

.record-label {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
}

/* ===== Checkbox ===== */
.checkbox {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 空白（待確認） */
.checkbox--empty {
  background: var(--core-color-white);
  border: 1.5px solid var(--ui-checkbox-empty-border);
}

/* 漸層勾選（Done） */
.checkbox--done {
  background: var(--gradient-brand);
}

/* 灰色 X（未執行） */
.checkbox--miss {
  background: var(--ui-checkbox-miss);
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
}
</style>
