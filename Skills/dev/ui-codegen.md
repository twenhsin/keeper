# ui-codegen.md
> Skill：截圖 → 頁面程式碼生成規則
> 適用專案：Keeper
> 最後更新：2026-04-28

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

所有頁面（index.vue 除外）套用以下結構，layout 骨架由 `default.vue` 提供，頁面只需要負責 `page-header` 和 `page-content`。

**default.vue 提供的結構：**

.layout（fixed inset 0, padding 24px, flex）
├── .sidebar / .bottom-nav（BottomNav.vue，桌機左側，手機底部）
└── .main-wrap（flex: 1, 桌機 padding-left: 24px）
└── .main-content（max-width: 800px, margin: 0 auto）
└── <slot />（各頁面內容）


**對話框（index、plans/backlog）：**
- position: absolute
- bottom: 0
- 父層需有 position: relative
- z-index: 50
- 高度隨內容向上延展
- page-content 需有足夠 padding-bottom 避免被遮住

**各頁面只需要：**
```vue
<template>
  <div class="page-header">
    <PageHeader title="頁面標題" />
    <!-- 若有 Tab，放在 PageHeader 下方，gap 16px -->
  </div>
  <div class="page-content">
    <!-- 頁面內容 -->
  </div>
</template>

<style scoped>
.page-header {
  flex-shrink: 0;
  padding-top: 24px;
}

.page-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0 24px;
  scrollbar-width: none;
}

.page-content::-webkit-scrollbar {
  display: none;
}
</style>
```

**禁止事項：**
- 不在頁面內使用 `position: fixed` 做 layout 定位
- 不在頁面內設定 `left`、`right`、`top`、`bottom` 做 layout 偏移
- 不在頁面內引用 `<BottomNav />`（已在 default.vue 統一管理）
- 桌機版 layout 不需要 `@media (min-width: 768px)` 另外處理，default.vue 已統一

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

### Home（index.vue）— 例外結構
- 輸入框：position: absolute，bottom: 0，相對於 .page（需設 position: relative）

### Plans（plans.vue）— 有 Tab，有對話框（Backlog）

- header-wrapper 內：PageHeader title="Plans" + Tab 列（間距 16px）
- Tab：Habits / Long-term / Backlog，active 狀態外框漸層
- Habits / Long-term：`PlanCard` 列表，右側 Toggle，點擊開彈窗
- Backlog：純文字清單卡片，右側 × 刪除
- Backlog 對話框：fixed，bottom: 72px，textarea（min-height 120px）+ Send 按鈕右下


### Records（records.vue）— 無 Tab

- 頂部：打卡卡片，按下 Check in 消失；桌機版三欄排列
- 中段：Progress report 標題 + 統計卡片列表
- 統計卡片：標題與數據間距 16px，This week / This month 兩欄等寬（grid 1fr 1fr）
- 數字用 text-brand 色標示
- 點擊統計卡片導航至 `/records-detail-[id]`


### Records Detail（records-detail-[id].vue）— 無 Tab

- main-content top: 111px
- PageHeader title="Records"，showBack: true，箭頭與標題文字皆可點擊返回
- id=1（習慣任務）：折線圖（SVG）+ 年份 + 週列表（checkbox 三種狀態）
- id=2（長期任務）：progress bar + Phase 清單


### Setting（setting.vue）— 無 Tab

- main-content top: 111px
- Claude API KEY：input 內嵌漸層上傳按鈕（按鈕在 input 右側內部）
- About Me：section 標題 + 右側 + 按鈕 + textarea
- Project：section 標題 + 右側 + 按鈕 + FileCard grid
- FileCard grid：手機三欄，桌機六欄
- Section 間距 32px，Section 標題與元素間距 12px


---

## 九、AppButton 狀態

| 狀態 | 樣式 |
|------|------|
| default | 漸層背景（#FF7FDC → #FFBB8E），文字白色 |
| hover | default 漸層 + shadow（#7A4099，opacity 15%，blur 4px）|
| active | 漸層（#EE64C8 → #F4A875）|
| disabled | opacity 50% |

---

## 十、輸入框交互狀態規則

所有 input 和 textarea 的按鈕交互模式統一如下：

### 按鈕顯示邏輯
- 未輸入 / 已儲存且未編輯：不顯示儲存按鈕（v-if 控制，不佔空間）
- 編輯中（有輸入文字）：顯示 Save icon
- 已儲存狀態：顯示 Trash2 icon

### 按鈕樣式
- Save icon：Lucide `<Save>`，顏色 #FF7FDC，無背景框，無 border
- Trash2 icon：Lucide `<Trash2>`，顏色 #FF7FDC，無背景框，無 border
- 尺寸：40×40px

### 按鈕位置
- input（單行）：右側垂直置中
- textarea（多行）：position absolute，top 12px，right 12px
- textarea 需設 padding-right: 48px 避免文字被按鈕蓋住

### 刪除確認
- 所有刪除操作必須透過 ConfirmDialog 確認，不可直接刪除
- 使用 `confirmDelete(action)` pattern，傳入刪除 function

### 刪除 vs 關閉 icon 區別
- 刪除功能 → Trash2
- 關閉/收合（如 detail 彈窗）→ X icon

---

## 十ㄧ、回報格式

頁面生成完成後，回報：

1. **變更 / 新增檔案清單**（有變更時才列出）
2. **視覺待確認項目**（無法從截圖判斷的細節，列出問題請 Kelly 確認）
3. **尚未建立的元件**（截圖中發現但元件清單未涵蓋的區塊）
