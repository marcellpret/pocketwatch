<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold">Activity</h1>
      <button
        class="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        @click="navigateTo('/add')"
      >
        Add
      </button>
    </div>

    <!-- Filters -->
    <div class="flex gap-2 overflow-x-auto pb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        v-for="f in typeFilters"
        :key="f.value"
        class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition"
        :class="activeType === f.value ? 'bg-brand-600 text-white' : 'border border-border bg-card text-muted-foreground'"
        @click="activeType = f.value"
      >
        {{ f.label }}
      </button>
    </div>

    <!-- Month picker -->
    <div class="mb-4 mt-3 flex items-center gap-2">
      <button
        aria-label="Previous month"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted"
        @click="shiftMonth(-1)"
      >
        <ChevronLeft class="h-4 w-4" />
      </button>
      <button
        class="flex h-9 flex-1 items-center justify-center gap-1 rounded-xl border border-border bg-card text-sm font-medium"
        @click="showMonthPicker = !showMonthPicker"
      >
        {{ monthLabel(currentMonth) }}
        <Calendar class="h-4 w-4 text-muted-foreground" />
      </button>
      <button
        aria-label="Next month"
        class="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card transition hover:bg-muted"
        @click="shiftMonth(1)"
      >
        <ChevronRight class="h-4 w-4" />
      </button>
    </div>

    <input
      v-if="showMonthPicker"
      v-model="currentMonth"
      type="month"
      class="mb-4 w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm"
    />

    <!-- Category filter -->
    <div class="mb-4 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition"
        :class="!activeCategory ? 'bg-brand-600 text-white' : 'border border-border bg-card text-muted-foreground'"
        @click="activeCategory = ''"
      >
        All
      </button>
      <button
        v-for="cat in categoriesForFilter"
        :key="cat.id"
        class="shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition"
        :class="activeCategory === cat.id ? 'bg-brand-600 text-white' : 'border border-border bg-card text-muted-foreground'"
        @click="activeCategory = activeCategory === cat.id ? '' : cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- List -->
    <div v-if="filtered.length === 0" class="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
      No transactions for this view.
    </div>

    <div v-else class="space-y-2">
      <TransactionRow
        v-for="t in filtered"
        :key="t.id"
        :transaction="t"
        :category-name="categoryById(t.category_id)?.name"
        :category-color="categoryById(t.category_id)?.color"
        @click="navigateTo({ path: '/add', query: { edit: t.id } })"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type TransactionRow = Database['public']['Tables']['transactions']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']

const supabase = useSupabase()
const { household, categories, loadHousehold, loadCategories } = useHousehold()

const todayKey = computed(() => monthKey(new Date()))
const transactions = ref<TransactionRow[]>([])
const currentMonth = ref(todayKey.value)
const activeType = ref<'all' | 'expense' | 'income'>('all')
const activeCategory = ref('')
const showMonthPicker = ref(false)

const typeFilters: { value: 'all' | 'expense' | 'income'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
]

const categoryMap = computed(() => {
  const map = new Map<string, CategoryRow>()
  for (const c of categories.value) map.set(c.id, c)
  return map
})

function categoryById(id: string) {
  return categoryMap.value.get(id)
}

const categoriesForFilter = computed(() =>
  categories.value.filter((c) => (activeType.value === 'all' ? true : c.type === activeType.value)),
)

const filtered = computed(() =>
  transactions.value
    .filter((t) => monthKey(new Date(t.occurred_on)) === currentMonth.value)
    .filter((t) => (activeType.value === 'all' ? true : t.type === activeType.value))
    .filter((t) => (activeCategory.value ? t.category_id === activeCategory.value : true))
    .sort((a, b) => new Date(b.occurred_on).getTime() - new Date(a.occurred_on).getTime()),
)

function shiftMonth(delta: number) {
  const key = currentMonth.value
  const y = Number(key.slice(0, 4))
  const m = Number(key.slice(5, 7))
  currentMonth.value = monthKey(new Date(y, m - 1 + delta, 1))
}

async function loadTransactions() {
  if (!household.value) return
  const { data } = await supabase
    .from('transactions')
    .select('*')
    .eq('household_id', household.value.id)
  transactions.value = data ?? []
}

onMounted(async () => {
  await loadHousehold()
  if (household.value) {
    await loadCategories()
    await loadTransactions()
  }
})
</script>
