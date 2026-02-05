<template>
  <div class="stock-page">
    <div class="header">
      <div>
        <h2>FNB Stock Dashboard</h2>
        <p class="subtitle">
          Kelola stok, harga modal, dan harga jual FNB terintegrasi dengan services.
        </p>
      </div>
      <button class="btn-primary" @click="openAdd">+ Add Stock</button>
    </div>

    <div class="stats">
      <div class="stat-card">
        <p>Total Items</p>
        <h3>{{ totalItems }}</h3>
      </div>
      <div class="stat-card warning">
        <p>Low Stock</p>
        <h3>{{ lowStockCount }}</h3>
      </div>
      <div class="stat-card danger">
        <p>Out of Stock</p>
        <h3>{{ outOfStockCount }}</h3>
      </div>
    </div>

    <div class="filters">
      <input
        v-model="keyword"
        class="input"
        placeholder="Search item..."
      />

      <select v-model="statusFilter" class="select">
        <option value="ALL">All Status</option>
        <option value="LOW">Low Stock</option>
        <option value="OUT">Out of Stock</option>
      </select>

      <div class="per-page">
        <span>Show</span>
        <select v-model="perPage" class="select">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
    </div>

    <div class="card table-card">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Stock</th>
            <th>Alert</th>
            <th>Harga Modal</th>
            <th>Harga Jual</th>
            <th>Status</th>
            <th width="140">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="empty">Loading...</td>
          </tr>
          <tr v-else-if="!paginatedItems.length">
            <td colspan="7" class="empty">No stock items found</td>
          </tr>
          <tr
            v-for="item in paginatedItems"
            :key="item.id"
            class="row"
          >
            <td class="name">{{ item.name }}</td>
            <td>{{ item.stock }}</td>
            <td>{{ item.alert_stock }}</td>
            <td>Rp {{ format(item.cost_price) }}</td>
            <td>Rp {{ format(item.sell_price) }}</td>
            <td>
              <span
                class="badge"
                :class="statusClass(item)"
              >
                {{ statusLabel(item) }}
              </span>
            </td>
            <td class="actions">
              <button @click="openEdit(item)">Edit</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination-bar">
        <button @click="prevPage" :disabled="page === 1">Prev</button>
        <span>Page {{ page }} / {{ totalPages }}</span>
        <button @click="nextPage" :disabled="page === totalPages">Next</button>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
        <div class="modal">
          <h3>{{ editingItem ? "Edit Stock Item" : "Add Stock Item" }}</h3>
          <form class="form-grid" @submit.prevent="submitForm">
            <label>
              Nama Item
              <input v-model="form.name" class="input" required />
            </label>
            <label>
              Harga Modal
              <input
                v-model.number="form.cost_price"
                type="number"
                min="0"
                class="input"
                required
              />
            </label>
            <label>
              Harga Jual
              <input
                v-model.number="form.sell_price"
                type="number"
                min="0"
                class="input"
                required
              />
            </label>
            <label>
              Stock
              <input
                v-model.number="form.stock"
                type="number"
                min="0"
                class="input"
                required
              />
            </label>
            <label>
              Alert Stock
              <input
                v-model.number="form.alert_stock"
                type="number"
                min="0"
                class="input"
                required
              />
            </label>
            <div class="form-actions">
              <button type="button" class="btn-ghost" @click="closeForm">
                Cancel
              </button>
              <button type="submit" class="btn-primary">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"
import api from "@/services/api"

const items = ref([])
const loading = ref(false)
const keyword = ref("")
const statusFilter = ref("ALL")
const perPage = ref(10)
const page = ref(1)

const showForm = ref(false)
const editingItem = ref(null)
const form = ref({
  name: "",
  cost_price: 0,
  sell_price: 0,
  stock: 0,
  alert_stock: 0
})

const loadItems = async () => {
  loading.value = true
  try {
    const res = await api.get("/fnb")
    items.value = res.data || []
  } catch (error) {
    console.error("Load FNB stock failed:", error)
    await Swal.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: "Silakan coba lagi."
    })
  } finally {
    loading.value = false
  }
}

onMounted(loadItems)

const filteredItems = computed(() => {
  const normalizedKeyword = keyword.value.toLowerCase()
  return items.value.filter(item => {
    const matchesName = item.name?.toLowerCase().includes(normalizedKeyword)
    if (!matchesName) return false
    if (statusFilter.value === "LOW") {
      return item.stock > 0 && item.stock <= item.alert_stock
    }
    if (statusFilter.value === "OUT") {
      return item.stock <= 0
    }
    return true
  })
})

const totalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredItems.value.length / perPage.value))
})

const paginatedItems = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filteredItems.value.slice(start, start + perPage.value)
})

const totalItems = computed(() => items.value.length)
const lowStockCount = computed(() =>
  items.value.filter(item => item.stock > 0 && item.stock <= item.alert_stock).length
)
const outOfStockCount = computed(() =>
  items.value.filter(item => item.stock <= 0).length
)

