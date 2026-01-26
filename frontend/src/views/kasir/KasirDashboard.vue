<template>
  <div class="kasir-dashboard">
    <!-- TOP BAR -->
        <header class="topbar">
      <div class="brand">
        <h1>NUMARS POS</h1>
        <span class="branch">{{ auth.user.branch_name || "Outlet" }}</span>
      </div>

      <div class="user">
        <span class="name">{{ auth.user.name }}</span>
        <button class="logout" @click="logout">Logout</button>
      </div>
    </header>

    <!-- QUICK STATS -->
    <section class="stats">
      <div class="card">
        <p>Order Aktif</p>
        <h2>{{ stats.activeOrders }}</h2>
      </div>
      <div class="card">
        <p>Omset Hari Ini</p>
        <h2>Rp {{ format(stats.todayRevenue) }}</h2>
      </div>
      <div class="card">
        <p>Terapis Aktif</p>
        <h2>{{ stats.activeTherapists }}</h2>
      </div>
    </section>

    <!-- MAIN ACTION -->
      <section class="actions">
      <router-link to="/kasir/pos" class="action primary">
        ➕ Buat Order Baru
      </router-link>

      <router-link to="/kasir/orders" class="action">
        📋 Daftar Order
      </router-link>

      <router-link to="/kasir/payments" class="action">
        💳 Pembayaran
      </router-link>
    </section>
 
    <!-- TIMER GRID (AMAN) -->
    <section class="timers">
      <h3>Timer Terapis Aktif</h3>
<!--      
<pre style="color:yellow">
{{ timers }}
</pre>
-->
 <div v-if="visibleTimers.length === 0">
    Tidak ada timer berjalan
  </div>

  <div class="timer-grid">
    <TimeCard
      v-for="t in visibleTimers"
      :key="t.slot"
      :timer="t"
      @start="openStartTimer"
    />
  </div>
</section>
    <!-- ?? TARUH DI SINI (PALING BAWAH) -->
    <StartTimerModal
      v-if="showStartModal"
      @close="showStartModal = false"
      @start="createManualTimer"
    />
  </div>
</template>


