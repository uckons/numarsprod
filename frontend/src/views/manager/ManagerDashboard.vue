<template>
  <UserBar />
  <div class="page">
    <h1>Manager Dashboard (Enterprise Overview)</h1>
    <section class="card">
      <h3>Approval Inbox Monitor</h3>
      <ApexChart
        type="line"
        :height="280"
        :series="[{ name: 'Request Qty', data: chartData }]"
        :options="chartOptions"
      />
      <div class="summary">
        <div>Total Request: <strong>{{ requests.length }}</strong></div>
        <div>Pending: <strong>{{ pending }}</strong></div>
      </div>
      <div v-for="req in requests.slice(0,8)" :key="req.id" class="row">
        <span>{{ req.item_name }} ({{ req.qty_change }})</span>
        <span>{{ req.status }}</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue"
import Swal from "sweetalert2"
import api from "../../services/api"
import socket from "../../services/socket"
import { useAuthStore } from "../../store/auth.store"
import UserBar from "../../components/UserBar.vue"
import ApexChart from "../../components/ApexChart.vue"

const auth = useAuthStore()
const requests = ref([])

const pending = computed(() => requests.value.filter(r => r.status === "PENDING").length)
const chartData = computed(() => requests.value.slice(0, 12).map(r => Number(r.qty_change || 0)))
const chartOptions = computed(() => ({
  xaxis: { categories: requests.value.slice(0, 12).map(r => `#${r.id}`) },
  theme: { mode: "dark" },
  colors: ["#f5c518"],
  stroke: { curve: "smooth" }
}))

const load = async () => {
  const res = await api.get("/fnb/stock/requests")
  requests.value = res.data || []
}

onMounted(async () => {
  socket.emit("join-branch", {
    branch_id: auth.user?.branch_id,
    role: auth.user?.role,
    user_id: auth.user?.id
  })

  socket.on("fnb:stock:approval:new", async () => {
    await Swal.fire({ icon: "info", title: "Request stock baru masuk" })
    await load()
  })

  await load()
})

onBeforeUnmount(() => {
  socket.off("fnb:stock:approval:new")
})
</script>

<style scoped>
.page { padding:20px; color:#fff; }
.card { background:#111; border:1px solid #2b2b2b; border-radius:12px; padding:14px; }
.summary { display:flex; gap:18px; margin:10px 0; }
.row { display:flex; justify-content:space-between; border-bottom:1px solid #2d2d2d; padding:8px 0; }
</style>
