<template>
  <div class="orders-page">
<header class="page-header">
  <div class="header-left">
    <button class="back-btn" @click="goBack">
      ← Kembali ke Kasir
    </button>

    <div>
      <h1>Daftar Order</h1>
      <span class="subtitle">Semua transaksi kasir</span>
    </div>
  </div>
</header>


    <div class="table-wrapper">
      <table class="orders-table">
<thead>
  <tr>
    <th>#</th>
    <th>Tanggal</th>
    <th>Service</th>
    <th>Terapis</th>
    <th>Room / Sofa</th>
    <th>Total</th>
    <th>Status</th>
    <th>Aksi</th>
  </tr>
</thead>


<tbody>
  <tr v-for="o in orders" :key="o.id">
    <td>#{{ o.id }}</td>

    <td>{{ formatDate(o.created_at) }}</td>

    <!-- SERVICE -->
    <td>
      <div
        v-for="(i, idx) in o.items || []"
        :key="idx"
        class="service-item"
      >
        {{ i.service_name }}
        <small>×{{ i.qty }}</small>
      </div>
    </td>

    <!-- TERAPIS -->
    <td>
      <div
        v-for="(i, idx) in o.items || []"
        :key="idx"
        class="meta"
      >
        <span v-if="o.therapist_name">
          {{ o.therapist_name }}
        </span>
        <span v-else class="muted">-</span>
      </div>
    </td>

    <!-- ROOM / SOFA -->
    <td>
      <div
        v-for="(i, idx) in o.items || []"
        :key="idx"
        class="meta"
      >
        <span v-if="o.room_name">
          {{ o.room_name }}
        </span>
        <span v-else class="muted">-</span>
      </div>
    </td>

    <!-- TOTAL -->
    <td class="price">
      Rp {{ format(o.total) }}
    </td>

    <!-- STATUS -->
    <td>
      <span
        class="badge"
        :class="o.status === 'PAID' ? 'paid' : 'draft'"
      >
        {{ o.status }}
      </span>
    </td>

    <!-- AKSI -->
    <td>
      <button
        v-if="o.status === 'DRAFT'"
        class="btn pay"
        @click="confirmPay(o)"
      >
        PAY
      </button>
      <span v-else class="done">✔</span>
    </td>
  </tr>
</tbody>

      </table>

      <div v-if="orders.length === 0" class="empty">
        Tidak ada order
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import Swal from "sweetalert2"
import api from "@/services/api"

const router = useRouter()
const orders = ref([])

const loadOrders = async () => {
  const res = await api.get("/orders/kasir")
  orders.value = res.data
}

const confirmPay = async (order) => {
  const res = await Swal.fire({
    title: "Checkout Order?",
    text: `Order #${order.id} akan dibayar`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Bayar",
    cancelButtonText: "Batal",
    confirmButtonColor: "#c9a24d",
    background: "#111",
    color: "#fff"
  })

  if (!res.isConfirmed) return

  // 👉 masuk ke POS checkout
  router.push({
    path: "/kasir/pos",
    query: { order_id: order.id }
  })
}
const goBack = () => {
  router.push("/kasir")
}

const format = (n) =>
  new Intl.NumberFormat("id-ID").format(n || 0)

const formatDate = (d) =>
  new Date(d).toLocaleString("id-ID")

onMounted(loadOrders)
</script>
<style scoped>
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  background: #111;
  border: 1px solid #333;
  color: #c9a24d;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.back-btn:hover {
  background: #1a1a1a;
}

.muted {
  color: #666;
  font-size: 12px;
}

.orders-page {
  padding: 20px;
  color: #fff;
}

.page-header h1 {
  margin: 0;
  font-size: 22px;
}

.subtitle {
  font-size: 12px;
  color: #aaa;
}

.table-wrapper {
  margin-top: 20px;
  overflow-x: auto;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  background: #111;
  border-radius: 12px;
  overflow: hidden;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #222;
  font-size: 13px;
}

th {
  background: #0e0e0e;
  color: #c9a24d;
  font-weight: 700;
}

.service-item small {
  color: #888;
  margin-left: 4px;
}

.meta {
  font-size: 11px;
  color: #aaa;
}

.price {
  font-weight: 700;
}

.badge {
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
}

.badge.draft {
  background: #facc15;
  color: #000;
}

.badge.paid {
  background: #22c55e;
  color: #000;
}

.btn.pay {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: #c9a24d;
  font-weight: 700;
  cursor: pointer;
}

.empty {
  padding: 40px;
  text-align: center;
  color: #777;
}

/* MOBILE */
@media (max-width: 768px) {
  th:nth-child(2),
  td:nth-child(2),
  th:nth-child(4),
  td:nth-child(4) {
    display: none;
  }
}
</style>
