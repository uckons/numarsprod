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
  background: var(--bg-main);
  color: var(--text-main);
  padding: var(--space-xl);
}

/* HEADER */
.topbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--gold);
  padding-bottom: var(--space-md);
  margin-bottom: var(--space-2xl);
}

.topbar h1 {
  color: var(--gold);
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.topbar p {
  color: var(--text-muted);
  margin: var(--space-xs) 0 0;
  font-size: var(--font-size-sm);
}

.logout {
  background: transparent;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: var(--space-sm) var(--space-md);
  cursor: pointer;
  border-radius: var(--radius-xs);
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
}

.logout:hover {
  background: var(--gold-soft);
}

/* SUMMARY */
.summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-lg);
  margin: var(--space-2xl) 0;
}

.box {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  padding: var(--space-xl);
  text-align: center;
  border-radius: var(--radius);
}

.box p {
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-sm);
}

.box h2 {
  color: var(--gold);
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

/* CATEGORY */
.categories {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-lg);
  margin-bottom: var(--space-3xl);
}

.card {
  padding: var(--space-lg);
  text-align: center;
  border: 1px solid var(--border-light);
  border-radius: var(--radius);
  background: var(--bg-card);
  transition: all var(--transition-fast);
}

.card:hover {
  transform: translateY(-2px);
}

.card p {
  color: var(--text-muted);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.card h3 {
  margin-top: var(--space-sm);
  font-size: var(--font-size-xl);
  color: var(--text-main);
}

.spa { 
  border-color: var(--success); 
}

.spa:hover {
  border-color: var(--success);
  box-shadow: 0 0 16px rgba(46, 204, 113, 0.2);
}

.karaoke { 
  border-color: var(--category-karaoke);
}

.karaoke:hover {
  border-color: var(--category-karaoke);
  box-shadow: 0 0 16px rgba(155, 89, 182, 0.2);
}

.fnb { 
  border-color: var(--category-fnb);
}

.fnb:hover {
  border-color: var(--category-fnb);
  box-shadow: 0 0 16px rgba(230, 126, 34, 0.2);
}

/* CHART */
.chart {
  margin-top: var(--space-3xl);
}

.chart h3 {
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  gap: var(--space-sm);
  height: 200px;
  border-left: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
  padding: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius);
  overflow-x: auto;
}

.bar-wrapper {
  text-align: center;
  min-width: 24px;
  flex-shrink: 0;
}

.bar {
  width: 100%;
  background: linear-gradient(to top, var(--gold), #8f6b1f);
  transition: all var(--transition-base) ease;
  border-radius: 2px 2px 0 0;
}

.bar-wrapper:hover .bar {
  opacity: 0.8;
}

.bar-wrapper span {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: var(--space-xs);
  display: block;
}

/* Mobile optimization */
@media (max-width: 768px) {
  .owner-dashboard {
    padding: var(--space-lg);
  }
  
  .topbar {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-md);
  }
  
  .logout {
    width: 100%;
    text-align: center;
  }
  
  .summary,
  .categories {
    grid-template-columns: 1fr;
  }
  
  .chart-bars {
    padding: var(--space-sm);
  }
}

@media (max-width: 480px) {
  .owner-dashboard {
    padding: var(--space-md);
  }
  
  .topbar h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
