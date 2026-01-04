<template>
  <div class="page">
    <h2>OWNER DASHBOARD</h2>

    <div class="cards">
      <div class="card">
        <h4>Income</h4>
        <p>Rp {{ format(report.income) }}</p>
      </div>
      <div class="card">
        <h4>Expense</h4>
        <p>Rp {{ format(report.expense) }}</p>
      </div>
      <div class="card">
        <h4>Profit</h4>
        <p>Rp {{ format(report.profit) }}</p>
      </div>
    </div>

    <h3>Cash Flow</h3>
    <ul>
      <li v-for="c in cashflow" :key="c.type">
        {{ c.type }} : Rp {{ format(c.total) }}
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"
import UserBar from "../../components/UserBar.vue"
const report = ref({
  income: 0,
  expense: 0,
  profit: 0
})

const cashflow = ref([])

onMounted(async () => {
  report.value = (await api.get("/reports/profit-loss")).data
  cashflow.value = (await api.get("/reports/cashflow")).data
})

const format = v => Number(v || 0).toLocaleString()
</script>

<style scoped>
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}
.card {
  background: #111;
  padding: 16px;
  border: 1px solid #c9a24d;
}
</style>
