# 生活督導 App 規格書 v4

> 更新日期：2026-04-13
> 版本：v4（補充通知排程細節、資料表新增 notification_logs、users 補充欄位、Skills 架構說明、App 命名）

---

## 一、產品定位

**Keeper** — 一個有記憶、會主動提醒、隨時可更新計畫的個人 AI 督導工具。
核心理念：AI 隨時存在，在對的時間提醒你做對的事，並持續追蹤你的執行狀態。

---

## 二、技術棧

| 元件 | 技術 |
|------|------|
| 前端框架 | Nuxt 3 + Vue 3 |
| 樣式 | Tailwind CSS |
| 資料庫 | Supabase |
| AI 模型 | Claude API（用戶自帶 API Key）|
| 部署 | Vercel |
| 通知排程 | Vercel Cron + Web Push API |
| 裝置支援 | PWA（手機加入主畫面）+ 桌機瀏覽器 |

---

## 三、AI 記憶機制

Claude 本身沒有跨對話記憶，記憶層由 Supabase 提供。

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
- 對話記錄只保留當天，隔天凌晨清空
- 對話摘要帶入最近七天
- 個人說明由用戶透過複製貼上方式輸入，儲存於 Supabase
- Project 文件支援上傳 .md 檔，僅在用戶明確提及時才帶入 Prompt

**三種對話情境：**

| 模式 | 觸發條件 | 說明 |
|------|----------|------|
| 提醒模式 | App 剛開啟，尚未輸入 | 生成即時督促提醒文字，不儲存 |
| 督導對話模式 | 用戶開始輸入 | 帶入完整脈絡進行督導對話 |
| 任務建立模式 | 對話涉及建立或修改任務 | 額外帶入現有任務清單，輸出 JSON 寫入 Supabase |

---

## 四、任務類型

### 4.1 習慣任務（Habit）

- 固定頻率執行的日常行為（例：每天吃早餐、每兩天運動一次）
- 在指定通知時間推播提醒
- 時間到後開啟 App 才顯示當天確認卡片
- 可透過 Toggle 啟用／暫停

### 4.2 長期任務（Long-term）

- 有明確 Phase 結構的專案（例：Filo 作品集，共 10 個 Phase）
- 每天早晚各一次推播提醒確認進度
- 支援上傳計畫說明 .md 檔，AI 讀取後了解專案內容
- 可透過 Toggle 啟用／暫停

---

## 五、頁面結構

導覽列位於畫面底部，共四個頁面：**Home、Plans、Records、Setting**

---

### 5.1 Home（對話介面）

**開啟 App 時：**
- 顯示即時督促提醒文字（24px，字體較大）
- 提醒文字由 Claude 根據當前任務狀態即時生成，不儲存、不計入對話記錄
- 多個任務提醒以換行方式排列

**提醒文字情境範例：**

```
早上開啟：記得進行你的 Filo Phase 1，不要怠惰了
晚上七點開啟：該是去運動的時候了
缺席多天：為何這三天都沒有去運動？
```

語氣隨缺席天數自動加重，由 Claude 動態生成。

**開始輸入後：**
- 提醒文字消失，進入對話模式
- 對話為一般聊天介面，左右氣泡區分 AI 與用戶
- 對話記錄保留當天，隔天清空

**對話功能：**
- 建立新習慣任務或長期任務（透過對話確認需求後自動新增至 Plans）
- 修改現有任務設定（修改後 Plans 說明文同步更新）
- 討論 Backlog 項目，決定是否啟動為正式任務
- 任務建立成功時頂部顯示 Toast 通知

---

### 5.2 Plans（計畫管理）

三個 Tab：**Habits、Long-term、Backlog**

**Habits Tab**
- 顯示所有習慣任務卡片
- 每張卡片右側有 Toggle（啟用／暫停）
- 點擊卡片出現彈窗，顯示 Claude 整理生成的任務說明文
- 支援刪除任務

**Long-term Tab**
- 顯示所有長期任務卡片
- 點擊卡片出現彈窗，顯示任務說明文與當前 Phase 進度
- 支援刪除任務

**Backlog Tab**
- 未來計畫的備忘清單，純文字記錄
- 右上角 ＋ 號新增項目（點擊後輸入文字）
- 每個項目右側有 X 可刪除
- 啟動方式：回到 Home 與 Claude 討論後建立正式任務
- **MVP 後期實作（v1.1）**

---

### 5.3 Records（打卡記錄）

**頁面頂部：待確認打卡卡片**

- 每個啟用中的任務，在通知時間後開啟 App 時出現確認卡片
- 卡片只有 **Done** 按鈕，沒有 No Show
- 未點擊 Done 即視為未執行
- 缺席多天全數補發，補發上限為 30 天
- 顯示順序從新到舊
- 當天卡片與缺席補發卡片分為兩個區塊顯示

