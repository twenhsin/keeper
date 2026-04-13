# ui-codegen.md
> Skill：截圖 → 頁面程式碼生成規則
> 適用專案：Keeper
> 最後更新：2026-04-13

---

## 一、任務定義

收到 Figma 截圖時，依照本文件規則將截圖還原為 Nuxt 3 + Vue 3 頁面程式碼。
截圖來源：Figma 直接截圖。

---

## 二、執行前置確認

每次收到截圖，執行前先完成以下確認：

1. 讀取 `design-system.md`，作為視覺對照基準
2. 讀取 `design-tokens.md`，確認 token 命名規則
3. 掃描 `components/` 資料夾，確認現有元件清單
4. 確認目標頁面路由（`pages/` 下對應的 `.vue` 檔）

---

## 三、樣式輸出規則

### 優先順序

```
1. design-system token（CSS custom properties）
2. Tailwind utility class
3. inline style（僅用於動態值或無法用以上兩種表達的情況）
```

### Token 使用方式

在 `assets/css/tokens.css` 定義 CSS custom properties，頁面與元件透過 `var()` 引用：

```css
/* tokens.css */
:root {
  --color-brand-primary: #FF7FDC;
  --color-brand-secondary: #FFBB8E;
  --spacing-600: 24px;
  --radius-card: 20px;
  /* ... */
}
```

```vue
<!-- 元件內使用 -->
<style scoped>
.card {
  padding: var(--spacing-600);
  border-radius: var(--radius-card);
}
</style>
```

### Tailwind 使用範圍

Token 無法涵蓋的輔助樣式使用 Tailwind：
- flex、grid 排版
- overflow、position、z-index
- 顯示／隱藏控制

### 字級單位

所有字級使用 rem，基準：`html { font-size: 62.5% }`，1rem = 10px。
禁止在元件內直接寫 px 字級。

---

## 四、元件引用規則

### 現有元件清單（開發前掃描確認）

| 元件 | 檔案 | Props |
|------|------|-------|
| BottomNav | `components/BottomNav.vue` | `active`（home/plans/records/setting）|
| PageHeader | `components/PageHeader.vue` | `title`、`showBack`（boolean）|
| AppButton | `components/AppButton.vue` | `variant`（primary/disabled）、`label` |
| BaseCard | `components/BaseCard.vue` | `padding`（sm=16px/lg=24px）、`opacity`（80/100）|
| TaskCard | `components/TaskCard.vue` | `title`、`date` |
| PlanCard | `components/PlanCard.vue` | `title`、`description`、`isActive`（toggle）|
| ProgressCard | `components/ProgressCard.vue` | `title`、`thisWeek`、`thisMonth` |
| FileCard | `components/FileCard.vue` | `filename`、`type` |
| ChatBubble | `components/ChatBubble.vue` | `align`（left/right）、`content` |

### 引用規則

- 截圖中識別到上表元件 → 直接引用，不重新生成
- 截圖中出現上表未涵蓋的重複區塊 → 回報後確認是否新增元件
- 截圖中出現唯一性區塊 → 直接寫在頁面 `.vue` 檔內

---

## 五、頁面生成規則

### 檔案位置

```
pages/
  index.vue        — Home
  plans.vue        — Plans
  records.vue      — Records
  setting.vue      — Setting
```

### 頁面結構模板

```vue
<template>
  <div class="page">
    <!-- 背景層 -->
    <div class="page-bg" aria-hidden="true">
      <div class="bg-blob bg-blob--top-right" />
      <div class="bg-blob bg-blob--top-left" />
      <div class="bg-blob bg-blob--bottom" />
    </div>

    <!-- 內容層 -->
    <div class="page-content">
      <PageHeader title="頁面標題" />
      <!-- 頁面內容 -->
    </div>

    <!-- 底部導航 -->
    <BottomNav active="pageName" />
  </div>
</template>

<style scoped>
.page {
  position: relative;
  min-height: 100dvh;
  padding: var(--spacing-page-top) var(--spacing-page-x) var(--spacing-page-bottom);
  overflow: hidden;
}
.page-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
}
.page-content {
  position: relative;
  z-index: 1;
}
</style>
```

### 背景色塊規格

三個色塊固定，所有頁面共用，定義在 `layouts/default.vue` 或全域 CSS：

