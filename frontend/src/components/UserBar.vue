<template>
  <div class="user-bar">
    <div>
      <strong>{{ auth.user.name }}</strong><br />
      <small>{{ auth.user.role }}</small>
    </div>
    <button @click="logout">Logout</button>
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
