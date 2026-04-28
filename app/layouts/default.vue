<template>
  <div class="layout">
    <!-- 背景圖層（position: fixed 避免 iOS Safari background-attachment 問題） -->
    <div class="layout-bg" aria-hidden="true" />

    <div class="layout-body">
      <!-- 主內容區（DOM 在前，桌機透過 order: 2 移到右側） -->
      <div class="main-wrap">
        <div class="main-content">
          <slot />
        </div>
      </div>

      <!-- 手機版：DOM 在後自然沉底；桌機版：order: 1 移到左側 -->
      <BottomNav :active="activeRoute" />
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

    <!-- 登出確認彈窗 -->
    <Teleport to="body">
      <div v-if="showLogoutModal" class="modal-overlay" @click="closeModal">
        <div class="modal-box" @click.stop>
          <p class="modal-title">Logout</p>
          <AppButton label="Log out" @click="handleLogout" />
        </div>
      </div>

      <!-- Toast -->
      <div v-if="showToast" class="logout-toast">登出成功</div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const route = useRoute()
const supabase = useSupabaseClient()
const user = useSupabaseUser()

useHead({
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, interactive-widget=resizes-content' },
    { name: 'apple-mobile-web-app-capable', content: 'yes' },
    { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
    { name: 'apple-mobile-web-app-title', content: 'Keeper' }
  ],
  link: [
    { rel: 'apple-touch-icon', href: '/icons/icon-192.png' },
    { rel: 'apple-touch-startup-image', href: '/icons/icon-512.png' }
  ]
})

const activeRoute = computed(() => {
  const path = route.path
  if (path === '/') return 'home'
  if (path.startsWith('/plans')) return 'plans'
  if (path.startsWith('/records')) return 'records'
  if (path.startsWith('/setting')) return 'setting'
  return ''
})

const showLogoutModal = ref(false)
const showToast = ref(false)

function handleUserIcon() {
  if (user.value) {
    showLogoutModal.value = true
  } else {
    navigateTo('/login')
  }
}

async function handleLogout() {
  await supabase.auth.signOut()
  showLogoutModal.value = false
  showToast.value = true
  setTimeout(() => { showToast.value = false }, 2000)
  setTimeout(() => { navigateTo('/login') }, 2200)
}

function closeModal() {
  showLogoutModal.value = false
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
  position: fixed;
  inset: 0;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.layout-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  background-image: url('/images/page-bg-m.png');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}

.layout-body {
  position: relative;
  z-index: 1;
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-wrap {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.main-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
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

/* ===== 登出彈窗 ===== */
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: rgba(255, 255, 255, 1.0);
  border-radius: 20px;
  padding: 24px;
  max-width: 280px;
  width: 100%;
}

.modal-title {
  font-size: var(--typography-heading-size);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 24px;
  text-align: center;
}

/* ===== Toast ===== */
.logout-toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 300;
  background: var(--gradient-brand);
  color: white;
  border-radius: 12px;
  padding: 10px 20px;
  font-size: var(--typography-caption-size);
  white-space: nowrap;
}

/* ===== Desktop (≥ 768px) ===== */
@media (min-width: 768px) {
  .layout-bg {
    background-image: url('/images/page-bg.svg');
  }

  .layout-body {
    flex-direction: row;
  }

  .main-wrap {
    order: 2;
    flex: 1;
    padding-left: 24px;
  }

  .main-content {
    max-width: 800px;
    height: 100%;
    margin: 0 auto;
  }
}
</style>
