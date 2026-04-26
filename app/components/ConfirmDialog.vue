<template>
  <Teleport to="body">
    <div v-if="modelValue" class="overlay" @click.self="$emit('update:modelValue', false)">
      <div class="dialog">
        <p class="dialog-message">{{ message }}</p>
        <div class="dialog-actions">
          <div class="btn-cancel-outer">
            <button class="btn-cancel" type="button" @click="$emit('update:modelValue', false)">
              取消
            </button>
          </div>
          <button class="btn-confirm" type="button" @click="handleConfirm">
            刪除
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  message: { type: String, default: '確定刪除？' }
})

const emit = defineEmits(['update:modelValue', 'confirm'])

function handleConfirm() {
  emit('confirm')
  emit('update:modelValue', false)
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog {
  background: #FFFFFF;
  border-radius: 20px;
  padding: 24px;
  width: 280px;
  max-width: calc(100% - 48px);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.dialog-message {
  font-size: 2.0rem;
  font-weight: 400;
  color: var(--text-primary);
  margin: 0;
  text-align: center;
}

.dialog-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.btn-cancel-outer {
  background: var(--gradient-brand);
  border-radius: 12px;
  padding: 1px;
}

.btn-cancel {
  width: 100%;
  height: 38px;
  background: #FFFFFF;
  border: none;
  border-radius: 11px;
  color: var(--text-primary);
  font-family: inherit;
  font-size: var(--typography-body-size);
  cursor: pointer;
}

.btn-confirm {
  height: 40px;
  background: var(--gradient-brand);
  border: none;
  border-radius: 12px;
  color: white;
  font-family: inherit;
  font-size: var(--typography-body-size);
  cursor: pointer;
}
</style>
