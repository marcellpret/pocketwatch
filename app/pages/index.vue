<template>
  <div v-if="loading" class="space-y-4 pt-4">
    <div class="h-44 animate-pulse rounded-2xl bg-muted" />
    <div class="h-24 animate-pulse rounded-2xl bg-muted" />
  </div>

  <div v-else-if="!workspace" class="flex flex-col items-center gap-4 pt-10 text-center">
    <div v-if="pendingInvite" class="w-full max-w-xs space-y-3 text-left">
      <div class="rounded-2xl border border-border bg-card p-5">
        <h2 class="mb-2 text-lg font-semibold">Invitation</h2>
        <p class="mb-4 text-sm text-muted-foreground">
          <strong>{{ pendingInvite.email.replace(/^(.*)@.*$/, '$1') }}</strong> invited you to join a
          workspace.
        </p>
        <div class="flex gap-2">
          <button
            class="flex-1 rounded-xl bg-brand-600 py-2.5 font-semibold text-white transition hover:bg-brand-700"
            @click="acceptInvite(pendingInvite)"
          >
            Accept
          </button>
          <button
            class="flex-1 rounded-xl border border-border bg-background py-2.5 font-semibold text-muted-foreground transition hover:bg-muted"
            @click="declineInvite(pendingInvite)"
          >
            Decline
          </button>
        </div>
      </div>
    </div>

    <template v-else>
      <span class="text-5xl">🕰️</span>
      <h2 class="text-xl font-semibold">Welcome to Pocketwatch!</h2>
      <p class="max-w-xs text-sm text-muted-foreground">
        You don't have a workspace yet. Create one, or join someone's workspace with their code.
      </p>
      <button
        class="mt-2 rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white transition hover:bg-brand-700"
        @click="navigateTo('/settings')"
      >
        Create workspace
      </button>
    </template>
  </div>

  <div v-else class="space-y-5">
    <SummaryCard
      v-model:month="currentMonth"
      title="Balance"
      action-label="Add entry"
      @action="navigateTo('/add')"
    >
      <p class="text-3xl font-bold">{{ formatAmount(balance) }}</p>

      <div class="mt-4 grid grid-cols-2 gap-3">
        <div class="rounded-xl bg-white/10 p-3">
          <p class="text-xs text-white/70">Income</p>
          <p class="mt-0.5 flex items-center gap-1 font-semibold text-emerald-300">
            <TrendingUp class="h-4 w-4" /> {{ formatAmount(income) }}
          </p>
        </div>
        <div class="rounded-xl bg-white/10 p-3">
          <p class="text-xs text-white/70">Spent</p>
          <p class="mt-0.5 flex items-center gap-1 font-semibold text-rose-300">
            <TrendingDown class="h-4 w-4" /> {{ formatAmount(spent) }}
          </p>
        </div>
      </div>
    </SummaryCard>

    <section>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-muted-foreground">Budgets this month</h3>
        <NuxtLink to="/budgets" class="text-sm font-medium text-slate-500 hover:underline">Manage</NuxtLink>
      </div>

      <div
        v-if="dashboardBudgetRows.length === 0"
        class="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
      >
        No budgets set yet.
        <NuxtLink to="/budgets" class="font-medium text-slate-500 hover:underline">Set budgets →</NuxtLink>
      </div>

      <div v-else class="rounded-2xl border border-border bg-card p-4">
        <div class="space-y-3">
          <div v-for="row in dashboardBudgetRows.slice(0, 4)" :key="row.categoryId" class="flex items-center gap-2">
            <span class="h-2.5 w-2.5 shrink-0 rounded-full" :style="{ backgroundColor: row.color || '#9ca3af' }" />
            <span class="min-w-0 flex-1 truncate text-sm">{{ row.name }}</span>
            <div class="h-1.5 w-24 shrink-0 overflow-hidden rounded-full bg-muted">
              <div
                class="h-full rounded-full transition-all"
                :class="row.spent > row.budget ? 'bg-rose-500' : 'bg-slate-400'"
                :style="{ width: `${percent(row.spent, row.budget)}%` }"
              />
            </div>
            <span class="shrink-0 text-xs tabular-nums text-muted-foreground">
              {{ formatAmount(row.spent) }} / {{ formatAmount(row.budget) }}
            </span>
          </div>
        </div>

        <p class="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
          Spent {{ formatAmount(dashboardTotalSpent) }} of {{ formatAmount(dashboardTotalBudget) }}
          <span :class="dashboardRemaining < 0 ? 'font-semibold text-rose-500' : 'font-semibold text-slate-600'">
            · {{ dashboardRemaining < 0 ? `Over by ${formatAmount(Math.abs(dashboardRemaining))}` : `${formatAmount(dashboardRemaining)} left` }}
          </span>
        </p>
      </div>
    </section>

    <section>
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-semibold text-muted-foreground">Recent activity</h3>
        <NuxtLink to="/transactions" class="text-sm font-medium text-brand-600 hover:underline">
          View all
        </NuxtLink>
      </div>

      <div
        v-if="recent.length === 0"
        class="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground"
      >
        No transactions this month yet.
        <NuxtLink to="/add" class="font-medium text-brand-600 hover:underline">Add one →</NuxtLink>
      </div>

      <div v-else class="space-y-2">
        <TransactionRow
          v-for="t in recent"
          :key="t.id"
          :transaction="t"
          :category-name="categoryById(t.category_id)?.name"
          :category-color="categoryById(t.category_id)?.color"
          @click="navigateTo({ path: '/add', query: { edit: t.id } })"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { TrendingUp, TrendingDown } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

