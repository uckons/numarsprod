<template>
  <UserBar />

  <div class="page">
    <section class="hero card-glass">
      <div>
        <p class="eyebrow">Enterprise Control Panel</p>
        <h1>Staff Bar Intelligence Dashboard</h1>
        <p class="muted">Live stock FNB, order inbox realtime, dan approval stock workflow.</p>
      </div>
      <button class="btn-primary" @click="loadAll">Refresh Data</button>
    </section>

    <section class="kpi-grid">
      <article class="kpi card-glass">
        <p>Total Item FNB</p>
        <h3>{{ fnbItems.length }}</h3>
      </article>
      <article class="kpi card-glass">
        <p>Low Stock</p>
        <h3>{{ lowStockCount }}</h3>
      </article>
      <article class="kpi card-glass">
        <p>Inbox Pending</p>
        <h3>{{ pendingInboxCount }}</h3>
      </article>
      <article class="kpi card-glass">
        <p>Total Nilai Stok</p>
        <h3>Rp {{ formatCurrency(totalStockValue) }}</h3>
      </article>
    </section>

    <section class="card-glass">
      <div class="section-head">
        <h3>Live Stock Overview</h3>
        <small class="muted">Top 12 item untuk visual cepat.</small>
      </div>
      <ApexChart
        type="bar"
        :height="280"
        :series="stockSeries"
        :options="stockChartOptions"
      />
    </section>

    <section class="card-glass">
      <div class="section-head">
        <h3>Order Inbox (Draft dari Kasir)</h3>
        <span class="badge">{{ barInbox.length }} order</span>
      </div>

      <div v-if="!barInbox.length" class="empty">Belum ada inbox order.</div>

      <div v-for="order in barInbox" :key="order.id" class="inbox-item">
        <div>
          <div class="order-title">Order #{{ order.order_id }} <span class="status" :class="order.status.toLowerCase()">{{ order.status }}</span></div>
          <small class="muted">{{ formatItems(order.items_snapshot) }}</small>
        </div>

        <div class="actions" v-if="!['DELIVERED','CANCELLED'].includes(order.status)">
          <button class="btn-light" @click="accept(order.id)">Accept</button>
          <button class="btn-success" @click="deliver(order.id)">Deliver</button>
          <button class="btn-danger" @click="cancel(order.id)">Cancel</button>
        </div>
      </div>
    </section>

    <section class="card-glass">
      <div class="section-head">
        <h3>Manajemen Stock (Need Approval)</h3>
      </div>

      <div class="toolbar">
        <input v-model.trim="stockSearch" class="input" placeholder="Cari item stock..." />
        <select v-model="sortMode" class="input">
          <option value="low-first">Stock paling sedikit</option>
          <option value="high-first">Stock paling banyak</option>
          <option value="name-asc">Nama A-Z</option>
          <option value="name-desc">Nama Z-A</option>
        </select>
        <select v-model.number="stockPageSize" class="input">
          <option :value="5">5 / halaman</option>
          <option :value="10">10 / halaman</option>
          <option :value="20">20 / halaman</option>
        </select>
      </div>

      <div class="stock-list">
        <div v-if="!paginatedStocks.length" class="empty">Data stock tidak ditemukan.</div>

        <div v-for="item in paginatedStocks" :key="item.id" class="stock-item">
          <div>
            <div class="order-title">
              {{ item.name }}
              <span class="badge" :class="Number(item.stock || 0) <= Number(item.alert_stock || 0) ? 'warn' : 'ok'">
                Stock {{ item.stock }}
              </span>
            </div>
            <small class="muted">Alert minimum: {{ item.alert_stock }} • Harga jual: Rp {{ formatCurrency(item.sell_price || item.price) }}</small>
          </div>

          <form class="req-form" @submit.prevent="submitAdjustment(item)">
            <input v-model.number="draftQty[item.id]" type="number" class="input" placeholder="qty +/-" required />
            <input v-model="draftReason[item.id]" type="text" class="input" placeholder="alasan" required />
            <button type="submit" class="btn-primary">Kirim Approval</button>
          </form>
        </div>
      </div>

      <div class="pagination">
        <button class="btn-light" :disabled="stockPage===1" @click="stockPage -= 1">Prev</button>
        <span>Page {{ stockPage }} / {{ stockTotalPages }}</span>
        <button class="btn-light" :disabled="stockPage>=stockTotalPages" @click="stockPage += 1">Next</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
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
const knownPendingInboxKeys = ref(new Set())
let autoRefreshTimer = null
const AUTO_REFRESH_MS = 5000

