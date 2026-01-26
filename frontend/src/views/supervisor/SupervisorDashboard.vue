<template>
  <div class="page">
    <h2>SUPERVISOR DASHBOARD</h2>

    <h3>Timer Terapis Aktif</h3>
    <div v-for="t in timers" :key="t.id" :class="timerClass(t)">
      {{ t.therapist_name }} —
      {{ remaining(t) }} menit
    </div>

    <h3>Order Hari Ini</h3>
    <table>
      <tr>
        <th>ID</th>
        <th>Status</th>
        <th>Total</th>
      </tr>
      <tr v-for="o in orders" :key="o.id">
        <td>#{{ o.id }}</td>
        <td>{{ o.status }}</td>
        <td>Rp {{ format(o.total) }}</td>
      </tr>
    </table>
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
  if (r > 30) return "green"
  if (r > 10) return "yellow"
  return "red"
}

const format = v => v.toLocaleString()
</script>

<style scoped>
.green { color: #2ecc71 }
.yellow { color: #f1c40f }
.red { color: #e74c3c }

table {
  width: 100%;
  border-collapse: collapse;
}
td, th {
  border-bottom: 1px solid #333;
  padding: 8px;
}
</style>
