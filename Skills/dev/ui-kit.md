# ui-kit.md
> Skill：UI Kit 頁面生成規則
> 適用專案：Keeper
> 最後更新：2026-04-13

---

## 一、任務定義

當被要求生成 UI Kit 或視覺規範頁面時，依照本文件規則生成完整的 `/ui-kit` 路由頁面。
輸出目標：可直接在瀏覽器全頁截圖，capture 至 Figma 作為設計規範交付物。

---

## 二、執行前置確認

1. 讀取 `design-system.md`：取得所有視覺數值
2. 讀取 `design-tokens.md`：確認 token 命名
3. 讀取 `component-gen.md`：確認現有元件清單與 props
4. 掃描 `components/` 資料夾：確認元件是否已實作

---

## 三、頁面規格

### 路由
```
pages/ui-kit.vue
```

### 頁面設定
- 背景：白色（#FFFFFF），不使用 Keeper 頁面背景色塊，確保規範清晰可讀
- 最大寬度：1440px，margin auto 置中
- 頁面左右 padding：80px
- Section 間距：80px
- 字型：Noto Serif TC

### 版面結構
左側固定導覽列（160px）+ 右側內容區（全寬）

```
┌─────────────────────────────────────────┐
│  Keeper Design System          v1.0.0   │
├──────────┬──────────────────────────────┤
│ Colors   │                             │
│ Type     │   Content Area              │
│ Spacing  │                             │
│ Radius   │                             │
│ Shadow   │                             │
│ Components│                            │
│ Navigation│                            │
└──────────┴──────────────────────────────┘
```

---

## 四、Section 結構規則

每個 Section 遵循以下結構：

```html
<section class="uk-section">
  <h2 class="uk-section-title">Section 名稱</h2>
  <p class="uk-section-desc">說明文字（選填）</p>
  <div class="uk-section-content">
    <!-- 展示內容 -->
  </div>
</section>
```

Section 標題規格：
- 字級：2.0rem，Semibold
- 字色：#363134
- 底部 border：1px solid #F0F0F0
- 標題與內容 gap：32px

---

## 五、各 Section 展示內容

### Section 1：Colors

**Brand**
- 兩個色塊並排：#FF7FDC（Primary）、#FFBB8E（Secondary）
- 漸層色塊（全寬）：linear-gradient(to right, #FF7FDC, #FFBB8E)
- 每個色塊下方標示：Token 名稱 + Hex

**Text**
- 色塊列：#363134（Primary）、#FFFFFF（Inverse，黑底顯示）、#FF7FDC（Brand）

**Surface**
- 色塊列：白色 100%、白色 80%（棋盤格底顯示透明度）
- Input 底層漸層色塊

**Background**
- 三個背景色塊各自展示，標示用途（右上 Radial / 左上 Radial / 下方 Linear）

---

### Section 2：Typography

每個字級獨立一行展示：

```
頁面大標題    3.2rem / 400    Aa 永遠保持好奇心
說明卡片標題  2.0rem / 600    Aa 永遠保持好奇心
Section 標題  2.0rem / 400    Aa 永遠保持好奇心
卡片小標題    1.6rem / 600    Aa 永遠保持好奇心
內文          1.6rem / 400    Aa 永遠保持好奇心
Caption       1.2rem / 400    Aa 永遠保持好奇心
```

每行格式：左側標籤（用途名稱 + rem + weight）→ 右側文字展示

---

### Section 3：Spacing

以視覺色塊方式展示每個 spacing token：

```
100   4px   ████
200   8px   ████████
300   12px  ████████████
400   16px  ████████████████
500   20px  ████████████████████
600   24px  ████████████████████████
700   32px  ████████████████████████████████
800   40px  ████████████████████████████████████████
900   48px  ████████████████████████████████████████████████
```

色塊顏色：#FF7FDC，高度固定 24px，寬度依數值等比例

每行格式：Token 名稱 → px 數值 → 視覺色塊

---

### Section 4：Border Radius

圓角展示：相同大小的正方形色塊，套用不同圓角值

```
12px（按鈕 / Tab / Toast）
20px（卡片）
9999px（Toggle / Full）
```

每個色塊下方標示：px 數值 + 用途

---

### Section 5：Shadow

展示各 shadow 規格，每個 shadow 一張白色卡片：

```
Input Shadow    color #7A4099，opacity 15%，blur 24px，x 0，y 0
Button Hover    color #7A4099，opacity 15%，blur 4px，x 0，y 0
```

卡片下方標示完整 shadow 參數。

---

### Section 6：Components

#### Button
四種狀態橫向排列：
- Default：漸層（#FF7FDC → #FFBB8E）
- Hover：漸層 + shadow
- Active：漸層（#EE64C8 → #F4A875）
- Disabled：opacity 50%

每個按鈕下方標示狀態名稱。

#### Toggle
兩種狀態並排：
- On：漸層填色
- Off：#D0D0D0

#### Checkbox
三種狀態並排：
- Done：漸層填色 + 白色勾
- Empty：白色 + border
- Miss：#D0D0D0 + X

#### Input（Home 頁輸入框）
完整展示兩層結構：
- 底層漸層背景
- 上層白色
- Shadow 效果

#### ChatBubble
兩種狀態垂直排列（模擬對話）：
- AI 訊息（align left）：無氣泡，直接文字
- 用戶訊息（align right）：白色氣泡

#### BaseCard
兩種變體並排：
- sm padding + opacity 80（清單卡片）
- lg padding + opacity 100（彈窗卡片）

以棋盤格底顯示透明度差異。

#### TaskCard
完整展示打卡卡片，含 Done 按鈕。

#### PlanCard
兩種狀態：
- 清單狀態（含 Toggle on / off）
- Detail 彈窗狀態（含 × 關閉）

#### ProgressCard
完整展示，含假資料（This week 2/7，This month 6/31）。

#### FileCard
展示單張文件卡片（MD 類型）。

---

### Section 7：Navigation

#### BottomNav
展示完整底部導航列，四個 tab 各自呈現 active 狀態：
- Home active
- Plans active
- Records active
- Setting active

四種狀態橫向排列（各一列完整 BottomNav）。

#### Tab（Plans 頁）
展示 Habits / Long-term / Backlog，各自呈現 active 狀態。

#### PageHeader
兩種狀態：
- 無返回箭頭（title only）
- 有返回箭頭（showBack = true）

#### Toast / Banner
展示漸層 Toast，含文字內容。

---

## 六、生成指令格式

當被要求生成 UI Kit 頁面時，執行步驟：

1. 讀取前置文件（第二節）
2. 建立 `pages/ui-kit.vue`
3. 依照 Section 順序生成完整頁面
4. 已實作的元件直接引用，未實作的用靜態 HTML 模擬展示
5. 頁面生成完成後回報：
   - 已引用的元件清單
   - 以靜態模擬展示的元件（尚未實作）
   - 視覺待確認項目

---

## 七、Figma Capture 建議

- 瀏覽器縮放設為 100%
- 使用全頁截圖工具（如 Chrome 開發者工具 → Capture full size screenshot）
- 匯入 Figma 後以 Frame 包覆，標註版本號與日期
- 建議 Figma 頁面命名：`Design System v1.0 — YYYY-MM-DD`
