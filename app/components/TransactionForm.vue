<template>
  <div class="space-y-5">
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
          v-model="form.amount"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          placeholder="0.00"
          class="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-lg font-semibold tabular-nums text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
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
          <RekaSelectContent class="z-50 rounded-xl border border-border bg-card p-1 shadow-lg">
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

    <div class="grid grid-cols-2 gap-3">
      <!-- Date -->
      <div>
        <Label for="date" class="mb-1.5 block text-sm font-medium">Date</Label>
        <input
          id="date"
          v-model="form.occurredOn"
          type="date"
          :max="todayISO()"
          class="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      <!-- Recurrence -->
      <div>
        <Label class="mb-1.5 block text-sm font-medium">Recurring</Label>
        <button
          type="button"
          role="switch"
          :aria-checked="form.frequency === 'monthly'"
          class="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2.5"
          @click="form.frequency = form.frequency === 'monthly' ? 'one_time' : 'monthly'"
        >
          <span class="text-sm text-foreground">{{ form.frequency === 'monthly' ? 'Monthly' : 'One-time' }}</span>
          <span
            class="relative h-6 w-11 rounded-full transition"
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
import { Check, ChevronsUpDown } from 'lucide-vue-next'
import { Label } from 'reka-ui'
import {
  SelectRoot as RekaSelect,
  SelectTrigger as RekaSelectTrigger,
  SelectValue as RekaSelectValue,
  SelectPortal as RekaSelectPortal,
  SelectContent as RekaSelectContent,
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
const { household } = useHousehold()
const { user } = useAuth()

const isEditing = computed(() => !!props.transaction)

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

  const amount = Number(form.amount)
  if (!amount || amount <= 0) {
    error.value = 'Please enter a valid amount.'
    return
  }
  if (!form.categoryId) {
    error.value = 'Please choose a category.'
    return
  }
  if (!household.value) {
    error.value = 'No household found.'
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
    const { error: err } = await supabase.from('transactions').update(payload).eq('id', props.transaction.id)
    if (err) error.value = err.message
    else emit('saved')
  } else {
    const { error: err } = await supabase.from('transactions').insert({
      ...payload,
      household_id: household.value.id,
      user_id: user.value.id,
    })
    if (err) error.value = err.message
    else emit('saved')
  }

  saving.value = false
}
</script>
