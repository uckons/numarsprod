<template>
  <div class="login-wrapper">
    <div class="login-card">
      <h1>NUMARS POS</h1>
      <p class="subtitle">Login Sistem</p>

      <!-- USERNAME (GANTI DARI PHONE) -->
      <input
        v-model="username"
        placeholder="Username"
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
import { useAuthStore } from "../store/auth.store"

const router = useRouter()
const auth = useAuthStore()

// ⬇️ GANTI phone → username
const username = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

//const handleLogin = async () => {
//  loading.value = true
//  error.value = ""
//
//  try {
    // ⬇️ KIRIM USERNAME KE BACKEND
//    await auth.login(username.value, password.value)
//    router.push("/")   // redirect by role
//  } catch (err) {
//    error.value =
//      err.response?.data?.message ||
//      err.message ||
//      "Login gagal"
//  } finally {
//    loading.value = false
//  }
//}

const handleLogin = async () => {
  loading.value = true
  try {
    await auth.login(username.value, password.value)
    const role = auth.role
    //if (["SuperAdmin","Owner"].includes(role)) router.push("/owner")
    if (role === "SuperAdmin") router.push("/superadmin")
    else if (role === "Owner") router.push("/owner")
    else if (role === "Manager") router.push("/manager")
    else if (role === "Kasir") router.push("/kasir")
    else if (role === "Terapis") router.push("/terapis")
    else router.push("/login")
  } catch (e) {
    error.value = e.response?.data?.message || "Login gagal"
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: var(--bg-main);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-lg);
}

.login-card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-card);
  border: 1px solid var(--gold);
  padding: var(--space-3xl);
  text-align: center;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-hover);
}

h1 {
  color: var(--gold);
  margin-bottom: var(--space-xs);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.subtitle {
  color: var(--text-secondary);
  margin-bottom: var(--space-xl);
  font-size: var(--font-size-sm);
}

input {
  width: 100%;
  margin-bottom: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-main);
  border: 1px solid var(--border-light);
  color: var(--text-main);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
}

input:focus {
  outline: none;
  border-color: var(--gold);
}

button {
  width: 100%;
  padding: var(--space-md);
  background: var(--gold);
  border: none;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  border-radius: var(--radius-xs);
  color: #000;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: var(--danger);
  margin-top: var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Mobile optimization */
@media (max-width: 480px) {
  .login-card {
    padding: var(--space-2xl);
    max-width: 320px;
  }
  
  h1 {
    font-size: var(--font-size-xl);
  }
}
</style>
