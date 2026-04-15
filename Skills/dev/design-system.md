# design-system.md
> Keeper 視覺設計規範
> 最後更新：2026-04-13
> 此文件提供實際數值，供 Claude Code 搭配 design-tokens.md 生成 tokens.json 及頁面樣式使用

---

## 一、色彩系統

### 1.1 Brand Color

| Token 名稱 | Hex | 用途 |
|-----------|-----|------|
| brand/primary | #FF7FDC | 主色，漸層起點 |
| brand/secondary | #FFBB8E | 主色，漸層終點 |

**主色漸層（brand gradient）**
方向：左到右或左上到右下
```
linear-gradient(to right, #FF7FDC, #FFBB8E)
```
用途：Button、Toast、Bottom nav active 外框、Toggle on 狀態、Progress bar、上傳按鈕

---

### 1.2 Text Color

| Token 名稱 | Hex | 用途 |
|-----------|-----|------|
| text/primary | #363134 | 主要文字 |
| text/inverse | #FFFFFF | 反白文字（用於漸層按鈕上） |
| text/brand | #FF7FDC | 強調數字（Progress report 數字） |
| text/danger | #FF7FDC | 關閉、刪除 icon（× 符號） |
| text/placeholder | #868385 | Input placeholder 文字色 |

---

### 1.3 Surface Color

| Token 名稱 | Hex / 描述 | 用途 |
|-----------|-----------|------|
| surface/card | rgba(255,255,255,1.0) | 彈窗卡片背景（100% 不透明，無 border） |
| surface/card-list | rgba(255,255,255,0.4) | 清單卡片、report 卡片、文件卡片 |
| surface/input | rgba(255,255,255,0.4) | Input 上層白色 |
| surface/textarea | rgba(255,255,255,0.4) | About Me textarea |

**非彈窗卡片共用規則：**
- 背景：rgba(255,255,255,0.4)
- Border：1px solid rgba(255,255,255,1.0)
- 彈窗卡片（surface/card）無 border，背景不透明

**Input 底層漸層**
三色橫向漸層：
```
linear-gradient(to right, #F4EED1, #F8E3DA, #DBE7F7)
```

**Input stroke**
白色，opacity 80%

**Input shadow**
```
color: #7A4099
opacity: 15%
blur: 24px
x: 0, y: 0
```

---

### 1.4 Background Color

頁面背景由三個色塊疊加組成，全部使用絕對定位，z-index 低於內容層。

**右上方 Radial（圓形）**
```
radial-gradient(circle, 
  #FEEEEA 3%,     opacity 90%
  #F9EDE2 54%,    opacity 100%
  #FFFDE6 92%     opacity 50%
)
尺寸：456 × 649px
位置：右上角
```

**左上方 Radial（橢圓）**
```
radial-gradient(ellipse,
  #EDF3FC 0%,     opacity 60%
  #E4EBF6 44%,    opacity 80%
  #F2F9FB 100%    opacity 30%
)
尺寸：679 × 419px（橢圓形，寬大於高）
位置：左上角
```

**下方 Linear（橢圓形色塊）**
```
linear-gradient(to bottom,
  #FCFAF8 0%,     opacity 30%
  #F9EBEE 66%     opacity 100%
)
位置：頁面底部
```

---

### 1.5 其他 UI 色

| Token 名稱 | Hex | 用途 |
|-----------|-----|------|
| ui/checkbox-done | #FF7FDC → #FFBB8E | 勾選完成狀態（漸層填色） |
| ui/checkbox-empty | #FFFFFF，border #E0E0E0 | 未勾選狀態 |
| ui/checkbox-miss | #D0D0D0 | 未執行（X 狀態） |
| ui/toggle-off | #D0D0D0 | Toggle 關閉狀態 |
| ui/divider | #F0F0F0 | 清單分隔線 |
| ui/progress-track | #F0F0F0 | Progress bar 底色 |

---

## 二、字級系統

**基準設定：** `html { font-size: 62.5% }` → 1rem = 10px

**字型：**
- 全站統一：Noto Serif TC

| 用途 | Size | rem | Weight | 備註 |
|------|------|-----|--------|------|
| 督促提醒文字 | 24px | 2.4rem | Regular (400) | Home 頁開啟時的 AI 提醒 |
| 頁面大標題 | 32px | 3.2rem | Regular (400) | Plans, Records, Setting, Home |
| 說明卡片標題 | 20px | 2.0rem | Semibold (600) | Plans detail 卡片標題 |
| Section 標題 | 20px | 2.0rem | Regular (400) | Progress report 標題 |
| 卡片小標題 | 16px | 1.6rem | Semibold (600) | 清單卡片任務名稱 |
| 內文 | 16px | 1.6rem | Regular (400) | 對話文字、說明文字、This week |
| 小字 / Caption | 14px | 1.4rem | Regular (400) | Tab label |

