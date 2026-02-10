<template>
  <div class="reports-page">
    <header class="page-header">
      <div>
        <h1>Laporan Pendapatan</h1>
        <p>Analytics harian, mingguan, bulanan + custom range</p>
      </div>
      <button class="back-btn" @click="router.push('/kasir')">← Kembali</button>
    </header>

    <section class="filters">
      <label>Periode</label>
      <select v-model="filters.preset" @change="onPresetChange">
        <option value="daily">Harian</option>
        <option value="weekly">Mingguan</option>
        <option value="monthly">Bulanan</option>
      </select>
      <label>Dari</label>
      <input type="date" v-model="filters.date_from" />
      <label>Sampai</label>
      <input type="date" v-model="filters.date_to" />
      <button class="apply-btn" @click="loadAnalytics">Terapkan</button>
      <button class="ghost-btn" @click="resetRange">Reset</button>
    </section>

    <section class="summary-grid">
      <article class="summary-card">
        <span>Total Pendapatan</span>
        <strong>Rp {{ format(analytics.summary.revenue) }}</strong>
      </article>
      <article class="summary-card">
        <span>Order PAID</span>
        <strong>{{ analytics.summary.paid_orders }}</strong>
      </article>
      <article class="summary-card">
        <span>Item Terjual</span>
        <strong>{{ analytics.summary.items_sold }}</strong>
      </article>
      <article class="summary-card">
        <span>Range</span>
        <strong>{{ analytics.range.from }} — {{ analytics.range.to }}</strong>
      </article>
    </section>

    <section class="chart-panel">
      <h3>Grafik Pendapatan</h3>
      <Line :data="trendChartData" :options="trendChartOptions" />
    </section>

    <section class="chart-panel">
      <h3>Grafik Pendapatan per Kategori (SPA / LC / FNB / KTV)</h3>
      <Bar :data="breakdownChartData" :options="breakdownChartOptions" />
    </section>

    <section class="two-col">
      <article class="table-card">
        <h3>Breakdown Service</h3>
        <table>
          <thead>
            <tr><th>Kategori</th><th>Qty</th><th>Pendapatan</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in normalizedBreakdown" :key="row.category">
              <td>{{ row.category }}</td>
              <td>{{ row.qty }}</td>
              <td>Rp {{ format(row.revenue) }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="table-card">
        <h3>FNB Terlaris</h3>
        <table>
          <thead>
            <tr><th>Item</th><th>Qty</th><th>Pendapatan</th></tr>
          </thead>
          <tbody>
            <tr v-for="row in analytics.top_fnb" :key="row.service_id">
              <td>{{ row.service_name }}</td>
              <td>{{ row.qty }}</td>
              <td>Rp {{ format(row.revenue) }}</td>
            </tr>
            <tr v-if="!analytics.top_fnb.length"><td colspan="3" class="muted">Belum ada data FNB</td></tr>
          </tbody>
        </table>
      </article>
    </section>

    <section class="table-card">
      <h3>Terapis Terlaris</h3>
      <table>
        <thead>
          <tr><th>Nama Terapis</th><th>Order</th><th>Pendapatan</th></tr>
        </thead>
        <tbody>
          <tr v-for="row in analytics.top_therapists" :key="row.therapist_name">
            <td>{{ row.therapist_name }}</td>
            <td>{{ row.orders }}</td>
            <td>Rp {{ format(row.revenue) }}</td>
          </tr>
          <tr v-if="!analytics.top_therapists.length"><td colspan="3" class="muted">Belum ada data terapis</td></tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'
import Swal from 'sweetalert2'
import { Line, Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const router = useRouter()

const filters = ref({
  preset: 'daily',
  date_from: '',
  date_to: ''
})

const analytics = ref({
  range: { from: '-', to: '-' },
  summary: { revenue: 0, paid_orders: 0, items_sold: 0 },
  breakdown: [],
  top_fnb: [],
  top_therapists: [],
  trend: []
})

const format = (n) => new Intl.NumberFormat('id-ID').format(Number(n || 0))

const onPresetChange = () => {
  filters.value.date_from = ''
  filters.value.date_to = ''
}

const resetRange = async () => {
  filters.value.date_from = ''
  filters.value.date_to = ''
  await loadAnalytics()
}

const loadAnalytics = async () => {
  try {
    const { data } = await api.get('/dashboard/kasir/analytics', {
      params: {
        preset: filters.value.preset,
        date_from: filters.value.date_from || undefined,
        date_to: filters.value.date_to || undefined
      }
    })
    analytics.value = data
  } catch (err) {
    await Swal.fire({
      icon: 'error',
      title: 'Gagal memuat laporan',
      text: err.response?.data?.message || 'Terjadi kesalahan saat mengambil data analytics.',
      background: '#111',
      color: '#fff'
    })
  }
}

const normalizedBreakdown = computed(() => {
  const base = { SPA: 0, LC: 0, FNB: 0, KTV: 0 }
  const qty = { SPA: 0, LC: 0, FNB: 0, KTV: 0 }
  for (const row of analytics.value.breakdown || []) {
    const key = row.category === 'KARAOKE' ? 'KTV' : row.category
    if (base[key] !== undefined) {
      base[key] += Number(row.revenue || 0)
      qty[key] += Number(row.qty || 0)
    }
  }
  return Object.keys(base).map((category) => ({
    category,
    qty: qty[category],
    revenue: base[category]
  }))
})

const trendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `Rp ${format(ctx.parsed.y || 0)}`
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a2b8' },
      grid: { color: '#273043', borderDash: [4, 4] }
    },
    y: {
      ticks: {
        color: '#94a2b8',
        callback: (value) => `Rp ${format(value)}`
      },
      grid: { color: '#273043', borderDash: [4, 4] }
    }
  }
}))

