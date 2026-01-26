<template>
  <div class="min-h-screen bg-bg-main flex items-center justify-center p-4">
    <div class="w-full max-w-sm bg-[#111] border border-gold p-6 text-center rounded-lg shadow-soft">
      <h1 class="text-gold text-2xl font-semibold mb-1">NUMARS POS</h1>
      <p class="text-text-muted mb-5">Login Sistem</p>

      <!-- USERNAME (GANTI DARI PHONE) -->
      <input
        v-model="username"
        placeholder="Username"
        autocomplete="username"
        class="w-full mb-3 px-2.5 py-2.5 bg-black border border-[#333] text-white rounded focus:outline-none focus:border-gold"
      />

      <input
        v-model="password"
        type="password"
        placeholder="Password"
        autocomplete="current-password"
        class="w-full mb-3 px-2.5 py-2.5 bg-black border border-[#333] text-white rounded focus:outline-none focus:border-gold"
      />

      <button 
        @click="handleLogin" 
        :disabled="loading"
        class="w-full py-2.5 bg-gold text-black font-bold rounded cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {{ loading ? "Loading..." : "Login" }}
      </button>

      <p v-if="error" class="text-danger mt-3">{{ error }}</p>
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