---

## 三、Spacing 系統

**基礎單位：** 4px

| Token | 值 |
|-------|----|
| 100 | 4px |
| 200 | 8px |
| 300 | 12px |
| 400 | 16px |
| 500 | 20px |
| 600 | 24px |
| 700 | 32px |
| 800 | 40px |
| 900 | 48px |

### Semantic Spacing 對應

| 用途 | 數值 | Token |
|------|------|-------|
| 頁面左右 padding | 24px | spacing/600 |
| 頁面上方 padding | 40px | spacing/800 |
| 頁面下方 padding | 24px | spacing/600 |
| 頁面 Header 標題與 Tab gap | 16px | spacing/400 |
| 頁面 Header 與 content gap | 32px | spacing/700 |
| Section 上下 gap | 32px | spacing/700 |
| Section 標題與下方物件 gap | 12px | spacing/300 |
| 卡片與卡片上下 gap | 12px | spacing/300 |
| 對話問答上下 gap | 24px | spacing/600 |
| 打卡卡片文字與按鈕 gap | 24px | spacing/600 |
| Records detail 大標題與下方 gap | 24px | spacing/600 |
| Records detail 卡片 section gap | 32px | spacing/700 |

### Padding 對應

| 元件 | Padding | Token |
|------|---------|-------|
| 清單卡片 | 16px | spacing/400 |
| Report 卡片 | 16px | spacing/400 |
| 文件卡片 | 16px | spacing/400 |
| 彈窗卡片 | 24px | spacing/600 |
| 打卡卡片 | 24px | spacing/600 |
| Records detail 卡片 | 24px | spacing/600 |
| 用戶對話框 | 16px | spacing/400 |

---

## 四、Border Radius

| 用途 | 數值 |
|------|------|
| 按鈕 | 12px |
| Tab | 12px |
| Toast | 12px |
| 對話框（白色） | 20px |
| 對話框外層漸層容器 | 24px |
| 卡片 | 20px |
| Toggle | 9999px（full） |
| 上傳按鈕（Setting） | 12px |
| 文件卡片（MD card） | 12px |

**對話框雙層結構：**
- 外層：漸層背景容器，圓角 24px
- 內層：白色背景，圓角 20px
- 外層比內層多 4px，確保漸層邊框視覺寬度一致

---

## 五、Shadow

| 用途 | 規格 |
|------|------|
| Input shadow | color #7A4099，opacity 15%，blur 24px，x 0，y 0 |
| 卡片 shadow | 無（白色卡片無陰影，依賴背景對比） |

---

## 六、元件規格

### Button

**共用規則：**
- 漸層填色（#FF7FDC → #FFBB8E）
- 文字：#FFFFFF，1.6rem，Regular
- 狀態：
  - default：漸層（#FF7FDC → #FFBB8E）
  - hover：default 漸層 + shadow（color #7A4099，opacity 15%，blur 4px，x 0，y 0）
  - active：漸層（#EE64C8 → #F4A875）
  - disabled：opacity 50%

**變體：**

| 變體 | 尺寸 | 圓角 | Padding | 用途 |
|------|------|------|---------|------|
| 大按鈕（primary） | 全寬 × 40px | 12px | 上下 0，左右 16px | 主要操作按鈕 |
| 方形按鈕（icon） | 40 × 40px | 12px | 無（固定尺寸） | API Key 上傳、單一 icon 操作 |
| 圓形（nav active） | 40 × 40px | 50% | 無（固定尺寸） | 桌機 sidebar active 狀態 |

### Toggle
- On：漸層填色（#FF7FDC → #FFBB8E）
- Off：#D0D0D0
- 圓角：full

### Tab（通用規則，適用所有頁面）
- 背景：rgba(255,255,255,0.8)
- 圓角：12px
- Padding：上下 8px，左右 16px
- Active：外框線漸層（#FF7FDC → #FFBB8E）
- Inactive：無外框
- Tab 之間 gap：12px
- CSS class：.keeper-tab（定義於 main.css，所有 tab 統一引用）

適用範圍：Plans 頁 Habits/Long-term/Backlog、手機版 BottomNav、Records detail、任何分頁切換元件

### Bottom Nav
- Active：外框線漸層（#FF7FDC → #FFBB8E）
- Inactive：無框
- 背景：透明（頁面背景透出）

