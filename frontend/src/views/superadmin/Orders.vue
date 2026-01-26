<template>
  <div class="p-5 md:p-6">
    <!-- HEADER -->
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white">Orders</h2>
        <p class="text-sm text-gray-400 mt-1">Summary & latest transactions</p>
      </div>
    </div>

    <!-- STATS -->
    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <p class="text-xs md:text-sm text-gray-400">Total Orders Today</p>
        <h3 class="mt-2 text-2xl md:text-3xl font-bold text-white">{{ stats.total }}</h3>
      </div>

      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <p class="text-xs md:text-sm text-gray-400">SPA</p>
        <h3 class="mt-2 text-2xl md:text-3xl font-bold text-gold">{{ stats.spa }}</h3>
      </div>

      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <p class="text-xs md:text-sm text-gray-400">LC</p>
        <h3 class="mt-2 text-2xl md:text-3xl font-bold text-[#3498db]">{{ stats.lc }}</h3>
      </div>

      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        <p class="text-xs md:text-sm text-gray-400">FNB</p>
        <h3 class="mt-2 text-2xl md:text-3xl font-bold text-success">{{ stats.fnb }}</h3>
      </div>

      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-4 md:p-5 shadow-[0_12px_40px_rgba(0,0,0,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_60px_rgba(0,0,0,0.6)] col-span-2 sm:col-span-1">
        <p class="text-xs md:text-sm text-gray-400">Karaoke</p>
        <h3 class="mt-2 text-2xl md:text-3xl font-bold text-[#e67e22]">{{ stats.karaoke }}</h3>
      </div>
    </div>

    <!-- FILTER -->
    <div class="bg-bg-card rounded-xl p-4 shadow-lg mt-5">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input 
          type="date" 
          v-model="dateFrom" 
          class="flex-1 bg-black border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
        />
        <input 
          type="date" 
          v-model="dateTo" 
          class="flex-1 bg-black border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
        />

        <select 
          v-model="perPage"
          class="flex-1 sm:flex-initial bg-black border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all"
        >
          <option v-for="n in [100,200,300,400,500]" :key="n" :value="n">
            {{ n }} / page
          </option>
        </select>

        <button 
          class="px-5 py-2 border border-gold text-gold rounded-lg hover:bg-gold hover:text-black transition-all duration-200 font-medium"
          @click="applyFilter"
        >
          Apply
        </button>
      </div>
    </div>

    <!-- TABLE -->
    <div class="bg-bg-card rounded-xl p-4 shadow-lg mt-5">
      <h3 class="text-lg font-semibold text-white mb-3">Latest Orders</h3>

      <div class="overflow-x-auto">
        <table class="w-full border-collapse min-w-[500px]">
          <thead>
            <tr>
              <th class="text-left text-gray-400 text-sm p-3">ID</th>
              <th class="text-left text-gray-400 text-sm p-3">Category</th>
              <th class="text-left text-gray-400 text-sm p-3">Total</th>
              <th class="text-left text-gray-400 text-sm p-3">Time</th>
            </tr>
          </thead>

          <tbody>
            <tr v-if="!orders.length">
              <td colspan="4" class="text-center py-8 text-gray-500">No orders found</td>
            </tr>

            <tr
              v-for="o in orders"
              :key="o.id"
              class="group transition-all duration-300 hover:bg-gradient-to-r hover:from-gold/5 hover:to-gold/0 hover:translate-x-1 hover:shadow-[inset_4px_0_0_theme(colors.gold)]"
            >
              <td class="p-3 border-t border-gray-800">#{{ o.id }}</td>
              <td class="p-3 border-t border-gray-800">
                <span class="inline-block bg-gold/20 text-gold px-2.5 py-1 rounded-xl text-xs font-medium">
                  {{ o.categories }}
                </span>
              </td>
              <td class="p-3 border-t border-gray-800 font-semibold">Rp {{ format(o.total) }}</td>
              <td class="p-3 border-t border-gray-800 text-sm text-gray-300">{{ new Date(o.created_at).toLocaleString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PAGINATION -->
      <div class="flex flex-col sm:flex-row justify-between items-center gap-3 mt-4 pt-4 border-t border-gray-800">
        <button 
          @click="page--" 
          :disabled="page === 1"
          class="w-full sm:w-auto px-5 py-2 border border-gold text-gold rounded-lg transition-all duration-200 hover:bg-gold hover:text-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          Prev
        </button>
        <span class="text-sm text-gray-400">Page {{ page }} / {{ totalPages }}</span>
        <button 
          @click="page++" 
          :disabled="page === totalPages"
          class="w-full sm:w-auto px-5 py-2 border border-gold text-gold rounded-lg transition-all duration-200 hover:bg-gold hover:text-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gold"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/services/api"

const orders = ref([])
const filtered = ref([])

const page = ref(1)
const perPage = ref(100)

const dateFrom = ref("")
const dateTo = ref("")

const stats = ref({
  total: 0,
  spa: 0,
  lc: 0,
  fnb: 0,
  karaoke: 0
})

onMounted(async () => {
  const res = await api.get("/superadmin/orders")
  orders.value = res.data || []
  applyFilter()
})

const applyFilter = () => {
  page.value = 1

  filtered.value = orders.value.filter(o => {
    const d = new Date(o.created_at)
    if (dateFrom.value && d < new Date(dateFrom.value)) return false
    if (dateTo.value && d > new Date(dateTo.value + " 23:59")) return false
    return true
  })

  calculateStats()
}

const calculateStats = () => {
  stats.value = { total: 0, spa: 0, lc: 0, fnb: 0, karaoke: 0 }
  const today = new Date().toDateString()

  filtered.value.forEach(o => {
    if (new Date(o.created_at).toDateString() === today) {
      stats.value.total++
      const k = o.category?.toLowerCase()
      if (stats.value[k] !== undefined) stats.value[k]++
    }
  })
}

const totalPages = computed(() =>
  Math.ceil(filtered.value.length / perPage.value)
)

const pagedOrders = computed(() => {
  const start = (page.value - 1) * perPage.value
  return filtered.value.slice(start, start + perPage.value)
})

const format = v => Number(v || 0).toLocaleString("id-ID")
</script>