const stockSearch = ref("")
const sortMode = ref("low-first")
const stockPage = ref(1)
const stockPageSize = ref(10)

const lowStockCount = computed(() => fnbItems.value.filter(i => Number(i.stock || 0) <= Number(i.alert_stock || 0)).length)
const pendingInboxCount = computed(() => barInbox.value.filter(i => i.status === "PENDING").length)
const totalStockValue = computed(() => fnbItems.value.reduce((acc, i) => acc + (Number(i.stock || 0) * Number(i.sell_price || i.price || 0)), 0))

const filteredStocks = computed(() => {
  const key = stockSearch.value.toLowerCase()
  let rows = [...fnbItems.value].filter(i => !key || String(i.name || "").toLowerCase().includes(key))

  if (sortMode.value === "low-first") rows.sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
  else if (sortMode.value === "high-first") rows.sort((a, b) => Number(b.stock || 0) - Number(a.stock || 0))
  else if (sortMode.value === "name-desc") rows.sort((a, b) => String(b.name || "").localeCompare(String(a.name || "")))
  else rows.sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))

  return rows
})

const stockTotalPages = computed(() => Math.max(1, Math.ceil(filteredStocks.value.length / stockPageSize.value)))
const paginatedStocks = computed(() => {
  const start = (stockPage.value - 1) * stockPageSize.value
  return filteredStocks.value.slice(start, start + stockPageSize.value)
})

watch([stockSearch, sortMode, stockPageSize], () => {
  stockPage.value = 1
})

watch(stockTotalPages, (total) => {
  if (stockPage.value > total) stockPage.value = total
})

const stockSeries = computed(() => {
  const rows = [...fnbItems.value]
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 12)
  return [{ name: "Stock", data: rows.map(i => Number(i.stock || 0)) }]
})

const stockChartOptions = computed(() => {
  const rows = [...fnbItems.value]
    .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0))
    .slice(0, 12)

  return {
    xaxis: { categories: rows.map(i => i.name) },
    theme: { mode: "dark" },
    plotOptions: { bar: { borderRadius: 6, columnWidth: "50%" } },
    dataLabels: { enabled: false },
    colors: ["#f5c518"],
    grid: { borderColor: "#2e2e2e" }
  }
})

const loadAll = async (options = {}) => {
  const { silent = false } = options

  const [fnbRes, inboxRes] = await Promise.all([
    api.get("/fnb"),
    api.get("/orders/bar/inbox")
  ])

  const nextInbox = inboxRes.data || []
  const nextPendingKeys = new Set(
    nextInbox
      .filter(item => item.status === "PENDING")
      .map(item => `${item.id}-${item.order_id}`)
  )

  if (!silent) {
    for (const item of nextInbox) {
      const key = `${item.id}-${item.order_id}`
      if (item.status === "PENDING" && !knownPendingInboxKeys.value.has(key)) {
        await Swal.fire({
          icon: "info",
          title: `Order #${item.order_id} masuk dari kasir`,
          text: "Silakan diproses di inbox Staff Bar"
        })
      }
    }
  }

  knownPendingInboxKeys.value = nextPendingKeys
  fnbItems.value = fnbRes.data || []
  barInbox.value = nextInbox
}

const accept = async (id) => {
  await api.post(`/orders/bar/${id}/accept`)
  await loadAll()
  await Swal.fire({ icon: "success", title: "Order diterima bar" })
}

const deliver = async (id) => {
  const confirm = await Swal.fire({
    icon: "question",
    title: "Deliver order sekarang?",
    text: "Stock akan berkurang setelah order delivered.",
    showCancelButton: true,
    confirmButtonText: "Deliver",
    cancelButtonText: "Batal"
  })
  if (!confirm.isConfirmed) return

  await api.post(`/orders/bar/${id}/deliver`)
  await loadAll()
  await Swal.fire({ icon: "success", title: "Order delivered", text: "Kasir sudah menerima notifikasi." })
}

const cancel = async (id) => {
  const confirm = await Swal.fire({
    icon: "warning",
    title: "Batalkan order bar?",
    text: "Stock tidak akan berkurang dan order kasir akan cancelled by SB.",
    showCancelButton: true,
    confirmButtonText: "Ya, batalkan",
    cancelButtonText: "Kembali"
  })
  if (!confirm.isConfirmed) return

  await api.post(`/orders/bar/${id}/cancel`, { note: "cancelled by SB" })
  await loadAll()
  await Swal.fire({ icon: "success", title: "Order dibatalkan" })
}

