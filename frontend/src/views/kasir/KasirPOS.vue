<template>
  <div>
    <h2>KASIR POS</h2>
    <button @click="createOrder">BUAT ORDER</button>
    <pre>{{ order }}</pre>
  </div>
</template>

<script setup>
import api from "../../services/api"
import { ref } from "vue"
import UserBar from "../../components/UserBar.vue"
const order = ref(null)

const createOrder = async () => {
  const res = await api.post("/orders")
  order.value = res.data
}
</script>
