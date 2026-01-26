<template>
  <div class="page">
    <h2>Audit Logs</h2>

    <!-- FILTER -->
    <div class="filter">
      <input v-model="filter.user_id" placeholder="User ID" />
      <input type="date" v-model="filter.from" />
      <input type="date" v-model="filter.to" />
      <button @click="load">Filter</button>
    </div>

    <!-- TABLE -->
    <table>
      <thead>
        <tr>
          <th>Waktu</th>
          <th>User</th>
          <th>Aksi</th>
          <th>Target</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="l in logs" :key="l.id">
          <td>{{ format(l.created_at) }}</td>
          <td>{{ l.username }}</td>
          <td>{{ l.action }}</td>
          <td>{{ l.target }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"

const logs = ref([])
const filter = ref({
  user_id: "",
  from: "",
  to: ""
})

const load = async () => {
  const params = {}
  if (filter.value.user_id) params.user_id = filter.value.user_id
  if (filter.value.from) params.from = filter.value.from
  if (filter.value.to) params.to = filter.value.to

  logs.value = (await api.get("/audit-logs", { params })).data
}

onMounted(load)

const format = (v) =>
  new Date(v).toLocaleString("id-ID")
</script>

<style scoped>
.page {
  padding: 20px;
}
.filter {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
input {
  background: #000;
  border: 1px solid #333;
  color: #fff;
  padding: 6px;
}
button {
  background: #C9A24D;
  padding: 6px 10px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
th, td {
  border: 1px solid #333;
  padding: 8px;
}
</style>