const submitAdjustment = async (item) => {
  const qty = Number(draftQty.value[item.id] || 0)
  if (!qty) {
    await Swal.fire({ icon: "info", title: "Qty wajib diisi" })
    return
  }

  await api.post(`/fnb/${item.id}/stock-adjustments`, {
    qty_change: qty,
    reason: draftReason.value[item.id]
  })

  draftQty.value[item.id] = null
  draftReason.value[item.id] = ""
  await Swal.fire({ icon: "success", title: "Request approval terkirim" })
}

const formatItems = (items) => Array.isArray(items) ? items.map(i => `${i.service_name} x${i.qty}`).join(", ") : "-"
const formatCurrency = (v) => Number(v || 0).toLocaleString("id-ID")

onMounted(async () => {
  socket.emit("join-branch", {
    branch_id: auth.user?.branch_id,
    role: auth.user?.role,
    user_id: auth.user?.id
  })

  socket.on("bar:order:new", async (payload) => {
    await Swal.fire({ icon: "info", title: `Order #${payload.order_id} masuk inbox bar` })
    await loadAll({ silent: true })
  })

  await loadAll({ silent: true })

  autoRefreshTimer = setInterval(() => {
    loadAll({ silent: false }).catch(err => {
      console.error("Auto refresh bar dashboard gagal", err)
    })
  }, AUTO_REFRESH_MS)
})

onBeforeUnmount(() => {
  socket.off("bar:order:new")
  if (autoRefreshTimer) clearInterval(autoRefreshTimer)
})
</script>

<style scoped>
.page { padding: 20px; color: #fff; background: radial-gradient(circle at top right, rgba(245,197,24,.08), transparent 38%); }
.card-glass { background: linear-gradient(145deg, rgba(21,21,21,.95), rgba(12,12,12,.95)); border: 1px solid #2d2d2d; border-radius: 16px; padding: 16px; margin-bottom: 14px; box-shadow: 0 16px 38px rgba(0,0,0,.35); }
.hero { display:flex; justify-content:space-between; align-items:flex-start; gap:14px; }
.eyebrow { color:#f5c518; font-size:12px; letter-spacing:.12em; text-transform:uppercase; margin-bottom:6px; }
.muted { color:#9aa0ae; }
.kpi-grid { display:grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap:12px; }
.kpi h3 { margin-top:8px; font-size:34px; color:#f5c518; }
.section-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.badge { padding:4px 8px; border-radius:999px; background:#222; color:#ddd; font-size:12px; }
.badge.warn { background: rgba(231,76,60,.2); color:#ff7b7b; }
.badge.ok { background: rgba(46,204,113,.2); color:#2ecc71; }
.inbox-item, .stock-item { display:flex; justify-content:space-between; gap:12px; border-top:1px solid #262626; padding:12px 0; }
.order-title { font-weight:700; display:flex; align-items:center; gap:8px; }
.status { border-radius:999px; padding:2px 8px; font-size:11px; font-weight:600; }
.status.pending { background:#5f4b19; color:#f5c518; }
.status.accepted { background:#19465f; color:#7fd0ff; }
.status.delivered { background:#1f4f34; color:#87f4b9; }
.status.cancelled { background:#5a2323; color:#ff9f9f; }
.actions, .req-form, .toolbar, .pagination { display:flex; gap:8px; align-items:center; }
.toolbar { margin-bottom:10px; flex-wrap: wrap; }
.input { background:#171717; border:1px solid #333; color:#fff; border-radius:10px; padding:9px 10px; }
.btn-primary,.btn-success,.btn-danger,.btn-light { border:none; border-radius:10px; padding:9px 12px; cursor:pointer; font-weight:600; }
.btn-primary { background:#f5c518; color:#111; }
.btn-success { background:#2ecc71; color:#081b10; }
.btn-danger { background:#c0392b; color:#fff; }
.btn-light { background:#282828; color:#fff; }
.empty { color:#8e95a6; padding:10px 0; }
.pagination { justify-content:flex-end; margin-top:10px; }

@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(2,minmax(0,1fr)); }
}
@media (max-width: 760px) {
  .hero { flex-direction:column; }
  .kpi-grid { grid-template-columns: 1fr; }
  .inbox-item, .stock-item { flex-direction:column; }
}
</style>
