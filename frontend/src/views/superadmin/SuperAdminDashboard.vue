<template>
  <div>
    <h1>Owner Dashboard</h1>
    <p>Halo, {{ auth.user.username }}</p>
    <button @click="logout">Logout</button>
  </div>
</template>

<script setup>
import { useAuthStore } from "../../store/auth.store"
import { useRouter } from "vue-router"
const auth = useAuthStore()
const router = useRouter()
const logout = () => { auth.logout(); router.push("/login") }
</script>
