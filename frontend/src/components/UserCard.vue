<template>
  <div class="page">
    <!-- HEADER -->
    <div class="header">
      <div>
        <h2>User Management</h2>
        <p class="subtitle">SuperAdmin Control Panel</p>
      </div>

      <button class="btn-primary" @click="openAdd">
        + Add User
      </button>
    </div>

    <!-- FILTER -->
    <div class="filter">
      <input v-model="q" placeholder="Search username..." />
      <select v-model="role">
        <option value="">All Roles</option>
        <option v-for="r in roles" :key="r" :value="r">
          {{ r }}
        </option>
      </select>
      <button @click="load">Search</button>
    </div>

    <!-- USERS GRID -->
    <div class="grid">
      <UserSkeleton v-if="loading" v-for="i in 6" :key="i" />

      <UserCard
        v-for="u in users"
        :key="u.id"
        :user="u"
        v-model:selected="selectedIds"
        @edit="edit"
        @reset="reset"
        @toggle="toggle"
      />

      <p v-if="!loading && !users.length" class="empty">
        No users found
      </p>
    </div>

    <!-- BULK ACTION -->
    <BulkActionBar
      v-if="selectedIds.length"
      :count="selectedIds.length"
      @disable="bulkDisable"
      @delete="bulkDelete"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

import UserCard from "./components/UserCard.vue"
import BulkActionBar from "./components/BulkActionBar.vue"
import UserSkeleton from "./components/UserSkeleton.vue"

const users = ref([])
const selectedIds = ref([])
const loading = ref(false)

const q = ref("")
const role = ref("")
const page = ref(1)
const limit = 12

const roles = ["SuperAdmin","Owner","Manager","Kasir","Terapis"]

const load = async () => {
  loading.value = true
  try {
    const res = await api.get("/users/search", {
      params: { q: q.value, role: role.value, page: page.value, limit }
    })
    users.value = res.data.data
    selectedIds.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)

/* ACTIONS */
const openAdd = () => alert("Open UserForm modal")
const edit = u => alert("Edit " + u.username)

const reset = async u => {
  if (!confirm(`Reset password ${u.username}?`)) return
  await api.put(`/users/${u.id}/reset-password`)
  alert("Password reset to 123456")
}

const toggle = async u => {
  await api.put(`/users/${u.id}/toggle`)
  u.is_active = !u.is_active
}

const bulkDisable = async () => {
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
.page { padding: 24px; }
.header { display:flex; justify-content:space-between; }
.subtitle { color:#888; }

.filter {
  display:flex;
  gap:12px;
  margin:16px 0;
}

.grid {
  display:grid;
  grid-template-columns: repeat(auto-fill,minmax(260px,1fr));
  gap:16px;
}

.empty {
  grid-column: 1 / -1;
  text-align:center;
  color:#777;
}
</style>
