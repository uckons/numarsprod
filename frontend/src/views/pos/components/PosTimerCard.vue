<template>
  <div class="timer-card" :class="color">
    <h4>{{ timer.room }}</h4>
    <p class="therapist">{{ timer.therapist }}</p>
    <p class="service">{{ timer.service }}</p>

    <div class="time">
      {{ remaining }} min
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue"

const props = defineProps({
  timer: Object
})

const remaining = computed(() =>
  Math.max(0, Math.ceil(props.timer.remaining_minutes))
)

const color = computed(() => {
  if (remaining.value <= 10) return "red"
  if (remaining.value <= 30) return "yellow"
  return "green"
})
</script>

<style scoped>
.timer-card {
  border-radius: 16px;
  padding: 14px;
  background: #111;
  box-shadow: 0 12px 40px rgba(0,0,0,.4);
  transition: .25s;
}

.timer-card:hover {
  transform: translateY(-4px);
}

.green { border-left: 6px solid #2ecc71 }
.yellow { border-left: 6px solid #f1c40f }
.red { border-left: 6px solid #e74c3c }

h4 {
  margin: 0;
  font-size: 16px;
}

.therapist {
  color: #aaa;
  font-size: 13px;
}

.service {
  font-size: 12px;
  color: #c9a24d;
}

.time {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
}
</style>
