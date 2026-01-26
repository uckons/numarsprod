<template>
  <div class="min-h-screen p-5 md:p-8 bg-bg-main">
    <h2 class="text-2xl md:text-3xl font-bold text-gold mb-6">SUPERVISOR DASHBOARD</h2>

    <h3 class="text-xl font-semibold mb-4 text-white">Timer Terapis Aktif</h3>
    <div v-for="t in timers" :key="t.id" :class="timerClass(t)" class="mb-2 p-2 rounded font-medium">
      {{ t.therapist_name }} —
      {{ remaining(t) }} menit
    </div>

    <h3 class="text-xl font-semibold mt-8 mb-4 text-white">Order Hari Ini</h3>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <tr class="border-b border-gray-700">
          <th class="text-left p-2 md:p-3 text-gold">ID</th>
          <th class="text-left p-2 md:p-3 text-gold">Status</th>
          <th class="text-left p-2 md:p-3 text-gold">Total</th>
        </tr>
        <tr v-for="o in orders" :key="o.id" class="border-b border-gray-800 hover:bg-bg-soft transition-colors">
          <td class="p-2 md:p-3">#{{ o.id }}</td>
          <td class="p-2 md:p-3">{{ o.status }}</td>
          <td class="p-2 md:p-3">Rp {{ format(o.total) }}</td>
        </tr>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"
import { io } from "socket.io-client"

const timers = ref([])
const orders = ref([])

const socket = io("http://localhost:4000")

const load = async () => {
  timers.value = (await api.get("/timers/active")).data
  orders.value = (await api.get("/orders")).data
}

onMounted(() => {
  load()
  socket.on("timer:update", load)
})

const remaining = t =>
  Math.max(0, Math.floor((new Date(t.end_time) - Date.now()) / 60000))

const timerClass = t => {
  const r = remaining(t)
  if (r > 30) return "text-success"
  if (r > 10) return "text-warn"
  return "text-danger"
}

const format = v => v.toLocaleString()
</script>


