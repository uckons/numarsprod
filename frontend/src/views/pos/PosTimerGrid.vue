<template>
  <div class="timer-grid">
    <div
      v-for="t in timers"
      :key="t.id"
      class="timer-card"
      :class="statusClass(t.remaining_minutes)"
    >
      <h4>{{ t.room_name || "Room ?" }}</h4>
      <p class="therapist">{{ t.therapist_name || "-" }}</p>
      <p class="time">{{ formatTime(t.remaining_minutes) }}</p>
    </div>

    <div v-if="!timers.length" class="empty">
      Tidak ada timer aktif
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import api from "@/services/api"

const timers = ref([]) // ✅ WAJIB DEFAULT ARRAY
let interval = null

const loadTimers = async () => {
  try {
    const res = await api.get("/timers/active")
    timers.value = res.data || []
  } catch (e) {
    console.error("Timer load failed", e)
    timers.value = []
  }
}

const tick = () => {
  timers.value = timers.value.map(t => ({
    ...t,
    remaining_minutes: Math.max(0, t.remaining_minutes - 1)
  }))
}

onMounted(async () => {
  await loadTimers()
  interval = setInterval(tick, 60000) // ⏱️ 1 menit
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

const statusClass = (min) => {
  if (min <= 10) return "danger"
  if (min <= 30) return "warning"
  return "success"
}

const formatTime = (min) => {
  if (min == null) return "--"
  const h = Math.floor(min / 60)
  const m = min % 60
  return h ? `${h}j ${m}m` : `${m}m`
}
</script>

<style scoped>
.timer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}

.timer-card {
  background: #111;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 8px 24px rgba(0,0,0,.4);
  transition: .2s;
}

.timer-card:hover {
  transform: translateY(-3px);
}

.timer-card.success { border-left: 4px solid #2ecc71 }
.timer-card.warning { border-left: 4px solid #f1c40f }
.timer-card.danger  { border-left: 4px solid #e74c3c }

h4 {
  margin: 0;
  font-size: 15px;
}

.therapist {
  font-size: 12px;
  color: #aaa;
}

.time {
  font-size: 22px;
  font-weight: bold;
  margin-top: 6px;
}

.empty {
  grid-column: 1 / -1;
  text-align: center;
  color: #777;
  padding: 40px;
}
</style>
