# ui-codegen.md
> Skill：截圖 → 頁面程式碼生成規則
> 適用專案：Keeper
> 最後更新：2026-04-13

---

## 一、任務定義

收到 Figma 截圖時，依照本文件規則將截圖還原為 Nuxt 3 + Vue 3 頁面程式碼。
截圖來源：Figma 直接截圖或瀏覽器畫面。

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

**index.vue 例外**，維持獨立結構（對話區捲動 + 輸入框 fixed）。

其餘所有頁面採三區塊固定佈局：

```vue
<template>
  <div class="page">
    <!-- PageHeader（fixed） -->
    <div class="header-wrapper">
      <PageHeader title="頁面標題" />
      <!-- 若有 Tab，放在 PageHeader 下方，間距 16px -->
    </div>

    <!-- 可捲動內容區（fixed） -->
    <div class="main-content">
      <!-- 頁面內容 -->
    </div>

    <!-- BottomNav（fixed） -->
    <BottomNav active="pageName" />
  </div>
</template>

<style scoped>
.page {
  height: 100dvh;
}

/* PageHeader：fixed，背景透明 */
.header-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: var(--spacing-page-top) var(--spacing-page-x) 0;
  background: transparent;
}

/* content：fixed，top / bottom 依變體決定 */
.main-content {
  position: fixed;
  top: 111px;    /* 無 Tab：40 + 39 + 32 */
  /* top: 161px; 有 Tab：40 + 89 + 32 */
  bottom: 88px;  /* 24 + 32 + 32 */
  left: 0;
  right: 0;
  padding: 0 var(--spacing-page-x) var(--spacing-page-x);
  overflow-y: auto;
  scrollbar-width: none;
}

.main-content::-webkit-scrollbar {
  display: none;
}

/* 桌機版 */
@media (min-width: 768px) {
  .page {
    padding-left: 80px;
  }
  .header-wrapper {
    left: 80px;
  }
  .main-content {
    left: 80px;
    max-width: 800px;
    margin-right: auto;
    bottom: 32px;
  }
}
</style>
```

**content top 速查：**

| 頁面變體 | top 值 | 說明 |
|---------|--------|------|
| 無 Tab | 111px | 40 + 39 + 32 |
| 有 Tab | 161px | 40 + 89 + 32 |

**對話框（index、plans/backlog）：**
- position: fixed
- bottom: 72px（24 + 32 + 16）
- z-index：高於 content，低於 BottomNav（z-index: 50）
- 高度隨內容向上延展
- content padding-bottom 需足夠大避免內容被遮住


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

所有頁面（index 除外）套用三區塊固定佈局，詳見第五節模板。

### Home（index.vue）— 例外結構

- 對話區自然捲動，不使用三區塊 fixed 佈局
- 上方：AI 督促提醒文字（2.4rem，無氣泡框）
- 中段：對話區，AI 文字直接顯示，用戶訊息使用 `ChatBubble align="right"`
- 輸入框：fixed，bottom: 72px，兩層結構（底層漸層 + 內層白色 + Send 按鈕在右下）
- `BottomNav active="home"`

### Plans（plans.vue）— 有 Tab，有對話框（Backlog）

- header-wrapper 內：PageHeader title="Plans" + Tab 列（間距 16px）
- main-content top: 161px
- Tab：Habits / Long-term / Backlog，active 狀態外框漸層
- Habits / Long-term：`PlanCard` 列表，右側 Toggle，點擊開彈窗
- Backlog：純文字清單卡片，右側 × 刪除
- Backlog 對話框：fixed，bottom: 72px，textarea（min-height 120px）+ Send 按鈕右下
- `BottomNav active="plans"`

### Records（records.vue）— 無 Tab

- main-content top: 111px
- 頂部：打卡卡片，按下 Check in 消失；桌機版三欄排列
- 中段：Progress report 標題 + 統計卡片列表
- 統計卡片：標題與數據間距 16px，This week / This month 兩欄等寬（grid 1fr 1fr）
- 數字用 text-brand 色標示
- 點擊統計卡片導航至 `/records-detail-[id]`
- `BottomNav active="records"`

### Records Detail（records-detail-[id].vue）— 無 Tab

- main-content top: 111px
- PageHeader title="Records"，showBack: true，箭頭與標題文字皆可點擊返回
- id=1（習慣任務）：折線圖（SVG）+ 年份 + 週列表（checkbox 三種狀態）
- id=2（長期任務）：progress bar + Phase 清單
- `BottomNav active="records"`

### Setting（setting.vue）— 無 Tab

- main-content top: 111px
- Claude API KEY：input 內嵌漸層上傳按鈕（按鈕在 input 右側內部）
- About Me：section 標題 + 右側 + 按鈕 + textarea
- Project：section 標題 + 右側 + 按鈕 + FileCard grid
- FileCard grid：手機三欄，桌機六欄
- Section 間距 32px，Section 標題與元素間距 12px
- `BottomNav active="setting"`

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
