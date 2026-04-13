# component-gen.md
> Skill：元件抽取與生成規則
> 適用專案：Keeper
> 最後更新：2026-04-13

---

## 一、任務定義

從截圖或頁面程式碼中識別可複用區塊，依照本文件規則生成獨立 Vue 元件。
所有元件輸出至 `components/` 資料夾。

---

## 二、元件拆分判斷標準

符合以下任一條件，獨立為元件：

1. 出現在兩個以上頁面
2. 結構複雜且具獨立功能（即使只出現一次）
3. 有多個 props 變體或互動狀態

不符合以上條件 → 直接寫在頁面 `.vue` 檔內，不強制抽取。

---

## 三、現有元件清單

開發新頁面或新元件前，先確認以下元件是否已存在，存在則直接引用。

### Layout 元件

#### `BottomNav.vue`
```
Props：
- active: 'home' | 'plans' | 'records' | 'setting'

規格：
- 背景：透明（頁面背景透出）
- Active 外框：漸層（#FF7FDC → #FFBB8E），圓角 12px
- Inactive：無框
- 位置：fixed bottom，全寬
```

#### `PageHeader.vue`
```
Props：
- title: string
- showBack: boolean（預設 false）

規格：
- 字級：3.2rem，Regular，Noto Serif TC
- 字色：#363134
- showBack = true 時，左側顯示 ← 返回箭頭
- 與下方 content gap：32px
```

---

### 通用元件

#### `AppButton.vue`
```
Props：
- variant: 'primary' | 'disabled'（預設 primary）
- label: string

規格：
- 圓角：12px
- Padding：上下 12px，左右 16px
- 字級：1.6rem，Regular，白色
- 寬度：預設全寬（width: 100%）

狀態：
- default：linear-gradient(to right, #FF7FDC, #FFBB8E)
- hover：default 漸層 + box-shadow（color #7A4099，opacity 15%，blur 4px，x 0，y 0）
- active：linear-gradient(to right, #EE64C8, #F4A875)
- disabled：opacity 50%，pointer-events: none
```

#### `BaseCard.vue`
```
Props：
- padding: 'sm' | 'lg'（sm = 16px，lg = 24px）
- opacity: 80 | 100（預設 80）

規格：
- 背景：rgba(255,255,255, opacity/100)
- 圓角：20px
- Shadow：無

用途：
- padding sm + opacity 80：清單卡片、report 卡片、文件卡片
- padding lg + opacity 100：彈窗卡片、打卡卡片、detail 卡片
```

---

### 功能元件

#### `TaskCard.vue`（打卡卡片）
```
Props：
- title: string
- date: string

規格：
- 基於 BaseCard（padding lg，opacity 100）
- 內容：任務名稱（1.6rem Semibold）+ 日期（1.2rem）
- Done 按鈕：AppButton variant="primary"，label="Done"
- 文字與按鈕 gap：24px
```

#### `PlanCard.vue`（Plans 清單卡片）
```
Props：
- title: string
- description: string（detail 彈窗用）
- isActive: boolean（Toggle 狀態）
- showDetail: boolean（控制彈窗顯示）

規格：
- 清單狀態（基於 BaseCard sm opacity 80）：
  - 左側：任務名稱（1.6rem Semibold）
  - 右側：Toggle（on = 漸層，off = #D0D0D0，圓角 full）
- Detail 彈窗狀態（基於 BaseCard lg opacity 100）：
  - 右上角：× 關閉按鈕（字色 #FF7FDC）
  - 標題：2.0rem Semibold
  - 說明文：1.6rem Regular，gap 24px
```

#### `ProgressCard.vue`（Progress report 卡片）
```
Props：
- title: string
- thisWeek: string（例：'2/7'）
- thisMonth: string（例：'6/31'）

規格：
- 基於 BaseCard（padding sm，opacity 80）
- 任務名稱：1.6rem Semibold
- This week / This month 標籤：1.2rem，字色 #363134
- 數字：1.2rem，字色 #FF7FDC（brand color）
- 兩組數據橫向排列，gap 自動分配
- 點擊整張卡片進入 detail 頁
```

#### `FileCard.vue`（文件卡片）
```
Props：
- filename: string
- type: string（例：'MD'）

規格：
- 基於 BaseCard（padding sm，opacity 80）
- 上方：檔名（1.6rem Semibold）
- 下方：type 標籤（1.2rem，border #E0E0E0，圓角 12px，padding 4px 8px）
- 固定寬度：約 100px（多個並排時換行）
```

#### `ChatBubble.vue`（對話氣泡）
```
Props：
- align: 'left' | 'right'
- content: string

規格：
- align right（用戶訊息）：
  - 背景：rgba(255,255,255,0.8)
  - 圓角：12px
  - Padding：16px
  - 靠右對齊
- align left（AI 訊息）：
  - 無氣泡框，文字直接顯示於背景
  - 靠左對齊
- 字級：1.6rem Regular
- 字色：#363134
- 對話問答上下 gap：24px
```

---

## 四、元件生成規則

### 檔案結構

```vue
<template>
  <!-- 元件 HTML 結構 -->
</template>

<script setup>
// Props 定義
const props = defineProps({
  propName: {
    type: String,
    default: 'defaultValue'
  }
})
</script>

<style scoped>
/* 使用 CSS custom properties，禁止直接寫色碼或 px 字級 */
.component {
  padding: var(--spacing-400);
  border-radius: var(--radius-card);
  font-size: var(--font-size-300);
}
</style>
```

### 樣式規則

- CSS custom properties 優先（`var(--token-name)`）
- 輔助排版用 Tailwind（flex、grid、overflow 等）
- 禁止在元件內直接寫色碼（#HEXCODE）
- 禁止在元件內直接寫 px 字級，統一用 rem

### 漸層寫法

品牌漸層統一定義為 CSS variable，元件引用：

```css
:root {
  --gradient-brand: linear-gradient(to right, #FF7FDC, #FFBB8E);
  --gradient-brand-active: linear-gradient(to right, #EE64C8, #F4A875);
}
```

```css
.button {
  background: var(--gradient-brand);
}
```

---

## 五、新元件建立流程

1. 確認元件清單中不存在相同功能元件
2. 判斷是否符合拆分標準（第二節）
3. 確認基於哪個基礎元件（BaseCard / 獨立）
4. 依照第四節模板生成 `.vue` 檔
5. 回報新增的元件名稱與 props 清單

---

## 六、回報格式

元件生成完成後回報：

1. 新增 / 修改的元件檔案清單
2. 各元件的 props 清單
3. 視覺待確認項目（截圖無法判斷的細節）
4. 若發現截圖中有未列入清單的重複區塊，提出是否新增元件的建議
