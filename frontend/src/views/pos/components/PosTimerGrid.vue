<template>
  <div class="timer-grid">
    <PosTimerCard
      v-for="t in timers"
      :key="t.id"
      :timer="t"
    />
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue"
import api from "@/services/api"
import PosTimerCard from "./PosTimerCard.vue"

const timers = ref([])

const loadTimers = async () => {
  const res = await api.get("/timers/active")
  timers.value = res.data || []
}

onMounted(() => {
  loadTimers()
  setInterval(loadTimers, 60_000) // refresh tiap menit
})
</script>

<style scoped>
.timer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
</style>
