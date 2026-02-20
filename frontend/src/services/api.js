import axios from "axios"
import { useAuthStore } from "@/store/auth.store"

const api = axios.create({
  baseURL: "https://pos.numars.biz.id/api", // ⬅️ PENTING
  timeout: 15000
})

api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = `Bearer ${auth.token}`
  }
  return config
})

let isHandlingExpiredToken = false

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status
    const code = error?.response?.data?.code

    if (status === 401 && (code === "TOKEN_EXPIRED" || code === "INVALID_TOKEN")) {
      const auth = useAuthStore()
      auth.logout()

      if (!isHandlingExpiredToken) {
        isHandlingExpiredToken = true
        const path = window.location.pathname || ""
        if (path !== "/login") {
          window.location.href = "/login"
        }
        setTimeout(() => {
          isHandlingExpiredToken = false
        }, 250)
      }
    }

    return Promise.reject(error)
  }
)

export default api
