<template>
  <div class="login-page">
    <div class="login-card">
      <button class="close-btn" type="button" aria-label="Close" @click="router.back()">×</button>
      <h1 class="login-title">Login</h1>

      <div class="field">
        <label class="field-label" for="email">Email</label>
        <input
          id="email"
          v-model="email"
          type="email"
          class="field-input"
          placeholder=""
          autocomplete="email"
        />
      </div>

      <div class="field field--password">
        <label class="field-label" for="password">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          class="field-input"
          placeholder=""
          autocomplete="current-password"
          @keyup.enter="handleLogin"
        />
      </div>

      <AppButton label="Log in" :disabled="loading" @click="handleLogin" />

      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<script setup>
const supabase = useSupabaseClient()
const router = useRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function handleLogin() {
  if (!email.value || !password.value) return
  loading.value = true
  errorMsg.value = ''

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    errorMsg.value = error.message
  } else {
    navigateTo('/')
  }

  loading.value = false
}
</script>

<style scoped>
/* ===== 頁面容器 ===== */
.login-page {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--spacing-page-x);
}

/* ===== 登入卡片 ===== */
.login-card {
  position: relative;
  width: 100%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 1.0);
  border-radius: var(--card-radius); /* 20px */
  padding: var(--core-spacing-700); /* 32px */
  box-shadow: 0 0 16px rgba(122, 64, 153, 0.05);
}

/* ===== 標題 ===== */
.login-title {
  font-size: var(--typography-ai-size); /* 24px */
  font-weight: var(--typography-display-weight); /* regular */
  line-height: var(--typography-display-line-height);
  color: var(--text-primary);
  text-align: center;
  margin: 0 0 var(--core-spacing-700); /* 0 0 32px */
}

/* ===== 欄位 ===== */
.field {
  display: flex;
  flex-direction: column;
  gap: var(--core-spacing-300); /* 12px */
  margin-bottom: var(--core-spacing-600); /* 24px */
}

.field--password {
  margin-bottom: var(--core-spacing-700); /* 32px */
}

.field-label {
  font-size: var(--typography-caption-size); /* 12px */
  font-weight: var(--typography-caption-weight);
  line-height: var(--typography-caption-line-height);
  color: var(--text-primary);
}

.field-input {
  width: 100%;
  background: var(--surface-input); /* rgba(255,255,255,0.8) */
  border: none;
  border-radius: var(--radius-input); /* 12px */
  padding: var(--core-spacing-300) var(--core-spacing-400); /* 12px 16px */
  font-family: inherit;
  font-size: var(--typography-body-size);
  color: var(--text-primary);
  outline: none;
  box-sizing: border-box;
}

.field-input::placeholder {
  color: var(--text-placeholder);
}

/* ===== 關閉按鈕 ===== */
.close-btn {
  position: absolute;
  top: var(--card-modal-padding);
  right: var(--card-modal-padding);
  background: none;
  border: none;
  padding: 0;
  font-size: 2rem;
  line-height: 1;
  color: var(--text-danger);
  cursor: pointer;
}

/* ===== 錯誤訊息 ===== */
.error-msg {
  font-size: var(--typography-caption-size);
  font-weight: var(--typography-caption-weight);
  line-height: var(--typography-caption-line-height);
  color: var(--text-danger);
  margin: var(--core-spacing-300) 0 0;
  text-align: center;
}
</style>
