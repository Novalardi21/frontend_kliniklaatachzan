<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
const open = defineModel<boolean>({ required: true })
const dialog = ref<HTMLDialogElement>()
const titleId = useId()
let previous: HTMLElement | null = null
watch(open, async (value) => {
  await nextTick()
  if (value) {
    previous = document.activeElement as HTMLElement
    dialog.value?.showModal()
  } else dialog.value?.close()
})
function close() {
  open.value = false
  previous?.focus()
}
onBeforeUnmount(() => dialog.value?.close())
</script>
<template>
  <dialog
    ref="dialog"
    class="admin-modal"
    :aria-labelledby="titleId"
    @cancel.prevent="close"
    @close="close"
    @click="$event.target === dialog && close()"
  >
    <header>
      <div>
        <h2 :id="titleId">{{ title }}</h2>
        <p v-if="description">{{ description }}</p>
      </div>
      <button
        class="admin-icon-button"
        aria-label="Tutup dialog"
        @click="close"
      >
        <UIcon name="i-lucide-x" />
      </button>
    </header>
    <div class="admin-modal-body"><slot /></div>
  </dialog>
</template>
