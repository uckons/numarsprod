<template>
  <div class="page">
    <h2>BAR POS</h2>

    <div class="grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="card"
        @click="sell(item)"
      >
        <h3>{{ item.name }}</h3>
        <!--<p>Rp {{ format(item.price) }}</p>-->
        <p>Rp {{ format(item.sell_price ?? item.price) }}</p>
        <p :class="{ low: item.stock <= item.alert_stock }">
          Stock: {{ item.stock }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"

const items = ref([])

const load = async () => {
  items.value = (await api.get("/fnb")).data
}

onMounted(load)

const sell = async item => {
  if (item.stock <= 0) {
    alert("Stock habis")
    return
  }

  // simulasi penjualan langsung (tanpa order spa)
  await api.put(`/fnb/${item.id}`, {
    ...item,
    stock: item.stock - 1
  })

  await load()
}

//const format = v => v.toLocaleString()
const format = v => Number(v || 0).toLocaleString("id-ID")
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
}
.card {
  background: #111;
  padding: 16px;
  border: 1px solid #c9a24d;
  cursor: pointer;
}
.low {
  color: #e74c3c;
}
</style>