const supabase = useSupabase()
const { workspace, categories, loadWorkspaces, loadCategories } = useWorkspace()
const { budgets, loadBudgets } = useBudgets()
const { myPendingInvites, loadMyPendingInvites, accept, decline } = useInvitations()

const loading = ref(true)
const transactions = ref<TransactionRow[]>([])
const todayKey = computed(() => monthKey(new Date()))
const currentMonth = ref(todayKey.value)

const monthTransactions = computed(() =>
  transactions.value.filter((t) => monthKey(new Date(t.occurred_on)) === currentMonth.value),
)

const income = computed(() =>
  monthTransactions.value.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
)
const spent = computed(() =>
  monthTransactions.value.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
)
const balance = computed(() => income.value - spent.value)

const recent = computed(() =>
  [...monthTransactions.value]
    .sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime())
    .slice(0, 8),
)

const categoryMap = computed(() => {
  const map = new Map<string, CategoryRow>()
  for (const c of categories.value) map.set(c.id, c)
  return map
})

function categoryById(id: string) {
  return categoryMap.value.get(id)
}

const categoryBudget = computed(() => {
  const map = new Map<string, number>()
  for (const c of categories.value) {
    if (c.type !== 'expense') continue
    const b = budgets.value.find((x) => x.category_id === c.id)
    if (b) map.set(c.id, b.amount)
  }
  return map
})

const dashboardBudgetRows = computed(() =>
  [...categoryBudget.value.entries()].map(([categoryId, budget]) => {
    const cat = categoryMap.value.get(categoryId)
    const spent = monthTransactions.value
      .filter((t) => t.type === 'expense' && t.category_id === categoryId)
      .reduce((sum, t) => sum + t.amount, 0)
    return { categoryId, budget, spent, name: cat?.name ?? 'Unknown', color: cat?.color ?? null }
  }),
)

const dashboardTotalBudget = computed(() =>
  dashboardBudgetRows.value.reduce((sum, r) => sum + r.budget, 0),
)
const dashboardTotalSpent = computed(() =>
  dashboardBudgetRows.value.reduce((sum, r) => sum + r.spent, 0),
)
const dashboardRemaining = computed(() => dashboardTotalBudget.value - dashboardTotalSpent.value)

function percent(spent: number, budget: number) {
  if (!budget || budget <= 0) return 0
  return Math.min(100, Math.round((spent / budget) * 100))
}

async function acceptInvite(invite: (typeof myPendingInvites.value)[number]) {
  await accept(invite)
  if (workspace.value) {
    await loadCategories()
    await loadBudgets()
    await loadTransactions()
  }
}

async function declineInvite(invite: (typeof myPendingInvites.value)[number]) {
  await decline(invite)
}

const pendingInvite = computed(() => myPendingInvites.value[0] ?? null)

async function loadTransactions() {
  if (!workspace.value) return
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('workspace_id', workspace.value.id)
  transactions.value = data ?? []
}

onMounted(async () => {
  loading.value = true
  await loadWorkspaces()
  if (workspace.value) {
    await loadCategories()
    await loadBudgets()
    await loadTransactions()
  } else {
    await loadMyPendingInvites()
  }
  loading.value = false
})
</script>