```css
/* 右上方 Radial（圓形）*/
.bg-blob--top-right {
  position: absolute;
  top: 0; right: 0;
  width: 456px; height: 649px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(254,238,234,0.9) 3%,
    rgba(249,237,226,1.0) 54%,
    rgba(255,253,230,0.5) 92%
  );
}

/* 左上方 Radial（橢圓）*/
.bg-blob--top-left {
  position: absolute;
  top: 0; left: 0;
  width: 679px; height: 419px;
  border-radius: 50%;
  background: radial-gradient(ellipse,
    rgba(237,243,252,0.6) 0%,
    rgba(228,235,246,0.8) 44%,
    rgba(242,249,251,0.3) 100%
  );
}

/* 下方 Linear（橢圓形色塊）*/
.bg-blob--bottom {
  position: absolute;
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  width: 100%; height: 420px;
  border-radius: 50%;
  background: linear-gradient(to bottom,
    rgba(252,250,248,0.3) 0%,
    rgba(249,235,238,1.0) 66%
  );
}
```

---

## 六、間距與圓角速查

| 用途 | 數值 | Token |
|------|------|-------|
| 頁面左右 padding | 24px | --spacing-page-x |
| 頁面上方 padding | 40px | --spacing-page-top |
| Header 與 content gap | 32px | --spacing-700 |
| Section 上下 gap | 32px | --spacing-700 |
| Section 標題與物件 gap | 12px | --spacing-300 |
| 卡片與卡片 gap | 12px | --spacing-300 |
| 按鈕、Tab、Toast、對話框圓角 | 12px | --radius-200 |
| 卡片圓角 | 20px | --radius-card |
| Toggle 圓角 | 9999px | --radius-full |

---

## 七、字級速查

基準：`html { font-size: 62.5% }`

| 用途 | rem | Weight |
|------|-----|--------|
| 頁面大標題 | 3.2rem | 400 |
| 說明卡片標題 | 2.0rem | 600 |
| Section 標題 | 2.0rem | 400 |
| 卡片小標題 | 1.6rem | 600 |
| 內文 | 1.6rem | 400 |
| Caption | 1.2rem | 400 |

字型：Noto Serif TC（全站統一）

---

## 八、各頁面生成重點

### Home（index.vue）

- 背景：三色塊（全頁共用）
- 上方：AI 督促提醒文字（3.2rem，無氣泡框，直接顯示於背景）
- 中段：對話區，AI 文字直接顯示，用戶訊息使用 `ChatBubble align="right"`
- 底部：Input 區（兩層結構：底層漸層 + 上層白色，shadow 規格見 design-system.md）
- 底部導航：`BottomNav active="home"`

### Plans（plans.vue）

- PageHeader title="Plans"
- Tab 列（Habits / Long-term / Backlog），active 狀態外框漸層
- 清單：`PlanCard` 列表，右側 Toggle
- 點擊卡片：彈窗覆蓋（`BaseCard padding="lg" opacity="100"`），右上角 × 關閉
- 底部導航：`BottomNav active="plans"`

### Records（records.vue）

- PageHeader title="Records"
- 頂部：待確認打卡卡片（`TaskCard`），當天卡片與補發卡片分區塊
- 中段：Progress report 標題 + `ProgressCard` 列表
- 點擊 ProgressCard 進入 detail 頁：`records/[id].vue`
- 底部導航：`BottomNav active="records"`

### Records Detail（records/[id].vue）

- PageHeader title="Records" showBack
- 習慣任務：`BaseCard padding="lg"`，內含標題、折線圖、週列表（勾/X 狀態）
- 長期任務：`BaseCard padding="lg"`，內含標題、progress bar、Phase 清單
- 底部導航：`BottomNav active="records"`

### Setting（setting.vue）

- PageHeader title="Setting"
- Claude API Key：Input + 上傳按鈕（漸層圓角方形 icon 按鈕）
- About Me：section 標題 + textarea（`BaseCard padding="lg" opacity="80"`）+ FileCard
- Project：section 標題 + FileCard 列表
- 底部導航：`BottomNav active="setting"`

---

## 九、AppButton 狀態

| 狀態 | 樣式 |
|------|------|
| default | 漸層背景（#FF7FDC → #FFBB8E），文字白色 |
| hover | default 漸層 + shadow（#7A4099，opacity 15%，blur 4px）|
| active | 漸層（#EE64C8 → #F4A875）|
| disabled | opacity 50% |


---

## 十、回報格式

頁面生成完成後，回報：

1. **變更 / 新增檔案清單**（有變更時才列出）
2. **視覺待確認項目**（無法從截圖判斷的細節，列出問題請 Kelly 確認）
3. **尚未建立的元件**（截圖中發現但元件清單未涵蓋的區塊）
