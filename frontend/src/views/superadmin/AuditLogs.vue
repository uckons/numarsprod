<template>
  <div class="box">
    <h2>Audit Logs</h2>

    <!-- FILTER -->
    <div class="filters">
      <input v-model="filters.user_id" placeholder="User ID" />
      <input type="date" v-model="filters.from" />
      <input type="date" v-model="filters.to" />
      <button @click="load">Filter</button>
    </div>

    <!-- TABLE -->
    <table>
      <tr>
        <th>Waktu</th>
        <th>User</th>
        <th>Aksi</th>
      </tr>

      <tr v-for="l in logs" :key="l.id">
        <td>{{ format(l.created_at) }}</td>
        <td>{{ l.username || "-" }}</td>
        <td>{{ l.action }}</td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const logs = ref([])
const filters = ref({
  user_id: "",
  from: "",
  to: ""
})

const load = async () => {
  logs.value = (
    await api.get("/superadmin/audit-logs", {
      params: filters.value
    })
  ).data
}

const format = (d) => new Date(d).toLocaleString()

onMounted(load)
</script>

<style scoped>
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
input {
  background:#000;
  color:#fff;
  border:1px solid #C9A24D;
  padding:6px;
}
button {
  background:#C9A24D;
  border:none;
  padding:6px 12px;
}
table {
  width:100%;
}
</style>

