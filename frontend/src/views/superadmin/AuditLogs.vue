<template>
  <div class="p-6">
    <h2 class="text-2xl font-bold mb-4">Audit Logs</h2>

    <!-- FILTER -->
    <div class="flex gap-2 mb-4">
      <input 
        v-model="filter.user_id" 
        placeholder="User ID" 
        class="flex-1 bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
      />
      <input 
        type="date" 
        v-model="filter.from" 
        class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
      />
      <input 
        type="date" 
        v-model="filter.to" 
        class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
      />
      <button 
        @click="load" 
        class="bg-gold text-black px-4 py-2 rounded cursor-pointer hover:opacity-90 transition-opacity"
      >
        Filter
      </button>
    </div>

    <!-- TABLE -->
    <div class="bg-bg-card rounded-lg shadow-lg overflow-hidden">
      <table class="w-full border-collapse">
        <thead>
          <tr class="border-b border-gray-800">
            <th class="border border-gray-800 p-2 text-left text-sm">Waktu</th>
            <th class="border border-gray-800 p-2 text-left text-sm">User</th>
            <th class="border border-gray-800 p-2 text-left text-sm">Aksi</th>
            <th class="border border-gray-800 p-2 text-left text-sm">Target</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id" class="border-b border-gray-800 hover:bg-white/5 transition-colors">
            <td class="border border-gray-800 p-2 text-sm">{{ format(l.created_at) }}</td>
            <td class="border border-gray-800 p-2 text-sm">{{ l.username }}</td>
            <td class="border border-gray-800 p-2 text-sm">{{ l.action }}</td>
            <td class="border border-gray-800 p-2 text-sm">{{ l.target }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"

const logs = ref([])
const filter = ref({
  user_id: "",
  from: "",
  to: ""
})

const load = async () => {
  const params = {}
  if (filter.value.user_id) params.user_id = filter.value.user_id
  if (filter.value.from) params.from = filter.value.from
  if (filter.value.to) params.to = filter.value.to

  logs.value = (await api.get("/audit-logs", { params })).data
}

onMounted(load)

const format = (v) =>
  new Date(v).toLocaleString("id-ID")
</script>
