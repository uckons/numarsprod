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
  <div class="timer-grid">
    <TimeCard
      v-for="t in visibleTimers"
      :key="t.slot"
      :timer="t"
      @start="openStartTimer"
      @stop="stopTimer"
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
    status: "EMPTY",
    id: null,
    order_id: null,
    service_name: null,
    therapist_name: null,
    room_name: null,
    start_time: null,
    planned_end_time: null,
    remaining_seconds: null,
    paused: false,
    warned: false
  }))
)
// Show all 30 slots (both empty and running)
const visibleTimers = computed(() => timers.value)

// Countdown interval
let countdownInterval = null
let apiRefreshInterval = null
let isSyncing = false

// Refresh intervals in milliseconds
const COUNTDOWN_INTERVAL = 1000    // 1 second
const API_REFRESH_INTERVAL = 30000 // 30 seconds

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

const stopTimer = async (timerId) => {
  try {
    await api.post(`/timers/${timerId}/stop`)
    // Refresh timers to reflect the change
    await syncTimers()
  } catch (err) {
    console.error("Failed to stop timer:", err)
    alert("Gagal menghentikan timer. Silakan coba lagi.")
  }
}
/* KODE KAMU DI SINI */
const createManualTimer = async (data) => {
  showStartModal.value = false

  const slot = timers.value.find(t => t.slot === selectedSlot.value)
  if (!slot) return

  const start = new Date()
  const end = new Date(start.getTime() + data.duration_minutes * 60000)

  Object.assign(slot, {
    status: "RUNNING",
    service_type: data.service_type,
    therapist_id: data.therapist_id,
    room_id: data.room_id,
    start_time: start,
    planned_end_time: end,
    paused: false,
    warned: false
  })

  // SIMPAN KE BACKEND
  try {
    await api.post("/timers/start", {
      slot: selectedSlot.value,
      service_id: data.service_id,
      therapist_id: data.therapist_id,
      room_id: data.room_id,
      duration_minutes: data.duration_minutes,
      start_time: start,
      planned_end_time: end
    })
  } catch (err) {
    console.error("Failed to start timer:", err)
    // Revert slot status on error
    Object.assign(slot, {
      status: "EMPTY",
      service_type: null,
      therapist_id: null,
      room_id: null,
      start_time: null,
      planned_end_time: null
    })
    alert("Gagal memulai timer. Silakan coba lagi.")
  }
}
const syncTimers = async () => {
  if (isSyncing) return // Prevent multiple simultaneous syncs
  
  try {
    isSyncing = true
    const response = await api.get("/timers/slots", {
      params: { branch_id: auth.user.branch_id }
    })
    const slots = response.data
    
    // Update timers array with the 30 slots from backend
    slots.forEach((slot, index) => {
      if (index < timers.value.length) {
        Object.assign(timers.value[index], {
          slot: slot.slot_number,
          status: slot.status,
          id: slot.timer_id,
          order_id: slot.order_id,
          service_id: slot.service_id,
          service_name: slot.service_name,
          therapist_name: slot.therapist_name,
          room_name: slot.room_name,
          start_time: slot.start_time,
          planned_end_time: slot.planned_end_time,
          remaining_seconds: slot.remaining_seconds,
          paused: false,
          warned: false
        })
      }
    })
  } catch (err) {
    console.error("Failed to sync timers:", err)
  } finally {
    isSyncing = false
  }
}

// Update countdown every second
const updateCountdown = () => {
  timers.value.forEach(t => {
    if (t.status === "RUNNING" && t.planned_end_time) {
      const remaining = Math.floor((new Date(t.planned_end_time).getTime() - Date.now()) / 1000)
      t.remaining_seconds = remaining
      
      // Handle timer completion
      if (remaining <= 0 && !t.warned) {
        t.warned = true
        console.warn(`⏰ Timer selesai: ${t.therapist_name || "Terapis"}`)
        // Re-sync to remove completed timers
        syncTimers()
      }
    }
  })
}

onMounted(async () => {
  await loadDashboard()
  await syncTimers()
  
  // Start countdown interval (every 1 second)
  countdownInterval = setInterval(updateCountdown, COUNTDOWN_INTERVAL)
  
  // Start API refresh interval (every 30 seconds)
  apiRefreshInterval = setInterval(syncTimers, API_REFRESH_INTERVAL)
})

onUnmounted(() => {
  if (countdownInterval) clearInterval(countdownInterval)
  if (apiRefreshInterval) clearInterval(apiRefreshInterval)
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
  background: #0e0e0e;
  color: #fff;
  padding: 16px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

/* ======================
   TOPBAR
====================== */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #222;
}

.brand h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: .5px;
  color: #c9a24d;
}

.branch {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: #888;
}

.user {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user .name {
  font-size: 13px;
  color: #aaa;
}

.logout {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 8px;
  background: #c0392b;
  border: 1px solid #333;
  color: white;
  cursor: pointer;
}

/* ======================
   STATS
====================== */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 14px;
  margin: 22px 0;
}

.card {
  background: #111;
  border: 1px solid #222;
  border-radius: 14px;
  padding: 18px 16px;
  text-align: center;
}

.card p {
  margin: 0 0 6px;
  font-size: 12px;
  color: #888;
  letter-spacing: .3px;
}

.card h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #c9a24d;
}

/* ======================
   ACTIONS
====================== */
.actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 14px;
  margin-bottom: 26px;
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 54px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  background: #111;
  border: 1px solid #222;
  color: #fff;
  transition: all .15s ease;
}

.action:hover {
  border-color: #c9a24d;
  transform: translateY(-2px);
}

.action.primary {
  background: #c9a24d;
  color: #000;
  border-color: #c9a24d;
}

/* ======================
   TIMERS
====================== */
.timers h3 {
  margin: 0 0 14px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}

.timer-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  align-items: stretch;
}

@media (max-width: 1920px) {
  .timer-grid {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media (max-width: 1440px) {
  .timer-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 1024px) {
  .timer-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .timer-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}


.empty {
  color: #666;
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
  padding: 16px;
  overflow-y: auto;
}

.right {
  border-left: 1px solid #222;
}

/* ======================
   MOBILE
====================== */
@media (max-width: 768px) {
  .brand h1 {
    font-size: 18px;
  }

  .card h2 {
    font-size: 22px;
  }

  .pos-body {
    grid-template-columns: 1fr;
  }

  .right {
    border-left: none;
    border-top: 1px solid #222;
  }
}


</style>
