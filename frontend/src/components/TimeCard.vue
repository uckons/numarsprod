<template>
  <div class="timer-card" :class="statusClass">
    <!-- HEADER -->
    <div class="header">
      <div>
        <h4>{{ title }}</h4>
        <small v-if="timer.order_id">
          Order #{{ timer.order_id }}
        </small>
      </div>

      <span class="badge" v-if="timer.service_type">
        {{ timer.service_type }}
      </span>
    </div>

    <!-- INFO -->
    <div class="info" v-if="timer.status !== 'EMPTY'">
      <div>Terapis: <strong>{{ timer.therapist_name }}</strong></div>
      <div v-if="timer.service_type === 'SPA'">
        Room: <strong>{{ timer.room_no }}</strong>
      </div>
      <div v-if="timer.service_type === 'LC'">
        Sofa: <strong>{{ timer.sofa_no }}</strong>
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
  if (props.timer.status !== "RUNNING") return "00:00"
  const ms = Math.max(0, remainingMs.value)
  const m = Math.floor(ms / 60000)
  const s = Math.floor((ms % 60000) / 1000)
  return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`
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
  background: var(--bg-dark);
  border: 2px solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  transition: all var(--transition-base) ease;
}

/* STATES */
.running { 
  border-color: var(--success); 
}

.finished { 
  border-color: var(--danger); 
}

.empty { 
  border-color: var(--border-light); 
}

.paused { 
  opacity: 0.7; 
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.header h4 {
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--text-main);
}

.header small {
  color: var(--text-tertiary);
  font-size: 11px;
}

.badge {
  background: var(--gold-soft);
  color: var(--gold);
  font-size: 11px;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-xs);
  font-weight: var(--font-weight-medium);
}

/* INFO */
.info {
  font-size: var(--font-size-xs);
  color: var(--text-dark);
  line-height: 1.4;
}

.info strong {
  color: var(--text-main);
}

/* TIME */
.time {
  text-align: center;
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-extrabold);
  letter-spacing: 1px;
  color: var(--text-main);
}

/* ACTIONS */
.actions {
  display: flex;
  gap: 6px;
}

button {
  flex: 1;
  padding: var(--space-sm) 0;
  border-radius: var(--radius-sm);
  border: none;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all var(--transition-fast);
}

button:hover {
  transform: translateY(-1px);
}

.start { 
  background: var(--gold); 
  color: #000; 
}

.pause { 
  background: #e67e22; 
  color: var(--text-main); 
}

.resume { 
  background: #27ae60; 
  color: var(--text-main); 
}

.extend { 
  background: #444; 
  color: var(--text-main); 
}

.extend:hover {
  background: #555;
}

/* Mobile optimization */
@media (max-width: 480px) {
  .timer-card {
    padding: var(--space-sm);
  }
  
  .time {
    font-size: var(--font-size-2xl);
  }
  
  .actions {
    flex-wrap: wrap;
  }
  
  button {
    min-width: calc(50% - 3px);
  }
}
</style>
