<template>
  <div class="file-card">
    <button v-if="deletable" class="delete-btn" type="button" @click.stop="$emit('delete')">×</button>
    <span class="file-name">{{ filename }}</span>
    <span class="file-type">{{ type }}</span>
  </div>
</template>

<script setup>
defineProps({
  filename: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  deletable: {
    type: Boolean,
    default: false
  }
})

defineEmits(['delete'])
</script>

<style scoped>
.file-card {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 160px;
  background: var(--card-bg);           /* rgba(255,255,255,0.4) */
  border: 1px solid var(--card-border); /* rgba(255,255,255,0.8) */
  border-radius: var(--md-card-radius);
  padding: var(--md-card-padding);
}

.delete-btn {
  position: absolute;
  top: var(--md-card-padding);
  right: var(--md-card-padding);
  background: none;
  border: none;
  padding: 0;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--text-danger);
  cursor: pointer;
}

.file-name {
  font-size: var(--typography-label-size);
  font-weight: var(--typography-label-weight);
  line-height: var(--typography-label-line-height);
  color: var(--text-primary);
  padding-right: var(--core-spacing-400); /* 避免與刪除按鈕重疊 */
}

.file-type {
  font-size: var(--typography-caption-size);
  font-weight: var(--typography-caption-weight);
  line-height: var(--typography-caption-line-height);
  color: var(--text-placeholder);
}
</style>
