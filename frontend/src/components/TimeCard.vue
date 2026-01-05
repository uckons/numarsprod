<template>
  <div class="timer-card" :class="colorClass">
    <!-- HEADER -->
    <div class="header">
      <div>
        <h3 class="name">{{ therapistName }}</h3>
        <p class="order">Order #{{ orderId }}</p>
      </div>
      <span class="status">{{ statusText }}</span>
    </div>

    <!-- TIME -->
    <div class="time">
      ⏱ {{ formattedTime }}
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <button
        v-if="!paused"
        class="btn pause"
        @click="$emit('pause', timerId)"
      >
        Pause
      </button>

      <button
        v-else
        class="btn resume"
        @click="$emit('resume', timerId)"
      >
        Resume
      </button>

      <button
        class="btn extend"
        @click="$emit('extend', timerId, 10)"
      >
        +10 Menit
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue"

/* =====================
   PROPS
===================== */
const props = defineProps({
  timerId: { type: Number, required: true },
  orderId: { type: Number, required: true },
  therapistName: { type: String, required: true },
  endTime: { type: String, required: true },
  paused: { type: Boolean, default: false }
})

/* =====================
   REALTIME CLOCK
===================== */
const now = ref(new Date())
let interval = null

onMounted(() => {
  interval = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})

/* =====================
   TIME CALCULATION
===================== */
const remainingSeconds = computed(() => {
  const end = new Date(props.endTime)
  return Math.max(0, Math.floor((end - now.value) / 1000))
})

const remainingMinutes = computed(() =>
  Math.floor(remainingSeconds.value / 60)
)

const formattedTime = computed(() => {
  const min = Math.floor(remainingSeconds.value / 60)
  const sec = remainingSeconds.value % 60
  return `${min}:${sec.toString().padStart(2, "0")}`
})

/* =====================
   COLOR LOGIC
===================== */
const colorClass = computed(() => {
  if (props.paused) return "paused"
  if (remainingMinutes.value <= 10) return "red"
  if (remainingMinutes.value <= 30) return "yellow"
  return "green"
})

const statusText = computed(() => {
  if (props.paused) return "PAUSED"
  if (remainingMinutes.value <= 10) return "HAMPIR HABIS"
  if (remainingMinutes.value <= 30) return "SEGERA HABIS"
  return "AKTIF"
})

import { watch } from "vue"

const alertShown = ref(false)

watch(remainingMinutes, (val) => {
  if (val <= 10 && !alertShown.value) {
    alertShown.value = true
    alert(`⏰ TIMER HAMPIR HABIS!\n${props.timer.therapist_name}\nSisa ${val} menit`)
  }
})


</script>

<style scoped>
/* =====================
   BASE
===================== */
.timer-card {
  background: #0e0e0e;
  border: 2px solid #333;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
  color: #fff;
  transition: all 0.3s ease;
}

/* =====================
   HEADER
===================== */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.name {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.order {
  margin: 0;
  font-size: 12px;
  color: #aaa;
}

.status {
  font-size: 12px;
  font-weight: bold;
  color: #c9a24d;
}

/* =====================
   TIME
===================== */
.time {
  margin: 14px 0;
  font-size: 28px;
  font-weight: bold;
  text-align: center;
  letter-spacing: 1px;
}

/* =====================
   ACTIONS
===================== */
.actions {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 8px;
  font-size: 13px;
  font-weight: bold;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}

.pause {
  background: #e67e22;
  color: #fff;
}

.resume {
  background: #27ae60;
  color: #fff;
}

.extend {
  background: #c9a24d;
  color: #000;
}

/* =====================
   COLOR STATES
===================== */
.green {
  border-color: #2ecc71;
}

.yellow {
  border-color: #f1c40f;
}

.red {
  border-color: #e74c3c;
}

.paused {
  border-color: #7f8c8d;
  opacity: 0.6;
}
</style>
