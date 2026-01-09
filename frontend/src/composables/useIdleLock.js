import { ref, onMounted, onUnmounted } from "vue"
import api from "@/services/api"

export function useIdleLock() {
  const locked = ref(false)
  let idleTimeout = 15 * 60 * 1000
  let timer = null

  const resetTimer = () => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      locked.value = true
    }, idleTimeout)
  }

  onMounted(async () => {
    // ?? load global setting
    const res = await api.get("/settings/security")
    idleTimeout = res.data.idle_timeout_minutes * 60 * 1000

    // listen user activity
    window.addEventListener("mousemove", resetTimer)
    window.addEventListener("keydown", resetTimer)
    window.addEventListener("click", resetTimer)

    resetTimer()
  })

  onUnmounted(() => {
    window.removeEventListener("mousemove", resetTimer)
    window.removeEventListener("keydown", resetTimer)
    window.removeEventListener("click", resetTimer)
    clearTimeout(timer)
  })

  return {
    locked,
    unlock: () => {
      locked.value = false
      resetTimer()
    }
  }
}
