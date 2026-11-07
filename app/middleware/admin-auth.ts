export default defineNuxtRouteMiddleware(async () => {
  const { refresh, user } = useAdminSession()
  try {
    if (!(await refresh())) return navigateTo('/admin/login')
  } catch {
    user.value = null
    return navigateTo('/admin/login')
  }
})
