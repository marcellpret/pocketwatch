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
    <section class="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-1.5">
          <button
            aria-label="Previous month"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            @click="shiftMonth(-1)"
          >
            <ChevronLeft class="h-5 w-5" />
          </button>
          <span class="text-sm font-medium">{{ monthLabel(currentMonth) }}</span>
          <button
            aria-label="Next month"
            class="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            @click="shiftMonth(1)"
          >
            <ChevronRight class="h-5 w-5" />
          </button>
        </div>
        <button
          v-if="currentMonth !== todayKey"
          class="text-xs font-medium underline-offset-2 hover:underline"
          @click="currentMonth = todayKey"
        >
          Today
        </button>
      </div>

      <p class="mt-4 text-xs uppercase tracking-wide text-white/70">Balance</p>
      <p class="text-3xl font-bold">{{ formatAmount(balance) }}</p>

      <div class="mt-5 grid grid-cols-2 gap-3">
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
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

const supabase = useSupabase()
const { workspace, categories, loadWorkspaces, loadCategories } = useWorkspace()
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

function shiftMonth(delta: number) {
  const key = currentMonth.value
  const y = Number(key.slice(0, 4))
  const m = Number(key.slice(5, 7))
  currentMonth.value = monthKey(new Date(y, m - 1 + delta, 1))
}

async function acceptInvite(invite: (typeof myPendingInvites.value)[number]) {
  await accept(invite)
  if (workspace.value) {
    await loadCategories()
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
    await loadTransactions()
  } else {
    await loadMyPendingInvites()
  }
  loading.value = false
})
</script>
