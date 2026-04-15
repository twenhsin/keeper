<template>
  <header class="page-header">
    <div
      class="title-row"
      :class="{ 'title-row--clickable': showBack }"
      @click="showBack ? handleBack() : undefined"
    >
      <span v-if="showBack" class="back-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 12H5M5 12L11 6M5 12L11 18" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <h1 class="page-title">{{ title }}</h1>
    </div>
    <slot name="tabs" />
  </header>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  },
  showBack: {
    type: Boolean,
    default: false
  },
  backTo: {
    type: String,
    default: null
  }
})

function handleBack() {
  navigateTo(props.backTo ?? -1)
}
</script>

<style scoped>
/* column 排列：title-row + 可選 tabs slot */
.page-header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-gap-header-tab); /* 16px — 只在 slot 有內容時視覺上生效 */
}

.title-row {
  display: flex;
  align-items: center;
  gap: var(--core-spacing-300);
}

.title-row--clickable {
  cursor: pointer;
}

.back-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--text-primary);
}

.page-title {
  font-size: var(--typography-display-size);
  font-weight: var(--typography-display-weight);
  line-height: var(--typography-display-line-height);
  color: var(--text-primary);
}
</style>
