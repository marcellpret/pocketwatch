<template>
  <button
    type="button"
    class="flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition"
    :class="
      needsReview
        ? 'border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/10'
        : 'border-border bg-card hover:bg-muted/60'
    "
    @click="$emit('click', transaction)"
  >
    <span
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
      :style="{ backgroundColor: catColor + '22', color: catColor }"
    >
      <component :is="isIncome ? ArrowDownLeft : ArrowUpRight" class="h-5 w-5" />
    </span>

    <div class="min-w-0 flex-1">
      <p class="truncate text-sm font-medium text-foreground">
        {{ transaction.description || categoryName || 'Transaction' }}
      </p>
      <p class="truncate text-xs text-muted-foreground">
        {{ categoryName }}<span v-if="categoryName && isFixed"> · </span>
        <span v-if="isFixed" class="font-medium text-muted-foreground">recurring</span>
        <span
          v-if="needsReview"
          class="ml-1 inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400"
        >
          <Sparkles class="h-3 h-3" />
          Needs review
        </span>
      </p>
    </div>

    <div class="text-right">
      <p
        class="text-sm font-semibold tabular-nums"
        :class="isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'"
      >
        {{ isIncome ? '+' : '−' }}{{ formatAmount(transaction.amount) }}
      </p>
      <p class="text-xs text-muted-foreground">
        {{ formatDate(transaction.occurred_on) }}
      </p>
    </div>
  </button>
</template>

<script setup lang="ts">
import { ArrowDownLeft, ArrowUpRight, Sparkles } from 'lucide-vue-next'
import type { TransactionRow } from '~/types/transactions'

const props = defineProps<{
  transaction: TransactionRow
  categoryName?: string
  categoryColor?: string | null
}>()

defineEmits<{ click: [t: TransactionRow] }>()

const isIncome = computed(() => props.transaction.type === 'income')
const isFixed = computed(() => props.transaction.frequency === 'monthly')
const needsReview = computed(() => !!props.transaction.needs_review)
const catColor = computed(() => props.categoryColor || '#6b7280')
</script>