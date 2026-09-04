<template>
  <div>
    <div class="mb-4 flex items-center justify-between">
      <h1 class="text-xl font-semibold">Categories</h1>
      <button
        class="flex items-center gap-1 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        @click="openAdd"
      >
        <Plus class="h-4 w-4" /> Add
      </button>
    </div>

    <div class="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
      <button
        v-for="t in ['expense', 'income']"
        :key="t"
        class="rounded-lg py-2 text-sm font-semibold transition"
        :class="activeType === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'"
        @click="activeType = t"
      >
        {{ t === 'expense' ? 'Expenses' : 'Income' }}
      </button>
    </div>

    <div v-if="visibleCategories.length === 0" class="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      No {{ activeType }} categories yet.
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="cat in visibleCategories"
        :key="cat.id"
        class="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
      >
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" :style="{ backgroundColor: (cat.color || '#9ca3af') + '22' }">
          <span class="h-4 w-4 rounded-full" :style="{ backgroundColor: cat.color || '#9ca3af' }" />
        </span>
        <span class="flex-1 text-sm font-medium">{{ cat.name }}</span>
        <button
          aria-label="Rename category"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition hover:bg-muted"
          @click="openEdit(cat)"
        >
          <Pencil class="h-4 w-4" />
        </button>
        <button
          aria-label="Delete category"
          class="flex h-8 w-8 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-500/10"
          @click="confirmDelete(cat)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>
    </div>

    <CategoryDialog v-model:open="dialogOpen" :category="dialogCategory" :type="activeType" @saved="reload" />
  </div>
</template>

<script setup lang="ts">
import { Plus, Pencil, Trash2 } from 'lucide-vue-next'
import type { Database } from '~/types/database'

type CategoryRow = Database['public']['Tables']['categories']['Row']

const supabase = useSupabase()
const { workspace, categories, loadWorkspaces, loadCategories } = useWorkspace()

const activeType = ref<'expense' | 'income'>('expense')
const dialogOpen = ref(false)
const dialogCategory = ref<CategoryRow | 'new' | null>(null)

const visibleCategories = computed(() => categories.value.filter((c) => c.type === activeType.value))

function openAdd() {
  dialogCategory.value = 'new'
  dialogOpen.value = true
}

function openEdit(cat: CategoryRow) {
  dialogCategory.value = cat
  dialogOpen.value = true
}

function confirmDelete(cat: CategoryRow) {
  if (confirm(`Delete "${cat.name}"?`)) {
    deleteCategory(cat)
  }
}

async function deleteCategory(cat: CategoryRow) {
  const { error } = await supabase.from('categories').delete().eq('id', cat.id)
  if (!error) await reload()
}

async function reload() {
  await loadCategories()
}

onMounted(async () => {
  await loadWorkspaces()
  if (workspace.value) await loadCategories()
})
</script>
