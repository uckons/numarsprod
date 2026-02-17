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
          <label>Cloudflare Captcha</label>
          <div v-if="turnstileSiteKey" ref="turnstileEl" class="turnstile-host"></div>
          <p v-else class="captcha-missing">
            Turnstile belum dikonfigurasi. Set <code>VITE_TURNSTILE_SITE_KEY</code> di environment frontend.
          </p>
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
import { computed, onMounted, ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "../store/auth.store"

const router = useRouter()
const auth = useAuthStore()

const username = ref("")
const password = ref("")
const loading = ref(false)
const error = ref("")

const logoUrl = computed(() => import.meta.env.VITE_LOGIN_LOGO_URL || "/logo-sky.png")
const showLogoImage = ref(true)

const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ""
const turnstileEl = ref(null)
const turnstileToken = ref("")
let turnstileWidgetId = null

const loadTurnstileScript = () => new Promise((resolve, reject) => {
  if (window.turnstile?.render) return resolve(window.turnstile)

  const existing = document.querySelector('script[data-turnstile="true"]')
  if (existing) {
    existing.addEventListener('load', () => resolve(window.turnstile))
    existing.addEventListener('error', () => reject(new Error('Gagal memuat Cloudflare Turnstile')))
    return
  }

  const script = document.createElement('script')
  script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
  script.async = true
  script.defer = true
  script.dataset.turnstile = 'true'
  script.onload = () => resolve(window.turnstile)
  script.onerror = () => reject(new Error('Gagal memuat Cloudflare Turnstile'))
  document.head.appendChild(script)
})

const renderTurnstile = async () => {
  if (!turnstileSiteKey || !turnstileEl.value) return
  try {
    const turnstile = await loadTurnstileScript()
    turnstileEl.value.innerHTML = ''
    turnstileWidgetId = turnstile.render(turnstileEl.value, {
      sitekey: turnstileSiteKey,
      theme: 'dark',
      callback: (token) => {
        turnstileToken.value = token
      },
      'expired-callback': () => {
        turnstileToken.value = ''
      },
      'error-callback': () => {
        turnstileToken.value = ''
      }
    })
  } catch (e) {
    error.value = e.message || 'Captcha Cloudflare gagal dimuat'
  }
}

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
  if (turnstileSiteKey && !turnstileToken.value) {
    error.value = 'Captcha Cloudflare belum tervalidasi'
    return
  }

  loading.value = true
  error.value = ""
  try {
    await auth.login(username.value, password.value, turnstileToken.value)
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
    if (turnstileSiteKey && window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId)
      turnstileToken.value = ''
    }
  }
}

onMounted(renderTurnstile)
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

.turnstile-host {
  min-height: 70px;
  display: flex;
  align-items: center;
}

.captcha-missing {
  color: #e5c677;
  font-size: 12px;
  margin: 0;
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
  color: #ff6b6b;
  margin-top: 12px;
  font-size: 13px;
}
</style>
