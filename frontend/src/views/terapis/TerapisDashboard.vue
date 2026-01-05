<template>
  <div>
    <h1>Timer Terapis</h1>

    <TimerCard
      v-for="t in timers"
      :key="t.id"
      :timer-id="t.id"
      :order-id="t.order_id"
      :therapist-name="t.therapist_name"
      :end-time="t.end_time"
      :paused="t.paused"

      @pause="pauseTimer"
      @resume="resumeTimer"
      @extend="extendTimer"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue"
import TimerCard from "../../components/TimeCard.vue"
import socket from "../../services/socket"
import { useAuthStore } from "../../store/auth.store"

const auth = useAuthStore()
const timers = ref([])

/* =========================
   LOAD TIMER AWAL
========================= */
const loadTimers = async () => {
  const res = await fetch("/api/timers/active", {
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
  timers.value = await res.json()
}

/* =========================
   API ACTIONS
========================= */
const pauseTimer = async (timerId) => {
  await fetch(`/api/timers/${timerId}/pause`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
}

const resumeTimer = async (timerId) => {
  await fetch(`/api/timers/${timerId}/resume`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
}

const extendTimer = async (timerId, minutes) => {
  await fetch(`/api/timers/${timerId}/extend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify({ minutes })
  })
}

/* =========================
   SOCKET REALTIME
========================= */
onMounted(() => {
  loadTimers()

  socket.emit("join-branch", auth.user.branch_id)

  socket.on("timer:start", (timer) => {
    timers.value.push(timer)
  })

  socket.on("timer:update", (data) => {
    const t = timers.value.find(x => x.id === data.id)
    if (t) Object.assign(t, data)
  })

  socket.on("timer:extend", (data) => {
    const t = timers.value.find(x => x.id === data.id)
    if (t) t.end_time = data.end_time
  })
})

onUnmounted(() => {
  socket.off("timer:start")
  socket.off("timer:update")
  socket.off("timer:extend")
})
socket.on("timer:stop", ({ id }) => {
  const t = timers.value.find(x => x.id === id)
  if (t) {
    t.paused = true
    t.end_time = new Date().toISOString()
  }
})


</script>
