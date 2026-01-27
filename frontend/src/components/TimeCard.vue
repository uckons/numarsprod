<template>
  <div class="timer-card" :class="statusClass" :style="{ backgroundColor: cardBackgroundColor }">
    <!-- HEADER -->
    <div class="header">
      <div>
        <h4>{{ title }}</h4>
        <small v-if="timer.order_id">
          Order #{{ timer.order_id }}
        </small>
      </div>

      <span class="badge" v-if="timer.service_name">
        {{ timer.service_name }}
      </span>
    </div>

    <!-- INFO -->
    <div class="info" v-if="timer.status !== 'EMPTY'">
      <div v-if="timer.service_name">Service: <strong>{{ timer.service_name }}</strong></div>
      <div v-if="timer.therapist_name">Terapis: <strong>{{ timer.therapist_name }}</strong></div>
      <div v-if="timer.room_name">
        Room/Sofa: <strong>{{ timer.room_name }}</strong>
      </div>
    </div>

    <!-- TIME -->
    <div class="time">
      {{ displayTime }}
    </div>

    <!-- ACTIONS -->
    <div class="actions">
      <!-- START -->
      <button
        v-if="timer.status !== 'RUNNING'"
        class="start"
        @click="$emit('start', timer.slot)"
      >
        Start
      </button>

      <!-- PAUSE / RESUME -->
      <button
        v-if="timer.status === 'RUNNING' && !timer.paused"
        class="pause"
        @click="$emit('pause', timer.slot)"
      >
        ? Pause
      </button>

      <button
        v-if="timer.status === 'RUNNING' && timer.paused"
        class="resume"
        @click="$emit('resume', timer.slot)"
      >
        ? Resume
      </button>

      <!-- EXTEND -->
      <button
        v-if="timer.status === 'RUNNING'"
        class="extend"
        @click="$emit('extend', timer.slot, 10)"
      >
        +10m
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  timer: { type: Object, required: true }
})

const title = computed(() => {
  if (props.timer.status === "EMPTY") return `Slot ${props.timer.slot}`
  return props.timer.therapist_name || "Terapis"
})

const remainingMs = computed(() => {
  if (!props.timer.planned_end_time) return 0
  return (
    new Date(props.timer.planned_end_time).getTime() -
    Date.now()
  )
})

const displayTime = computed(() => {
  if (props.timer.status !== "RUNNING") return "00:00:00"
  const ms = Math.max(0, remainingMs.value)
  const h = Math.floor(ms / 3600000)
  const m = Math.floor((ms % 3600000) / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
})

const cardBackgroundColor = computed(() => {
  if (props.timer.status !== "RUNNING") return "#0f0f0f"
  
  const remainingSeconds = Math.floor(remainingMs.value / 1000)
  
  if (remainingSeconds >= 3600) return "#10b981" // Green: >= 60 minutes
  if (remainingSeconds <= 1800 && remainingSeconds >= 600) return "#eab308" // Yellow: <= 30 minutes
  if (remainingSeconds < 600) return "#ef4444" // Red: < 10 minutes
  
  return "#64748b" // Gray: default
})

const statusClass = computed(() => ({
  empty: props.timer.status === "EMPTY",
  running: props.timer.status === "RUNNING",
  finished: props.timer.status === "FINISHED",
  paused: props.timer.paused
}))
</script>

<style scoped>
.timer-card {
  background: #0f0f0f;
  border: 2px solid #222;
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: background-color .3s ease, all .2s ease;
}

/* STATES */
.running { border-color: #2ecc71; }
.finished { border-color: #e74c3c; }
.empty { border-color: #333; }
.paused { opacity: .7; }

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header h4 {
  margin: 0;
  font-size: 14px;
}

.header small {
  color: #888;
  font-size: 11px;
}

.badge {
  background: rgba(201,162,77,.2);
  color: #c9a24d;
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 12px;
}

/* INFO */
.info {
  font-size: 12px;
  color: #bbb;
  line-height: 1.4;
}

/* TIME */
.time {
  text-align: center;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 1px;
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 6px;
}

button {
  flex: 1;
  padding: 8px 0;
  border-radius: 10px;
  border: none;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.start { background: #c9a24d; color: #000; }
.pause { background: #e67e22; color: #fff; }
.resume { background: #27ae60; color: #fff; }
.extend { background: #444; color: #fff; }
</style>