const trendChartData = computed(() => ({
  labels: (analytics.value.trend || []).map((row) => row.label),
  datasets: [
    {
      label: 'Pendapatan',
      data: (analytics.value.trend || []).map((row) => Number(row.revenue || 0)),
      borderColor: '#f0c46a',
      backgroundColor: 'rgba(240,196,106,0.2)',
      fill: true,
      tension: 0.35,
      pointRadius: 3,
      pointHoverRadius: 5
    }
  ]
}))

const breakdownChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `Rp ${format(ctx.parsed.y || 0)}`
      }
    }
  },
  scales: {
    x: {
      ticks: { color: '#94a2b8' },
      grid: { color: '#273043', borderDash: [4, 4] }
    },
    y: {
      ticks: {
        color: '#94a2b8',
        callback: (value) => `Rp ${format(value)}`
      },
      grid: { color: '#273043', borderDash: [4, 4] }
    }
  }
}))

const breakdownChartData = computed(() => ({
  labels: normalizedBreakdown.value.map((row) => row.category),
  datasets: [
    {
      label: 'Pendapatan',
      data: normalizedBreakdown.value.map((row) => Number(row.revenue || 0)),
      backgroundColor: ['#8b5cf6', '#f0c46a', '#22c55e', '#3b82f6'],
      borderRadius: 8,
      borderSkipped: false
    }
  ]
}))

onMounted(loadAnalytics)
</script>

<style scoped>
.reports-page { padding: 20px; color: #fff; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
.page-header h1 { margin: 0 0 4px; color: #f0c46a; }
.page-header p { margin: 0; color: #9aa0ae; }
.back-btn { border: 1px solid #2e2e2e; background: #131313; color: #fff; border-radius: 10px; padding: 10px 14px; cursor: pointer; }

.filters { display: grid; grid-template-columns: auto 180px auto 170px auto 170px 120px 100px; gap: 10px; align-items: center; background:#121212; border:1px solid #242424; border-radius:12px; padding: 12px; margin-bottom: 14px; }
.filters select, .filters input { background:#1a1a1a; border:1px solid #2f2f2f; color:#fff; border-radius:8px; padding:8px; }
.apply-btn { background:#c9a24d; border:none; color:#111; font-weight:700; border-radius:8px; padding:9px; cursor:pointer; }
.ghost-btn { background:transparent; border:1px solid #474747; color:#fff; border-radius:8px; padding:9px; cursor:pointer; }

.summary-grid { display:grid; gap:12px; grid-template-columns: repeat(4, minmax(0,1fr)); margin-bottom:14px; }
.summary-card { background:#111; border:1px solid #232323; border-radius:12px; padding:14px; display:flex; flex-direction:column; gap:6px; }
.summary-card span { color:#9aa0ae; font-size:12px; }
.summary-card strong { font-size:22px; color:#f0c46a; }

.chart-panel, .table-card { background:#111; border:1px solid #232323; border-radius:12px; padding:14px; margin-bottom:14px; }
.chart-panel h3, .table-card h3 { margin:0 0 12px; }

:deep(canvas) {
  min-height: 280px;
}


.two-col { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:12px; }
table { width:100%; border-collapse: collapse; }
th, td { padding:10px; border-bottom:1px solid #212121; text-align:left; }
th { color:#f0c46a; font-size:12px; }
.muted { text-align:center; color:#8a8a8a; }

@media (max-width: 1024px) {
  .filters { grid-template-columns: 1fr 1fr; }
  .summary-grid { grid-template-columns: 1fr 1fr; }
  .two-col { grid-template-columns: 1fr; }
}
</style>
