<template>
  <div class="box">
    <h2>User Management</h2>

    <table>
      <tr>
        <th>User</th>
        <th>Role</th>
        <th>Branch</th>
        <th>Status</th>
        <th>Aksi</th>
      </tr>

      <tr v-for="u in users" :key="u.id">
        <td>{{ u.username }}</td>
        <td>{{ u.role }}</td>
        <td>{{ u.branch || "-" }}</td>
        <td>
          <span :class="u.active ? 'on' : 'off'">
            {{ u.active ? "AKTIF" : "NONAKTIF" }}
          </span>
        </td>
        <td>
          <button @click="force(u.id)">Force Logout</button>
          <button @click="reset(u.id)">Reset</button>
          <button @click="toggle(u.id)">
            {{ u.active ? "Disable" : "Enable" }}
          </button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const users = ref([])

const load = async () => {
  users.value = (await api.get("/superadmin/users")).data
}
const force = async(id)=>{
  await api.post(`/superadmin/users/${id}/force-logout`)
  alert("User dikeluarkan")
}

const reset = async (id) => {
  if (!confirm("Reset password ke 123456?")) return
  await api.put(`/superadmin/users/${id}/reset`)
  alert("Password direset")
}

const toggle = async (id) => {
  await api.put(`/superadmin/users/${id}/toggle`)
  load()
}

onMounted(load)
</script>

<style scoped>
.on { color:#2ecc71 }
.off { color:#e74c3c }
button { margin-right:6px }
</style>
