# Skill: api-prompt-builder

> 版本：v1
> 用途：定義每次呼叫 Claude API 前，如何從 Supabase 撈取資料並組裝成 System Prompt

---

## 一、核心原則

Claude 沒有跨對話記憶。每次對話前必須從 Supabase 撈出相關資料，組成 System Prompt 傳入，Claude 才能扮演一個真正了解用戶的督導。

**資料帶入原則：**
- 個人說明：每次都帶，讓 Claude 知道在督導誰
- 任務清單：視對話情境決定帶入範圍
- 對話摘要：帶入最近七天，掌握近期狀態與討論脈絡

---

## 二、對話情境分類

根據用戶開啟 App 的情境，分為三種模式：

| 模式 | 觸發條件 | 說明 |
|------|----------|------|
| **提醒模式** | App 剛開啟，尚未輸入任何內容 | 生成即時督促提醒文字 |
| **督導對話模式** | 用戶開始輸入，進行一般對話 | 帶入完整脈絡進行督導對話 |
| **任務建立模式** | 對話內容涉及建立或修改任務 | 額外帶入現有任務清單避免重複或衝突 |

---

## 三、Supabase 資料撈取清單

### 每次必帶

```
users.personal_summary        // 個人說明
users.supervisor_style        // 督導風格偏好
```

### 視情境帶入

**所有啟用中任務（督導對話模式 / 任務建立模式）：**
```
habits WHERE is_active = true
  → id, title, description, frequency_days, notify_time

plans WHERE is_active = true
  → id, title, description, total_phases, current_phase, notify_morning, notify_evening
```

**最近七天對話摘要：**
```
conversation_summaries
WHERE user_id = current_user
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
```

**當前任務執行狀態（提醒模式 / 督導對話模式）：**
```
task_cards
WHERE user_id = current_user
  AND scheduled_date >= NOW() - INTERVAL '7 days'
ORDER BY scheduled_date DESC
```

---

## 四、System Prompt 組裝結構

以下為標準組裝順序，區塊之間以空行分隔：

```
[角色定義]
你是 {user_name} 的個人督導 Keeper。
你的行為準則請參考 supervisor-persona 定義。

[用戶資料]
## 關於用戶
{personal_summary}

[任務狀態]
## 當前啟用中的任務

### 習慣任務
{habits 列表}
每項包含：名稱、頻率、通知時間、說明

### 長期任務
{plans 列表}
每項包含：名稱、當前 Phase、總 Phase 數、說明

[執行記錄]
## 近期執行狀態（最近七天）
{task_cards 摘要}
格式：任務名稱 | 日期 | 是否完成

[對話脈絡]
## 最近七天對話摘要
{conversation_summaries 列表}
格式：日期 | 摘要內容
```

---

## 五、各模式的 Prompt 組裝規則

### 提醒模式
目標：生成開啟 App 時的即時督促文字

帶入資料：
- 個人說明
- 所有啟用中任務
- 最近七天執行狀態

額外指令：
```
請根據以上資料，生成用戶當前應看到的督促提醒。
規則：
- 每個任務各一條，換行分隔
- 不超過兩句話每條
- 語氣根據缺席天數對應 supervisor-persona 的層級 1–3
- 當前時間：{current_time}，請根據時間調整語境
- 此提醒不計入對話記錄
```

### 督導對話模式
目標：進行完整的督導對話

帶入資料：
- 個人說明
- 所有啟用中任務
- 最近七天執行狀態
- 最近七天對話摘要

額外指令：
```
現在進入對話模式。根據用戶的輸入給予督導回應。
行為準則遵照 supervisor-persona 定義。
當前時間：{current_time}
```

### 任務建立模式
目標：協助用戶建立或修改任務，並輸出結構化資料寫回 Supabase

帶入資料：
- 個人說明
- 所有啟用中任務（避免重複建立）
- 最近七天對話摘要

額外指令：
```
用戶正在建立或修改任務。
討論完成後，請輸出以下 JSON 格式供系統寫入資料庫：

習慣任務：
{
  "type": "habit",
  "title": "",
  "description": "",   // 用繁體中文整理任務說明
  "frequency_days": ,
  "notify_time": ""    // 格式 HH:MM
}

長期任務：
{
  "type": "long_term",
  "title": "",
  "description": "",   // 用繁體中文整理任務說明
  "total_phases": ,
  "current_phase": 1,
  "notify_morning": "", // 格式 HH:MM
  "notify_evening": ""  // 格式 HH:MM
}
```

---

## 六、Token 控制原則

| 資料 | 控制方式 |
|------|----------|
| 個人說明 | 用戶自行精簡，建議 500 字以內 |
| 任務說明 | 每筆建議 100 字以內，由 Claude 生成時即控制長度 |
| 執行記錄 | 只帶七天，不帶全部歷史 |
| 對話摘要 | 只帶七天，每筆摘要建議 150 字以內 |
| Project 文件 | 僅在用戶明確提及時才帶入，不預設帶入 |

---

## 七、對話結束後的摘要回寫

每次對話結束後，呼叫 Claude 生成本次對話摘要，寫入 `conversation_summaries`：

```
請用繁體中文，以 150 字以內總結這次對話的重點：
- 討論了什麼
- 有沒有建立或修改任務
- 用戶當前的執行狀態與態度

格式：純文字，不需要標題或列點
```

---

## 八、待補內容

- [ ] Project 文件的帶入時機與條件（待 v1.1 實作）
- [ ] 原子習慣概念庫整合後，對應的 Prompt 片段補充
