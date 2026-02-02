<template>
  <div class="timer-grid">
    <div
      v-for="t in timers"
      :key="t.id"
      class="timer-card"
      :class="statusClass(t.remaining_seconds)"
    >
      <!-- ROOM & THERAPIST - BRIGHT & BOLD -->
      <div class="timer-header">
        <div class="room-badge">{{ t.room_name || "ROOM ?" }}</div>
        <div class="therapist-badge">{{ t.therapist_name || "THERAPIST" }}</div>
      </div>

      <!-- TIME DISPLAY -->
      <p class="time">{{ formatTime(t.remaining_seconds) }}</p>

      <!-- CONTROLS -->
      <div class="controls">
        <button class="btn-stop" @click="stopTimer(t.id)">Stop</button>
        <button class="btn-pause" @click="pauseTimer(t.id)">Pause</button>
        <button class="btn-add" @click="addTime(t.id)">+10m</button>
      </div>
    </div>

    <div v-if="!timers.length" class="empty">
      Tidak ada timer aktif
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from "vue"
import api from "@/services/api"

const timers = ref([])
let tickInterval = null
let reloadInterval = null

const loadTimers = async () => {
  try {
    const res = await api.get("/timers/active")
    if (Array.isArray(res.data)) {
      timers.value = res.data.map(t => ({
        ...t,
        remaining_seconds: (t.remaining_minutes || 0) * 60 + (t.remaining_seconds || 0)
      }))
    }
  } catch (e) {
    console.error("Timer load failed", e)
  }
}

const tick = () => {
  timers.value = timers.value
    .map(t => ({
      ...t,
      remaining_seconds: Math.max(0, t.remaining_seconds - 1)
    }))
    .filter(t => t.remaining_seconds > 0)
}

const stopTimer = async (id) => {
  try {
    await api.post(`/timers/${id}/stop`)
    await loadTimers()
  } catch (e) {
    console.error("Stop failed", e)
  }
}

const pauseTimer = async (id) => {
  try {
    await api.post(`/timers/${id}/pause`)
    await loadTimers()
  } catch (e) {
    console.error("Pause failed", e)
  }
}

const addTime = async (id) => {
  try {
    await api.post(`/timers/${id}/add-time`, { minutes: 10 })
    await loadTimers()
  } catch (e) {
    console.error("Add time failed", e)
  }
}

onMounted(async () => {
  console.log("✅ PosTimerGrid mounted")
  await loadTimers()
  
  // ✅ Tick setiap 1000ms (1 detik)
  tickInterval = setInterval(() => {
    console.log("⏱ Tick!", timers.value.length)
    tick()
  }, 1000)
  
  // ✅ Reload dari backend setiap 30s
  reloadInterval = setInterval(async () => {
    console.log("🔄 Reload timers")
    await loadTimers()
  }, 30000)
})

onUnmounted(() => {
  console.log("❌ PosTimerGrid unmounted")
  if (tickInterval) clearInterval(tickInterval)
  if (reloadInterval) clearInterval(reloadInterval)
})

const statusClass = (sec) => {
  if (sec == null) return "success"
  const min = sec / 60
  if (min <= 10) return "danger"
  if (min <= 30) return "warning"
  return "success"
}

const formatTime = (sec) => {
  if (sec == null || sec < 0) return "--"
  const totalSec = Math.round(sec)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  } else {
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
}
</script>

<style scoped>
.timer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  padding: 12px;
}

.timer-card {
  background: linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%);
  border-radius: 14px;
  padding: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
  transition: all 0.2s;
  border: 2px solid #222;
}

.timer-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 32px rgba(0,0,0,.6);
}

.timer-card.success { border-left: 6px solid #2ecc71 }
.timer-card.warning { border-left: 6px solid #f1c40f }
.timer-card.danger { border-left: 6px solid #e74c3c }

/* HEADER - ROOM & THERAPIST */
.timer-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 10px;
}

.room-badge {
  background: linear-gradient(135deg, #c9a24d 0%, #e8c547 100%);
  color: #000;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 1px;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-shadow: 0 4px 12px rgba(201, 162, 77, 0.3);
}

.therapist-badge {
  background: linear-gradient(135deg, #e74c3c 0%, #ff6b6b 100%);
  color: #fff;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

/* TIME */
.time {
  font-size: 32px;
  font-weight: bold;
  margin: 8px 0;
  color: #fff;
  font-family: 'Courier New', monospace;
  text-align: center;
  letter-spacing: 2px;
}

/* CONTROLS */
.controls {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
}

button {
  padding: 10px;
  border: none;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 12px;
}

.btn-stop {
  background: #e74c3c;
  color: #fff;
}

.btn-stop:hover {
  background: #ff6b6b;
  transform: scale(1.05);
}

.btn-pause {
  background: #f39c12;
  color: #fff;
}

.btn-pause:hover {
  background: #f5b041;
  transform: scale(1.05);
}

.btn-add {
  background: #27ae60;
  color: #fff;
}

.btn-add:hover {
  background: #2ecc71;
  transform: scale(1.05);
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #777;
  padding: 40px;
}
</style>