### Input（Home 頁）
- 上層：白色背景
- 下層：漸層背景（#F4EED1 → #F8E3DA → #DBE7F7）
- Stroke：白色，opacity 80%
- Shadow：#7A4099，opacity 15%，blur 24px
- Placeholder 文字：'Reply'，字色 #868385，字級 1.6rem

**對話框雙層結構：**
- 外層：漸層背景容器，圓角 24px
- 內層：白色背景，圓角 20px
- 外層比內層多 4px，確保漸層邊框視覺寬度一致

### Card（清單、report、、打卡、detail）
- 背景：rgba(255,255,255,0.4)
- 圓角：20px
- Border：1px solid rgba(255,255,255,1.0)
- Shadow：無
- Padding：16px

### Card（彈窗）
- 背景：#FFFFFF
- 圓角：20px
- Shadow：無
- Padding：24px

### Toast / Banner
- 背景：漸層（#FF7FDC → #FFBB8E）
- 文字：#FFFFFF
- 圓角：12px

### Checkbox
- Done：漸層填色（#FF7FDC → #FFBB8E）+ 白色勾
- Empty：白色填色，border #E0E0E0
- Miss：#D0D0D0 填色 + X

### Progress Bar
- Track：#F0F0F0
- Fill：漸層（#FF7FDC → #FFBB8E）
- 圓角：full

### 文件卡片（MD card）
- 背景：rgba(255,255,255,0.4)
- Border：1px solid rgba(255,255,255,1.0)
- 圓角：12px
- Padding：16px
- 包含：檔名（16px Semibold）+ 副標籤「MD」（12px）
- 高度：160px
- 寬度：由父層 grid 決定，不寫死
  - 手機版：grid-template-columns: repeat(3, 1fr)
  - 桌機版（≥ 768px）：grid-template-columns: repeat(6, 1fr)

---

## 七、與其他 Skill 的關係

| Skill | 使用此文件的方式 |
|-------|---------------|
| `design-tokens.md` | 從此文件取得數值，生成 Core / Semantic / Component token |
| `ui-codegen.md` | 截圖轉頁面時，以此文件為視覺對照基準 |
| `component-gen.md` | 元件生成時，以此文件為樣式規格來源 |
| `ui-kit.md` | UI Kit 展示頁使用此文件的所有規格 |

## 八、響應式規格

### 版面切換斷點
- 手機版：< 768px
- 桌機版：≥ 768px

### 手機版
- 導覽列：底部水平，純文字標籤，無 icon，高度 32px
- 頁面左右 padding：24px

### 桌機版
- 導覽列：左側垂直，含 icon（Lucide Vue Next）
- 導覽列寬度：80px
- icon 尺寸：24×24px
- active 狀態：漸層圓形背景
- 主內容區：max-width 800px，margin auto，置中
- 頁面左右 padding：40px

---

## 九、頁面佈局結構

### 三區塊固定佈局（index.vue 除外）

所有頁面由三個固定區塊組成，互不重疊：

| 區塊 | position | 說明 |
|------|----------|------|
| PageHeader | fixed，top: 0 | 頁面標題，含或不含 Tab |
| content | fixed，top / bottom 依變體計算 | 可捲動內容區 |
| BottomNav | fixed，bottom: 0 | 手機底部導覽 / 桌機左側 sidebar |

**PageHeader 高度：**
- 含 Tab：89px（不含頁面上方 padding 40px）
- 不含 Tab：39px（不含頁面上方 padding 40px）

**BottomNav 高度：** 32px（不含頁面下方 padding 24px）

**content top：**
- 含 Tab：40 + 89 + 32 = 161px
- 不含 Tab：40 + 39 + 32 = 111px

**content bottom：** 24 + 32 + 32 = 88px

**PageHeader 背景：** 透明，捲動時內容滑入後方被裁切

---

### 對話框定位（index、plans/backlog）

- position: fixed
- bottom: 72px（頁面底部 padding 24px + BottomNav 32px + 間距 16px）
- z-index：高於 content，低於 BottomNav
- 高度隨文字內容向上延展
- content padding-bottom 需足夠大，確保最後一筆內容不被對話框遮住

---

### index.vue 例外

index 頁面維持獨立結構，不套用三區塊固定佈局：
- 對話區自然捲動
- 輸入框 fixed，bottom: 72px

---

### 桌機版佈局

- BottomNav 改為左側 fixed sidebar，寬度 80px
- PageHeader：left: 80px，fixed
- content：left: 80px，max-width 800px，margin-right: auto
- 對話框：left: 80px + spacing-page-x，right: spacing-page-x