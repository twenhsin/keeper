# CLAUDE.md
> Keeper 專案入口文件
> 每次開啟專案時優先讀取此文件
> 最後更新：2026-04-28

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
| AI 模型 | Claude API（用戶自帶 Key）| claude-sonnet-4-20250514 |
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
├── 生活督導App_規格書_v6.md      — 完整產品規格
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
│       └── ui-kit.vue           — 待完成
├── server/
│   └── api/
│       ├── chat.post.ts         — Claude API 對話 server route ✅
│       └── verify-key.post.ts   — API Key 驗證 + 寫入 Supabase ✅
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

## 七、當前開發進度
> 最後更新：2026-04-16

### 已完成
- assets/css/tokens.css（169 tokens）
- assets/css/main.css（含全域 input font-size: 16px）
- layouts/default.vue（背景圖響應式、viewport useHead、position: fixed inset: 0）
- 全站元件：BottomNav、PageHeader、AppButton、BaseCard、ChatBubble、TaskCard、PlanCard、ProgressCard、FileCard
- pages/index.vue（Home）：
  - Claude API 對話接入（reminder / chat 模式）
  - 任務建立 JSON 偵測 → 自動寫入 Supabase habits / plans
  - 當天對話記錄跨裝置保留（today_messages + messages_date）
  - 督促提醒模式（開啟 App 自動生成）
  - 點擊輸入框切換對話模式
  - 暫停對話功能（AbortController）
  - 提醒文字換行（white-space: pre-line）
- pages/plans.vue：Supabase 串接（habits + plans 讀取、刪除、Toggle）
- pages/records.vue：Supabase 串接（打卡卡片動態生成、card_mode daily/scheduled、Progress Report）
- pages/setting.vue：API Key 驗證 + 寫入 Supabase users.api_key
- server/api/chat.post.ts：System Prompt 組裝、三種模式、台灣時區、任務建立日期判斷
- server/api/verify-key.post.ts：驗證 + upsert users 表
- Supabase 資料表：users（含 api_key、today_messages、messages_date、card_mode）、habits、plans、backlog、task_cards、conversation_summaries、project_files、notification_logs
- Supabase Auth 登入 + session 持久化（nuxt.config.ts redirectOptions）
- Vercel 部署完成：keeper-eight-inky.vercel.app
- PWA 設定
- ✅ Notes tab
- ✅ Reference Books
- ✅ 滾動式記憶架構（週摘要、月摘要資料表與 Cron）
- ✅ 登出功能
- ✅ PWA 設定
- ✅ 對話摘要寫回 conversation_summaries（每日 Cron）
- ✅ weekly_summaries 資料表 + 每週摘要 Cron
- ✅ monthly_summaries 資料表 + 每月摘要 Cron
-  Backlog tab 串接 Supabase
- habits 表新增欄位（required_weekdays、period_days、allow_extra、allow_makeup、daily_slots、card_show_time、notify_times）
- records.vue 打卡卡片邏輯改用新欄位（固定卡、加分卡、週期卡、補打卡）
- chat.post.ts taskCardsBlock 改為顯示任務名稱而非 uuid
- chat.post.ts habitsBlock 帶入 id
- supervisor-persona.md 新增語氣層級 0、切換邏輯、Reference Books 使用規則、建議彈性規則
- chat.post.ts system prompt 語氣規則更新
- LoadingDots component
- ConfirmDialog component
- setting.vue 輸入框互動模式（未輸入不顯示按鈕、儲存後顯示刪除按鈕）
- plans.vue 刪除按鈕統一為 X icon、absolute 定位
- Keeper 建立習慣命名規則（頻率在前）
- Keeper 修改現有習慣流程（habit_update JSON + 前端 UPDATE）
- index.vue 打卡後 Progress report 即時更新
- Streaming 優化（reminder + chat）
- reminder 模式減少 Supabase 查詢
- reminder 查詢移至前端 （habits/plans/taskCards/notes）
- chat.post.ts reminder 模式 Supabase 查詢精簡（habits/plans/taskCards 移至前端傳入）
- Notes 只在 reminder 模式讀取，chat 模式不帶入
- ✅ 全站 Layout 重構（default.vue 統一管理 sidebar/bottom-nav/main-wrap）
- ✅ 桌機版 RWD 修正（sidebar 左側、main-content 置中、padding 24px）
- ✅ Setting 頁 Info icon tooltip
- ✅ Setting 頁 Project 區塊重構（條列 + Toggle + 彈窗編輯）
- ✅ project_files 新增 is_active 欄位
- ✅ 主要文字色更新為 #363134
- ✅ Keeper 任務確認兩層保護（pendingConfirm + system prompt）
- ✅ index.vue 注音 Enter 誤送出修正
- ✅ index.vue 誤送出後輸入框文字殘留修正
- ✅ index.vue 輸入框遮住對話修正
- ✅ 全站 Layout 重構（default.vue + index.vue 採用 flex column 結構）
- ✅ index.vue 輸入框定位修正（flex 沉底，移除 absolute 與 justify-content）
- ✅ index.vue 輸入框結構調整（textarea 預設一行、操作區永久保留位置）
- ✅ Setting 頁 Info icon tooltip
- ✅ Setting 頁 Project 區塊重構（條列 + Toggle + 彈窗編輯）
- ✅ project_files 新增 is_active 欄位
- ✅ 主要文字色更新為 #363134
- ✅ Keeper 任務確認兩層保護（pendingConfirm + system prompt）
- ✅ index.vue 注音 Enter 誤送出修正
- ✅ index.vue 誤送出後輸入框文字殘留修正

### 待完成
- [ ] pages/ui-kit.vue
- [ ] 手機版 iOS Safari 鍵盤收起後底部白色空白問題
- [ ] Quotes 功能（Plans 頁第五個 Tab，一鍵收藏 + 手動輸入）
- [ ] 對話匯出到 Obsidian

### 待辦清單（功能擴充）
- [ ] 對話暫停後 AI 回應顯示被截斷的處理
- [ ] Plans 第一次建立有時不顯示的問題（確認是否穩定復現）
- [ ] 滾動式記憶架構（v1.1）：每日摘要 → 週摘要 → 月摘要 → 累積摘要
  - 每日對話 → 7天每日摘要
  - 7天摘要 → 週摘要（保留4週）
  - 4週摘要 → 月摘要（保留3個月）
  - 3個月摘要 → 歷史總摘要（滾動壓縮）
- [ ] AI 回饋文字（缺席補發後）
- [ ] 計畫視覺圖
- [ ] Vercel Cron 推播通知（需 Vercel 付費方案，暫緩）

