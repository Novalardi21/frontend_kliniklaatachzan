import type { PublicCatalog } from '../../shared/types/catalog'

export function usePublicCatalog() {
  const ready = useAsyncData('public-clinic-catalog', () =>
    $fetch<PublicCatalog>('/api/catalog')
  )
  return {
    ready,
    refresh: ready.refresh,
    error: ready.error,
    status: ready.status,
    packages: computed(() => ready.data.value?.packages ?? []),
    methods: computed(() => ready.data.value?.methods ?? []),
    providers: computed(() => ready.data.value?.providers ?? []),
    sessions: computed(() => ready.data.value?.sessions ?? [])
  }
}
