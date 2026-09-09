<script setup lang="ts">
import { ChevronLeft, ChevronRight, Plus } from 'lucide-vue-next'

const props = withDefaults(
  defineProps<{
    title: string
    variant?: 'brand' | 'alt'
    monthControl?: boolean
    actionLabel?: string | null
    actionDisabled?: boolean
  }>(),
  {
    variant: 'brand',
    monthControl: true,
    actionLabel: null,
    actionDisabled: false,
  },
)

const month = defineModel<string>('month', { default: () => monthKey(new Date()) })

const emit = defineEmits<{ action: [] }>()

const todayKey = computed(() => monthKey(new Date()))

const variantClasses = {
  brand: {
    card: 'bg-gradient-to-br from-brand-600 to-brand-800',
    actionText: 'text-brand-700',
  },
  alt: {
    card: 'bg-gradient-to-br from-slate-800 to-slate-950',
    actionText: 'text-slate-800',
  },
}

function shiftMonth(delta: number) {
  const key = month.value
  const y = Number(key.slice(0, 4))
  const m = Number(key.slice(5, 7))
  month.value = monthKey(new Date(y, m - 1 + delta, 1))
}
</script>

<template>
  <section class="overflow-hidden rounded-2xl p-5 text-white" :class="variantClasses[variant].card">
    <div class="flex items-center justify-between gap-2">
      <p class="text-xs font-semibold uppercase tracking-wide text-white/70">{{ title }}</p>
      <div v-if="monthControl" class="flex items-center gap-1">
        <button
          aria-label="Previous month"
          class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          @click="shiftMonth(-1)"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <span class="min-w-[3.6rem] text-center text-xs font-semibold uppercase tracking-wider">{{ monthLabelShort(month) }}</span>
        <button
          aria-label="Next month"
          class="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
          @click="shiftMonth(1)"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
        <button
          v-if="month !== todayKey"
          class="ml-1 rounded-full bg-white/15 px-2 py-1 text-[11px] font-medium transition hover:bg-white/25"
          @click="month = todayKey"
        >
          Today
        </button>
      </div>
    </div>

    <div class="mt-4"><slot /></div>

    <button
      v-if="actionLabel"
      class="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white py-3.5 text-base font-semibold shadow-sm transition hover:bg-white/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
      :class="variantClasses[variant].actionText"
      :disabled="actionDisabled"
      @click="emit('action')"
    >
      <Plus class="h-5 w-5 stroke-[2.5]" />
      {{ actionLabel }}
    </button>
  </section>
</template>