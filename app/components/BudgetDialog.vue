<template>
  <RekaDialogRoot :open="open" @update:open="(v) => emit('update:open', v === true)">
    <RekaDialogPortal>
      <RekaDialogOverlay class="fixed inset-0 z-40 bg-black/50" />
      <RekaDialogContent
        class="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-md rounded-t-3xl bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl"
      >
        <div class="mb-5 flex items-center justify-between">
          <RekaDialogTitle class="text-lg font-semibold">
            {{ isEditing ? 'Edit budget' : 'Add budget' }}
          </RekaDialogTitle>
          <RekaDialogClose class="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted">
            <X class="h-5 w-5" />
          </RekaDialogClose>
        </div>

        <div v-if="!category" class="mb-4">
          <label class="mb-1.5 block text-sm font-medium">Category</label>
          <p v-if="availableCategories.length === 0" class="text-sm text-muted-foreground">
            All expense categories already have a budget.
          </p>
          <RekaSelect v-else v-model="selectedCategoryId">
            <RekaSelectTrigger
              class="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-left text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            >
              <RekaSelectValue placeholder="Choose a category" />
              <ChevronsUpDown class="h-4 w-4 text-muted-foreground" />
            </RekaSelectTrigger>
            <RekaSelectPortal>
              <RekaSelectContent position="popper" class="z-50 rounded-xl border border-border bg-card shadow-lg">
                <RekaSelectViewport class="max-h-[min(16rem,60dvh)] overflow-y-auto p-1">
                  <RekaSelectItem
                    v-for="cat in availableCategories"
                    :key="cat.id"
                    :value="cat.id"
                    class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground outline-none hover:bg-muted"
                  >
                    <RekaSelectItemIndicator>
                      <Check class="h-4 w-4 text-brand-600" />
                    </RekaSelectItemIndicator>
                    <span class="h-3 w-3 rounded-full" :style="{ backgroundColor: cat.color || '#9ca3af' }" />
                    <RekaSelectItemText>{{ cat.name }}</RekaSelectItemText>
                  </RekaSelectItem>
                </RekaSelectViewport>
              </RekaSelectContent>
            </RekaSelectPortal>
          </RekaSelect>
        </div>

        <div v-if="category" class="mb-4 flex items-center gap-2 rounded-xl bg-muted px-4 py-3">
          <span class="h-3.5 w-3.5 shrink-0 rounded-full" :style="{ backgroundColor: category.color || '#9ca3af' }" />
          <span class="text-sm font-medium">{{ category.name }}</span>
          <span class="ml-auto text-xs text-muted-foreground">per month</span>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium">Budget amount (EUR)</label>
          <div class="relative">
            <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50">€</span>
            <input
              v-model="amount"
              type="text"
              inputmode="decimal"
              autocomplete="off"
              placeholder="0.00"
              class="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-lg font-semibold tabular-nums text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
            />
          </div>
        </div>

        <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          {{ error }}
        </p>

        <div class="flex gap-3 pt-3">
          <button
            v-if="isEditing"
            type="button"
            aria-label="Remove budget"
            class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-rose-500 transition hover:bg-rose-500/10 disabled:opacity-60"
            :disabled="saving"
            @click="remove"
          >
            <Trash2 class="h-5 w-5" />
          </button>
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
      </RekaDialogContent>
    </RekaDialogPortal>
  </RekaDialogRoot>
</template>

<script setup lang="ts">
import { X, Trash2, Check, ChevronsUpDown } from 'lucide-vue-next'
import {
  DialogRoot as RekaDialogRoot,
  DialogPortal as RekaDialogPortal,
  DialogOverlay as RekaDialogOverlay,
  DialogContent as RekaDialogContent,
  DialogTitle as RekaDialogTitle,
  DialogClose as RekaDialogClose,
  SelectRoot as RekaSelect,
  SelectTrigger as RekaSelectTrigger,
  SelectValue as RekaSelectValue,
  SelectPortal as RekaSelectPortal,
  SelectContent as RekaSelectContent,
  SelectViewport as RekaSelectViewport,
  SelectItem as RekaSelectItem,
  SelectItemIndicator as RekaSelectItemIndicator,
  SelectItemText as RekaSelectItemText,
} from 'reka-ui'
import type { Database } from '~/types/database'

type BudgetRow = Database['public']['Tables']['budgets']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

const props = defineProps<{
  open: boolean
  budget: BudgetRow | 'new' | null
  category: CategoryRow | null
}>()

const emit = defineEmits<{ 'update:open': [v: boolean]; saved: [] }>()

const { workspace, categories } = useWorkspace()
const { budgets, upsertBudget, removeBudget } = useBudgets()

const amount = ref('')
const saving = ref(false)
const error = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)

const isEditing = computed(() => props.budget !== 'new' && props.budget !== null)

const availableCategories = computed(() => {
  if (props.category) return []
  const budgeted = new Set(budgets.value.map((b) => b.category_id))
  return categories.value.filter((c) => c.type === 'expense' && !budgeted.has(c.id))
})

const effectiveCategory = computed<CategoryRow | null>(
  () => props.category ?? categories.value.find((c) => c.id === selectedCategoryId.value) ?? null,
)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    error.value = null
    selectedCategoryId.value = null
    if (props.budget && props.budget !== 'new') {
      amount.value = String(props.budget.amount)
    } else {
      amount.value = ''
    }
  },
)

async function save() {
  error.value = null
  const value = parseAmount(amount.value)
  if (!Number.isFinite(value) || value <= 0) {
    error.value = 'Please enter a valid amount.'
    return
  }
  if (!effectiveCategory.value) {
    error.value = 'Please choose a category.'
    return
  }
  if (!workspace.value) {
    error.value = 'No workspace selected.'
    return
  }

  saving.value = true
  const { error: err } = await upsertBudget(effectiveCategory.value.id, value)
  saving.value = false

  if (err) error.value = err.message
  else {
    emit('saved')
    emit('update:open', false)
  }
}

async function remove() {
  if (!props.category) return
  error.value = null
  saving.value = true
  const { error: err } = await removeBudget(props.category.id)
  saving.value = false

  if (err) error.value = err.message
  else {
    emit('saved')
    emit('update:open', false)
  }
}
</script>