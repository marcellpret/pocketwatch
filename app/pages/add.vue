<template>
  <div class="max-w-md">
    <div class="mb-5">
      <h1 class="text-xl font-semibold">{{ isEditing ? 'Edit transaction' : 'Add transaction' }}</h1>
      <p class="text-sm text-muted-foreground">
        {{ isEditing ? 'Update the details below.' : 'Quickly record what you spent or earned.' }}
      </p>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="h-40 animate-pulse rounded-2xl bg-muted" />
    </div>

    <div v-else class="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <TransactionForm
        :transaction="editingTransaction"
        :categories="categories"
        @saved="onSaved"
        @cancel="onCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useHousehold } from '~/composables/useHousehold'
import type { TransactionRow } from '~/types/transactions'

const route = useRoute()
const supabase = useSupabase()

const { household, categories, loadHousehold, loadCategories } = useHousehold()

const editingTransaction = ref<TransactionRow | null>(null)
const loading = ref(true)

const isEditing = computed(() => !!route.query.edit)

onMounted(async () => {
  loading.value = true
  await loadHousehold()
  if (household.value) {
    await loadCategories()
    const id = route.query.edit as string | undefined
    if (id) {
      const { data } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      editingTransaction.value = data
    }
  }
  loading.value = false
})

function onSaved() {
  navigateTo('/')
}

function onCancel() {
  navigateTo('/transactions')
}
</script>
