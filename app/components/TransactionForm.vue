<template>
  <div class="space-y-5">
    <!-- Apple Pay review -->
    <div
      v-if="isReviewable"
      class="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4"
    >
      <div class="mb-1.5 flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
        <Sparkles class="h-4 w-4" />
        This purchase wasn't auto-categorized
      </div>
      <p class="mb-3 text-xs text-amber-600/80 dark:text-amber-400/80">
        Pick a category below. Optionally remember this merchant so future Apple Pay purchases are categorized automatically.
      </p>
      <label class="flex cursor-pointer items-start gap-2 text-xs text-foreground">
        <input v-model="setRule" type="checkbox" class="mt-0.5 h-4 w-4 accent-amber-600" :disabled="!form.description.trim()" />
        <span>
          Remember <b>"{{ form.description.trim() }}"</b> → {{ selectedCategoryName }}
          <span v-if="!form.description.trim()" class="text-muted-foreground">(add a merchant name first)</span>
        </span>
      </label>
    </div>

    <!-- Type toggle -->
    <div class="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      <button
        type="button"
        class="rounded-lg py-2 text-sm font-semibold transition"
        :class="form.type === 'expense' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'"
        @click="form.type = 'expense'"
      >
        Expense
      </button>
      <button
        type="button"
        class="rounded-lg py-2 text-sm font-semibold transition"
        :class="form.type === 'income' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'"
        @click="form.type = 'income'"
      >
        Income
      </button>
    </div>

    <!-- Amount -->
    <div>
      <Label for="amount" class="mb-1.5 block text-sm font-medium">Amount (EUR)</Label>
      <div class="relative">
        <span class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50">€</span>
        <input
          id="amount"
          :value="form.amount"
          type="text"
          inputmode="decimal"
          autocomplete="off"
          placeholder="0.00"
          class="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-lg font-semibold tabular-nums text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          @input="onAmountInput"
        />
      </div>
    </div>

    <!-- Category -->
    <div>
      <Label class="mb-1.5 block text-sm font-medium">Category</Label>
      <RekaSelect v-model="form.categoryId">
        <RekaSelectTrigger
          class="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-2.5 text-left text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        >
          <RekaSelectValue placeholder="Choose a category" />
          <ChevronsUpDown class="h-4 w-4 text-muted-foreground" />
        </RekaSelectTrigger>
        <RekaSelectPortal>
          <RekaSelectContent
            position="popper"
            class="z-50 rounded-xl border border-border bg-card shadow-lg"
          >
            <RekaSelectViewport class="max-h-[min(16rem,60dvh)] overflow-y-auto p-1">
              <RekaSelectItem
                v-for="cat in filteredCategories"
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
      <p v-if="filteredCategories.length === 0" class="mt-1 text-xs text-muted-foreground">
        No categories for {{ form.type }} yet. Add some in Categories first.
      </p>
    </div>

    <!-- Where / description -->
    <div>
      <Label for="description" class="mb-1.5 block text-sm font-medium">
        Where / note <span class="text-muted-foreground">(optional)</span>
      </Label>
      <input
        id="description"
        v-model="form.description"
        type="text"
        placeholder="e.g. Lidl, Renfe, Netflix"
        class="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      />
    </div>

    <div class="grid gap-3 min-[400px]:grid-cols-2">
      <!-- Date -->
      <div>
        <Label for="date" class="mb-1.5 block text-sm font-medium">Date</Label>
        <div
          class="relative flex w-full items-center gap-2 rounded-xl border border-border bg-background px-3 py-2.5 outline-none transition focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/30"
        >
          <CalendarDays class="h-4 w-4 shrink-0 text-muted-foreground" />
          <span
            class="flex-1 text-sm tabular-nums"
            :class="form.occurredOn ? 'text-foreground' : 'text-muted-foreground'"
          >
            {{ form.occurredOn ? formatDate(form.occurredOn) : 'dd.mm.yyyy' }}
          </span>
          <ChevronDown class="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            id="date"
            v-model="form.occurredOn"
            type="date"
            :max="todayISO()"
            aria-label="Date"
            class="absolute inset-0 h-full w-full cursor-pointer bg-transparent opacity-0 dark:[color-scheme:dark]"
            @click="openDatePicker"
          />
        </div>
      </div>

      <!-- Recurrence -->
      <div>
        <Label class="mb-1.5 block text-sm font-medium">Recurring</Label>
        <button
          type="button"
          role="switch"
          :aria-checked="form.frequency === 'monthly'"
          class="flex w-full items-center justify-between gap-2 rounded-xl border border-border px-3 py-2.5"
          @click="form.frequency = form.frequency === 'monthly' ? 'one_time' : 'monthly'"
        >
          <span class="min-w-0 flex-1 truncate text-left text-sm text-foreground">{{ form.frequency === 'monthly' ? 'Monthly' : 'One-time' }}</span>
          <span
            class="relative h-6 w-11 shrink-0 rounded-full transition"
            :class="form.frequency === 'monthly' ? 'bg-brand-600' : 'bg-muted'"
          >
            <span
              class="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
              :class="form.frequency === 'monthly' ? 'left-[22px]' : 'left-0.5'"
            />
          </span>
        </button>
      </div>
    </div>

    <p v-if="error" class="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
      {{ error }}
    </p>

    <div class="flex gap-3">
      <button
        type="button"
        class="flex-1 rounded-xl border border-border py-3 font-semibold text-muted-foreground transition hover:bg-muted"
        @click="$emit('cancel')"
      >
        Cancel
      </button>
      <button
        type="button"
        :disabled="saving"
        class="flex-1 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        @click="save"
      >
        {{ saving ? 'Saving…' : isEditing ? 'Save changes' : 'Add' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CalendarDays, Check, ChevronDown, ChevronsUpDown, Sparkles } from 'lucide-vue-next'
import { Label } from 'reka-ui'
import {
  SelectRoot as RekaSelect,
  SelectTrigger as RekaSelectTrigger,
  SelectValue as RekaSelectValue,
  SelectPortal as RekaSelectPortal,
  SelectContent as RekaSelectContent,
  SelectViewport as RekaSelectViewport,
  SelectItem as RekaSelectItem,
  SelectItemText as RekaSelectItemText,
  SelectItemIndicator as RekaSelectItemIndicator,
} from 'reka-ui'
import type { TransactionRow, CategoryRow } from '~/types/transactions'

const props = defineProps<{
  transaction?: TransactionRow | null
  categories: CategoryRow[]
}>()

const emit = defineEmits<{
  saved: []
  cancel: []
}>()

const supabase = useSupabase()
const { workspace } = useWorkspace()
const { user } = useAuth()
const { createRule } = useApplePay()

const isEditing = computed(() => !!props.transaction)
const isReviewable = computed(
  () => isEditing.value && (props.transaction?.source === 'apple_pay' || props.transaction?.source === 'receipt') && !!props.transaction.needs_review,
)
const setRule = ref(true)

const selectedCategoryName = computed(
  () => props.categories.find((c) => c.id === form.categoryId)?.name ?? '',
)

const form = reactive({
  type: 'expense' as 'expense' | 'income',
  amount: '' as string | number,
  categoryId: '',
  description: '',
  occurredOn: todayISO(),
  frequency: 'one_time' as 'one_time' | 'monthly',
})

const saving = ref(false)
const error = ref<string | null>(null)

function openDatePicker(e: Event) {
  const el = e.currentTarget as HTMLInputElement
  try {
    el.showPicker?.()
  } catch {
    /* keyboard/interaction edge cases: fall back to native click behaviour */
  }
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  const next = sanitizeAmountInput(el.value)
  if (el.value !== next) {
    el.value = next
  }
  form.amount = next
}

const filteredCategories = computed(() => props.categories.filter((c) => c.type === form.type))

watch(
  () => form.type,
  () => {
    if (!filteredCategories.value.some((c) => c.id === form.categoryId)) {
      form.categoryId = filteredCategories.value[0]?.id ?? ''
    }
  },
)

if (props.transaction) {
  const t = props.transaction
  form.type = t.type as 'expense' | 'income'
  form.amount = t.amount
  form.categoryId = t.category_id
  form.description = t.description ?? ''
  form.occurredOn = t.occurred_on
  form.frequency = t.frequency as 'one_time' | 'monthly'
} else {
  form.amount = ''
  form.categoryId = filteredCategories.value[0]?.id ?? ''
}

async function save() {
  error.value = null

  const amount = parseAmount(form.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    error.value = 'Please enter a valid amount.'
    return
  }
  if (!form.categoryId) {
    error.value = 'Please choose a category.'
    return
  }
  if (!workspace.value) {
    error.value = 'No workspace selected.'
    return
  }
  if (!user.value) {
    error.value = 'Not signed in.'
    return
  }

  saving.value = true

  const payload = {
    type: form.type,
    amount,
    category_id: form.categoryId,
    description: form.description.trim() || null,
    occurred_on: form.occurredOn,
    frequency: form.frequency,
  }

  if (isEditing.value && props.transaction) {
    const payloadWithReview = {
      ...payload,
      needs_review: false,
    }
    const { error: err } = await supabase.from('transactions').update(payloadWithReview).eq('id', props.transaction.id)
    if (err) {
      error.value = err.message
      saving.value = false
      return
    }
    if (setRule.value && form.description.trim()) {
      const { error: ruleErr } = await createRule(form.description.trim(), form.categoryId)
      if (ruleErr) error.value = ruleErr.message
    }
    emit('saved')
  } else {
    const { error: err } = await supabase.from('transactions').insert({
      ...payload,
      workspace_id: workspace.value.id,
      user_id: user.value.id,
    })
    if (err) error.value = err.message
    else emit('saved')
  }

  saving.value = false
}
</script>
