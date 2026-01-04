<template>
  <div>
    <h2>TIMER TERAPIS</h2>
    <div v-for="t in timers" :key="t.id" :class="timerColor(t)">
      {{ t.therapist_name }} - {{ remaining(t) }} menit
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"
import { io } from "socket.io-client"

const timers = ref([])
const socket = io("http://localhost:4000")

onMounted(async () => {
  timers.value = (await api.get("/timers/active")).data
  socket.on("timer:update", () => refresh())
})

const refresh = async () => {
  timers.value = (await api.get("/timers/active")).data
}

const remaining = t =>
  Math.max(0, Math.floor((new Date(t.end_time) - Date.now()) / 60000))

const timerColor = t => {
  const r = remaining(t)
  if (r > 30) return "green"
  if (r > 10) return "yellow"
  return "red"
}
</script>
