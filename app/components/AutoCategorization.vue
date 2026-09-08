<template>
  <section class="rounded-2xl border border-border bg-card p-5">
    <h2 class="mb-1 font-semibold">Auto-categorization</h2>
    <p class="mb-4 text-sm text-muted-foreground">
      Apple Pay purchases are matched to a category by merchant name. If nothing matches, the purchase lands in your "Other"-type expense category.
    </p>

    <form class="mb-4 flex flex-wrap gap-2" @submit.prevent="addRule">
      <input
        v-model="match"
        type="text"
        required
        placeholder="Merchant text, e.g. Lidl"
        class="min-w-0 flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      />
      <select
        v-model="categoryId"
        required
        class="rounded-xl border border-border bg-background px-3 py-2.5 text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
      >
        <option v-for="c in expenseCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
      </select>
      <button
        type="submit"
        :disabled="adding || !expenseCategories.length"
        class="shrink-0 rounded-xl bg-brand-600 px-4 py-2.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {{ adding ? 'Adding…' : 'Add rule' }}
      </button>
    </form>
    <p v-if="ruleError" class="mb-3 text-xs text-rose-500">{{ ruleError }}</p>

    <div v-if="rules.length" class="space-y-1.5">
      <div
        v-for="r in rules"
        :key="r.id"
        class="flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2 text-sm"
      >
        <span class="min-w-0 truncate">
          contains <b class="font-medium">"{{ r.match }}"</b>
          <span class="mx-1 text-muted-foreground">→</span>
          <span class="inline-flex items-center gap-1.5">
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :style="{ backgroundColor: categoryColor(r.category_id) }"
            />
            {{ categoryName(r.category_id) }}
          </span>
        </span>
        <button
          type="button"
          aria-label="Delete rule"
          class="shrink-0 rounded-lg p-1 text-muted-foreground transition hover:bg-rose-500/10 hover:text-rose-500"
          @click="deleteRule(r.id)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>
    <p v-else class="text-xs text-muted-foreground">
      No rules yet — every Apple Pay purchase falls back to your "Other" category until you add one.
    </p>

    <template v-if="unmatched.length">
      <p class="mb-1.5 mt-5 text-sm font-medium text-muted-foreground">From recent Apple Pay purchases</p>
      <div class="space-y-1.5">
        <div
          v-for="u in unmatched"
          :key="u.merchant"
          class="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm"
        >
          <span class="min-w-0 flex-1 truncate">
            {{ u.merchant }}
            <span class="text-xs text-muted-foreground">({{ u.count }}×, {{ formatDate(u.latest) }})</span>
          </span>
          <select
            v-model="suggestions[u.merchant]"
            class="rounded-xl border border-border bg-background px-2 py-1.5 text-sm text-foreground outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
          >
            <option value="" disabled>Category…</option>
            <option v-for="c in expenseCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <button
            type="button"
            :disabled="!suggestions[u.merchant]"
            class="shrink-0 rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            @click="addSuggested(u)"
          >
            Add rule
          </button>
        </div>
      </div>
    </template>
  </section>
</template>

<script setup lang="ts">
import { Trash2 } from 'lucide-vue-next'

type RecentMerchant = {
  merchant: string
  count: number
  latest: string
}

const { workspace, categories, loadCategories } = useWorkspace()
const { rules, loadRules, createRule, deleteRule, recentUnmatchedMerchants } = useApplePay()

const match = ref('')
const categoryId = ref('')
const adding = ref(false)
const ruleError = ref<string | null>(null)
const unmatched = ref<RecentMerchant[]>([])
const suggestions = reactive<Record<string, string>>({})

const expenseCategories = computed(() => categories.value.filter((c) => c.type === 'expense'))

function categoryName(id: string) {
  return categories.value.find((c) => c.id === id)?.name ?? 'Unknown'
}

function categoryColor(id: string) {
  return categories.value.find((c) => c.id === id)?.color ?? '#94a3b8'
}

async function refresh() {
  unmatched.value = await recentUnmatchedMerchants()
}

async function load() {
  if (!workspace.value) return
  await Promise.all([loadCategories(), loadRules()])
  await refresh()
}

watch(
  () => workspace.value?.id,
  () => load(),
  { immediate: true },
)

async function addRule() {
  ruleError.value = null
  if (!match.value.trim() || !categoryId.value) return
  adding.value = true
  const { error } = await createRule(match.value, categoryId.value)
  adding.value = false
  if (error) {
    ruleError.value = error.message
    return
  }
  match.value = ''
  await refresh()
}

async function addSuggested(u: RecentMerchant) {
  const cat = suggestions[u.merchant]
  if (!cat) return
  const { error } = await createRule(u.merchant, cat)
  if (error) {
    ruleError.value = error.message
    return
  }
  delete suggestions[u.merchant]
  await refresh()
}
</script>