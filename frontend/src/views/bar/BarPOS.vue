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
        <p>Rp {{ format(item.price) }}</p>
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

const format = v => v.toLocaleString()
</script>

<style scoped>
.page {
  padding: var(--space-xl);
  background: var(--bg-main);
  min-height: 100vh;
  color: var(--text-main);
}

h2 {
  color: var(--gold);
  margin-bottom: var(--space-2xl);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: var(--space-lg);
}

.card {
  background: var(--bg-card);
  padding: var(--space-lg);
  border: 1px solid var(--gold);
  cursor: pointer;
  border-radius: var(--radius);
  transition: all var(--transition-fast);
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
  border-color: var(--gold);
}

.card h3 {
  color: var(--text-main);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
}

.card p {
  color: var(--text-muted);
  margin: var(--space-xs) 0;
  font-size: var(--font-size-sm);
}

.low {
  color: var(--danger);
  font-weight: var(--font-weight-medium);
}

/* Mobile optimization */
@media (max-width: 768px) {
  .page {
    padding: var(--space-lg);
  }
  
  .grid {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    gap: var(--space-md);
  }
}

@media (max-width: 480px) {
  .page {
    padding: var(--space-md);
  }
  
  h2 {
    font-size: var(--font-size-xl);
  }
  
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
