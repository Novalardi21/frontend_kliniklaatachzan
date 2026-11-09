import type { MaybeRefOrGetter } from 'vue'

export function useTablePagination<T>(
  source: MaybeRefOrGetter<readonly T[]>,
  size: MaybeRefOrGetter<number> = 6
) {
  const page = ref(1)
  const pageSize = computed(() => toValue(size))
  const total = computed(() => toValue(source).length)
  const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
  const rows = computed(() => {
    const start = (Math.min(page.value, pages.value) - 1) * pageSize.value
    return toValue(source).slice(start, start + pageSize.value)
  })

  watch(pages, (last) => {
    if (page.value > last) page.value = last
  })

  return { page, pageSize, total, rows }
}
