<template>
  <div class="loading-dots-wrapper">
    <span class="dot" style="animation-delay: 0s"></span>
    <span class="dot" style="animation-delay: 0.2s"></span>
    <span class="dot" style="animation-delay: 0.4s"></span>
  </div>
</template>

<style scoped>
.loading-dots-wrapper {
  display: flex;
  gap: 6px;
  align-items: center;
  height: 2.4rem;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-primary);
  opacity: 0.4;
  animation: dotBounce 0.8s ease-in-out infinite;
}

@keyframes dotBounce {
  0%, 100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-6px); opacity: 1; }
}
</style>
