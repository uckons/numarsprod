<template>
  <div class="timer-card" :class="statusClass">
    <!-- HEADER -->
    <div class="header">
      <h4>{{ timer.service_name || `Slot ${timer.slot}` }}</h4>
    </div>

    <!-- INFO -->
    <div class="info" v-if="timer.status !== 'EMPTY'">
      <div v-if="timer.therapist_name">Therapist: <strong>{{ timer.therapist_name }}</strong></div>
      <div v-if="timer.room_name">
        Room: <strong>{{ timer.room_name }}</strong>
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
        :disabled="isStartDisabled"
        @click="$emit('start', timer.slot)"
      >
        Start
      </button>

      <!-- STOP -->
      <button
        v-if="timer.status === 'RUNNING'"
        class="stop"
        @click="$emit('stop', timer.id)"
      >
        Stop
      </button>

      <!-- PAUSE / RESUME -->
      <button
        v-if="timer.status === 'RUNNING' && !timer.paused"
        class="pause"
        @click="$emit('pause', timer.slot)"
      >
        ⏸ Pause
      </button>

      <button
        v-if="timer.status === 'RUNNING' && timer.paused"
        class="resume"
        @click="$emit('resume', timer.slot)"
      >
        ▶ Resume
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

// Start button should be disabled if timer is running OR has remaining time
const isStartDisabled = computed(() => {
  return props.timer.status === "RUNNING" || (props.timer.remaining_seconds && props.timer.remaining_seconds > 0)
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
  background: #1a1a1a;
  border: 1px solid #222;
  border-left: 4px solid #d4a574;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 180px;
  min-height: 140px;
}

/* STATES */
.running { border-left-color: #d4a574; }
.finished { border-left-color: #888; }
.empty { border-left-color: #333; }
.paused { opacity: .7; }

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header h4 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
}

/* INFO */
.info {
  font-size: 11px;
  color: #bbb;
  line-height: 1.3;
}

.info div {
  margin-bottom: 2px;
}

/* TIME */
.time {
  text-align: center;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: 1px;
  color: #fff;
  margin: 4px 0;
}

/* ACTIONS */
.actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

button {
  width: 100%;
  padding: 6px 0;
  border-radius: 6px;
  border: none;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: opacity 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.start { background: #c9a24d; color: #000; }
.stop { background: #ef4444; color: #fff; }
.pause { background: #e67e22; color: #fff; }
.resume { background: #27ae60; color: #fff; }
.extend { background: #444; color: #fff; }
</style>
