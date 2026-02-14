<template>
  <div class="kasir-inbox-page">
    <header class="head card">
      <div>
        <h2>Inbox Bar</h2>
        <p>Update terbaru dari Staff Bar tersusun dari yang paling baru.</p>
      </div>
      <div class="head-actions">
        <router-link class="btn-light" to="/kasir">← Dashboard</router-link>
        <button class="btn-primary" @click="refresh">Refresh</button>
      </div>
    </header>

    <section class="card">
      <div class="meta">
        <span>Total {{ pagination.total }} message</span>
        <span class="badge" v-if="unreadCount">{{ unreadCount }} unread</span>
      </div>

      <div v-if="!messages.length" class="empty">Belum ada message dari Staff Bar.</div>

      <div v-for="msg in messages" :key="msg.id" class="message-row" :class="{ unread: !msg.is_read }">
        <div class="message-main">
          <h4>{{ msg.title }}</h4>
          <p>{{ msg.message || '-' }}</p>
          <small>{{ formatDate(msg.created_at) }}</small>
        </div>

        <button v-if="!msg.is_read" class="btn-primary" @click="markRead(msg.id)">Tandai Dibaca</button>
      </div>

      <div class="pagination">
        <button class="btn-light" :disabled="page===1" @click="changePage(page - 1)">Prev</button>
        <span>Page {{ page }} / {{ pagination.total_pages }}</span>
        <button class="btn-light" :disabled="page>=pagination.total_pages" @click="changePage(page + 1)">Next</button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import Swal from "sweetalert2"
import api from "@/services/api"

const page = ref(1)
const pageSize = 20
const messages = ref([])
const pagination = ref({ page: 1, page_size: 20, total: 0, total_pages: 1 })

const unreadCount = computed(() => messages.value.filter((m) => !m.is_read).length)

const refresh = async () => {
  const res = await api.get('/orders/bar/messages', {
    params: { page: page.value, page_size: pageSize }
  })

  const rows = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : [])
  const meta = res.data?.pagination || { page: page.value, page_size: pageSize, total: rows.length, total_pages: 1 }

  messages.value = rows
  pagination.value = meta
  page.value = Number(meta.page || page.value)
}

const changePage = async (nextPage) => {
  const target = Math.min(Math.max(1, Number(nextPage) || 1), pagination.value.total_pages || 1)
  if (target === page.value) return
  page.value = target
  await refresh()
}

const markRead = async (id) => {
  await api.post(`/orders/bar/messages/${id}/read`)
  await refresh()
  await Swal.fire({ icon: 'success', title: 'Message ditandai dibaca' })
}

const formatDate = (v) => v ? new Date(v).toLocaleString('id-ID', { weekday: "long", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"

onMounted(refresh)
</script>

<style scoped>
.kasir-inbox-page { min-height: 100vh; padding: 20px; background: radial-gradient(circle at top right, rgba(245,197,24,.09), transparent 40%), #0c0c0c; color: #fff; }
.card { background: linear-gradient(145deg, rgba(20,20,20,.95), rgba(14,14,14,.95)); border:1px solid #272727; border-radius:14px; padding:16px; margin-bottom:14px; box-shadow: 0 12px 30px rgba(0,0,0,.32); }
.head { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
.head h2 { margin:0 0 6px; color:#f5c518; }
.head p { margin:0; color:#9ca3b3; }
.head-actions { display:flex; gap:8px; }
.meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; color:#b9bfcd; }
.badge { background:#c0392b; color:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:700; }
.message-row { display:flex; justify-content:space-between; gap:12px; border-top:1px solid #262626; padding:12px 0; }
.message-row.unread { background: rgba(245,197,24,.08); border-radius:10px; padding:12px; margin-top:8px; }
.message-main h4 { margin:0 0 6px; }
.message-main p { margin:0 0 6px; color:#ddd; }
.message-main small { color:#9aa0ae; }
.empty { color:#9aa0ae; padding:12px 0; }
.pagination { display:flex; gap:8px; justify-content:flex-end; align-items:center; margin-top:10px; }
.btn-primary,.btn-light { border:none; border-radius:10px; padding:9px 12px; font-weight:700; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; }
.btn-primary { background:#f5c518; color:#111; }
.btn-light { background:#2a2a2a; color:#fff; }
.btn-light:disabled { opacity:.5; cursor:not-allowed; }

@media (max-width: 760px) {
  .head { flex-direction: column; }
  .message-row { flex-direction: column; }
}
</style>
