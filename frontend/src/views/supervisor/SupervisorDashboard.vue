<template>
  <UserBar />
  <div class="page">
    <section class="hero card">
      <div>
        <p class="eyebrow">SUPERVISOR CONTROL CENTER</p>
        <h2>Dashboard Supervisor Enterprise</h2>
        <p class="muted">Manajemen stok, approval inbox, dan laporan pendapatan detail dalam satu layar.</p>
      </div>
      <button class="btn-primary" @click="loadAll">Refresh Semua</button>
    </section>

    <section class="kpi-grid">
      <article class="card kpi"><p>Pending Approval Stock</p><h3>{{ pendingCount }}</h3></article>
      <article class="card kpi"><p>Pending Undo Void</p><h3>{{ undoPendingCount }}</h3></article>
      <article class="card kpi"><p>Total Item FNB</p><h3>{{ fnbItems.length }}</h3></article>
      <article class="card kpi"><p>Total Nilai Stok</p><h3>Rp {{ formatCurrency(totalStockValue) }}</h3></article>
    </section>

    <section class="card">
      <div class="section-head">
        <h3>Manage Stock (Tambah / Kurangi)</h3>
        <small class="muted">Perubahan akan langsung tersimpan di stok saat ini.</small>
      </div>

      <div class="toolbar">
        <input class="input" v-model.trim="stockSearch" placeholder="Cari item stok..." />
        <select class="input" v-model.number="stockPageSize"><option :value="10">10</option><option :value="20">20</option><option :value="50">50</option></select>
      </div>

      <div v-for="item in paginatedStocks" :key="item.id" class="stock-row">
        <div>
          <div class="title">{{ item.name }}</div>
          <small class="muted">Stock saat ini: {{ item.stock }} • Alert: {{ item.alert_stock }}</small>
        </div>
        <form class="inline-form" @submit.prevent="updateStock(item)">
          <input class="input short" type="number" v-model.number="draftStock[item.id]" />
          <button class="btn-primary" type="submit">Simpan</button>
        </form>
      </div>

      <div class="pagination">
        <button class="btn-light" :disabled="stockPage===1" @click="stockPage -= 1">Prev</button>
        <span>Page {{ stockPage }} / {{ stockTotalPages }}</span>
        <button class="btn-light" :disabled="stockPage>=stockTotalPages" @click="stockPage += 1">Next</button>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h3>Inbox Approval Stock dari Bar</h3>
        <span class="badge">{{ stockApprovalPagination.total }} request</span>
      </div>
      <div class="toolbar">
        <select class="input" v-model="stockApprovalStatus" @change="changeStockApprovalPage(1)">
          <option value="PENDING">Pending</option>
          <option value="ALL">Semua</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      <div v-if="!stockRequests.length" class="empty">Belum ada request.</div>
      <div v-for="req in stockRequests" :key="req.id" class="req-row" :class="req.status.toLowerCase()">
        <div>
          <div class="title">{{ req.item_name }} ({{ req.qty_change > 0 ? '+' : '' }}{{ req.qty_change }})</div>
          <small class="muted">By {{ req.requested_by_name || '-' }} • {{ formatDate(req.created_at) }}</small>
          <p class="reason">{{ req.reason || '-' }}</p>
        </div>
        <div class="actions" v-if="req.status==='PENDING'">
          <button class="btn-success" @click="approveStock(req.id)">Approve</button>
          <button class="btn-danger" @click="rejectStock(req.id)">Reject</button>
        </div>
      </div>

      <div class="pagination">
        <button class="btn-light" :disabled="stockApprovalPage===1" @click="changeStockApprovalPage(stockApprovalPage-1)">Prev</button>
        <span>Page {{ stockApprovalPage }} / {{ stockApprovalPagination.total_pages }}</span>
        <button class="btn-light" :disabled="stockApprovalPage>=stockApprovalPagination.total_pages" @click="changeStockApprovalPage(stockApprovalPage+1)">Next</button>
      </div>
    </section>

    <section class="card">
      <div class="section-head">
        <h3>Inbox Approval Undo Void dari Kasir</h3>
        <span class="badge">{{ undoPagination.total }} request</span>
      </div>
      <div v-if="!undoRequests.length" class="empty">Belum ada request undo.</div>
      <div v-for="req in undoRequests" :key="req.id" class="req-row" :class="req.status.toLowerCase()">
        <div>
          <div class="title">Order #{{ req.order_id }} • {{ req.status }}</div>
          <small class="muted">By {{ req.requested_by_name || '-' }} • {{ formatDate(req.created_at) }}</small>
          <p class="reason">{{ req.reason || '-' }}</p>
        </div>
        <div class="actions" v-if="req.status==='PENDING'">
          <button class="btn-success" @click="approveUndo(req.id)">Approve</button>
          <button class="btn-danger" @click="rejectUndo(req.id)">Reject</button>
        </div>
      </div>

      <div class="pagination">
        <button class="btn-light" :disabled="undoPage===1" @click="changeUndoPage(undoPage-1)">Prev</button>
        <span>Page {{ undoPage }} / {{ undoPagination.total_pages }}</span>
        <button class="btn-light" :disabled="undoPage>=undoPagination.total_pages" @click="changeUndoPage(undoPage+1)">Next</button>
      </div>
    </section>

    <section class="card">
      <div class="section-head"><h3>Laporan Pendapatan Detail (PNL Base)</h3></div>
      <div class="toolbar">
        <input class="input" type="date" v-model="reportFilters.date_from" />
        <input class="input" type="date" v-model="reportFilters.date_to" />
        <button class="btn-primary" @click="loadReport">Terapkan</button>
      </div>
      <div class="summary-grid">
        <div><p class="muted">Revenue</p><h4>Rp {{ formatCurrency(report.summary.revenue) }}</h4></div>
        <div><p class="muted">Paid Orders</p><h4>{{ report.summary.paid_orders }}</h4></div>
        <div><p class="muted">Items Sold</p><h4>{{ report.summary.items_sold }}</h4></div>
      </div>
      <table class="table">
        <thead><tr><th>Kategori</th><th>Qty</th><th>Revenue</th></tr></thead>
        <tbody>
          <tr v-for="row in report.breakdown" :key="row.category"><td>{{ row.category }}</td><td>{{ row.qty }}</td><td>Rp {{ formatCurrency(row.revenue) }}</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue"
