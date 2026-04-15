<template>
  <div class="base-card" :class="`base-card--${padding} base-card--op${opacity}`">
    <slot />
  </div>
</template>

<script setup>
defineProps({
  padding: {
    type: String,
    default: 'sm'
  },
  opacity: {
    type: Number,
    default: 80
  }
})
</script>

<style scoped>
.base-card {
  border-radius: var(--card-radius);
}

/* padding sm = 16px（清單/report/文件卡片） */
.base-card--sm {
  padding: var(--card-padding);
}

/* padding lg = 24px（彈窗/打卡/detail 卡片） */
.base-card--lg {
  padding: var(--card-modal-padding);
}

/* opacity 80（半透明白）*/
.base-card--op80 {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
}

/* opacity 100（全白）*/
.base-card--op100 {
  background: var(--card-modal-bg);
}
</style>
