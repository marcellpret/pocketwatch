<template>
  <RekaDialogRoot :open="open" @update:open="(v) => emit('update:open', v === true)">
    <RekaDialogPortal>
      <RekaDialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <RekaDialogContent
        class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl"
      >
        <div class="mb-5 flex items-center justify-between">
          <RekaDialogTitle class="text-lg font-semibold">
            {{ isEdit ? 'Edit workspace' : 'New workspace' }}
          </RekaDialogTitle>
          <RekaDialogClose class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X class="h-5 w-5" />
          </RekaDialogClose>
        </div>

        <form class="space-y-4" @submit.prevent="save">
          <div>
            <label class="mb-1.5 block text-sm font-medium">Name</label>
            <input
              v-model="name"
              type="text"
              required
              placeholder="e.g. Family budget, Project X, Trip"
              class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium">
              Description <span class="text-muted-foreground">(optional)</span>
            </label>
            <textarea
              v-model="description"
              rows="3"
              placeholder="What is this workspace for?"
              class="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {{ error }}
          </p>

          <div class="flex gap-3 pt-1">
            <button
              type="button"
              class="flex-1 rounded-xl border border-border py-3 font-semibold text-muted-foreground transition hover:bg-muted"
              @click="emit('update:open', false)"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {{ saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create workspace' }}
            </button>
          </div>
        </form>
      </RekaDialogContent>
    </RekaDialogPortal>
  </RekaDialogRoot>
</template>

<script setup lang="ts">
import { X } from 'lucide-vue-next'
import {
  DialogRoot as RekaDialogRoot,
  DialogPortal as RekaDialogPortal,
  DialogOverlay as RekaDialogOverlay,
  DialogContent as RekaDialogContent,
  DialogTitle as RekaDialogTitle,
  DialogClose as RekaDialogClose,
} from 'reka-ui'
import type { Database } from '~/types/database'

type WorkspaceRow = Database['public']['Tables']['workspaces']['Row']

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  workspace?: WorkspaceRow | null
}>()

const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [] }>()

const { workspace: currentWorkspace, createWorkspace, updateWorkspace } = useWorkspace()

const name = ref('')
const description = ref('')
const saving = ref(false)
const error = ref<string | null>(null)

const isEdit = computed(() => props.mode === 'edit')

const editTarget = computed(() => (isEdit.value ? props.workspace ?? null : null))

watch(
  () => props.open,
  (open) => {
    if (!open) return
    error.value = null
    if (editTarget.value) {
      name.value = editTarget.value.name
      description.value = editTarget.value.description ?? ''
    } else {
      name.value = ''
      description.value = ''
    }
  },
)

async function save() {
  error.value = null
  const trimmed = name.value.trim()
  if (!trimmed) {
    error.value = 'Please enter a name.'
    return
  }

  saving.value = true

  if (isEdit.value && editTarget.value) {
    const { error: err } = await updateWorkspace({
      id: editTarget.value.id,
      name: trimmed,
      description: description.value,
    })
    if (err) {
      error.value = err.message
      saving.value = false
      return
    }
  } else {
    const { error: err } = await createWorkspace({ name: trimmed, description: description.value })
    if (err) {
      error.value = err.message
      saving.value = false
      return
    }
  }

  saving.value = false
  emit('saved')
  emit('update:open', false)
}
</script>
