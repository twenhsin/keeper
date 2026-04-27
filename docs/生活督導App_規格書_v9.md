# 生活督導 App 規格書 v9

> 更新日期：2026-04-27
> 版本：v9（查詢架構調整、Notes 讀取範圍確認、推播通知暫緩）

---

## 一、產品定位

**Keeper** — 一個有記憶、會主動提醒、隨時可更新計畫的個人 AI 督導工具。
核心理念：AI 隨時存在，在對的時間提醒你做對的事，並持續追蹤你的執行狀態。

---

## 二、技術棧

| 元件 | 技術 |
|------|------|
| 前端框架 | Nuxt 4.4.2 + Vue 3 |
| 樣式 | Tailwind CSS |
| 資料庫 | Supabase |
| AI 模型 | Claude API（用戶自帶 API Key）|
| 模型版本 | claude-sonnet-4-20250514 |
| 部署 | Vercel（keeper-eight-inky.vercel.app）|
| 通知排程 | Vercel Cron + Web Push API |
| 裝置支援 | PWA（手機加入主畫面）+ 桌機瀏覽器 |
| Node.js | v20 LTS |
| 套件管理 | npm |

---

## 三、AI 記憶機制

Claude 本身沒有跨對話記憶，記憶層由 Supabase 提供。
- habits、plans、task_cards、notes 由前端查詢後傳入 server，不在 server 端重複查詢

**運作流程：**

```
用戶開啟 App
      ↓
從 Supabase 撈出用戶當前狀態
（個人說明、計畫清單、任務狀態、對話摘要）
      ↓
組成 System Prompt 傳給 Claude API
      ↓
Claude 根據這些資料回應
      ↓
對話結束後，重要內容寫回 Supabase（摘要形式）
```

**設計原則：**
- 不儲存完整對話記錄，只存摘要，控制 token 成本
- 當天對話保留於 users.today_messages，隔天自動清空
- 對話摘要帶入最近七天

### 滾動式記憶架構（v1.1 實作）

```
當日對話（today_messages）
    ↓ 每天凌晨 Cron
每日摘要（conversation_summaries）— 保留 7 天
    ↓ 每週一凌晨 Cron
每週摘要（weekly_summaries）— 保留 4 週
    ↓ 每月 1 日凌晨 Cron
每月摘要（monthly_summaries）— 保留 3 個月
    ↓ 超過 3 個月
歷史總摘要（history_summary）— 滾動壓縮，單一文字欄位
```

**摘要原則：** 每個階段的摘要只需精簡到「足夠讓 Keeper 判斷狀態演變」，不需要細節，只需要行為模式。

**System Prompt 帶入（實作後）：**
- 最近 7 天每日摘要
- 最近 4 週每週摘要
- 最近 3 個月每月摘要
- 歷史總摘要（若存在）

---

## 四、對話情境與模式

| 模式 | 觸發條件 | 說明 |
|------|----------|------|
| **提醒模式** | App 剛開啟，尚未點擊輸入框 | 生成即時督促提醒文字，不儲存 |
| **督導對話模式** | 用戶點擊輸入框開始輸入 | 帶入完整脈絡進行督導對話 |
| **任務建立模式** | 對話內容涉及建立或修改任務 | AI 自動判斷，收集足夠資訊後輸出 JSON |

### 各模式資料傳入規則

| 資料 | Reminder | Chat | 查詢位置 |
|------|----------|------|---------|
| About Me | ✅ | ✅ | Server |
| Reference Books | ✅ | ✅ | Server |
| Habits | ✅ | ✅ | 前端傳入 |
| Plans | ✅ | ✅ | 前端傳入 |
| Task Cards（7天）| ✅ | ✅ | 前端傳入 |
| Notes | ✅ | ❌ | 前端傳入 |
| 對話摘要（daily/weekly/monthly）| ❌ | ✅ | Server |

**任務建立 JSON 格式：**

習慣任務：
```json
{
  "type": "habit",
  "title": "（頻率在前，例：一週三次健身房運動習慣）",
  "description": "",
  "required_weekdays": [0, 3],
  "period_days": null,
  "allow_extra": false,
  "allow_makeup": false,
  "daily_slots": 1,
  "card_show_time": null,
  "notify_times": ["HH:MM"]
}
```
習慣修改:
```json
{
  "type": "habit_update",
  "id": "現有 habit 的 uuid",
  "title": "",
  "description": "",
  "required_weekdays": [],
  "period_days": null,
  "allow_extra": false,
  "allow_makeup": false,
  "daily_slots": 1,
  "card_show_time": null,
  "notify_times": ["HH:MM"]
}
```

