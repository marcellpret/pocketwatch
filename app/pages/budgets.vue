<template>
  <div v-if="loading" class="space-y-4 pt-4">
    <div class="h-40 animate-pulse rounded-2xl bg-muted" />
    <div class="h-24 animate-pulse rounded-2xl bg-muted" />
  </div>

  <div v-else-if="!workspace" class="pt-10 text-center text-sm text-muted-foreground">
    Create or join a workspace to set budgets.
  </div>

  <div v-else>
    <SummaryCard
      v-if="budgetedRows.length > 0"
      class="mb-5"
      v-model:month="currentMonth"
      variant="alt"
      title="Budgeted this month"
      action-label="Add budget"
      :action-disabled="!canAdd"
      @action="openAdd"
    >
      <p class="text-3xl font-bold">{{ formatAmount(totalBudget) }}</p>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-white/10 p-3">
          <p class="text-xs text-white/70">Spent</p>
          <p class="mt-0.5 flex items-center gap-1 font-semibold text-rose-300">
            <TrendingDown class="h-4 w-4" /> {{ formatAmount(totalSpent) }}
          </p>
        </div>
        <div class="rounded-xl bg-white/10 p-3">
          <p class="text-xs text-white/70">{{ remaining >= 0 ? 'Left' : 'Over' }}</p>
          <p class="mt-0.5 flex items-center gap-1 font-semibold" :class="remaining >= 0 ? 'text-emerald-300' : 'text-rose-300'">
            <Wallet class="h-4 w-4" /> {{ formatAmount(Math.abs(remaining)) }}
          </p>
        </div>
      </div>

      <div class="mt-4 h-2 overflow-hidden rounded-full bg-white/15">
        <div
          class="h-full rounded-full transition-all"
          :class="remaining >= 0 ? 'bg-emerald-300' : 'bg-rose-300'"
          :style="{ width: `${totalPercent}%` }"
        />
      </div>
    </SummaryCard>

    <div
      v-if="expenseCategories.length === 0"
      class="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground"
    >
      No expense categories yet.
      <NuxtLink to="/categories" class="font-medium text-brand-600 hover:underline">Add some →</NuxtLink>
    </div>

    <div v-else-if="budgetedRows.length === 0" class="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      No budgets yet. Tap "Add budget" to set how much you want to spend on a category each month.
    </div>

    <div v-else class="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {{ budgetedRows.length }} of {{ expenseCategories.length }} categories budgeted
    </div>

    <div class="space-y-2">
      <div
        v-for="row in budgetedRows"
        :key="row.category.id"
        class="rounded-2xl border border-border bg-card p-4"
      >
        <div class="flex items-center gap-3">
          <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" :style="{ backgroundColor: (row.category.color || '#9ca3af') + '22' }">
            <span class="h-3.5 w-3.5 rounded-full" :style="{ backgroundColor: row.category.color || '#9ca3af' }" />
          </span>
          <span class="flex-1 truncate text-sm font-medium">{{ row.category.name }}</span>
          <button
            aria-label="Edit budget"
            class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
            @click="openEdit(row.category)"
          >
            <Pencil class="h-4 w-4" />
          </button>
        </div>

        <template v-if="row.budget !== undefined">
          <div class="mt-3 flex items-end justify-between">
            <p class="text-sm">
              <span class="font-semibold tabular-nums">{{ formatAmount(row.spent) }}</span>
              <span class="text-muted-foreground"> of {{ formatAmount(row.budget) }}</span>
            </p>
            <p class="flex items-center gap-1 text-xs font-medium tabular-nums" :class="row.spent > row.budget ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'">
              <AlertTriangle v-if="row.spent > row.budget" class="h-3.5 w-3.5" />
              {{ row.spent > row.budget ? `Over by ${formatAmount(row.spent - row.budget)}` : `${formatAmount(row.budget - row.spent)} left` }}
            </p>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div
              class="h-full rounded-full transition-all"
              :class="row.spent > row.budget ? 'bg-rose-500' : 'bg-emerald-500'"
              :style="{ width: `${percent(row.spent, row.budget)}%` }"
            />
          </div>
        </template>
      </div>
    </div>

    <BudgetDialog v-model:open="dialogOpen" :budget="dialogBudget" :category="dialogCategory" @saved="reloadBudgets" />
  </div>
</template>

<script setup lang="ts">
import { TrendingDown, Wallet, Pencil, AlertTriangle } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type BudgetRow = Database['public']['Tables']['budgets']['Row']

const supabase = useSupabase()
const { workspace, categories, loadWorkspaces, loadCategories } = useWorkspace()
const { budgets, loadBudgets } = useBudgets()

const loading = ref(true)
const transactions = ref<TransactionRow[]>([])
const todayKey = computed(() => monthKey(new Date()))
const currentMonth = ref(todayKey.value)

const dialogOpen = ref(false)
const dialogCategory = ref<CategoryRow | null>(null)
const dialogBudget = ref<BudgetRow | 'new' | null>(null)

const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))

const monthSpent = computed(() => {
  const map = new Map<string, number>()
  for (const t of transactions.value) {
    if (t.type !== 'expense') continue
    if (monthKey(new Date(t.occurred_on)) !== currentMonth.value) continue
    map.set(t.category_id, (map.get(t.category_id) ?? 0) + t.amount)
  }
  return map
})

const budgetMap = computed(() => {
  const map = new Map<string, number>()
  for (const b of budgets.value) map.set(b.category_id, b.amount)
  return map
})

const rows = computed(() =>
  expenseCategories.value.map((category) => {
    const spent = monthSpent.value.get(category.id) ?? 0
    const budget = budgetMap.value.get(category.id)
    return { category, spent, budget }
  }),
)

const budgetedRows = computed(() => rows.value.filter((r) => r.budget !== undefined))

const canAdd = computed(() => expenseCategories.value.some((c) => !budgetMap.value.has(c.id)))

const totalBudget = computed(() => budgetedRows.value.reduce((sum, r) => sum + (r.budget ?? 0), 0))
const totalSpent = computed(() => budgetedRows.value.reduce((sum, r) => sum + r.spent, 0))
const remaining = computed(() => totalBudget.value - totalSpent.value)
const totalPercent = computed(() => percent(totalSpent.value, totalBudget.value))

function percent(spent: number, budget: number) {
  if (!budget || budget <= 0) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

function openEdit(category: CategoryRow) {
  dialogCategory.value = category
  dialogBudget.value = budgets.value.find((b) => b.category_id === category.id) ?? 'new'
  dialogOpen.value = true
}

function openAdd() {
  dialogCategory.value = null
  dialogBudget.value = 'new'
  dialogOpen.value = true
}

async function reloadBudgets() {
  await loadBudgets()
}

async function loadTransactions() {
  if (!workspace.value) return
  const { data } = await supabase.from('transactions').select('*').eq('workspace_id', workspace.value.id)
  transactions.value = data ?? []
}

onMounted(async () => {
  loading.value = true
  await loadWorkspaces()
  if (workspace.value) {
    await loadCategories()
    await loadBudgets()
    await loadTransactions()
  }
  loading.value = false
})
</script>