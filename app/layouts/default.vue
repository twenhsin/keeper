<template>
  <div class="layout">
    <!-- 背景圖層（position: fixed 避免 iOS Safari background-attachment 問題） -->
    <div class="layout-bg" aria-hidden="true" />

    <!-- 內容層 -->
    <div class="layout-content">
      <slot />
    </div>

    <!-- 全域右上角使用者 icon -->
    <button class="user-icon-btn" type="button" aria-label="User" @click="handleUserIcon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="user-icon-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#FF7FDC" />
            <stop offset="100%" stop-color="#FFBB8E" />
          </linearGradient>
        </defs>
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="url(#user-icon-gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="12" cy="7" r="4" stroke="url(#user-icon-gradient)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const user = useSupabaseUser()

async function handleUserIcon() {
  if (user.value) {
    await supabase.auth.signOut()
    navigateTo('/login')
  } else {
    navigateTo('/login')
  }
}
</script>

<style>
/* 全域 reset */
*, *::before, *::after {
  box-sizing: border-box;
}

body {
  margin: 0;
}
</style>

<style scoped>
.layout {
  position: relative;
  min-height: 100dvh;
  height: 100dvh;
  overflow: hidden;
}

/* 背景圖層：position: fixed 確保 iOS Safari 正確渲染 */
.layout-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('/images/page-bg-m.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

@media (min-width: 768px) {
  .layout-bg {
    background-image: url('/images/page-bg.svg');
  }
}

/* 內容層浮在背景上 */
.layout-content {
  position: relative;
  z-index: 1;
  height: 100%;
  overflow: hidden;
}

/* ===== 使用者 icon 按鈕 ===== */
.user-icon-btn {
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 150;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
}

/* 漸層外框（mask 技巧） */
.user-icon-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1.5px;
  background: var(--gradient-brand);
  border-radius: 50%;
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}
</style>