長期任務：
```json
{
  "type": "long_term",
  "title": "",
  "description": "",
  "total_phases": 0,
  "current_phase": 1,
  "notify_morning": "HH:MM",
  "notify_evening": "HH:MM"
}
```

**card_mode 判斷規則：**
- `daily`：執行日彈性，用戶可任意一天執行（Records 頁每天顯示打卡卡片）
- `scheduled`：固定執行日，只在特定星期幾執行（Records 頁只在執行日顯示卡片）

---

## 五、任務類型

### 5.1 習慣任務（Habit）

- 固定頻率執行的日常行為
- 在指定通知時間推播提醒
- 打卡卡片根據 card_mode 決定出現頻率
- 可透過 Toggle 啟用／暫停

habits 表欄位（v2）：
- required_weekdays：固定執行星期幾，jsonb，例 [3,0]
- period_days：週期卡，每 N 天一次
- allow_extra：非固定日是否出現加分卡
- allow_makeup：錯過後隔天是否補一張
- daily_slots：每天幾張卡，預設 1
- card_show_time：卡片從幾點顯示，null = 全天
- notify_times：推播時間，jsonb，例 ["18:30"]
退役欄位（保留不刪）：card_mode、frequency_days、notify_time

### 5.2 長期任務（Long-term）

- 有明確 Phase 結構的專案
- 每天早晚各一次推播提醒確認進度
- 支援上傳計畫說明 .md 檔
- 可透過 Toggle 啟用／暫停

---

## 六、頁面結構

### 6.1 Home（對話介面）

**預設狀態（未點擊輸入框）：**
- 顯示即時督促提醒文字（由 Claude 根據任務狀態生成）
- 語氣根據缺席天數對應 supervisor-persona 層級 1–3
- 新建任務 7 天內不視為缺席

**點擊輸入框後：**
- 切換顯示當天對話記錄
- 對話記錄保留當天，跨裝置同步（存於 Supabase users.today_messages）
- 隔天自動清空

**對話功能：**
- 建立新習慣任務或長期任務（AI 判斷 card_mode，自動寫入 Supabase）
- 修改現有任務設定
- 任務建立成功時頂部顯示 Toast 通知（「✓ 已建立任務：{title}」）
- 暫停功能：AI 回應中可點擊暫停按鈕中止
- 所有資訊確認完整後，Keeper 先整理方案說明請用戶確認，用戶同意後才輸出 JSON
- 用戶使用「調整」「升級」「改為」「提升」等字眼時，Keeper 詢問是修改現有習慣還是建立新習慣
- 修改現有習慣輸出 habit_update JSON，前端執行 UPDATE 而非 INSERT
- 習慣命名規則：頻率寫在前面，例「一週三次健身房運動習慣」

### 6.2 Plans（計畫管理）

四個 Tab：Habits、Long-term、Backlog、Notes

- 從 Supabase 讀取啟用中任務
- 右側 Toggle 啟用／暫停
- 右側垃圾桶 icon 刪除任務
- 點擊卡片出現彈窗，顯示 description
- Backlog tab：待 v1.1 串接 Supabase
- Backlog tab：已串接 Supabase，支援新增、編輯、刪除
- Notes tab：支援點擊編輯，儲存後顯示刪除按鈕
- Backlog/Notes 輸入方式：清單最下方直接顯示 textarea，移除底部固定輸入框

#### Notes tab
- 用戶記錄生活狀態觀察（非正式任務）
- 輸入框新增後以卡片顯示，可刪除
- 資料存入 notes 資料表
- Keeper 根據這些紀錄在督促互動中柔性提醒（非嚴格督導）

### 6.3 Records（打卡記錄）

**打卡卡片（前端動態生成）：**
- `card_mode = 'daily'`：每天顯示（未打卡）
- `card_mode = 'scheduled'`：依 frequency_days 和 created_at 推算執行日
- Check in 後 INSERT 一筆到 task_cards，從卡片清單移除

**Progress Report：**
- This week N/7：本週打卡天數
- This month N/X：本月打卡天數（分母依月份動態判斷）

### 6.4 Setting（設定）

