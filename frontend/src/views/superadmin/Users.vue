<template>
  <div class="p-6">

    <!-- HEADER -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h2 class="text-2xl font-bold text-white">User Management</h2>
        <p class="text-gray-400 text-sm mt-1">Manage system users & access</p>
      </div>
      <button class="bg-gold text-black font-semibold px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all duration-150" @click="openAdd">+ Add User</button>
    </div>
    <!-- STATS -->
<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-4">
  <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-250">
    <p class="text-sm text-gray-400">Total Users</p>
    <h3 class="text-3xl font-bold mt-2 text-white">{{ stats.total }}</h3>
  </div>

  <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-250">
    <p class="text-sm text-gray-400">Active</p>
    <h3 class="text-3xl font-bold mt-2 text-success">{{ stats.active }}</h3>
  </div>

  <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-250">
    <p class="text-sm text-gray-400">Disabled</p>
    <h3 class="text-3xl font-bold mt-2 text-danger">{{ stats.disabled }}</h3>
  </div>

  <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-250">
    <p class="text-sm text-gray-400">New This Month</p>
    <h3 class="text-3xl font-bold mt-2 text-gold">+{{ stats.new_month }}</h3>
  </div>
</div>

    <!-- FILTER -->
    <div class="bg-bg-card rounded-xl p-4 mt-4 shadow-lg flex flex-col sm:flex-row gap-3">
      <input v-model="q" placeholder="Search username..." class="flex-1 bg-black border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gold transition-colors" />
      <select v-model="role" class="flex-1 sm:flex-none bg-black border border-gray-700 text-white px-3 py-2 rounded-lg focus:outline-none focus:border-gold transition-colors">
        <option value="">All Roles</option>
        <option v-for="r in roles" :key="r" :value="r">{{ r }}</option>
      </select>
      <button class="bg-transparent border border-gold text-gold px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed" @click="load" :disabled="loading">
        {{ loading ? "Loading..." : "Search" }}
      </button>
    </div>

    <!-- BULK BAR -->
    <transition name="fade">
      <div v-if="selectedIds.length" class="mt-3 p-3 bg-gold/10 border border-gold rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <span class="text-white">{{ selectedIds.length }} selected</span>
        <div class="flex gap-2 flex-wrap">
          <button class="bg-warn text-white px-3 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all duration-150" @click="bulkToggle">Toggle Active</button>
          <button class="bg-danger text-white px-3 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all duration-150" @click="bulkDelete">Delete</button>
        </div>
      </div>
    </transition>

    <!-- TABLE -->
    <div class="bg-bg-card rounded-xl p-4 mt-4 shadow-lg overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
  <tr>
    <th class="w-10 text-gray-400 text-xs px-3 py-3 text-left">
      <input
        type="checkbox"
        v-model="selectAll"
        @change="toggleAll"
        class="cursor-pointer accent-gold"
      />
    </th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap">Full Name</th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap">Username</th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap">Phone</th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap">Role</th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap">Branch</th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap">Status</th>
    <th class="text-gray-400 text-xs px-3 py-3 text-left whitespace-nowrap min-w-[260px]">Actions</th>
  </tr>
</thead>


        <transition-group name="fade" tag="tbody">
          <!-- LOADING -->
          <tr v-if="loading" v-for="i in limit" :key="'sk'+i">
            <td colspan="8" class="px-3 py-3 border-t border-gray-800">
              <div class="h-3.5 rounded-lg bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:400%_100%] animate-[skeleton_1.4s_infinite]"></div>
            </td>
          </tr>

          <!-- EMPTY -->
          <tr v-else-if="!users.length" key="empty">
            <td colspan="8" class="px-3 py-3 border-t border-gray-800 text-center text-gray-400">No users found</td>
          </tr>

          <!-- DATA -->
          <tr
  v-for="u in users"
  :key="u.id"
  class="transition-all duration-250 hover:bg-gradient-to-r hover:from-gold/8 hover:to-gold/2 hover:translate-x-1 hover:shadow-[inset_4px_0_0_theme(colors.gold)]"
