<template>
  <div class="user-bar">
    <div class="user-info">
      <strong>{{ user.name }}</strong>
      <small>{{ user.role }} • Cabang {{ user.branch_id }}</small>
    </div>

    <button @click="handleLogout">Logout</button>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
import { useAuthStore } from "../store/auth.store"

const router = useRouter()
const auth = useAuthStore()

const user = auth.user

const handleLogout = () => {
  auth.logout()
  router.push("/login")
}
</script>

<style scoped>
.user-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #0e0e0e;
  border-bottom: 1px solid #c9a24d;
  color: #fff;
}

.user-info small {
  display: block;
  font-size: 12px;
  color: #aaa;
}

button {
  background: transparent;
  border: 1px solid #c9a24d;
  color: #c9a24d;
  padding: 6px 12px;
  cursor: pointer;
}
</style>