| 區塊 | 說明 |
|------|------|
| Claude API Key | 輸入後 server 端驗證，寫入 users.api_key |
| About Me | 純文字個人說明，存 users.personal_summary，高度固定 200px，最高 500px，超過可捲動 |
| Project | 上傳 .md 檔，存 project_files 表 |
| Reference Books | 輸入希望 Keeper 引用的書籍，每本獨立一格，存 reference_books 表 |

輸入框交互統一規則：
- 未輸入時不顯示按鈕
- 編輯中顯示 Save icon（#FF7FDC，無背景）
- 已儲存顯示 Trash2 icon（#FF7FDC，無背景）
- 所有刪除操作透過 ConfirmDialog 確認

---

## 七、Supabase 資料結構

### `users`
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| personal_summary | text | 個人說明 |
| supervisor_style | text | 督導風格偏好 |
| api_key | text | 用戶 Claude API Key |
| today_messages | jsonb | 當天對話記錄（隔天清空）|
| messages_date | date | today_messages 對應日期 |
| push_subscription | jsonb | Web Push 訂閱物件 |
| last_opened_at | timestamp | 上次開啟時間 |
| created_at | timestamp | 建立時間 |

### `habits`（習慣任務）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| title | text | 任務名稱 |
| description | text | AI 生成的任務說明（含執行細節、提醒時間）|
| frequency_days | int | 幾天執行一次 |
| notify_time | time | 提醒時間（非執行時間）|
| card_mode | text | `daily` / `scheduled` |
| is_active | boolean | 是否啟用 |
| created_at | timestamp | 建立時間 |

### `plans`（長期任務）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| title | text | 任務名稱 |
| description | text | 計畫說明 |
| total_phases | int | 總 Phase 數 |
| current_phase | int | 當前 Phase |
| notify_morning | time | 早上提醒時間 |
| notify_evening | time | 晚上提醒時間 |
| is_active | boolean | 是否啟用 |
| created_at | timestamp | 建立時間 |

### `notes`（生活觀察紀錄）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| content | text | 觀察內容 |
| created_at | timestamp | 建立時間 |

### `task_cards`（打卡記錄）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| task_type | text | `habit` / `long_term` |
| ref_id | uuid | 關聯 habits 或 plans |
| scheduled_date | date | 對應日期 |
| is_completed | boolean | 是否執行 |
| note | text | 用戶補充文字 |
| confirmed_at | timestamp | 確認時間 |

### `conversation_summaries`（每日對話摘要）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| summary | text | 摘要（150 字以內）|
| created_at | timestamp | 建立時間 |

### `weekly_summaries`（週摘要，v1.1）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| summary | text | 週摘要 |
| week_start | date | 該週週一日期 |
| created_at | timestamp | 建立時間 |

### `reference_books`（參考書籍）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| title | text | 書名 |
| created_at | timestamp | 建立時間 |

### `monthly_summaries`（月摘要）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| summary | text | 月摘要 |
| month_start | date | 該月 1 日日期 |
| created_at | timestamp | 建立時間 |

### `backlog`、`project_files`、`notification_logs`
（結構同 v5，略）

---

## 八、server/api/chat.post.ts 規格

**Request body：**
```ts
{
  mode: 'reminder' | 'chat',
  messages: { role: 'user' | 'assistant', content: string }[],
  userId: string,
  apiKey: string
}
```

**System Prompt 組裝：**
- 台灣時區當前時間（`toLocaleString('zh-TW', { timeZone: 'Asia/Taipei', weekday: 'long', ... })`）
- 用戶個人說明
- 啟用中習慣任務（含 created_at，判斷是否為新建任務）
- 啟用中長期任務
- 近 7 天執行狀態（task_cards）
- 近 7 天對話摘要（conversation_summaries）
- 新建任務 7 天內不視為缺席的說明
- Notes（notes 表，柔性提醒用，語氣與習慣任務不同）
- Reference Books（reference_books 表，Keeper 適時引用書籍概念）
- 近 4 週週摘要（weekly_summaries）
- 近 3 個月月摘要（monthly_summaries）