import Swal from "sweetalert2"
import api from "../../services/api"
import socket from "../../services/socket"
import { useAuthStore } from "../../store/auth.store"
import UserBar from "../../components/UserBar.vue"

const auth = useAuthStore()
const fnbItems = ref([])
const stockSearch = ref("")
const stockPage = ref(1)
const stockPageSize = ref(10)
const draftStock = ref({})

const stockRequests = ref([])
const stockApprovalPage = ref(1)
const stockApprovalStatus = ref("PENDING")
const stockApprovalPagination = ref({ page: 1, page_size: 20, total: 0, total_pages: 1 })

const undoRequests = ref([])
const undoPage = ref(1)
const undoPagination = ref({ page: 1, page_size: 20, total: 0, total_pages: 1 })

const reportFilters = ref({ date_from: "", date_to: "" })
const report = ref({ summary: { revenue: 0, paid_orders: 0, items_sold: 0 }, breakdown: [] })

const filteredStocks = computed(() => {
  const key = stockSearch.value.toLowerCase()
  return fnbItems.value.filter((i) => !key || String(i.name || "").toLowerCase().includes(key))
})
const stockTotalPages = computed(() => Math.max(1, Math.ceil(filteredStocks.value.length / stockPageSize.value)))
const paginatedStocks = computed(() => {
  const start = (stockPage.value - 1) * stockPageSize.value
  return filteredStocks.value.slice(start, start + stockPageSize.value)
})
const totalStockValue = computed(() => fnbItems.value.reduce((acc, i) => acc + Number(i.stock || 0) * Number(i.sell_price || i.price || 0), 0))
const pendingCount = computed(() => stockRequests.value.filter((i) => i.status === "PENDING").length)
const undoPendingCount = computed(() => undoRequests.value.filter((i) => i.status === "PENDING").length)

watch([stockSearch, stockPageSize], () => { stockPage.value = 1 })

const loadFnb = async () => {
  const res = await api.get("/fnb")
  fnbItems.value = Array.isArray(res.data) ? res.data : []
  for (const item of fnbItems.value) {
    if (draftStock.value[item.id] === undefined) draftStock.value[item.id] = Number(item.stock || 0)
  }
}

const loadStockRequests = async () => {
  const res = await api.get("/fnb/stock/requests", { params: { page: stockApprovalPage.value, page_size: 20, status: stockApprovalStatus.value } })
  stockRequests.value = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
  stockApprovalPagination.value = res.data?.pagination || { page: 1, page_size: 20, total: stockRequests.value.length, total_pages: 1 }
  stockApprovalPage.value = Number(stockApprovalPagination.value.page || 1)
}

const loadUndoRequests = async () => {
  const res = await api.get("/orders/undo-void/requests", { params: { page: undoPage.value, page_size: 20, status: "PENDING" } })
  undoRequests.value = Array.isArray(res.data?.data) ? res.data.data : []
  undoPagination.value = res.data?.pagination || { page: 1, page_size: 20, total: undoRequests.value.length, total_pages: 1 }
  undoPage.value = Number(undoPagination.value.page || 1)
}

const loadReport = async () => {
  const res = await api.get("/dashboard/kasir/analytics", { params: { preset: "daily", date_from: reportFilters.value.date_from || undefined, date_to: reportFilters.value.date_to || undefined } })
  report.value = res.data
}

const loadAll = async () => {
  await Promise.all([loadFnb(), loadStockRequests(), loadUndoRequests(), loadReport()])
}

const updateStock = async (item) => {
  const nextStock = Number(draftStock.value[item.id])
  if (Number.isNaN(nextStock) || nextStock < 0) {
    await Swal.fire({ icon: "warning", title: "Stock tidak valid" })
    return
  }

  await api.put(`/fnb/${item.id}`, {
    ...item,
    sell_price: item.sell_price || item.price,
    stock: nextStock,
    alert_stock: item.alert_stock
  })
  await Swal.fire({ icon: "success", title: `Stock ${item.name} diperbarui` })
  await loadFnb()
}

