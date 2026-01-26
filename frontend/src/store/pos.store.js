import { defineStore } from "pinia"
import { ref, watch } from "vue"

export const usePosStore = defineStore("pos", () => {
  const items = ref(
    JSON.parse(localStorage.getItem("pos-cart") || "[]")
  )

  function addService(service) {
    const found = items.value.find(i => i.id === service.id)
    if (found) {
      found.qty++
    } else {
      items.value.push({
        id: service.id,
        name: service.name,
        base_price: Number(service.base_price),
        qty: 1
      })
    }
  }
  const locked = ref(false) //tambahan
  
  function lock() {
    locked.value = true
  }

  function unlock() {
    locked.value = false
  }

  function inc(id) {
    const item = items.value.find(i => i.id === id)
    if (item) item.qty++
  }

  function dec(id) {
    const item = items.value.find(i => i.id === id)
    if (item && item.qty > 1) item.qty--
  }

  function remove(id) {
    items.value = items.value.filter(i => i.id !== id)
  }

  function clear() {
    items.value = []
  }

  // 🔥 AUTO SAVE
  watch(
    items,
    v => localStorage.setItem("pos-cart", JSON.stringify(v)),
    { deep: true }
  )

  return {
    items,
    addService,
    inc,
    dec,
    remove,
    clear,
    lock,
    unlock
  }
})
