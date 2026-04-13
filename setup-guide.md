# setup-guide.md
> Skill：新專案建立標準流程
> 跨專案通用，適用所有 Nuxt 3 + Vue 3 專案
> 最後更新：2026-04-13

---

## 一、適用範圍

每次建立新專案時參考此文件，依序執行以下步驟：

1. 建立本機環境
2. 上傳至 GitHub
3. 部署至 Vercel
4. 初始化 Supabase（有後台需求時）
5. 連接 Figma MCP（需要 capture 時）

---

## 二、建立本機環境

### 2.1 確認 Node.js 版本

```bash
node -v
```

應為 v20.x.x。若不是，用 nvm 切換：

```bash
nvm use 20
```

### 2.2 建立 Nuxt 3 專案

```bash
npx nuxi@latest init 專案名稱
cd 專案名稱
```

選項確認：
- Package manager：**npm**
- Git repository：**Yes**

### 2.3 安裝 Tailwind CSS

```bash
npm install -D @nuxtjs/tailwindcss
```

在 `nuxt.config.ts` 加入：

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss']
})
```

建立 Tailwind 設定檔：

```bash
npx tailwindcss init
```

### 2.4 安裝 Supabase（有後台需求時）

```bash
npm install @nuxtjs/supabase
```

在 `nuxt.config.ts` 加入：

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/supabase']
})
```

### 2.5 建立環境變數檔案

建立 `.env`：

```
SUPABASE_URL=
SUPABASE_KEY=
```

建立 `.env.example`（提交至 GitHub，不含實際數值）：

```
SUPABASE_URL=
SUPABASE_KEY=
```

確認 `.gitignore` 包含 `.env`（Nuxt 預設已包含）。

### 2.6 建立專案基礎結構

```bash
mkdir -p assets/css components composables server/api public Skills/dev Skills/product
touch assets/css/tokens.css assets/css/main.css
touch CLAUDE.md
```

在 `assets/css/main.css` 加入字型基準設定：

```css
html {
  font-size: 62.5%; /* 1rem = 10px */
  font-family: 'Noto Serif TC', serif;
}
```

### 2.7 本機啟動確認

```bash
npm run dev
```

確認 `http://localhost:3000` 正常顯示後進行下一步。

---

## 三、上傳至 GitHub

### 3.1 在 GitHub 建立新 repo

前往 https://github.com/new
- Repository name：專案名稱
- Visibility：Private（預設）
- **不勾選** Initialize with README（本機已有）

### 3.2 連接並推送

```bash
git remote add origin https://github.com/twenhsin/專案名稱.git
git branch -M main
git add .
git commit -m "init: project setup"
git push -u origin main
```

### 3.3 日常推送流程

```bash
git add .
git commit -m "描述這次的變更"
git push
```

**分支策略：** 個人專案統一使用 main，不建立 develop / feature branch。

---

## 四、部署至 Vercel

### 4.1 首次部署（連接 GitHub）

1. 前往 https://vercel.com/new
2. Import Git Repository → 選擇剛建立的 repo
3. Framework Preset：**Nuxt.js**（自動偵測）
4. 點擊 Deploy

### 4.2 設定環境變數

部署完成後：
Settings → Environment Variables → 逐一加入 `.env` 的所有變數

### 4.3 後續自動部署

每次 `git push` 到 main，Vercel 自動觸發重新部署，無需額外操作。

### 4.4 確認部署網址

部署完成後取得 `https://專案名稱.vercel.app`，記錄至 `CLAUDE.md`。

---

## 五、初始化 Supabase

### 5.1 建立專案

1. 前往 https://supabase.com/dashboard
2. New Project → 填入名稱、資料庫密碼、區域（選 Northeast Asia）
3. 等待專案建立完成（約 1 分鐘）

### 5.2 取得 API 金鑰

Settings → API：
- `Project URL` → 填入 `.env` 的 `SUPABASE_URL`
- `anon public` key → 填入 `.env` 的 `SUPABASE_KEY`

同步更新 Vercel 的 Environment Variables。

### 5.3 建立資料表

請 Claude Code 根據規格書的資料結構生成 SQL，在 Supabase SQL Editor 執行：

```
指令範例：
「請根據規格書的資料庫結構，幫我生成建立所有資料表的 SQL，
包含欄位定義、型別、預設值與 RLS policy。」
```

### 5.4 確認 RLS 政策

每張資料表建立後，在 Table Editor → RLS 確認政策是否正確啟用。

---

## 六、連接 Figma MCP（Capture 用）

### 6.1 安裝 Figma MCP

在終端機執行：

```bash
claude mcp add --transport http --scope user figma https://mcp.figma.com/mcp
```

確認安裝：

```bash
claude mcp list
```

### 6.2 在 Claude Code 確認連線

在 Claude Code 輸入：

```
/mcp
```

確認顯示 **Figma MCP connected**。

### 6.3 執行 Capture

在 Claude Code 右側對話窗輸入：

```
Start a local server for my app and capture the UI in a new Figma file.
```

**注意事項：**
- 執行前確認本機開發伺服器已啟動（`npm run dev`）
- Capture 前確認目標頁面路由正確
- 若需要 capture 特定頁面，補充路由資訊：
  ```
  Start a local server and capture the /ui-kit page in a new Figma file.
  ```

---

## 七、CLAUDE.md 初始內容

新專案建立完成後，將以下模板填入 `CLAUDE.md`，替換 `[]` 內的內容：

```markdown
# CLAUDE.md
> [專案名稱] 專案入口文件
> 最後更新：[日期]

## 專案概述
**產品名稱：** [名稱]
**GitHub：** https://github.com/twenhsin/[repo名稱]
**部署：** https://[專案名稱].vercel.app

## 技術棧
- Nuxt 3 + Vue 3
- Tailwind CSS
- Supabase（若有）
- Claude API（若有）
- Node.js v20
- npm

## Skills 位置
[列出 Skills 資料夾結構]

## 開發規範
[從 Keeper CLAUDE.md 的第四節複製並調整]

## 環境變數
[列出所需變數名稱，不含數值]
```