<script setup>
import { onMounted, ref, computed, onUnmounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../store/auth.store"
import TimeCard from "@/components/TimeCard.vue"
import api from "@/services/api"
import { watch } from "vue"
import StartTimerModal from "@/components/StartTimerModal.vue"

const router = useRouter()
const auth = useAuthStore()

const stats = ref({
  activeOrders: 0,
  todayRevenue: 0,
  activeTherapists: 0
})

const TIMER_SLOTS = 30

const timers = ref(
  Array.from({ length: 30 }, (_, i) => ({
    slot: i + 1,
    status: "EMPTY", // ?? PENTING

    order_id: null,
    service_type: null, // SPA | LC
    therapist_name: null,
    room_no: null,      // SPA
    sofa_no: null,      // LC

    start_time: null,
    planned_end_time: null,
    paused: false,
    warned: false
  }))
)
const visibleTimers = computed(() => timers.value.slice(0, 12))

const format = n =>
  new Intl.NumberFormat("id-ID").format(n || 0)

const logout = () => {
  auth.logout()
  router.push("/login")
}

const loadDashboard = async () => {
  const headers = {
    Authorization: `Bearer ${auth.token}`
  }

  const s = await fetch("/api/dashboard/kasir", { headers })
  stats.value = await s.json()

//  const t = await fetch("/api/timers/active", { headers })
//  timers.value = await t.json()
}
const selectedSlot = ref(null)
const showStartModal = ref(false)

const openStartTimer = (slot) => {
  selectedSlot.value = slot
  showStartModal.value = true
}
/* ?????? KODE KAMU DI SINI ?????? */
const createManualTimer = async (data) => {
  showStartModal.value = false

  const slot = timers.value.find(t => t.slot === selectedSlot.value)
  if (!slot) return

  const start = new Date()
  const end = new Date(start.getTime() + data.duration * 60000)

  Object.assign(slot, {
    status: "RUNNING",
    service_type: data.service_type,
    therapist_name: data.therapist_name,
    room_no: data.room_no || null,
    sofa_no: data.sofa_no || null,
    start_time: start,
    planned_end_time: end,
    paused: false,
    warned: false
  })


  // ?? SIMPAN KE BACKEND
  await api.post("/timers/manual", {
    slot: selectedSlot.value,
    ...data,
    start_time: start,
    planned_end_time: end
  })
}
const syncTimers = async () => {
  const headers = {
   Authorization: `Bearer ${auth.token}`
  }
  const res = await fetch("/api/timers/active", { headers })
  const activeTimers = await res.json()
  // 🔥 RESET SLOT
  timers.value.forEach(t => {
    Object.assign(t, {
      active: false,
      warned: false,
      order_id: null,
      therapist_name: null,
      start_time: null,
      planned_end_time: null,
      paused: false
    })
  })
  activeTimers.forEach(at => {
    const slot = timers.value.find(t => !t.active)
    if (!slot) return

    Object.assign(slot, {
      active: true,
      order_id: at.order_id,
      therapist_name: at.therapist_name,
      start_time: at.start_time,
      planned_end_time: at.planned_end_time
    })
  })
}
onMounted(async () => {
  await loadDashboard()
  await syncTimers()
})

watch(
  timers,
  (list) => {
    const now = Date.now()

    list.forEach(t => {
      if (!t.planned_end_time || t.warned) return

      const remaining =
        new Date(t.planned_end_time).getTime() - now

      if (remaining <= 10 * 60 * 1000 && remaining > 0) {
        t.warned = true

        // UI alert (sementara)
        console.warn(`⏰ Timer hampir habis: ${t.therapist_name || "Terapis"}`)

        // 🔔 nanti bisa ganti toast / sound / modal
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.kasir-dashboard {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
  padding: var(--space-lg);
  font-family: var(--font-main);
}

/* ======================
   TOPBAR
====================== */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid var(--border-medium);
}

.brand h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  letter-spacing: 0.5px;
  color: var(--gold);
}

.branch {
  display: block;
  margin-top: 2px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

.user {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.user .name {
  font-size: 13px;
  color: var(--text-secondary);
}

.logout {
  padding: 6px var(--space-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-xs);
  background: var(--danger-dark);
  border: 1px solid var(--border-light);
  color: var(--text-main);
  cursor: pointer;
}

/* ======================
   STATS
====================== */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-md);
  margin: 22px 0;
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius);
  padding: 18px var(--space-lg);
  text-align: center;
}

.card p {
  margin: 0 0 6px;
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
  letter-spacing: 0.3px;
}

.card h2 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--gold);
}

/* ======================
   ACTIONS
====================== */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-md);
  margin-bottom: 26px;
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 54px;
  border-radius: var(--radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  text-decoration: none;
  background: var(--bg-card);
  border: 1px solid var(--border-medium);
  color: var(--text-main);
  transition: all var(--transition-fast) ease;
}

.action:hover {
  border-color: var(--gold);
  transform: translateY(-2px);
}

.action.primary {
  background: var(--gold);
  color: #000;
  border-color: var(--gold);
}

/* ======================
   TIMERS
====================== */
.timers h3 {
  margin: 0 0 var(--space-md);
  font-size: var(--space-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.timer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: var(--space-lg);
  align-items: stretch;
}

.empty {
  color: var(--text-disabled);
  font-size: 13px;
  font-style: italic;
}

/* ======================
   POS LAYOUT SLOT
====================== */
.pos-body {
  display: grid;
  grid-template-columns: 1fr 420px;
  height: 100%;
}

.left {
  padding: var(--space-lg);
  overflow-y: auto;
}

.right {
  border-left: 1px solid var(--border-medium);
}

/* ======================
   MOBILE-FIRST RESPONSIVE
====================== */

/* Mobile base styles are default above */

/* Tablet and up (768px+) */
@media (min-width: 768px) {
  .kasir-dashboard {
    padding: var(--space-2xl);
  }
  
  .stats {
    gap: var(--space-lg);
  }
  
  .actions {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* Desktop (1024px+) */
@media (min-width: 1024px) {
  .timer-grid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

/* Legacy mobile overrides for smaller screens */
@media (max-width: 768px) {
  .brand h1 {
    font-size: var(--font-size-lg);
  }

  .card h2 {
    font-size: 22px;
  }
  
  .actions {
    grid-template-columns: 1fr;
  }

  .pos-body {
    grid-template-columns: 1fr;
  }

  .right {
    border-left: none;
    border-top: 1px solid var(--border-medium);
  }
}

/* Extra small screens (480px and below) */
@media (max-width: 480px) {
  .kasir-dashboard {
    padding: var(--space-md);
  }
  
  .stats {
    grid-template-columns: 1fr;
  }
  
  .timer-grid {
    grid-template-columns: 1fr;
  }
}
</style>