**任務建立指令（chat 模式末尾附加）：**
- AI 自行判斷何時收集資訊足夠
- 輸出 JSON 前後加 \`\`\`json 標記
- description 必填，繁體中文，100 字以內，含執行細節
- notify_time 填提醒時間（非執行時間）
- card_mode 根據對話內容判斷 daily / scheduled

**Response：**
```ts
{ content: string, mode: string }
```

---

## 九、Skills 架構

### 產品邏輯 Skills（`Skills/product/`）

| 檔案 | 用途 | 狀態 |
|------|------|------|
| `supervisor-persona.md` | 督導 AI 語氣、行為邊界、協商規則 | ✅ v2（含語氣層級 0、Reference Books 規則、建議彈性規則））|
| `api-prompt-builder.md` | System Prompt 組裝規則 | ✅ |
| `task-card-logic.md` | 卡片出現規則、card_mode | ✅ v2（habits 新欄位邏輯）|
| `notification-schedule.md` | 通知觸發架構 | ✅ |

### 開發工具 Skills（`Skills/dev/`）

| 檔案 | 用途 | 狀態 |
|------|------|------|
| `design-system.md` | 視覺規則基礎 | ✅ |
| `design-tokens.md` | Token 架構 | ✅ |
| `ui-codegen.md` | 截圖→頁面生成 | ✅ |
| `component-gen.md` | 元件生成規則 | ✅ |
| `ui-kit.md` | UI Kit 展示頁 | ✅ |

---

## 十、MVP 完成狀態

### 已完成
- ✅ 全站靜態介面
- ✅ Supabase 資料表建立與 RLS
- ✅ Supabase Auth 登入 + session 持久化
- ✅ Setting 頁（API Key 驗證寫入、About Me、Project 文件）
- ✅ Claude API 接入（提醒模式 + 督導對話模式）
- ✅ 任務建立流程（對話 → JSON → 寫入 Supabase）
- ✅ Plans 頁 Supabase 串接（讀取、刪除、Toggle）
- ✅ Records 頁 Supabase 串接（card_mode 動態打卡卡片、Progress Report）
- ✅ 當天對話跨裝置保留
- ✅ 台灣時區修正
- ✅ 新建任務不誤判為缺席
- ✅ 督導語氣協商規則
- ✅ Vercel 部署
- ✅ Notes tab（Plans 頁第四個 tab）
- ✅ Reference Books（Setting 頁 + System Prompt 帶入）
- ✅ 滾動式記憶架構（每日/週/月 Cron 實作完成）
- ✅ PWA 設定（App icon + 加入主畫面）
- ✅ 登出功能（右上角 account icon → 彈窗 → Toast）
- ✅ habits 表欄位重構（required_weekdays、period_days 等新欄位）
- ✅ records.vue 打卡卡片邏輯改用新欄位
- ✅ Keeper 語氣層級 0（友善模式）+ Reference Books 整合
- ✅ Keeper 習慣修改流程（habit_update JSON）
- ✅ LoadingDots component
- ✅ ConfirmDialog component
- ✅ 輸入框交互模式統一（setting、plans）
- ✅ Backlog tab 串接 Supabase
- ✅ Streaming 優化（reminder + chat）
- ✅ Progress report 時區修正
- ✅ reminder 查詢移至前端（habits/plans/taskCards/notes）
- ✅ Notes 只在 reminder 模式讀取，chat 模式不帶入
- ✅ chat.post.ts reminder 模式 Supabase 查詢精簡

### 待完成
- [ ] pages/ui-kit.vue
- [ ] Vercel Cron 推播通知（需 Vercel 付費方案，暫緩）
- [ ] 手機版 iOS Safari 鍵盤收起後底部白色空白（已知問題，待解）



### v1.1 功能
- [ ] Backlog tab 串接 Supabase
- [ ] AI 回饋文字（缺席補發後）
- [ ] 計畫視覺圖

---

## 十一、已知問題

### iOS Safari 鍵盤底部白色空白
**現象：** 點擊輸入框鍵盤彈出，往上滑動後底部出現白色空白區域。
**根本原因：** iOS Safari 鍵盤彈出時 `position: fixed` 元素的 visual viewport 與 layout viewport 不一致。
**已嘗試方案：** `100dvh`、`interactive-widget=resizes-content`、`focusout` scroll reset。
**目前狀態：** 待繼續研究，不阻礙主流程。

### Nuxt 4 注意事項
- `srcDir` 預設為 `app/`，所有前端檔案在 `app/` 下
- `app/app.vue` 必須改為 `<NuxtLayout><NuxtPage /></NuxtLayout>`
- 元件引用路徑從 `app/components/` 開始，不需加 `app/` 前綴
- `useSupabaseUser()` 在 SSR 時可能回傳 null，用 `supabase.auth.getUser()` 取得可靠 user id
