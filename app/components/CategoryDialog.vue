<template>
  <RekaDialogRoot :open="open" @update:open="(v) => emit('update:open', v === true)">
    <RekaDialogPortal>
      <RekaDialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <RekaDialogContent
        class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl"
      >
        <div class="mb-5 flex items-center justify-between">
          <RekaDialogTitle class="text-lg font-semibold">
            {{ isEditing ? 'Edit category' : 'New category' }}
          </RekaDialogTitle>
          <RekaDialogClose class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X class="h-5 w-5" />
          </RekaDialogClose>
        </div>

        <div class="space-y-4">
          <div>
            <label class="mb-1.5 block text-sm font-medium">Name</label>
            <input
              v-model="name"
              type="text"
              placeholder="e.g. Rent"
              class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium">Colour</label>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in colors"
                :key="c"
                type="button"
                class="h-8 w-8 rounded-full transition ring-offset-2 ring-offset-card"
                :style="{ backgroundColor: c }"
                :class="selectedColor === c ? 'ring-2 ring-foreground' : 'hover:scale-110'"
                @click="selectedColor = c"
              />
            </div>
          </div>

          <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
            {{ error }}
          </p>

          <div class="flex gap-3 pt-1">
            <button
              class="flex-1 rounded-xl border border-border py-3 font-semibold text-muted-foreground transition hover:bg-muted"
              @click="emit('update:open', false)"
            >
              Cancel
            </button>
            <button
              :disabled="saving"
              class="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              @click="save"
            >
              {{ saving ? 'Saving…' : 'Save' }}
            </button>
          </div>
        </div>
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

type CategoryRow = Database['public']['Tables']['categories']['Row']

const props = defineProps<{
  open: boolean
  category: CategoryRow | 'new' | null
  type: 'expense' | 'income'
}>()

const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [] }>()

const supabase = useSupabase()
const { household, loadCategories } = useHousehold()

const name = ref('')
const selectedColor = ref('#6366f1')
const saving = ref(false)
const error = ref<string | null>(null)

const colors = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981',
  '#3b82f6', '#ef4444', '#8b5cf6', '#14b8a6',
  '#f97316', '#84cc16',
]

const isEditing = computed(() => props.category !== 'new' && props.category !== null)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    error.value = null
    if (props.category === 'new') {
      name.value = ''
      selectedColor.value = colors[0]!
    } else if (props.category) {
      name.value = props.category.name
      selectedColor.value = props.category.color || colors[0]!
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
  if (!household.value) {
    error.value = 'No household found.'
    return
  }

  saving.value = true

  if (isEditing.value && props.category && props.category !== 'new') {
    const { error: err } = await supabase
      .from('categories')
      .update({ name: trimmed, color: selectedColor.value })
      .eq('id', props.category.id)
    if (err) error.value = err.message
    else {
      emit('saved')
      emit('update:open', false)
    }
  } else {
    const { error: err } = await supabase
      .from('categories')
      .insert({
        household_id: household.value.id,
        name: trimmed,
        type: props.type,
        color: selectedColor.value,
      })
    if (err) error.value = err.message
    else {
      emit('saved')
      emit('update:open', false)
    }
  }

  saving.value = false
  await loadCategories()
}
</script>