watch([keyword, statusFilter, perPage], () => {
  page.value = 1
})

const openAdd = () => {
  editingItem.value = null
  form.value = {
    name: "",
    cost_price: 0,
    sell_price: 0,
    stock: 0,
    alert_stock: 0
  }
  showForm.value = true
}

const openEdit = (item) => {
  editingItem.value = item
  form.value = {
    name: item.name,
    cost_price: Number(item.cost_price || 0),
    sell_price: Number(item.sell_price || item.price || 0),
    stock: Number(item.stock || 0),
    alert_stock: Number(item.alert_stock || 0)
  }
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  editingItem.value = null
}

const submitForm = async () => {
  const payload = {
    name: form.value.name,
    cost_price: Number(form.value.cost_price || 0),
    sell_price: Number(form.value.sell_price || 0),
    stock: Number(form.value.stock || 0),
    alert_stock: Number(form.value.alert_stock || 0)
  }

  try {
    if (editingItem.value) {
      await api.put(`/fnb/${editingItem.value.id}`, payload)
    } else {
      await api.post("/fnb", payload)
    }
    await loadItems()
    closeForm()
    await Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Data stok FNB tersimpan."
    })
  } catch (error) {
    console.error("Save FNB stock failed:", error)
    await Swal.fire({
      icon: "error",
      title: "Gagal menyimpan",
      text: "Periksa kembali data yang diinput."
    })
  }
}

const prevPage = () => {
  if (page.value > 1) page.value -= 1
}

const nextPage = () => {
  if (page.value < totalPages.value) page.value += 1
}

const statusLabel = (item) => {
  if (item.stock <= 0) return "OUT"
  if (item.stock <= item.alert_stock) return "LOW"
  return "SAFE"
}

const statusClass = (item) => {
  if (item.stock <= 0) return "danger"
  if (item.stock <= item.alert_stock) return "warning"
  return "success"
}

const format = (value) => Number(value || 0).toLocaleString("id-ID")
</script>

<style scoped>
.stock-page {
  padding: 24px;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitle {
  color: #9b9b9b;
  font-size: 13px;
}

.btn-primary {
  background: #c9a24d;
  color: #000;
  padding: 10px 16px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

.btn-primary:hover {
  transform: translateY(-2px);
}

.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-top: 20px;
}

.stat-card {
  background: linear-gradient(145deg, #0e0e0e, #151515);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 12px 40px rgba(0,0,0,.45);
  transition: transform .25s ease-in-out;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card.warning h3 {
  color: #f1c40f;
}

.stat-card.danger h3 {
  color: #e74c3c;
}

.filters {
  margin-top: 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.per-page {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #aaa;
}

.input,
.select {
  background: #111;
  border: 1px solid #222;
  padding: 8px 12px;
  border-radius: 12px;
  color: #fff;
}

.card {
  background: #111;
  border-radius: 16px;
  padding: 16px;
  margin-top: 20px;
  box-shadow: 0 12px 40px rgba(0,0,0,.45);
}

table {
  width: 100%;
  border-collapse: collapse;
}

th {
  text-align: left;
  color: #aaa;
  font-size: 12px;
  padding: 12px;
}

td {
  padding: 12px;
  border-top: 1px solid #222;
}

.row {
  transition: background 0.2s ease-in-out;
}

.row:hover {
  background: rgba(201,162,77,.08);
}

.name {
  font-weight: 600;
}

.badge {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
}

.badge.success {
  background: rgba(39,174,96,.2);
  color: #2ecc71;
}

.badge.warning {
  background: rgba(241,196,15,.2);
  color: #f1c40f;
}

.badge.danger {
  background: rgba(231,76,60,.2);
  color: #e74c3c;
}

.actions button {
  background: transparent;
  border: 1px solid #c9a24d;
  color: #c9a24d;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s ease-in-out;
}

.actions button:hover {
  background: #c9a24d;
  color: #000;
}

.pagination-bar {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 16px;
  align-items: center;
}

.pagination-bar button {
  border: none;
  background: #222;
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background .2s ease-in-out;
}

.pagination-bar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty {
  text-align: center;
  padding: 24px;
  color: #888;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 50;
}

.modal {
  background: #151515;
  padding: 24px;
  border-radius: 16px;
  width: 100%;
  max-width: 520px;
  box-shadow: 0 30px 80px rgba(0,0,0,.55);
  animation: slideIn .25s ease-in-out;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-top: 16px;
}

.form-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #bbb;
  font-size: 13px;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.btn-ghost {
  background: transparent;
  border: 1px solid #333;
  color: #ddd;
  padding: 8px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: all .2s ease-in-out;
}

.btn-ghost:hover {
  border-color: #c9a24d;
  color: #c9a24d;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity .25s ease-in-out;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes slideIn {
  from {
    transform: translateY(12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .header {
    flex-direction: column;
    align-items: flex-start;
  }

  table {
    display: block;
    overflow-x: auto;
  }
}
</style>