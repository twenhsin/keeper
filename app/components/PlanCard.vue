<template>
  <BaseCard padding="sm" :opacity="80" class="plan-card" @click="$emit('open-detail')">
    <div class="plan-card__row">
      <span class="plan-card__title">{{ title }}</span>
      <div class="plan-card__actions">
        <button
          class="toggle"
          :class="{ 'toggle--on': isActive }"
          type="button"
          role="switch"
          :aria-checked="isActive"
          @click.stop="$emit('update:isActive', !isActive)"
        >
          <span class="toggle__thumb" />
        </button>
        <button class="delete-icon-btn" type="button" aria-label="刪除" @click.stop="$emit('delete', id)">
          <Trash2 :size="18" stroke="#FF7FDC" stroke-width="1.8" />
        </button>
      </div>
    </div>
  </BaseCard>
</template>

<script setup>
import { Trash2 } from 'lucide-vue-next'

defineProps({
  id: {
    type: [Number, String],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  }
})

defineEmits(['update:isActive', 'open-detail', 'delete'])
</script>

<style scoped>
.plan-card {
  cursor: pointer;
}

.plan-card__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--core-spacing-400);
}

.plan-card__actions {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.delete-icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  line-height: 0;
}

.plan-card__title {
  font-size: var(--typography-label-size);
  font-weight: var(--typography-label-weight);
  line-height: var(--typography-label-line-height);
  color: var(--text-primary);
}

/* ===== Toggle ===== */
.toggle {
  flex-shrink: 0;
  position: relative;
  width: 44px;
  height: 26px;
  border: none;
  border-radius: var(--radius-toggle);
  background: var(--ui-toggle-off);
  cursor: pointer;
  padding: 0;
  transition: background 0.25s;
}

.toggle--on {
  background: var(--gradient-brand);
}

.toggle__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-toggle);
  background: var(--core-color-white);
  transition: transform 0.25s;
  pointer-events: none;
}

.toggle--on .toggle__thumb {
  transform: translateX(18px);
}
</style>
