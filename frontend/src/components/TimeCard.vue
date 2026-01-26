<template>
  <div class="bg-[#0f0f0f] border-2 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all duration-200"
       :class="{
         'border-success': timer.status === 'RUNNING',
         'border-danger': timer.status === 'FINISHED',
         'border-[#333]': timer.status === 'EMPTY',
         'opacity-70': timer.paused
       }">
    <!-- HEADER -->
    <div class="flex justify-between items-start">
      <div>
        <h4 class="m-0 text-sm">{{ title }}</h4>
        <small v-if="timer.order_id" class="text-text-muted text-[11px]">
          Order #{{ timer.order_id }}
        </small>
      </div>

      <span v-if="timer.service_type" class="bg-gold/20 text-gold text-[11px] px-2.5 py-1 rounded-xl">
        {{ timer.service_type }}
      </span>
    </div>

    <!-- INFO -->
    <div v-if="timer.status !== 'EMPTY'" class="text-xs text-[#bbb] leading-relaxed">
      <div>Terapis: <strong>{{ timer.therapist_name }}</strong></div>
      <div v-if="timer.service_type === 'SPA'">
        Room: <strong>{{ timer.room_no }}</strong>
      </div>
      <div v-if="timer.service_type === 'LC'">
        Sofa: <strong>{{ timer.sofa_no }}</strong>
      </div>
    </div>

    <!-- TIME -->
    <div class="text-center text-3xl font-extrabold tracking-wide">
      {{ displayTime }}
    </div>

    <!-- ACTIONS -->
    <div class="flex gap-1.5">
      <!-- START -->
      <button
        v-if="timer.status !== 'RUNNING'"
        class="flex-1 py-2 rounded-[10px] border-0 text-xs font-bold cursor-pointer bg-gold text-black"
        @click="$emit('start', timer.slot)"
      >
        Start
      </button>

      <!-- PAUSE / RESUME -->
      <button
        v-if="timer.status === 'RUNNING' && !timer.paused"
        class="flex-1 py-2 rounded-[10px] border-0 text-xs font-bold cursor-pointer bg-warn text-white"
        @click="$emit('pause', timer.slot)"
      >
        ? Pause
      </button>

      <button
        v-if="timer.status === 'RUNNING' && timer.paused"
        class="flex-1 py-2 rounded-[10px] border-0 text-xs font-bold cursor-pointer bg-success text-white"
        @click="$emit('resume', timer.slot)"
      >
        ? Resume
      </button>

      <!-- EXTEND -->
      <button
        v-if="timer.status === 'RUNNING'"
        class="flex-1 py-2 rounded-[10px] border-0 text-xs font-bold cursor-pointer bg-[#444] text-white"
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
