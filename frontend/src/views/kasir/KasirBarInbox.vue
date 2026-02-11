<template>
  <div class="kasir-inbox-page">
    <header class="head">
      <div>
        <h2>Inbox Message dari Staff Bar</h2>
        <p>Semua update bar tersimpan di sini agar tidak terlewat.</p>
      </div>
      <div class="head-actions">
        <router-link class="btn-light" to="/kasir">← Kembali Dashboard</router-link>
        <button class="btn-primary" @click="refresh">Refresh</button>
      </div>
    </header>

    <section class="card" v-if="messages.length">
      <div class="meta">
        <span>Total {{ messages.length }} message</span>
        <span class="badge" v-if="unreadCount">{{ unreadCount }} unread</span>
      </div>

      <div class="message-row" v-for="msg in messages" :key="msg.id" :class="{ unread: !msg.is_read }">
        <div>
          <h4>{{ msg.title }}</h4>
          <p>{{ msg.message || '-' }}</p>
          <small>{{ formatDate(msg.created_at) }}</small>
        </div>

        <button v-if="!msg.is_read" class="btn-primary" @click="markRead(msg.id)">Tandai Dibaca</button>
      </div>
    </section>

    <section class="card" v-else>
      <p class="empty">Belum ada message dari Staff Bar.</p>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from "vue"
import Swal from "sweetalert2"
import api from "@/services/api"

const messages = ref([])
const unreadCount = computed(() => messages.value.filter(m => !m.is_read).length)

const refresh = async () => {
  const res = await api.get('/orders/bar/messages')
  messages.value = Array.isArray(res.data) ? res.data : []
}

const markRead = async (id) => {
  await api.post(`/orders/bar/messages/${id}/read`)
  await refresh()
  await Swal.fire({ icon: 'success', title: 'Message ditandai dibaca' })
}

const formatDate = (v) => new Date(v).toLocaleString('id-ID')

onMounted(refresh)
</script>

<style scoped>
.kasir-inbox-page { min-height: 100vh; padding: 20px; background: #0e0e0e; color: #fff; }
.head { display:flex; justify-content:space-between; gap:12px; margin-bottom:14px; }
.head p { color:#9ca3b3; margin-top:4px; }
.head-actions { display:flex; gap:8px; }
.card { background:#111; border:1px solid #272727; border-radius:12px; padding:14px; }
.meta { display:flex; justify-content:space-between; margin-bottom:8px; color:#b9bfcd; }
.badge { background:#c0392b; color:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:700; }
.message-row { display:flex; justify-content:space-between; gap:12px; border-top:1px solid #262626; padding:12px 0; }
.message-row.unread { background: rgba(245,197,24,.07); }
.message-row h4 { margin:0 0 6px; }
.message-row p { margin:0 0 6px; color:#ddd; }
.message-row small { color:#9aa0ae; }
.empty { color:#9aa0ae; }
.btn-primary,.btn-light { border:none; border-radius:10px; padding:9px 12px; font-weight:700; cursor:pointer; text-decoration:none; display:inline-flex; align-items:center; }
.btn-primary { background:#f5c518; color:#111; }
.btn-light { background:#2a2a2a; color:#fff; }
</style>
