<template>
  <div class="box">
    <h2>Timer Terapis</h2>

    <table>
      <tr>
        <th>Order</th>
        <th>Terapis</th>
        <th>Mulai</th>
        <th>Selesai</th>
        <th>Status</th>
      </tr>

      <tr v-for="t in timers" :key="t.id">
        <td>#{{ t.order_id }}</td>
        <td>{{ t.therapist }}</td>
        <td>{{ t.start_time }}</td>
        <td>{{ t.end_time }}</td>
        <td>{{ t.paused ? "PAUSE" : "RUNNING" }}</td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const timers = ref([])

onMounted(async () => {
  timers.value = (await api.get("/superadmin/timers")).data
})
</script>