>
  <!-- CHECKBOX -->
  <td class="px-3 py-3 border-t border-gray-800">
    <input
      type="checkbox"
      :value="u.id"
      v-model="selectedIds"
      class="cursor-pointer accent-gold"
    />
  </td>

  <!-- FULL NAME -->
  <td class="px-3 py-3 border-t border-gray-800 font-semibold text-white whitespace-nowrap">
    {{ u.name }}
  </td>

  <!-- USERNAME -->
  <td class="px-3 py-3 border-t border-gray-800 font-medium text-white whitespace-nowrap">
    {{ u.username }}
  </td>

  <!-- PHONE -->
  <td class="px-3 py-3 border-t border-gray-800 text-gray-400 text-sm whitespace-nowrap">
    {{ u.phone }}
  </td>

  <!-- ROLE -->
  <td class="px-3 py-3 border-t border-gray-800 whitespace-nowrap">
    <span class="inline-block px-2.5 py-1 rounded-xl text-xs bg-gold/20 text-gold">{{ u.role }}</span>
  </td>

  <!-- BRANCH -->
  <td class="px-3 py-3 border-t border-gray-800 text-white whitespace-nowrap">
    {{ u.branch || "-" }}
  </td>

  <!-- STATUS -->
  <td class="px-3 py-3 border-t border-gray-800 whitespace-nowrap">
    <span
      class="inline-block px-2.5 py-1 rounded-xl text-xs"
      :class="u.is_active ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'"
    >
      {{ u.is_active ? "ACTIVE" : "DISABLED" }}
    </span>
  </td>

  <!-- ACTIONS -->
  <td class="px-3 py-3 border-t border-gray-800 whitespace-nowrap">
    <button class="bg-gray-700 text-white px-3 py-2 rounded-lg mr-1.5 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-200" @click="edit(u)">Edit</button>
    <button class="bg-warn text-white px-3 py-2 rounded-lg mr-1.5 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-200" @click="reset(u)">Reset PW</button>
    <button
      class="px-3 py-2 rounded-lg hover:-translate-y-0.5 hover:shadow-lg active:scale-95 transition-all duration-200 text-white"
      :class="u.is_active ? 'bg-danger' : 'bg-success'"
      @click="toggle(u)"
    >
      {{ u.is_active ? "Disable" : "Enable" }}
    </button>
  </td>
</tr>

        </transition-group>
      </table>

      <!-- PAGINATION -->
      <div class="flex justify-center items-center gap-3 mt-4">
        <button class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="page===1" @click="prev">Prev</button>
        <span class="text-white">Page {{ page }}</span>
        <button class="bg-gray-700 text-white px-4 py-2 rounded-lg hover:brightness-110 active:scale-95 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed" :disabled="page*limit>=total" @click="next">Next</button>
      </div>
    </div>

    <!-- MODAL -->
    <transition name="fade">
      <UserForm
        v-if="showForm"
        :edit="!!selected"
        :data="selected"
        @saved="reload"
        @close="close"
      />
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"
import UserForm from "./UserForm.vue"

/* STATE */
const users = ref([])
const showForm = ref(false)
const selected = ref(null)

const selectedIds = ref([])
const selectAll = ref(false)

const q = ref("")
const role = ref("")
const page = ref(1)
const limit = 10
const total = ref(0)
const loading = ref(false)

const roles = ["SuperAdmin","Owner","Manager","Kasir","Terapis"]
const stats = ref({
  total: 0,
  active: 0,
  disabled: 0,
  new_month: 0
})

/* LOAD */
const load = async () => {
  loading.value = true
  try {
    const [usersRes, statsRes] = await Promise.all([
      api.get("/users/search", {
        params: {
          q: q.value,
          role: role.value,
          page: page.value,
          limit
        }
      }),
      api.get("/users/stats")
    ])

    users.value = usersRes.data.data
    total.value = usersRes.data.total
    stats.value = statsRes.data

    selectedIds.value = []
    selectAll.value = false
  } finally {
    loading.value = false
  }
}

onMounted(load)

/* PAGINATION */
const next = () => { page.value++; load() }
const prev = () => { if (page.value>1) { page.value--; load() } }

/* ACTION */
const openAdd = () => { selected.value=null; showForm.value=true }
const edit = u => { selected.value={...u}; showForm.value=true }

const reset = async u => {
  if (!confirm(`Reset password ${u.username}?`)) return
  await api.put(`/users/${u.id}/reset-password`)
  alert("Password reset to 123456")
}

const toggle = async u => {
  await api.put(`/users/${u.id}/toggle`)
  u.is_active = !u.is_active
}

const reload = async () => {
  showForm.value=false
  await load()
}

const close = () => {
  showForm.value=false
  selected.value=null
}

/* BULK */
const toggleAll = () => {
  selectedIds.value = selectAll.value ? users.value.map(u=>u.id) : []
}

const bulkToggle = async () => {
  if (!confirm("Toggle active selected users?")) return
  for (const id of selectedIds.value) {
    await api.put(`/users/${id}/toggle`)
  }
  load()
}

const bulkDelete = async () => {
  if (!confirm("Delete selected users?")) return
  for (const id of selectedIds.value) {
    await api.delete(`/users/${id}`)
  }
  load()
}
</script>

<style scoped>
/* TRANSITIONS */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from {
  opacity: 0;
  transform: translateY(6px);
}
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* SKELETON ANIMATION */
@keyframes skeleton {
  0% { background-position: 100% 0; }
  100% { background-position: 0 0; }
}
</style>
