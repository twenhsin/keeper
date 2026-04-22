# Skill: task-card-logic

> 版本：v1
> 用途：定義確認卡片的出現規則、缺席補發邏輯、狀態管理

---

## 一、卡片類型

所有卡片統一存放於 `task_cards` 資料表，以 `task_type` 區分：

| task_type | 對應任務表 | 說明 |
|-----------|-----------|------|
| `habit` | `habits` | 習慣任務確認卡 |
| `long_term` | `plans` | 長期任務確認卡 |

---

## 二、卡片出現規則

### 習慣任務卡片

**固定卡（required_weekdays 有值）**
- 今天的星期幾在 required_weekdays 內
- card_show_time 為 null 或當前時間 >= card_show_time
- 今天尚未有對應的 task_cards 記錄

**加分卡（allow_extra = true）**
- 今天不在 required_weekdays 內
- card_show_time 為 null 或當前時間 >= card_show_time
- 今天尚未有對應的 task_cards 記錄
- 寫入 task_cards 時 is_extra = true

**週期卡（period_days 有值）**
- 距上次完成打卡（confirmed_at）已達 period_days 天
- 若從未打卡，以 created_at 為基準起算
- card_show_time 為 null 或當前時間 >= card_show_time
- 今天尚未有對應的 task_cards 記錄

**補打卡（allow_makeup = true）**
- 昨天是固定日或週期日，但昨天沒有 is_completed = true 的記錄
- 補一張，scheduled_date = 昨天
- 顯示在獨立「待補打卡」區塊

### 長期任務卡片

觸發條件：
1. 當前時間 >= `notify_morning` 或 >= `notify_evening`
2. 今天尚未有對應的 `task_cards` 記錄
3. 任務 `is_active = true` 且尚未完成所有 Phase

每天最多產生兩張卡片（早晚各一），但若用戶已確認其中一張，另一張仍會出現。

---

## 三、補打卡邏輯

### 觸發時機
用戶開啟 App 時執行補發檢查。

### 補發計算

**習慣任務：**
```
只補昨天一天，不往前推算多天。
條件：allow_makeup = true，且昨天應出現卡片（固定日或週期日）但未打卡。
```

**長期任務：**
```
從上次開啟 App 的日期到今天
計算這段期間每天應出現的卡片數（早晚各一）
比對 task_cards 找出缺少的記錄
針對缺少的日期逐一建立補發卡片
```

### 補發卡片的 scheduled_date
補發卡片的 `scheduled_date` 填入「原本應該出現的日期」，不是補發當天。

範例：
```
今天是 4/13，習慣任務兩天一次
上次打卡是 4/7
應補發：4/9、4/11 兩張卡片
scheduled_date 分別填 4/9、4/11
```

---

## 四、卡片顯示規則

### 顯示順序
從新到舊排列（`scheduled_date` DESC）

### 區塊分隔
Records 頁面分為兩個區塊：

```
區塊 1：今日待確認
→ scheduled_date = 今天 且 is_completed = false

區塊 2：尚未確認（補發）
→ scheduled_date < 今天 且 is_completed = false
→ 標示張數，例如「3 張待確認」
```

### 卡片內容

習慣任務卡片：
- 任務名稱
- scheduled_date 對應的日期顯示
- Done 按鈕
- 文字輸入區（選填）

長期任務卡片：
- 任務名稱 + 當前 Phase（例：Filo — Phase 2）
- scheduled_date 對應的日期顯示
- Done 按鈕
- 完成 Phase N 按鈕（僅在用戶想推進 Phase 時點擊）
- 文字輸入區（選填）

---

## 五、卡片狀態更新

### 點擊 Done
```sql
UPDATE task_cards
SET
  is_completed = true,
  confirmed_at = NOW(),
  note = {用戶輸入的文字，若有}
WHERE id = {card_id}
```

### 點擊完成 Phase N（長期任務）
```sql
-- 更新卡片狀態
UPDATE task_cards
SET is_completed = true, confirmed_at = NOW()
WHERE id = {card_id}

-- 推進 Phase
UPDATE plans
SET current_phase = current_phase + 1
WHERE id = {plan_id}
```

Phase 推進條件：
- `current_phase` 不超過 `total_phases`
- 若 `current_phase = total_phases`，任務標記為完成（`is_active = false`）

---

## 六、Progress Report 計算

### This week N/7
```
計算本週（週一到今天）task_cards 中
is_completed = true 的不重複日期數
分母固定為 7
```

### This month N/30
```
計算本月 1 日到今天 task_cards 中
is_completed = true 的不重複日期數
分母依當月天數動態判斷：
- 一般月份：30 或 31
- 二月：28（平年）或 29（閏年）
```

閏年判斷：
```javascript
const isLeapYear = (year) =>
  (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
```

---

## 七、邊界情境處理

| 情境 | 處理方式 |
|------|----------|
| 任務建立當天 | 若通知時間已過，當天不補發，從隔天起算 |
| 任務暫停期間（is_active = false）| 暫停期間不產生卡片，也不補發 |
| Phase 已到最後一個 | 完成 Phase 按鈕消失，任務自動停用 |
| 同一天有多張補發卡片 | 同日期的卡片全部顯示，不合併 |
| 用戶從未打開 App 超過 30 天 | 補發上限為 30 天，更早的不補發 |

---

## 八、task_cards 新增欄位

```sql
ALTER TABLE task_cards
  ADD COLUMN is_extra boolean DEFAULT false,
  ADD COLUMN slot_index int DEFAULT 0;
```

---

**5. habits 退役欄位說明（加在第一節「卡片類型」後面）**

```markdown
## 一之二、habits 欄位說明（v2）

| 欄位 | 類型 | 說明 |
|------|------|------|
| required_weekdays | jsonb | 固定日，0=週日~6=週六，例 [3,0] |
| period_days | int | 週期卡，每 N 天一次 |
| allow_extra | boolean | 非固定日是否出現加分卡 |
| allow_makeup | boolean | 錯過後隔天是否補一張 |
| daily_slots | int | 每天幾張卡，預設 1 |
| card_show_time | time | 卡片從幾點顯示，null = 全天 |
| notify_times | jsonb | 推播時間，例 ["18:30"] |

退役欄位（保留不刪）：card_mode、frequency_days、notify_time
```

---


## 九、待補內容

- [ ] 缺席補發後 AI 一次性回饋的觸發邏輯（v1.1）
- [ ] 補發上限天數可否由用戶自訂（待確認）
