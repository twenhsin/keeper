# CLAUDE.md
> Keeper 專案入口文件
> 每次開啟專案時優先讀取此文件
> 建置日期：2026-04-29
> 最後更新：2026-06-25

---

## 一、專案概述

**產品名稱：** Keeper
**定位：** 個人 AI 行為督導工具
**完整規格：** `生活督導App_規格書_v9.md`

---

## 二、技術棧

| 元件 | 技術 | 版本 |
|------|------|------|
| 前端框架 | Nuxt 4.4.2 + Vue 3 | - |
| 樣式 | Tailwind CSS | latest |
| 資料庫 | Supabase | - |
| AI 模型 | Claude API（用戶自帶 Key）| claude-sonnet-4-6 |
| 部署 | Vercel | - |
| 通知排程 | Vercel Cron + Web Push API | - |
| 裝置支援 | PWA | - |
| Node.js | v20 LTS | - |
| 套件管理 | npm | - |

---

## 三、專案結構

```
keeper/
├── CLAUDE.md                    — 本文件，專案入口
├── 生活督導App_規格書_v9.md      — 完整產品規格
├── Skills/
│   ├── dev/                     — 開發工具 Skills
│   │   ├── design-system.md
│   │   ├── design-tokens.md
│   │   ├── ui-codegen.md
│   │   ├── component-gen.md
│   │   └── ui-kit.md
│   └── product/                 — 產品邏輯 Skills
│       ├── supervisor-persona.md — 督導 AI 語氣與行為規則（含任務建立協商規則）
│       ├── api-prompt-builder.md — System Prompt 組裝邏輯
│       ├── task-card-logic.md
│       └── notification-schedule.md
├── app/
│   ├── app.vue
│   ├── assets/css/
│   │   ├── tokens.css           — 169 個 CSS custom properties
│   │   └── main.css             — 全域樣式（含 input font-size: 16px）
│   ├── components/
│   │   ├── BottomNav.vue
│   │   ├── PageHeader.vue
│   │   ├── AppButton.vue
│   │   ├── BaseCard.vue
│   │   ├── ChatBubble.vue
│   │   ├── TaskCard.vue
│   │   ├── PlanCard.vue
│   │   ├── ProgressCard.vue
│   │   └── FileCard.vue
│   ├── layouts/
│   │   └── default.vue          — 全站 Layout 骨架（sidebar/bottom-nav/main-wrap/main-content）
│   └── pages/
│       ├── index.vue            — Home ✅（Claude API 對話接入完成）
│       ├── plans.vue            — Plans ✅（Supabase 串接完成）
│       ├── records.vue          — Records ✅（Supabase 串接完成）
│       ├── records-detail-[id].vue
│       ├── setting.vue          — Setting ✅（API Key 寫入 Supabase）
│       ├── login.vue
│       ├── quotes.vue           — Quotes ✅（Supabase 串接完成）
│       └── ui-kit.vue           — 待完成
└── server/
    └── api/
        ├── chat.post.ts         — Claude API 對話 server route ✅
        ├── verify-key.post.ts   — API Key 驗證 + 寫入 Supabase ✅
        └── cron/
            ├── daily-summary.post.ts    — 每日對話摘要 ✅
            ├── weekly-summary.post.ts   — 每週摘要 ✅
            └── monthly-summary.post.ts  — 每月摘要 ✅
└── public/
    └── images/
        └── page-bg-m.png        — 手機版背景圖
```

---

## 四、開發規範

### 執行任何任務前

1. 先讀取本文件
2. 根據任務類型讀取對應 Skill 文件：

| 任務 | 讀取 Skill |
|------|-----------|
| 截圖轉頁面 | `dev/ui-codegen.md` |
| 生成或修改元件 | `dev/component-gen.md` |
| 生成 tokens.json | `dev/design-tokens.md` |
| 生成 UI Kit 頁面 | `dev/ui-kit.md` |
| 視覺規格查詢 | `dev/design-system.md` |
| AI 督導對話邏輯 | `product/supervisor-persona.md` |
| System Prompt 組裝 | `product/api-prompt-builder.md` |
| 打卡卡片邏輯 | `product/task-card-logic.md` |
| 推播通知實作 | `product/notification-schedule.md` |

### 樣式規則

- CSS custom properties 優先（`var(--token-name)`）
- 輔助排版用 Tailwind（flex、grid、overflow）
- 禁止直接寫色碼（#HEXCODE）於元件內
- 禁止直接寫 px 字級，統一用 rem
- 字型：Noto Serif TC（全站統一）
- input / textarea 的 font-size 必須 16px（防 iOS 縮放）

### 元件規則

- 開發新頁面前先掃描 `components/` 確認現有元件
- 現有元件直接引用，不重新生成
- 新元件需符合 `component-gen.md` 的拆分標準

### 禁止事項

- 未被要求的檔案一律不動
- 不修改全域樣式（除非明確要求）
- 不更動路由結構（除非明確要求）
- 不在頁面背景加 background 色（背景色塊統一在 layouts/default.vue 管理）

---

## 五、環境變數

```
SUPABASE_URL=
SUPABASE_KEY=          # anon key
SUPABASE_SERVICE_KEY=  # service role key（chat.post.ts 使用）
VAPID_PUBLIC_KEY=      # Web Push（待實作）
VAPID_PRIVATE_KEY=     # Web Push（待實作）
```

本機：`.env` 檔案
Vercel：Settings → Environment Variables 手動設定

---

## 六、完成任務後回報格式

1. 變更 / 新增檔案清單（有變更時才列出）
2. 視覺待確認項目（無法從截圖判斷的細節）
3. 尚未處理的項目（若任務範圍內有未完成部分）

---

## 七、開發進度
詳見 `docs/CHANGELOG.md`