**頁面下方：Progress Report**

每個任務顯示打卡統計：
- `This week N/7`：本週第幾天有打卡（分母固定為 7）
- `This month N/X`：本月第幾天有打卡（分母依月份動態判斷：28／29／30／31）

**點擊任務進入 Detail 頁面：**

習慣任務 Detail：
- 折線圖顯示全年打卡趨勢
- 依週列出打卡記錄（粉紅勾 = Done，X = 未執行）

長期任務 Detail：
- Progress bar 顯示整體進度
- Phase 清單，已完成的 Phase 顯示勾選狀態

---

### 5.4 Setting（設定）

| 區塊 | 說明 |
|------|------|
| Claude API Key | 輸入後顯示前五碼，其餘以 `*` 遮罩 |
| About Me | 純文字貼上個人說明，不提供檔案上傳 |
| Project | 上傳 .md 檔，多個檔案以換行排列，支援刪除 |

---

## 六、確認卡片邏輯

### 卡片結構

每張卡片包含：
- 任務名稱 + 對應日期
- **Done** 按鈕
- 文字輸入區（選填，當下補充說明）

長期任務卡片額外包含：
- **完成 Phase N** 按鈕（手動點擊即可推進，`current_phase + 1`）
- Phase 完成後若已達 `total_phases`，任務自動停用（`is_active = false`）

### 卡片出現規則

| 情境 | 行為 |
|------|------|
| 習慣任務通知時間後開 App | 顯示當天確認卡片 |
| 長期任務早晚通知後開 App | 顯示當天確認卡片 |
| 通知時間未到 | 卡片不顯示 |
| 缺席多天後開 App | 補發所有應出現的卡片（上限 30 天）|

### 缺席補發規則

- 補發卡片的 `scheduled_date` 填入原本應出現的日期，不是補發當天
- 顯示順序：從新到舊
- 分為兩個區塊：當天卡片（主要）、尚未確認卡片（補發）
- 任務暫停期間（`is_active = false`）不補發
- 任務建立當天若通知時間已過，當天不補發，從隔天起算
- 補發卡片確認完畢後，AI 給一次性回饋（v1.1 加入）

---

## 七、通知排程

**架構：**

```
Vercel Cron Job（每小時整點觸發）
      ↓
呼叫 /api/notify server route
      ↓
查詢 Supabase：當前小時內應通知的任務
      ↓
過濾：比對 notification_logs，避免同小時重複推播
      ↓
Web Push API 推送通知到用戶裝置
      ↓
寫入 notification_logs 記錄
      ↓
用戶點擊通知 → 開 App → Records 頁面
```

**通知時間精度：**
通知以整點為單位觸發，建議用戶設定整點時間（例：07:00、19:00）。

**通知文字：**

| 任務類型 | 通知內文 |
|----------|----------|
| 習慣任務 | 該是執行「{任務名稱}」的時候了 |
| 長期任務（早） | 今天的 {任務名稱} Phase {N} 有進度了嗎？ |
| 長期任務（晚） | {任務名稱} 今天有推進嗎？記得回報 |

**裝置支援：**

| 裝置 | 狀態 | 備註 |
|------|------|------|
| Android Chrome | ✅ | 瀏覽器開著即可 |
| iOS Safari | ✅ | 需加入主畫面（iOS 16.4+）|
| 桌機 Chrome | ✅ | 瀏覽器開著即可 |
| iOS 瀏覽器內 | ❌ | 必須加入主畫面 |

**iOS 引導：** 首次開啟偵測到 iOS 裝置且未加入主畫面，顯示引導提示。

**跨裝置同步：** 卡片狀態存於 Supabase，任一裝置確認後自動同步。

---

## 八、Supabase 資料結構

### `users`
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| personal_summary | text | 個人說明（純文字貼上）|
| supervisor_style | text | 督導風格偏好 |
| push_subscription | jsonb | Web Push 訂閱物件 |
| last_opened_at | timestamp | 上次開啟 App 的時間（補發邏輯用）|
| created_at | timestamp | 建立時間 |

### `habits`（習慣任務）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| title | text | 任務名稱 |
| description | text | Claude 生成的任務說明文 |
| frequency_days | int | 幾天執行一次 |
| notify_time | time | 通知時間 |
| is_active | boolean | 是否啟用 |
| created_at | timestamp | 建立時間 |

