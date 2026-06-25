# Keeper 開發進度紀錄

## 2026-06-25

### 修復
- AI 模型版本更新（claude-sonnet-4-20250514 → claude-sonnet-4-6，舊版本已下架）
- 修復 chat.post.ts、daily/weekly/monthly-summary.post.ts 因舊模型版本導致的 500 錯誤
- 改用 cron-job.org 外部排程取代 Vercel Hobby Cron Jobs（不可靠，凌晨排程從未真正觸發）

### 新增
- Records 打卡卡片新增日期與星期幾顯示
- index.vue 收藏愛心 icon 加大為 24px，並加入已收藏 solid 狀態
- 睡眠習慣建立（一週一次睡眠時間記錄）

---
## ㄧ、當前開發進度
> 最後更新：2026-04-29

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
- ✅ Quotes 頁面（獨立路由 /quotes，Supabase 串接完成）
- ✅ BottomNav 新增第五個 item（手機文字 / 桌機 BookMarked icon）
- ✅ quotes 資料表建立（含 RLS）
- ✅ reminder [QUOTE] 標記解析 + 愛心 icon 一鍵收藏
- ✅ chat.post.ts system prompt 加入 [QUOTE] 標記規則
- ✅ 對話文字 user-select: text（可選取複製）

### 待完成
- [ ] pages/ui-kit.vue
- [x] 手機版 iOS Safari 鍵盤收起後底部白色空白問題
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
- [ ] 定期檢查 Anthropic model 版本是否棄用（建議每季檢查一次）