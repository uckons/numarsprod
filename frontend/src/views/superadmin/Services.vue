<template>
  <div class="p-6">
    <!-- HEADER -->
    <div class="flex justify-between items-center mb-4">
      <div>
        <h2 class="text-2xl font-bold">Services</h2>
        <p class="text-gray-500 text-sm">Manage SPA / LC / FNB / Karaoke services</p>
      </div>

      <button class="bg-gold text-black px-4 py-2 rounded cursor-pointer hover:opacity-90 transition-opacity" @click="openAdd">
        + Add Service
      </button>
    </div>

    <!-- STATS -->
    <div class="grid grid-cols-3 gap-4 mt-4">
      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default">
        <p class="text-sm text-gray-400">Total Service</p>
        <h3 class="mt-2 text-3xl font-bold">{{ total }}</h3>
      </div>

      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default">
        <p class="text-sm text-gray-400">Active</p>
        <h3 class="mt-2 text-3xl font-bold text-success">{{ active }}</h3>
      </div>

      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl cursor-default">
        <p class="text-sm text-gray-400">Disabled</p>
        <h3 class="mt-2 text-3xl font-bold text-danger">{{ disabled }}</h3>
      </div>
    </div>

    <!-- FILTER -->
    <div class="flex gap-3 mt-4">
      <input 
        v-model="keyword" 
        placeholder="Search service..." 
        class="flex-1 bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
      />

      <select 
        v-model="selectedBranch" 
        class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors cursor-pointer"
      >
        <option value="">All Branches</option>
        <option v-for="b in branches" :key="b.id" :value="b.id">
          {{ b.name }}
        </option>
      </select>

      <select 
        v-model="selectedType" 
        class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors cursor-pointer"
      >
        <option value="">All Types</option>
        <option value="SPA">SPA</option>
        <option value="LC">LC</option>
        <option value="FNB">FNB</option>
        <option value="KARAOKE">KARAOKE</option>
      </select>

      <button 
        class="bg-transparent border border-gold text-gold px-4 py-2 rounded hover:bg-gold hover:text-black transition-all cursor-pointer" 
        @click="loadServices(1)"
      >
        Search
      </button>
    </div>

    <!-- TABLE -->
    <div class="bg-bg-card rounded-lg p-4 mt-4 shadow-lg">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-gray-500 text-xs p-3 text-left">Name</th>
            <th class="text-gray-500 text-xs p-3 text-left">Branch</th>
            <th class="text-gray-500 text-xs p-3 text-left">Type</th>
            <th class="text-gray-500 text-xs p-3 text-left">Duration</th>
            <th class="text-gray-500 text-xs p-3 text-left">Price</th>
            <th class="text-gray-500 text-xs p-3 text-left">Status</th>
            <th class="text-gray-500 text-xs p-3 text-left" width="220">Actions</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="loading">
            <td colspan="7" class="text-center p-8 text-gray-500">Loading...</td>
          </tr>

          <tr v-else-if="!services.length">
            <td colspan="7" class="text-center p-8 text-gray-500">No services found</td>
          </tr>

          <tr
            v-for="s in services"
            :key="s.id"
            class="transition-all duration-300 hover:bg-gradient-to-r hover:from-gold/10 hover:to-gold/5 hover:translate-x-1 hover:shadow-[inset_4px_0_0_var(--gold)]"
          >
            <td class="p-3 border-t border-gray-900 font-semibold">{{ s.name }}</td>

            <!-- BRANCH BADGE -->
            <td class="p-3 border-t border-gray-900">
              <span class="px-3 py-1 rounded-xl text-xs bg-white/10">
                {{ s.branch_name || s.branch?.name || '—' }}
              </span>
            </td>

            <td class="p-3 border-t border-gray-900">
              <span class="px-3 py-1 rounded-xl text-xs bg-gold/20 text-gold">{{ s.type }}</span>
            </td>

            <td class="p-3 border-t border-gray-900">
              {{ s.duration_minutes ? s.duration_minutes + " min" : "-" }}
            </td>

            <td class="p-3 border-t border-gray-900 font-semibold">
              Rp {{ format(s.base_price) }}
            </td>

            <td class="p-3 border-t border-gray-900">
              <span
                class="px-3 py-1 rounded-xl text-xs"
                :class="s.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'"
              >
                {{ s.is_active ? "ACTIVE" : "DISABLED" }}
              </span>
            </td>

            <td class="p-3 border-t border-gray-900">
              <button 
                @click="edit(s)" 
                class="mr-2 border-none px-3 py-2 rounded cursor-pointer transition-all hover:-translate-y-0.5 bg-gray-800 hover:bg-gray-700"
              >
                Edit
              </button>
              <button
                :class="s.is_active ? 'bg-danger/20 text-danger hover:bg-danger/30' : 'bg-success/20 text-success hover:bg-success/30'"
                @click="toggle(s)"
                class="border-none px-3 py-2 rounded cursor-pointer transition-all hover:-translate-y-0.5"
              >
                {{ s.is_active ? "Disable" : "Enable" }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- PAGINATION -->
      <div class="flex justify-center gap-3 mt-4">
        <div class="flex items-center gap-2">
          Show
          <select 
            v-model="perPage" 
            @change="loadServices(1)" 
            class="bg-black border border-gray-800 text-white p-1 rounded cursor-pointer"
          >
            <option :value="30">30</option>
            <option :value="50">50</option>
            <option :value="100">100</option>
          </select>
        </div>

        <div class="flex items-center gap-2">
          <button 
            @click="loadServices(page-1)" 
            :disabled="page===1" 
            class="px-3 py-1 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          <span>Page {{ page }}</span>
          <button 
            @click="loadServices(page+1)" 
            :disabled="services.length < perPage" 
            class="px-3 py-1 bg-gray-800 rounded cursor-pointer hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL -->
    <ServiceForm
      v-if="showForm"
      :edit="!!selected"
      :data="selected"
      @saved="reload"
      @close="close"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue"
import api from "@/services/api"
import ServiceForm from "./ServiceForm.vue"

const services = ref([])
const branches = ref([])
const loading = ref(false)

const selected = ref(null)
const showForm = ref(false)

const keyword = ref("")
const selectedBranch = ref("")
const selectedType = ref("")

const page = ref(1)
const perPage = ref(30)

/* LOAD BRANCHES */
const loadBranches = async () => {
  const res = await api.get("/branches")
  branches.value = res.data.data || res.data
}

/* LOAD SERVICES */
const loadServices = async () => {
  loading.value = true
  try {
    const res = await api.get("/services", {
      params: {
        q: keyword.value || undefined,
        branch_id: selectedBranch.value || undefined,
        type: selectedType.value || undefined
      }
    })

    // ?? KUNCI AGAR SELALU ARRAY
    if (Array.isArray(res.data)) {
      services.value = res.data
    } else if (Array.isArray(res.data.data)) {
      services.value = res.data.data
    } else {
      services.value = []
    }

  } catch (err) {
    console.error("Load services error:", err)
    services.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await loadBranches()
  await loadServices(1)
})

/* ACTIONS */
const openAdd = () => {
  selected.value = null
  showForm.value = true
}

const edit = (s) => {
  selected.value = { ...s }
  showForm.value = true
}
const close = () => {
  showForm.value = false   // ?? INI YANG SERING HILANG
  selected.value = null
}

const reload = async () => {
  showForm.value = false   // ?? WAJIB
  selected.value = null
  await loadServices()
}
const toggle = async (s) => {
  // optimistic UI (langsung berubah)
  const previous = s.is_active
  s.is_active = !s.is_active
  try {
    await api.put(`/services/${s.id}/toggle`)
    //s.is_active = !s.is_active
  } catch (err) {
    s.is_active = !s.is_active
    console.error("Toggle failed", err)
    alert("Gagal mengubah status service")
  }
}

/* STATS */
const total = computed(() => services.value.length)
const active = computed(() => services.value.filter(s => s.is_active).length)
const disabled = computed(() => total.value - active.value)

const format = (v) =>
  Number(v || 0).toLocaleString("id-ID")
</script>