### `plans`（長期任務）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| title | text | 任務名稱 |
| description | text | 計畫說明（md 內容）|
| total_phases | int | 總 Phase 數 |
| current_phase | int | 當前 Phase |
| notify_morning | time | 早上通知時間 |
| notify_evening | time | 晚上通知時間 |
| is_active | boolean | 是否啟用 |
| created_at | timestamp | 建立時間 |

### `backlog`（待辦清單）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| title | text | 計畫名稱或說明 |
| created_at | timestamp | 建立時間 |

### `task_cards`（所有確認卡片）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| task_type | enum | `habit` / `long_term` |
| ref_id | uuid | 關聯 habits 或 plans |
| scheduled_date | date | 對應日期（補發填原始應執行日）|
| is_completed | boolean | 是否執行 |
| note | text | 用戶補充文字 |
| confirmed_at | timestamp | 確認時間 |

### `conversation_summaries`（對話摘要）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| summary | text | 對話摘要（150 字以內）|
| created_at | timestamp | 建立時間 |

### `project_files`（Project 文件）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| filename | text | 檔案名稱 |
| content | text | md 檔案內容 |
| created_at | timestamp | 上傳時間 |

### `notification_logs`（通知記錄）
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | uuid | 主鍵 |
| user_id | uuid | 關聯 users |
| task_id | uuid | 關聯 habits 或 plans |
| task_type | text | `habit` / `long_term` |
| notified_at | timestamp | 推播時間 |
| hour_slot | int | 觸發的小時（0–23），避免同小時重複推播 |

---

## 九、Skills 架構

專案 Skills 存放於 `skills/` 資料夾，分為兩類：

### 產品邏輯 Skills（`skills/product/`）

| 檔案 | 用途 | 狀態 |
|------|------|------|
| `supervisor-persona.md` | 督導 AI 的語氣、行為邊界、介入邏輯 | ✅ 完成 |
| `api-prompt-builder.md` | System Prompt 組裝規則、對話情境分類 | ✅ 完成 |
| `task-card-logic.md` | 卡片出現規則、補發邏輯、狀態更新 | ✅ 完成 |
| `notification-schedule.md` | 通知觸發架構、Web Push 實作、裝置支援 | ✅ 完成 |

### 開發工具 Skills（`skills/dev/`）

| 檔案 | 用途 | 狀態 |
|------|------|------|
| `ui-codegen.md` | 截圖→頁面，Nuxt + Tailwind 程式碼生成規範 | 待撰寫 |
| `design-tokens.md` | Token 命名結構、輸出格式規範 | 待撰寫 |
| `component-gen.md` | 元件抽取規則與輸出格式 | 待撰寫 |
| `design-spec.md` | 規範文件生成規則 | 待撰寫 |

---

## 十、MVP 範圍

### 包含功能

| 功能 | 說明 |
|------|------|
| 個人說明輸入 | 純文字貼上 |
| 習慣任務建立 | 透過對話建立，頻率、通知時間設定 |
| 長期任務建立 | 透過對話建立，上傳計畫說明 .md、Phase 數量設定 |
| 即時督促提醒 | 開啟 App 時顯示，即時生成不儲存 |
| 基本督導對話 | 帶入記憶的 Claude 對話，當天保留 |
| 執行確認卡片 | Done 按鈕 + 文字輸入區 |
| 缺席補發卡片 | 全補（上限 30 天），從新到舊顯示 |
| Phase 完成確認 | 手動點擊推進 |
| Progress Report | 週／月打卡統計 |
| PWA 推播通知 | 習慣任務 + 長期任務早晚提醒 |
| Setting | API Key 設定、About Me、Project 文件上傳 |

### 暫緩至 v1.1

| 功能 | 說明 |
|------|------|
| Backlog 待辦清單 | Plans 第三個 Tab |
| AI 回饋文字 | 缺席補發後的一次性鼓勵或批評 |
| 計畫視覺圖 | 待研究後決定呈現方式 |
| 原子習慣概念庫 | 整合《原子習慣》＋《Rewire》後加入 supervisor-persona |

---

## 十一、待討論項目

- [ ] 計畫視覺圖的呈現方式（Kelly 另行研究）
- [ ] AI 回饋文字的語氣設定與觸發條件
- [ ] 通知時間是否開放非整點設定
- [ ] 督導角色名字與人設（supervisor-persona 待補）

---

## 十二、Claude API 使用說明

- 用戶需自行至 [console.anthropic.com](https://console.anthropic.com) 申請 API Key
- 建立帳號後儲值（最低 $5 美金），產生 API Key 填入 Setting 頁面
- Claude 訂閱（claude.ai）與 API 為獨立產品，無法互用
- 建議使用模型：**Claude Sonnet 4.6**（$3/$15 per million tokens）
- 自用頻率下預估每月費用約 $1–3 美金
