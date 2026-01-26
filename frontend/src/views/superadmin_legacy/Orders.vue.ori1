<template>
  <div class="box">
    <h2>Orders (Terakhir)</h2>

    <table>
      <tr>
        <th>ID</th>
        <th>Kategori</th>
        <th>Total</th>
        <th>Waktu</th>
      </tr>

      <tr v-for="o in orders" :key="o.id">
        <td>#{{ o.id }}</td>
        <td>{{ o.category }}</td>
        <td>{{ o.total }}</td>
        <td>{{ new Date(o.created_at).toLocaleString() }}</td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const orders = ref([])

onMounted(async () => {
  orders.value = (await api.get("/superadmin/orders")).data
})
</script>
