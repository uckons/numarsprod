import { defineStore } from "pinia"
import { ref, watch } from "vue"

export const usePosStore = defineStore("pos", () => {
  const items = ref(
    JSON.parse(localStorage.getItem("pos-cart") || "[]")
  )

  // 🆕 Track current order ID
  const currentOrderId = ref(null)
  // 🆕 Track selected therapist & room
const selectedTherapist = ref(null)
const selectedRoom = ref(null)

  const itemKey = (service) => [
    service.id,
    Number(service.base_price || 0),
    service.price_label || '',
    service.is_package ? 'P' : 'N'
  ].join(':')

  function addService(service) {
    const key = itemKey(service)
    const found = items.value.find(i => i.cart_key === key)
    if (found) {
      found.qty++
    } else {
      items.value.push({
        id: service.id,
        name: service.name,
        base_price: Number(service.base_price),
        price_label: service.price_label || null,
        is_package: Boolean(service.is_package),
        cart_key: key,
        qty: 1
      })
    }
  }

  const locked = ref(false)
  
  function lock() {
    locked.value = true
  }

  function unlock() {
    locked.value = false
  }

  function inc(id, cartKey = null) {
    const item = items.value.find(i => i.id === id && (!cartKey || i.cart_key === cartKey))
    if (item) item.qty++
  }

  function dec(id, cartKey = null) {
    const item = items.value.find(i => i.id === id && (!cartKey || i.cart_key === cartKey))
    if (item && item.qty > 1) item.qty--
  }

  function remove(id, cartKey = null) {
    items.value = items.value.filter(i => !(i.id === id && (!cartKey || i.cart_key === cartKey)))
  }

  function clear() {
    items.value = []
    currentOrderId.value = null  // 🆕 Reset order ID
  }
 function setTherapist(therapist) {
  selectedTherapist.value = therapist
}

function setRoom(room) {
  selectedRoom.value = room
}
  // 🔥 AUTO SAVE
  watch(
    items,
    v => localStorage.setItem("pos-cart", JSON.stringify(v)),
    { deep: true }
  )

  return {
  items,
  currentOrderId,
  selectedTherapist,    // 🆕
  selectedRoom,         // 🆕
  addService,
  locked,
  lock,
  unlock,
  inc,
  dec,
  remove,
  clear,
  setTherapist,         // 🆕
  setRoom              // 🆕
}
})
