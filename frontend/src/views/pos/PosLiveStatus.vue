<template>
  <div class="stats">
    <div
      v-for="t in working"
      :key="t.id"
      class="stat-card active"
    >
      <p>{{ t.therapist_name }}</p>
      <h3>{{ t.room_name }}</h3>
      <small>{{ t.service_name }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const working = ref([])

onMounted(async () => {
  working.value = (await api.get("/pos/live")).data
})
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px,1fr));
  gap: 16px;
}

.stat-card {
  background: linear-gradient(145deg, #0e0e0e, #151515);
  border-radius: 16px;
  padding: 18px;
  box-shadow: 0 12px 40px rgba(0,0,0,.45);
  transition: all .25s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
}

.stat-card p {
  color: #999;
  font-size: 13px;
}

.stat-card h3 {
  margin-top: 6px;
  font-size: 20px;
  color: #2ecc71;
}
</style>
