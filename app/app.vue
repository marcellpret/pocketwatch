<template>
  <div>
    <NuxtRouteAnnouncer />
    <h1>Instruments</h1>
    <ul>
      <li v-for="instrument in instruments" :key="instrument.id">
        {{ instrument.name }}
      </li>
    </ul>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
const supabase = useSupabase()
const instruments = ref<any[]>([])
const error = ref<string | null>(null)

onMounted(async () => {
  const { data, error: err } = await supabase
    .from('instruments')
    .select('*')

  if (err) {
    error.value = err.message
  } else {
    instruments.value = data ?? []
  }
})
</script>
