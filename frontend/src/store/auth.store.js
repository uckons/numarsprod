import { defineStore } from "pinia"
import axios from "axios"

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user") || "null"),
  }),
  getters: {
    isLoggedIn: (s) => !!s.token,
    role: (s) => s.user?.role || null,
  },
  actions: {
    async login(username, password, captcha = {}) {
      const turnstileToken = captcha.turnstileToken || ""
      const recaptchaToken = captcha.recaptchaToken || ""
      const res = await axios.post("/api/auth/login", {
        username,
        password,
        turnstile_token: turnstileToken || undefined,
        recaptcha_token: recaptchaToken || undefined
      })
      this.token = res.data.token
      this.user = res.data.user
      localStorage.setItem("token", this.token)
      localStorage.setItem("user", JSON.stringify(this.user))
      axios.defaults.headers.common.Authorization = `Bearer ${this.token}`
    },
    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem("token")
      localStorage.removeItem("user")
      delete axios.defaults.headers.common.Authorization
    },
  },
})
