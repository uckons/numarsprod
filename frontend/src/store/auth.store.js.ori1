import { defineStore } from "pinia"
import api from "../services/api"

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || null,
    user: JSON.parse(localStorage.getItem("user") || "null")
  }),

  getters: {
    isLoggedIn: state => !!state.token,
    role: state => state.user?.role || null
  },

  actions: {
    async login(phone, password) {
      const res = await api.post("/auth/login", { phone, password })

      this.token = res.data.token
      this.user = res.data.user

      localStorage.setItem("token", res.data.token)
      localStorage.setItem("user", JSON.stringify(res.data.user))

      return res.data
    },

    logout() {
      this.token = null
      this.user = null
      localStorage.removeItem("token")
      localStorage.removeItem("user")
    }
  }
})

