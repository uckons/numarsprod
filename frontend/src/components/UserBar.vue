<template>
  <div class="user-bar-wrap">
    <div class="user-bar">
      <div class="identity">
        <strong>{{ auth.user?.name || auth.user?.username || 'User' }}</strong>
        <small>{{ auth.user?.role || '-' }}</small>
      </div>
      <button @click="logout">Logout</button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
import { useAuthStore } from "../store/auth.store"

const router = useRouter()
const auth = useAuthStore()

const logout = () => {
  auth.logout()
  router.push("/login")
}
</script>

<style scoped>
.user-bar-wrap {
  padding: 12px 20px 0;
}

.user-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(145deg, rgba(21,21,21,.95), rgba(12,12,12,.95));
  border: 1px solid #2d2d2d;
  border-radius: 14px;
  padding: 10px 14px;
}

.identity {
  display: grid;
  gap: 2px;
}

.identity strong {
  color: #fff;
  font-size: 14px;
}

.identity small {
  color: #b7bcc8;
  font-size: 12px;
}

button {
  border: none;
  border-radius: 10px;
  background: #f5c518;
  color: #111;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
}
</style>
