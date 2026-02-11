<template>
  <UserBar />

  <div class="page">
    <header class="head">
      <div>
        <h1>Staff Bar Enterprise Dashboard</h1>
        <p>Live stock FNB, inbox order draft kasir, dan approval adjustment.</p>
      </div>
      <button class="refresh" @click="loadAll">Refresh</button>
    </header>

    <section class="grid">
      <article class="card stat">
        <h4>Total Item FNB</h4>
        <strong>{{ fnbItems.length }}</strong>
      </article>
      <article class="card stat">
        <h4>Low Stock</h4>
        <strong>{{ lowStockCount }}</strong>
      </article>
      <article class="card stat">
        <h4>Inbox Pending</h4>
        <strong>{{ pendingInboxCount }}</strong>
      </article>
    </section>

    <section class="card">
      <h3>Live Stock Overview</h3>
      <ApexChart
        type="bar"
        :height="260"
        :series="[{ name: 'Stock', data: fnbItems.map(i => Number(i.stock || 0)) }]"
        :options="stockChartOptions"
      />
    </section>

    <section class="card">
      <h3>Order Inbox (Draft dari Kasir)</h3>
      <div v-if="!barInbox.length" class="empty">Belum ada inbox order.</div>
      <div v-for="order in barInbox" :key="order.id" class="inbox-item">
        <div>
          <strong>Order #{{ order.order_id }}</strong>
          <p>Status: {{ order.status }}</p>
          <small>{{ formatItems(order.items_snapshot) }}</small>
        </div>
        <div class="actions" v-if="order.status !== 'DELIVERED' && order.status !== 'CANCELLED'">
          <button @click="accept(order.id)">Accept</button>
          <button class="deliver" @click="deliver(order.id)">Deliver</button>
          <button class="danger" @click="cancel(order.id)">Cancel</button>
        </div>
      </div>
    </section>

    <section class="card">
      <h3>Manajemen Stock (Butuh Approval Supervisor/Manager)</h3>
      <div class="stock-list">
        <div v-for="item in fnbItems" :key="item.id" class="stock-item">
          <div>
            <strong>{{ item.name }}</strong>
            <p>Stock: {{ item.stock }} | Alert: {{ item.alert_stock }}</p>
          </div>
          <form class="req-form" @submit.prevent="submitAdjustment(item)">
            <input v-model.number="draftQty[item.id]" type="number" placeholder="qty +/-" required />
            <input v-model="draftReason[item.id]" type="text" placeholder="alasan" required />
            <button type="submit">Kirim Approval</button>
          </form>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, onBeforeUnmount, ref } from "vue"
import Swal from "sweetalert2"
import UserBar from "../../components/UserBar.vue"
import ApexChart from "../../components/ApexChart.vue"
import api from "../../services/api"
import socket from "../../services/socket"
import { useAuthStore } from "../../store/auth.store"

const auth = useAuthStore()
const fnbItems = ref([])
const barInbox = ref([])
const draftQty = ref({})
const draftReason = ref({})

const lowStockCount = computed(() => fnbItems.value.filter(i => Number(i.stock || 0) <= Number(i.alert_stock || 0)).length)
const pendingInboxCount = computed(() => barInbox.value.filter(i => i.status === "PENDING").length)

const stockChartOptions = computed(() => ({
  xaxis: { categories: fnbItems.value.map(i => i.name) },
  theme: { mode: "dark" },
  dataLabels: { enabled: false },
  colors: ["#f5c518"]
}))

const loadAll = async () => {
  const [fnbRes, inboxRes] = await Promise.all([
    api.get("/fnb"),
    api.get("/orders/bar/inbox")
  ])
  fnbItems.value = fnbRes.data || []
  barInbox.value = inboxRes.data || []
}

const accept = async (id) => {
  await api.post(`/orders/bar/${id}/accept`)
  await loadAll()
  await Swal.fire({ icon: "success", title: "Order diterima" })
}

const deliver = async (id) => {
  await api.post(`/orders/bar/${id}/deliver`)
  await loadAll()
  await Swal.fire({ icon: "success", title: "Order delivered", text: "Kasir sudah dikirim notifikasi siap kirim." })
}

const cancel = async (id) => {
  await api.post(`/orders/bar/${id}/cancel`, { note: "cancelled by SB" })
  await loadAll()
  await Swal.fire({ icon: "warning", title: "Order dibatalkan" })
}

const submitAdjustment = async (item) => {
  const qty = Number(draftQty.value[item.id] || 0)
  await api.post(`/fnb/${item.id}/stock-adjustments`, {
    qty_change: qty,
    reason: draftReason.value[item.id]
  })

  draftQty.value[item.id] = null
  draftReason.value[item.id] = ""
  await Swal.fire({ icon: "success", title: "Request approval terkirim" })
}

const formatItems = (items) => {
  if (!Array.isArray(items)) return "-"
  return items.map(i => `${i.service_name} x${i.qty}`).join(", ")
}

onMounted(async () => {
  socket.emit("join-branch", {
    branch_id: auth.user?.branch_id,
    role: auth.user?.role,
    user_id: auth.user?.id
  })

  socket.on("bar:order:new", async (payload) => {
    await Swal.fire({ icon: "info", title: `Order #${payload.order_id} masuk inbox bar` })
    await loadAll()
  })

  await loadAll()
})

onBeforeUnmount(() => {
  socket.off("bar:order:new")
})
</script>

<style scoped>
.page { padding: 20px; color: #fff; }
.head { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:16px; }
.grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin-bottom:12px; }
.card { background:#111; border:1px solid #2e2e2e; border-radius:12px; padding:14px; margin-bottom:12px; }
.stat strong { font-size: 28px; color:#f5c518; }
.refresh { background:#f5c518; border:none; padding:10px 14px; border-radius:8px; }
.inbox-item { display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid #2c2c2c; }
.actions button { margin-left:8px; }
.actions .deliver { background:#2ecc71; }
.actions .danger { background:#c0392b; color:#fff; }
.stock-item { display:flex; justify-content:space-between; gap:10px; padding:8px 0; border-bottom:1px solid #2b2b2b; }
.req-form { display:flex; gap:8px; }
.req-form input { background:#1a1a1a; color:#fff; border:1px solid #333; border-radius:8px; padding:8px; }
.req-form button { background:#f5c518; border:none; border-radius:8px; padding:8px 10px; }
.empty { color:#9e9e9e; }
</style>
