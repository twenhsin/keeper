# Skill: notification-schedule

> 版本：v1
> 用途：定義推播通知的觸發規則、技術架構與實作方式

---

## 一、通知類型

| 類型 | 觸發來源 | 說明 |
|------|----------|------|
| 習慣任務通知 | `habits.notify_time` | 指定時間推播 |
| 長期任務早晨通知 | `plans.notify_morning` | 每天早上推播 |
| 長期任務晚間通知 | `plans.notify_evening` | 每天晚上推播 |

---

## 二、技術架構

```
Vercel Cron Job（每小時整點觸發）
      ↓
呼叫 /api/notify 這個 server route
      ↓
查詢 Supabase：當前時間區間內應通知的任務
      ↓
對有訂閱推播的用戶發送 Web Push
      ↓
用戶收到通知 → 點擊 → 開啟 App → Records 頁面
```

---

## 三、Vercel Cron 設定

在 `vercel.json` 設定每小時執行一次：

```json
{
  "crons": [
    {
      "path": "/api/notify",
      "schedule": "0 * * * *"
    }
  ]
}
```

觸發時間精度為整點，因此通知時間設定建議以整點為單位（例：07:00、19:00），避免用戶設定 07:30 但系統在 07:00 或 08:00 才觸發。

> 若未來需要支援非整點時間，可改為每 30 分鐘觸發一次（`*/30 * * * *`），但會增加執行次數與成本。

---

## 四、/api/notify 執行邏輯

### Step 1：取得當前時間區間

```javascript
const now = new Date()
const currentHour = now.getHours()      // 例：19
const windowStart = `${currentHour}:00`
const windowEnd = `${currentHour}:59`
```

### Step 2：查詢應通知的習慣任務

```sql
SELECT h.*, u.push_subscription
FROM habits h
JOIN users u ON h.user_id = u.id
WHERE h.is_active = true
  AND h.notify_time BETWEEN {windowStart} AND {windowEnd}
```

### Step 3：查詢應通知的長期任務

```sql
SELECT p.*, u.push_subscription
FROM plans p
JOIN users u ON p.user_id = u.id
WHERE p.is_active = true
  AND p.current_phase <= p.total_phases
  AND (
    p.notify_morning BETWEEN {windowStart} AND {windowEnd}
    OR
    p.notify_evening BETWEEN {windowStart} AND {windowEnd}
  )
```

### Step 4：過濾已通知過的任務

避免同一個任務在同一天同一時段重複推播：

```sql
SELECT * FROM notification_logs
WHERE user_id = {user_id}
  AND task_id = {task_id}
  AND notified_at::date = TODAY
  AND hour_slot = {currentHour}
```

若已有記錄則跳過，不重複發送。

### Step 5：發送 Web Push

```javascript
import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:your@email.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

await webpush.sendNotification(
  push_subscription,
  JSON.stringify({
    title: 'Keeper',
    body: notificationBody,  // 依任務類型決定文字
    url: '/records'          // 點擊後開啟的頁面
  })
)
```

### Step 6：寫入通知記錄

```sql
INSERT INTO notification_logs (user_id, task_id, task_type, notified_at, hour_slot)
VALUES ({user_id}, {task_id}, {task_type}, NOW(), {currentHour})
```

---

## 五、通知文字規則

通知文字保持簡短，點進 App 後才由 AI 生成完整督促文字。

| 任務類型 | 通知標題 | 通知內文 |
|----------|----------|----------|
| 習慣任務 | Keeper | 該是執行「{任務名稱}」的時候了 |
| 長期任務（早） | Keeper | 今天的 {任務名稱} Phase {N} 有進度了嗎？ |
| 長期任務（晚） | Keeper | {任務名稱} 今天有推進嗎？記得回報 |

---

## 六、Supabase 新增資料表

### `users` 補充欄位

```sql
ALTER TABLE users
ADD COLUMN push_subscription jsonb,  -- Web Push 訂閱物件
ADD COLUMN last_opened_at timestamp  -- 上次開啟 App 的時間（補發邏輯用）
```

### `notification_logs`（新增）

```sql
CREATE TABLE notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  task_id uuid,
  task_type text,         -- 'habit' 或 'long_term'
  notified_at timestamp,
  hour_slot int           -- 0–23，避免同小時重複推播
)
```

---

## 七、前端：推播訂閱設定

用戶首次開啟 App 時，引導訂閱推播通知：

```javascript
// 請求通知權限
const permission = await Notification.requestPermission()

if (permission === 'granted') {
  const registration = await navigator.serviceWorker.ready

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: process.env.NUXT_PUBLIC_VAPID_PUBLIC_KEY
  })

  // 儲存訂閱物件到 Supabase
  await supabase
    .from('users')
    .update({ push_subscription: subscription })
    .eq('id', currentUserId)
}
```

---

## 八、裝置支援與限制

| 裝置 | 支援狀態 | 備註 |
|------|----------|------|
| Android Chrome | ✅ 完整支援 | 瀏覽器開著即可 |
| iOS Safari | ✅ 支援（iOS 16.4+）| 需加入主畫面才能收到推播 |
| 桌機 Chrome | ✅ 完整支援 | 瀏覽器開著即可 |
| iOS 瀏覽器內 | ❌ 不支援 | 必須加入主畫面 |

**iOS 引導流程：**
首次開啟 App 時，若偵測到 iOS 裝置且尚未加入主畫面，顯示引導提示：
「請將 Keeper 加入主畫面，才能接收督導通知」

---

## 九、VAPID Key 產生方式

```bash
npx web-push generate-vapid-keys
```

產生後存入 Vercel 環境變數：
- `VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`

VAPID Key 只需產生一次，不要重新產生，否則所有既有訂閱會失效。

---

## 十、邊界情境處理

| 情境 | 處理方式 |
|------|----------|
| 用戶尚未訂閱推播 | 跳過，不發送，等用戶授權後下次再觸發 |
| 任務已暫停（is_active = false）| 不發送通知 |
| 推播發送失敗（訂閱過期）| 捕捉錯誤，清除 push_subscription，等用戶重新訂閱 |
| 用戶同時有多個任務在同一時間 | 每個任務各發一則通知，不合併 |
| 網路離線 | Web Push 由瀏覽器排隊，上線後自動補發 |

---

## 十一、待補內容

- [ ] 通知時間是否開放非整點設定（視需求決定）
- [ ] 靜音時段設定（例：深夜不推播）
- [ ] 推播失敗的 retry 機制
