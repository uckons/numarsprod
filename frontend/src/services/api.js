import axios from "axios"

const api = axios.create({
  baseURL: "/api",          // ⬅️ WAJIB, JANGAN localhost
  timeout: 10000
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
