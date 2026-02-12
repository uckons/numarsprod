<template>
  <div class="page">
    <section class="hero card">
      <div>
        <h2>Timer Monitor</h2>
        <p class="subtitle">Real-time monitoring status timer terapis lintas order.</p>
      </div>
      <button class="btn-outline" @click="loadTimers">Refresh</button>
    </section>

    <section class="card toolbar">
      <div class="field search">
        <label>Cari Terapis / Order</label>
        <input v-model.trim="query" placeholder="Contoh: Andi / #123" />
      </div>
      <div class="field">
        <label>Status</label>
        <select v-model="statusFilter">
          <option value="ALL">Semua</option>
          <option value="RUNNING">Running</option>
          <option value="PAUSE">Pause</option>
        </select>
      </div>
      <div class="summary">
        <span class="pill">Total {{ timers.length }}</span>
        <span class="pill running">Running {{ runningCount }}</span>
        <span class="pill paused">Pause {{ pausedCount }}</span>
      </div>
    </section>

    <section class="card table-card">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Terapis</th>
            <th>Mulai</th>
            <th>Selesai</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filteredTimers.length">
            <td colspan="5" class="empty">Tidak ada timer.</td>
          </tr>
          <tr v-for="t in filteredTimers" :key="t.id">
            <td>#{{ t.order_id }}</td>
            <td>{{ t.therapist || '-' }}</td>
            <td>{{ formatDateTime(t.start_time) }}</td>
            <td>{{ formatDateTime(t.end_time) }}</td>
            <td>
              <span class="status" :class="t.paused ? 'paused' : 'running'">{{ t.paused ? "PAUSE" : "RUNNING" }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import api from "@/services/api"

const timers = ref([])
const query = ref("")
const statusFilter = ref("ALL")

const loadTimers = async () => {
  const res = await api.get("/superadmin/timers")
  timers.value = Array.isArray(res.data) ? res.data : []
}

onMounted(loadTimers)

const runningCount = computed(() => timers.value.filter((t) => !t.paused).length)
const pausedCount = computed(() => timers.value.filter((t) => t.paused).length)

const filteredTimers = computed(() => {
  const key = query.value.toLowerCase()
  return timers.value.filter((t) => {
    if (statusFilter.value === "RUNNING" && t.paused) return false
    if (statusFilter.value === "PAUSE" && !t.paused) return false

    if (!key) return true
    const therapist = String(t.therapist || "").toLowerCase()
    const order = String(t.order_id || "").toLowerCase()
    return therapist.includes(key) || order.includes(key)
  })
})

const formatDateTime = (v) => {
  if (!v) return "-"
  return new Date(v).toLocaleString("id-ID")
}
</script>

<style scoped>
.page { padding: 24px; display: grid; gap: 16px; }
.card { background: linear-gradient(120deg, rgba(255,255,255,.02), rgba(255,255,255,.01)); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.hero { display: flex; align-items: center; justify-content: space-between; }
.subtitle { color: var(--text-muted); margin-top: 4px; }
.btn-outline { background: transparent; border: 1px solid var(--gold); color: var(--gold); border-radius: 10px; padding: 8px 14px; cursor: pointer; }

.toolbar { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; justify-content: space-between; }
.field { display: grid; gap: 6px; }
label { color: var(--text-muted); font-size: 12px; }
input, select { background: #0a0a0a; border: 1px solid var(--border-soft); color: white; padding: 8px 10px; border-radius: 10px; min-width: 180px; }
.search { flex: 1; min-width: 280px; }
.summary { display: flex; gap: 8px; flex-wrap: wrap; }
.pill { border: 1px solid rgba(255,255,255,.2); border-radius: 999px; padding: 6px 10px; font-size: 12px; }
.pill.running { border-color: rgba(56,217,150,.6); color: #38d996; }
.pill.paused { border-color: rgba(245,161,74,.6); color: #f5a14a; }

.table-card { overflow: auto; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: var(--text-muted); font-size: 12px; padding: 11px 10px; border-bottom: 1px solid var(--border-soft); }
td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,.07); }
.status { border-radius: 999px; padding: 4px 10px; font-size: 12px; font-weight: 700; }
.status.running { background: rgba(56,217,150,.14); color: #38d996; }
.status.paused { background: rgba(245,161,74,.14); color: #f5a14a; }
.empty { text-align: center; color: var(--text-muted); padding: 26px; }
</style>
