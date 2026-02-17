<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="logo-block" aria-hidden="true">
        <img
          v-if="showLogoImage"
          :src="logoUrl"
          alt="SKY POS Logo"
          class="logo-image"
          @error="showLogoImage = false"
        />
        <div v-else class="logo-circle">S</div>
      </div>
      <h1>SKY ePOS</h1>
      <p class="subtitle">NUMARS POS SYSTEMS</p>
      <p class="subtitle subtitle-login">System Login</p>

      <form class="login-form" @submit.prevent="handleLogin">
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

        <div class="captcha-box">
          <label for="captchaInput">Captcha keamanan</label>
          <div class="captcha-row">
            <span class="captcha-question">{{ captchaQuestion }}</span>
            <button type="button" class="captcha-refresh" @click="generateCaptcha" title="Refresh captcha">↻</button>
          </div>
          <input
            id="captchaInput"
            v-model="captchaAnswer"
            type="text"
            inputmode="numeric"
            placeholder="Jawaban captcha"
            autocomplete="off"
          />
        </div>

        <button type="submit" :disabled="loading">
          {{ loading ? "Loading..." : "Login" }}
        </button>
      </form>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../store/auth.store"

const router = useRouter()
const auth = useAuthStore()

// ⬇️ GANTI phone → username
const username = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

const captchaAnswer = ref("")
const captchaA = ref(0)
const captchaB = ref(0)
const captchaQuestion = computed(() => `${captchaA.value} + ${captchaB.value} = ?`)
const logoUrl = computed(() => import.meta.env.VITE_LOGIN_LOGO_URL || "/logo-sky.png")
const showLogoImage = ref(true)

const generateCaptcha = () => {
  captchaA.value = Math.floor(Math.random() * 9) + 1
  captchaB.value = Math.floor(Math.random() * 9) + 1
  captchaAnswer.value = ""
}

generateCaptcha()

const requestAppFullscreen = async () => {
  const el = document.documentElement
  if (!el || document.fullscreenElement) return
  try {
    if (el.requestFullscreen) await el.requestFullscreen()
  } catch (_) {
    // Browser may block fullscreen without a direct trusted user gesture.
  }
}

const handleLogin = async () => {
  const expected = captchaA.value + captchaB.value
  if (Number(captchaAnswer.value) !== expected) {
    error.value = "Captcha tidak valid"
    generateCaptcha()
    return
  }

  loading.value = true
  error.value = ""
  try {
    await auth.login(username.value, password.value)
    await requestAppFullscreen()
    const role = auth.role
    if (role === "SuperAdmin") router.push("/superadmin")
    else if (role === "Owner") router.push("/owner")
    else if (role === "Manager") router.push("/manager")
    else if (role === "Supervisor") router.push("/supervisor")
    else if (role === "Staff Bar") router.push("/bar")
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
  background: #0e0e0e;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-card {
  width: min(460px, 92vw);
  background: #111;
  border: 1px solid #c9a24d;
  padding: 24px;
  text-align: center;
}

.logo-block {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}

.logo-image {
  max-width: 100%;
  width: auto;
  height: auto;
  max-height: 88px;
  object-fit: contain;
  box-shadow: 0 0 14px rgba(201, 162, 77, 0.2);
}

.logo-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 1px solid #c9a24d;
  color: #c9a24d;
  font-weight: 800;
  font-size: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(145deg, #171717, #090909);
  box-shadow: 0 0 14px rgba(201, 162, 77, 0.2);
}

h1 {
  color: #c9a24d;
  margin-bottom: 4px;
}

.subtitle {
  color: #aaa;
  margin-bottom: 4px;
}

.subtitle-login {
  margin-bottom: 14px;
  color: #8d8d8d;
  font-size: 13px;
}

.login-form {
  width: 100%;
}

.captcha-box {
  text-align: left;
  margin-bottom: 12px;
}

.captcha-box label {
  display: block;
  color: #b8b8b8;
  font-size: 12px;
  margin-bottom: 6px;
}

.captcha-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.captcha-question {
  color: #e5c677;
  font-weight: 700;
}

.captcha-refresh {
  width: auto;
  padding: 4px 8px;
  background: #1f1f1f;
  border: 1px solid #373737;
  color: #c9a24d;
  border-radius: 8px;
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
