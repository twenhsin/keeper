<template>
  <div class="chat-bubble" :class="`chat-bubble--${align}`">
    <div v-if="align === 'right'" class="bubble-box">
      {{ content }}
    </div>
    <p v-else class="bubble-text">{{ content }}</p>
  </div>
</template>

<script setup>
defineProps({
  align: {
    type: String,
    default: 'left'
  },
  content: {
    type: String,
    required: true
  }
})
</script>

<style scoped>
.chat-bubble {
  display: flex;
}

.chat-bubble--right {
  justify-content: flex-end;
}

.chat-bubble--left {
  justify-content: flex-start;
}

/* 用戶訊息：白色氣泡框 */
.bubble-box {
  background: var(--surface-card-list);
  border-radius: var(--radius-input);
  padding: var(--spacing-padding-dialog);
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  max-width: 80%;
}

/* AI 訊息：無氣泡，文字直接於背景 */
.bubble-text {
  font-size: var(--typography-body-size);
  font-weight: var(--typography-body-weight);
  line-height: var(--typography-body-line-height);
  color: var(--text-primary);
  margin: 0;
  max-width: 100%;
}
</style>
