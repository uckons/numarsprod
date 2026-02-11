<template>
  <UserBar />
  <div class="page">
    <h2>Supervisor Dashboard (Approval Center)</h2>

    <section class="card">
      <h3>Pending Stock Approval</h3>
      <ApexChart
        type="donut"
        :height="260"
        :series="[pendingCount, approvedCount, rejectedCount]"
        :options="approvalChartOptions"
      />
      <div v-for="req in requests" :key="req.id" class="req-row" :class="req.status.toLowerCase()">
        <div>
          <strong>{{ req.item_name }}</strong>
          <p>Qty {{ req.qty_change }} | Status {{ req.status }}</p>
          <small>{{ req.reason || '-' }}</small>
        </div>
        <div v-if="req.status === 'PENDING'">
          <button @click="approve(req.id)">Approve</button>
          <button class="danger" @click="reject(req.id)">Reject</button>
        </div>
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
const pendingCount = computed(() => requests.value.filter(i => i.status === "PENDING").length)
const approvedCount = computed(() => requests.value.filter(i => i.status === "APPROVED").length)
const rejectedCount = computed(() => requests.value.filter(i => i.status === "REJECTED").length)

const approvalChartOptions = {
  labels: ["Pending", "Approved", "Rejected"],
  theme: { mode: "dark" },
  colors: ["#f5c518", "#2ecc71", "#e74c3c"]
}

const load = async () => {
  const res = await api.get("/fnb/stock/requests")
  requests.value = res.data || []
}

const approve = async (id) => {
  await api.post(`/fnb/stock/requests/${id}/approve`)
  await Swal.fire({ icon: "success", title: "Approved" })
  await load()
}

const reject = async (id) => {
  await api.post(`/fnb/stock/requests/${id}/reject`, { reason: "Rejected by supervisor" })
  await Swal.fire({ icon: "warning", title: "Rejected" })
  await load()
}

onMounted(async () => {
  socket.emit("join-branch", {
    branch_id: auth.user?.branch_id,
    role: auth.user?.role,
    user_id: auth.user?.id
  })

  socket.on("fnb:stock:approval:new", async () => {
    await Swal.fire({ icon: "info", title: "Ada request stock baru" })
    await load()
  })

  await load()
})

onBeforeUnmount(() => {
  socket.off("fnb:stock:approval:new")
})
</script>

<style scoped>
.page { padding: 20px; color:#fff; }
.card { background:#111; border:1px solid #2c2c2c; border-radius:12px; padding:14px; }
.req-row { display:flex; justify-content:space-between; border-bottom:1px solid #2b2b2b; padding:10px 0; }
button { border:none; padding:8px 10px; border-radius:8px; background:#f5c518; }
.danger { background:#c0392b; color:#fff; }
</style>