const approveStock = async (id) => {
  await api.post(`/fnb/stock/requests/${id}/approve`)
  await Swal.fire({ icon: "success", title: "Request stock approved" })
  await Promise.all([loadStockRequests(), loadFnb()])
}

const rejectStock = async (id) => {
  await api.post(`/fnb/stock/requests/${id}/reject`, { review_note: "Rejected by supervisor" })
  await Swal.fire({ icon: "info", title: "Request stock rejected" })
  await loadStockRequests()
}

const approveUndo = async (id) => {
  await api.post(`/orders/undo-void/requests/${id}/approve`, { review_note: "Approved by supervisor" })
  await Swal.fire({ icon: "success", title: "Undo void approved" })
  await loadUndoRequests()
}

const rejectUndo = async (id) => {
  await api.post(`/orders/undo-void/requests/${id}/reject`, { review_note: "Rejected by supervisor" })
  await Swal.fire({ icon: "warning", title: "Undo void rejected" })
  await loadUndoRequests()
}

const changeStockApprovalPage = async (p) => {
  const target = Math.min(Math.max(1, Number(p) || 1), stockApprovalPagination.value.total_pages || 1)
  if (target === stockApprovalPage.value) return
  stockApprovalPage.value = target
  await loadStockRequests()
}
const changeUndoPage = async (p) => {
  const target = Math.min(Math.max(1, Number(p) || 1), undoPagination.value.total_pages || 1)
  if (target === undoPage.value) return
  undoPage.value = target
  await loadUndoRequests()
}

const formatCurrency = (n) => Number(n || 0).toLocaleString("id-ID")
const formatDate = (d) => new Date(d).toLocaleString("id-ID")

onMounted(async () => {
  socket.emit("join-branch", { branch_id: auth.user?.branch_id, role: auth.user?.role, user_id: auth.user?.id })

  socket.on("fnb:stock:approval:new", async () => {
    await Swal.fire({ icon: "info", title: "Request stock baru dari bar" })
    await loadStockRequests()
  })

  socket.on("orders:undo-void:request:new", async (payload) => {
    await Swal.fire({ icon: "info", title: `Request undo void order #${payload.order_id}` })
    await loadUndoRequests()
  })

  await loadAll()
})

onBeforeUnmount(() => {
  socket.off("fnb:stock:approval:new")
  socket.off("orders:undo-void:request:new")
})
</script>

<style scoped>
.page { padding: 20px; color: #fff; background: radial-gradient(circle at top right, rgba(76,114,255,.14), transparent 42%), #0b0f18; }
.card { background: linear-gradient(145deg, rgba(22,27,44,.95), rgba(13,18,30,.95)); border:1px solid #293046; border-radius:16px; padding:16px; margin-bottom:14px; box-shadow: 0 12px 34px rgba(0,0,0,.36); }
.hero { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.eyebrow { color:#83a5ff; font-size:12px; letter-spacing:.12em; text-transform:uppercase; }
.muted { color:#a7b4d5; }
.kpi-grid { display:grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap:12px; }
.kpi h3 { margin-top:8px; font-size:30px; color:#d2deff; }
.section-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
.toolbar,.pagination,.actions,.inline-form { display:flex; gap:8px; align-items:center; }
.toolbar { margin-bottom:10px; flex-wrap:wrap; }
.input { background:#121a2c; border:1px solid #334063; color:#fff; border-radius:10px; padding:8px 10px; }
.short { width: 90px; }
.stock-row,.req-row { display:flex; justify-content:space-between; align-items:center; gap:12px; border-top:1px solid #2b3452; padding:12px 0; }
.title { font-weight:700; }
.reason { margin: 4px 0 0; color: #d7def7; }
.badge { background:#2e3c66; color:#d7e2ff; border-radius:999px; padding:4px 8px; font-size:12px; }
.btn-primary,.btn-light,.btn-success,.btn-danger { border:none; border-radius:10px; padding:9px 12px; font-weight:700; cursor:pointer; }
.btn-primary { background:#5f85ff; color:#fff; }
.btn-light { background:#27324f; color:#fff; }
.btn-success { background:#26b36b; color:#062617; }
.btn-danger { background:#cb4b5a; color:#fff; }
.btn-light:disabled { opacity:.5; cursor:not-allowed; }
.empty { color:#9cb1e2; padding:10px 0; }
.pagination { justify-content:flex-end; margin-top:10px; }
.table { width:100%; border-collapse: collapse; margin-top:8px; }
.table th,.table td { border-bottom:1px solid #2b3452; padding:8px; text-align:left; }
.table th { color:#9ec0ff; }
.summary-grid { display:grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap:10px; margin-bottom:10px; }
@media (max-width: 980px) { .kpi-grid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 760px) { .hero,.stock-row,.req-row { flex-direction:column; align-items:flex-start; } .kpi-grid,.summary-grid { grid-template-columns:1fr; } }
</style>
