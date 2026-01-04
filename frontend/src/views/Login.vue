<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1>NUMARS POS</h1>
      <p class="subtitle">Login Sistem</p>

      <input
        v-model="phone"
        placeholder="No. HP"
        autocomplete="username"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
      />

      <button @click="handleLogin" :disabled="loading">
        {{ loading ? "Loading..." : "Login" }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../store/auth.store"   // ✅ PINIA STORE

const router = useRouter()
const auth = useAuthStore()

const phone = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

const handleLogin = async () => {
  loading.value = true
  error.value = ""

  try {
    await auth.login(phone.value, password.value)  // ✅ PAKAI STORE
    router.push("/")                               // redirect sukses
  } catch (err) {
    error.value =
      err.response?.data?.message ||
      err.message ||
      "Login gagal"
  } finally {
    loading.value = false                          // ⬅️ PENTING
  }
}
</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: #0e0e0e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: 320px;
  background: #111;
  border: 1px solid #c9a24d;
  padding: 24px;
  text-align: center;
}

h1 {
  color: #c9a24d;
  margin-bottom: 4px;
}

.subtitle {
  color: #aaa;
  margin-bottom: 20px;
}

input {
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
}

button {
  width: 100%;
  padding: 10px;
  background: #c9a24d;
  border: none;
  font-weight: bold;
  cursor: pointer;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  margin-top: 12px;
}
</style>
