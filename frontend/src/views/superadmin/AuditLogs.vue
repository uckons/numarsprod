<template>
  <div class="page">
    <section class="hero card">
      <div>
        <h2>Audit Logs</h2>
        <p class="subtitle">Jejak aktivitas user untuk kebutuhan kontrol, investigasi, dan compliance.</p>
      </div>
      <span class="meta-pill">{{ logs.length }} Logs</span>
    </section>

    <section class="card filter">
      <div class="field">
        <label>User ID</label>
        <input v-model="filter.user_id" placeholder="Contoh: 12" />
      </div>
      <div class="field">
        <label>Dari</label>
        <input type="date" v-model="filter.from" />
      </div>
      <div class="field">
        <label>Sampai</label>
        <input type="date" v-model="filter.to" />
      </div>
      <div class="field">
        <label>Per Halaman</label>
        <select v-model.number="pageSize">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
        </select>
      </div>
      <button class="btn-outline" @click="load">Terapkan</button>
    </section>

    <section class="card table-card">
      <table>
        <thead>
          <tr>
            <th>Waktu</th>
            <th>User</th>
            <th>User ID</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!pagedLogs.length">
            <td colspan="4" class="empty">Tidak ada data audit.</td>
          </tr>
          <tr v-for="l in pagedLogs" :key="l.id">
            <td>{{ format(l.created_at) }}</td>
            <td>{{ l.username || '-' }}</td>
            <td>#{{ l.user_id ?? '-' }}</td>
            <td><span class="action">{{ l.action || '-' }}</span></td>
          </tr>
        </tbody>
      </table>
      <div class="pagination">
        <button @click="page -= 1" :disabled="page === 1">Prev</button>
        <span>Page {{ page }} / {{ totalPages }}</span>
        <button @click="page += 1" :disabled="page >= totalPages">Next</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue"
import api from "../../services/api"

const logs = ref([])
const filter = ref({ user_id: "", from: "", to: "" })
const page = ref(1)
const pageSize = ref(20)

const load = async () => {
  const params = {}
  if (filter.value.user_id) params.user_id = filter.value.user_id
  if (filter.value.from) params.from = filter.value.from
  if (filter.value.to) params.to = `${filter.value.to}T23:59:59`

  const res = await api.get("/audit-logs", { params })
  logs.value = Array.isArray(res.data) ? res.data : []
  page.value = 1
}

onMounted(load)

watch(pageSize, () => { page.value = 1 })

const totalPages = computed(() => Math.max(1, Math.ceil(logs.value.length / pageSize.value)))
const pagedLogs = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return logs.value.slice(start, start + pageSize.value)
})

const format = (v) => new Date(v).toLocaleString("id-ID")
</script>

<style scoped>
.page { padding: 24px; display: grid; gap: 16px; }
.card { background: linear-gradient(120deg, rgba(255,255,255,.02), rgba(255,255,255,.01)); border: 1px solid rgba(255,255,255,.08); border-radius: 16px; padding: 16px; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
.hero { display: flex; justify-content: space-between; align-items: center; }
.subtitle { color: var(--text-muted); margin-top: 4px; }
.meta-pill { border: 1px solid rgba(201,162,77,.45); color: var(--gold); border-radius: 999px; padding: 6px 12px; font-size: 12px; }

.filter { display: flex; flex-wrap: wrap; gap: 10px; align-items: end; }
.field { display: grid; gap: 6px; }
label { color: var(--text-muted); font-size: 12px; }
input, select { background: #0a0a0a; border: 1px solid var(--border-soft); color: white; padding: 8px 10px; border-radius: 10px; min-width: 160px; }
.btn-outline { background: transparent; border: 1px solid var(--gold); color: var(--gold); border-radius: 10px; padding: 8px 14px; cursor: pointer; }

.table-card { overflow: auto; }
table { width: 100%; border-collapse: collapse; }
th { text-align: left; color: var(--text-muted); font-size: 12px; padding: 11px 10px; border-bottom: 1px solid var(--border-soft); }
td { padding: 12px 10px; border-bottom: 1px solid rgba(255,255,255,.07); }
.action { background: rgba(95,133,255,.14); color: #8eabff; border-radius: 999px; padding: 4px 10px; font-size: 12px; border: 1px solid rgba(95,133,255,.4); }
.empty { text-align: center; color: var(--text-muted); padding: 24px; }
.pagination { display: flex; justify-content: space-between; align-items: center; margin-top: 14px; }
.pagination button { background: transparent; border: 1px solid var(--gold); color: var(--gold); border-radius: 10px; padding: 6px 14px; cursor: pointer; }
.pagination button:disabled { opacity: .5; cursor: not-allowed; }
</style>
