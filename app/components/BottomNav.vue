<template>
  <nav class="bottom-nav">
    <!-- nav-group：手機 display:contents（不影響 flex 排列），桌機絕對置中 -->
    <div class="nav-group">
      <NuxtLink
        v-for="item in navItems"
        :key="item.key"
        :to="item.to"
        class="nav-item"
        :class="{ 'nav-item--active': active === item.key }"
      >
        <component :is="item.icon" class="nav-icon" :size="24" :stroke-width="1.5" />
        <span class="nav-label">{{ item.label }}</span>
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import { Home, LayoutList, CheckSquare, Settings } from 'lucide-vue-next'

defineProps({
  active: {
    type: String,
    default: 'home'
  }
})

const navItems = [
  { key: 'home',    to: '/',        label: 'Home',    icon: Home },
  { key: 'plans',   to: '/plans',   label: 'Plans',   icon: LayoutList },
  { key: 'records', to: '/records', label: 'Records', icon: CheckSquare },
  { key: 'setting', to: '/setting', label: 'Setting', icon: Settings }
]
</script>

<style scoped>
/* ===== Mobile: 底部浮動導覽列 ===== */
.bottom-nav {
  position: fixed;
  bottom: 24px;
  left: 0;
  right: 0;
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  background: transparent;
  padding: 0;
  pointer-events: none; /* 讓點擊穿透外層，只有 nav-group 接收事件 */
}

/* 手機：nav-group 為白底膠囊，水平排列自適應寬度 */
.nav-group {
  display: flex;
  flex-direction: row;
  gap: var(--core-spacing-300); /* 12px */
  pointer-events: auto;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--core-spacing-100);
  padding: var(--core-spacing-200) var(--core-spacing-400); /* 8px 16px */
  border-radius: var(--radius-tab); /* 12px */
  background: rgba(255, 255, 255, 0.8);
  color: var(--nav-text);
  text-decoration: none;
  position: relative;
}

.nav-icon {
  display: none; /* 手機隱藏 icon */
}

.nav-label {
  font-size: var(--typography-caption-size);
  font-weight: var(--typography-caption-weight);
  line-height: var(--typography-caption-line-height);
}

/* Mobile active：漸層外框 */
.nav-item--active::before {
  content: '';
  position: absolute;
  inset: 0;
  padding: 1.5px;
  background: var(--nav-border-active);
  border-radius: var(--radius-tab);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

/* ===== Desktop (≥ 768px): 左側浮動 Sidebar ===== */
@media (min-width: 768px) {
  /* Sidebar 容器：上下左各 24px，高度 calc(100dvh - 48px) */
  .bottom-nav {
    top: 24px;
    bottom: 24px;
    left: 24px;
    right: auto;
    width: 80px;
    /* height 由 top + bottom 自動計算 = 100dvh - 48px */
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.8);
    padding: 0;
    /* 作為 nav-group 絕對定位的 containing block */
    display: block;
    position: fixed;
  }

  /* nav-group：絕對定位，上下左右置中於 sidebar */
  .nav-group {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--spacing-gap-chat); /* 24px */
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* 桌機 nav-item：48×48px 圓形點擊區域 */
  .nav-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    padding: 0;
    border-radius: 50%; /* 圓形 */
    color: var(--text-primary);
    position: relative; /* 覆蓋 mobile relative */
  }

  /* 桌機隱藏文字標籤 */
  .nav-label {
    display: none;
  }

  /* 桌機顯示 icon */
  .nav-icon {
    display: block;
  }

  /* 桌機 active：漸層填色圓形，icon 轉白 */
  .nav-item--active {
    background: var(--gradient-brand);
    color: var(--core-color-white);
  }

  /* 桌機移除偽元素外框 */
  .nav-item--active::before {
    display: none;
  }
}
</style>
