<template>
  <div class="owner-dashboard">
    <!-- HEADER -->
    <header class="topbar">
      <div>
        <h1>NUMARS POS</h1>
        <p>Owner Dashboard</p>
      </div>
      <button class="logout" @click="logout">Logout</button>
    </header>

    <!-- SUMMARY -->
    <section class="summary">
      <div class="box">
        <p>Omset Bulanan</p>
        <h2>Rp {{ format(summary.monthlyTotal) }}</h2>
      </div>
      <div class="box">
        <p>Omset Tahunan</p>
        <h2>Rp {{ format(summary.yearlyTotal) }}</h2>
      </div>
    </section>

    <!-- CATEGORY TOTAL -->
    <section class="categories">
      <div class="card spa">
        <p>SPA</p>
        <h3>Rp {{ format(summary.spa) }}</h3>
      </div>
      <div class="card karaoke">
        <p>KARAOKE</p>
        <h3>Rp {{ format(summary.karaoke) }}</h3>
      </div>
      <div class="card fnb">
        <p>F&B</p>
        <h3>Rp {{ format(summary.fnb) }}</h3>
      </div>
    </section>

    <!-- CHART -->
    <section class="chart">
      <h3>Grafik Pendapatan Harian</h3>

      <div class="chart-bars">
        <div
          v-for="d in daily"
          :key="d.date"
          class="bar-wrapper"
        >
          <div
            class="bar"
            :style="{ height: barHeight(d.total) }"
          ></div>
          <span>{{ d.date.slice(8,10) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../../store/auth.store"

const auth = useAuthStore()
const router = useRouter()

const summary = ref({
  monthlyTotal: 0,
  yearlyTotal: 0,
  spa: 0,
  karaoke: 0,
  fnb: 0
})

const daily = ref([])

const format = n =>
  new Intl.NumberFormat("id-ID").format(n || 0)

const barHeight = (value) => {
  const max = Math.max(...daily.value.map(d => d.total), 1)
  return `${(value / max) * 160}px`
}

const logout = () => {
  auth.logout()
  router.push("/login")
}

const loadDashboard = async () => {
  const headers = {
    Authorization: `Bearer ${auth.token}`
  }

  const s = await fetch("/api/dashboard/owner/summary", { headers })
  summary.value = await s.json()

  const d = await fetch("/api/dashboard/owner/daily", { headers })
  daily.value = await d.json()
}

onMounted(loadDashboard)
</script>

<style scoped>
.owner-dashboard {
  min-height: 100vh;
  background: #0e0e0e;
  color: white;
  padding: 20px;
}

/* HEADER */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #c9a24d;
  padding-bottom: 12px;
}

.topbar h1 {
  color: #c9a24d;
  margin: 0;
}

.logout {
  background: transparent;
  border: 1px solid #c9a24d;
  color: #c9a24d;
  padding: 6px 12px;
  cursor: pointer;
}

/* SUMMARY */
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin: 24px 0;
}

.box {
  background: #111;
  border: 1px solid #333;
  padding: 20px;
  text-align: center;
}

.box h2 {
  color: #c9a24d;
}

/* CATEGORY */
.categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 32px;
}

.card {
  padding: 16px;
  text-align: center;
  border: 1px solid #333;
}

.card h3 {
  margin-top: 8px;
}

.spa { border-color: #2ecc71; }
.karaoke { border-color: #9b59b6; }
.fnb { border-color: #e67e22; }

/* CHART */
.chart h3 {
  margin-bottom: 16px;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  height: 200px;
  border-left: 1px solid #333;
  border-bottom: 1px solid #333;
  padding: 10px;
}

.bar-wrapper {
  text-align: center;
  width: 24px;
}

.bar {
  width: 100%;
  background: linear-gradient(#c9a24d, #8f6b1f);
  transition: height 0.3s ease;
}

.bar-wrapper span {
  font-size: 11px;
  color: #aaa;
}
</style>
