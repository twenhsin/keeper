<template>
  <button
    class="app-btn"
    :class="[`app-btn--${variant}`, size === 'compact' && 'app-btn--compact']"
    :disabled="disabled"
    v-bind="$attrs"
  >
    {{ label }}
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'normal'
  },
  label: {
    type: String,
    required: true
  },
  disabled: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.app-btn {
  display: block;
  width: 100%;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  border: none;
  border-radius: var(--btn-radius);
  font-size: var(--btn-font-size);
  font-weight: var(--btn-font-weight);
  font-family: inherit;
  color: var(--btn-text);
  background: var(--btn-bg);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
}

.app-btn--primary:hover {
  box-shadow: var(--btn-shadow-hover);
}

.app-btn--primary:active {
  background: var(--btn-bg-active);
}

.app-btn--compact {
  display: inline-flex;
  align-items: center;
  width: auto;
  height: 32px;
  padding-left: 16px;
  padding-right: 16px;
}

.app-btn:disabled {
  opacity: var(--btn-opacity-disabled);
  pointer-events: none;
  cursor: default;
}
</style>
