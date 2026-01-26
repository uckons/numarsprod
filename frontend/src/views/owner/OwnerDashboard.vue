<template>
  <div class="min-h-screen bg-bg-main text-text-main p-4 md:p-5">
    <!-- HEADER -->
    <header class="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gold pb-3 mb-6">
      <div>
        <h1 class="text-gold text-xl md:text-2xl font-semibold">NUMARS POS</h1>
        <p class="text-text-muted text-sm">Owner Dashboard</p>
      </div>
      <button 
        class="bg-transparent border border-gold text-gold px-4 py-1.5 rounded-[10px] hover:bg-gold-soft transition-colors cursor-pointer self-start sm:self-auto"
        @click="logout"
      >
        Logout
      </button>
    </header>

    <!-- SUMMARY -->
    <section class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div class="bg-bg-card border border-border-soft p-5 text-center rounded-[10px]">
        <p class="text-text-muted text-sm mb-2">Omset Bulanan</p>
        <h2 class="text-gold text-2xl font-semibold">Rp {{ format(summary.monthlyTotal) }}</h2>
      </div>
      <div class="bg-bg-card border border-border-soft p-5 text-center rounded-[10px]">
        <p class="text-text-muted text-sm mb-2">Omset Tahunan</p>
        <h2 class="text-gold text-2xl font-semibold">Rp {{ format(summary.yearlyTotal) }}</h2>
      </div>
    </section>

    <!-- CATEGORY TOTAL -->
    <section class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
      <div class="p-4 text-center border border-success rounded-[10px] bg-bg-card">
        <p class="text-text-muted text-sm mb-2">SPA</p>
        <h3 class="text-success text-xl font-semibold">Rp {{ format(summary.spa) }}</h3>
      </div>
      <div class="p-4 text-center border border-purple-500 rounded-[10px] bg-bg-card">
        <p class="text-text-muted text-sm mb-2">KARAOKE</p>
        <h3 class="text-purple-400 text-xl font-semibold">Rp {{ format(summary.karaoke) }}</h3>
      </div>
      <div class="p-4 text-center border border-orange-500 rounded-[10px] bg-bg-card">
        <p class="text-text-muted text-sm mb-2">F&B</p>
        <h3 class="text-orange-400 text-xl font-semibold">Rp {{ format(summary.fnb) }}</h3>
      </div>
    </section>

    <!-- CHART -->
    <section>
      <h3 class="text-lg font-semibold mb-4">Grafik Pendapatan Harian</h3>

      <div class="flex items-end gap-2 md:gap-3 h-[220px] border-l border-b border-border-soft p-2 md:p-3 overflow-x-auto">
        <div
          v-for="d in daily"
          :key="d.date"
          class="flex flex-col items-center justify-end min-w-[24px]"
        >
          <div
            class="w-full bg-gradient-to-t from-[#8f6b1f] to-gold transition-all duration-300 ease-in-out"
            :style="{ height: barHeight(d.total) }"
          ></div>
          <span class="text-[11px] text-text-muted mt-1">{{ d.date.slice(8,10) }}</span>
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
