interface SessionUser {
  id: number
  email: string
  name: string
  role: 'admin'
}
export function useAdminSession() {
  const user = useState<SessionUser | null>('admin-user', () => null)
  const request = useRequestFetch()
  async function refresh() {
    const result = await request<{ user: SessionUser | null }>(
      '/api/auth/session'
    )
    user.value = result.user
    return result.user
  }
  async function login(email: string, password: string) {
    const result = await $fetch<{ user: SessionUser }>('/api/auth/login', {
      method: 'POST',
      body: { email, password }
    })
    user.value = result.user
  }
  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
  }
  return {
    user,
    refresh,
    login,
    logout,
    validRole: computed(() => user.value?.role ?? null),
    name: computed(() => user.value?.name ?? 'Admin Klinik'),
    label: computed(() => (user.value ? 'Administrator' : 'Petugas Klinik'))
  }
}
