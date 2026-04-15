export default defineNuxtRouteMiddleware((to) => {
  // SSR 時 session 尚未還原，跳過驗證交由 client 端處理
  if (import.meta.server) return

  const user = useSupabaseUser()

  // 已登入訪問 /login → 導向首頁
  if (to.path === '/login' && user.value) {
    return navigateTo('/')
  }

  // 受保護頁面由各頁面的 page middleware 個別處理
})
