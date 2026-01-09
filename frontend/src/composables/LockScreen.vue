<template>
  <div class="lock">
    <div class="card">
      <h2>Session Locked</h2>
      <p>Enter password to continue</p>

      <input
        type="password"
        v-model="password"
        placeholder="Password"
      />

      <button @click="unlock" :disabled="loading">
        {{ loading ? "Checking..." : "Unlock" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import api from "@/services/api"
import { useAuthStore } from "@/store/auth.store"

const emit = defineEmits(["unlocked"])
const auth = useAuthStore()
const password = ref("")
const loading = ref(false)

const unlock = async () => {
  loading.value = true
  try {
    await api.post("/auth/verify", {
      username: auth.user.username,
      password: password.value
    })
    emit("unlocked")
    password.value = ""
  } catch {
    alert("Wrong password")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.lock {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.card {
  width: 320px;
  background: #111;
  border: 1px solid #C9A24D;
  padding: 24px;
  border-radius: 12px;
  text-align: center;
}
</style>
