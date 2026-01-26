<template>
  <div class="p-5 md:p-6">
    <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
      <div>
        <h2 class="text-2xl font-bold text-white">Branches</h2>
        <p class="text-sm text-gray-400 mt-1">Manage company branches</p>
      </div>

      <button 
        class="bg-gold text-black font-semibold px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 self-start sm:self-auto" 
        @click="openAdd"
      >
        + Add Branch
      </button>
    </div>

    <div class="bg-bg-card rounded-xl p-4 shadow-lg overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left text-gray-400 text-sm p-2.5">Name</th>
            <th class="text-left text-gray-400 text-sm p-2.5 hidden sm:table-cell">Address</th>
            <th class="text-left text-gray-400 text-sm p-2.5 hidden md:table-cell">Operating Hours</th>
            <th class="text-left text-gray-400 text-sm p-2.5 hidden lg:table-cell">Users</th>
            <th class="text-left text-gray-400 text-sm p-2.5">Status</th>
            <th class="text-left text-gray-400 text-sm p-2.5 w-48">Actions</th>
          </tr>
        </thead>

        <tbody>
          <!-- LOADING -->
          <tr v-if="loading">
            <td colspan="6" class="text-center py-8 text-gray-500">Loading...</td>
          </tr>

          <!-- EMPTY -->
          <tr v-else-if="!branches.length">
            <td colspan="6" class="text-center py-8 text-gray-500">No branches found</td>
          </tr>

          <!-- DATA -->
          <tr 
            v-else 
            v-for="b in branches" 
            :key="b.id" 
            class="group hover:bg-gold/5 transition-colors duration-200"
          >
            <td class="p-2.5 border-t border-gray-800 font-semibold">{{ b.name }}</td>
            <td class="p-2.5 border-t border-gray-800 hidden sm:table-cell">{{ b.address || "-" }}</td>
            <td class="p-2.5 border-t border-gray-800 hidden md:table-cell">{{ b.open_time }} - {{ b.close_time }}</td>
            <td class="p-2.5 border-t border-gray-800 hidden lg:table-cell">{{ b.user_count }}</td>
            <td class="p-2.5 border-t border-gray-800">
              <span
                class="inline-block px-2.5 py-1 rounded-xl text-xs font-medium"
                :class="b.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'"
              >
                {{ b.is_active ? "ACTIVE" : "DISABLED" }}
              </span>
            </td>
            <td class="p-2.5 border-t border-gray-800">
              <div class="flex flex-wrap gap-2">
                <button 
                  class="px-3 py-1.5 text-sm border border-gold text-gold rounded-lg hover:bg-gold hover:text-black transition-all duration-200"
                  @click="edit(b)"
                >
                  Edit
                </button>
                <button
                  class="px-3 py-1.5 text-sm rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg"
                  :class="b.is_active 
                    ? 'bg-danger/20 text-danger hover:bg-danger/30' 
                    : 'bg-success/20 text-success hover:bg-success/30'"
                  @click="toggle(b)"
                >
                  {{ b.is_active ? "Disable" : "Enable" }}
                </button>
                <button
                  v-if="b.id !== 1"
                  class="px-3 py-1.5 text-sm bg-gradient-to-br from-gold to-[#F5D27A] text-black rounded-lg font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(201,162,77,0.4)]"
                  @click="cloneServices(b.id)"
                >
                  Clone Services
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <BranchForm
      v-if="showForm"
      :edit="!!selected"
      :data="selected"
      @saved="reload"
      @close="close"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"
import BranchForm from "./BranchForm.vue"

const branches = ref([])
const loading = ref(false)
const showForm = ref(false)
const selected = ref(null)

const load = async () => {
  loading.value = true
  try {
    const res = await api.get("/branches")
    branches.value = res.data.data   // ?? INI YANG PENTING
  } catch (e) {
    console.error("Failed load branches", e)
  } finally {
    loading.value = false
  }
}

onMounted(load)

const openAdd = () => {
  selected.value = null
  showForm.value = true
}

const edit = (b) => {
  selected.value = { ...b }
  showForm.value = true
}

const toggle = async (b) => {
  await api.put(`/branches/${b.id}/toggle`)
  b.is_active = !b.is_active
}

const reload = async () => {
  showForm.value = false
  await load()
}

const close = () => {
  showForm.value = false
  selected.value = null
}

const cloneServices = async (branchId) => {
  const ok = confirm(
    "Clone all services from Pondok Indah?\n" +
    "Services will be INACTIVE by default."
  )
  if (!ok) return

  try {
    await api.post("/services/clone-from-template", {
      target_branch_id: branchId
    })

    alert("? Services cloned successfully (DRAFT)")
  } catch (err) {
    console.error(err)
    alert(err.response?.data?.message || "Clone failed")
  }
}

</script>
