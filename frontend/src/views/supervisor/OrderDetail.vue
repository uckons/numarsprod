<template>
  <div class="min-h-screen p-5 md:p-8 bg-bg-main">
    <h2 class="text-2xl md:text-3xl font-bold text-gold mb-6">Order #{{ order.id }}</h2>

    <div class="bg-bg-card border border-gray-700 rounded-lg p-4 md:p-6 space-y-3">
      <p class="text-base md:text-lg">Status: <b class="text-gold">{{ order.status }}</b></p>
      <p class="text-base md:text-lg">Total: <span class="font-semibold">Rp {{ format(order.total_amount) }}</span></p>

      <!-- 🔴 REVERT BUTTON -->
      <button
        v-if="canRevert"
        class="bg-danger hover:bg-red-600 text-white font-medium px-4 py-2.5 rounded-lg mt-4 cursor-pointer transition-colors duration-200"
        @click="revertPayment"
      >
        Revert Payment
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useAuthStore } from "../../store/auth.store"
import { useRoute, useRouter } from "vue-router"

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const order = ref({})

const canRevert = computed(() =>
  ["Owner", "Supervisor"].includes(auth.user.role)
  && order.value.status === "PAID"
)

const format = n =>
  new Intl.NumberFormat("id-ID").format(n || 0)

onMounted(async () => {
  const res = await fetch(`/api/orders/${route.params.id}`, {
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
  order.value = await res.json()
})

const revertPayment = async () => {
  const reason = prompt("Alasan revert payment?")
  if (!reason) return

  await fetch("/api/revert-payment", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify({
      order_id: order.value.id,
      reason
    })
  })

  alert("Payment berhasil direvert")
  router.back()
}
</script>

<button @click="printStruk">
  🖨 Print Struk
</button>
const printStruk = async () => {
  await fetch("/api/printers/print", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${auth.token}`
    },
    body: JSON.stringify({
      order_id: orderId.value,
      printer: {
        type: "LAN",
        ip: "192.168.1.50"   // IP printer Epson
      }
    })
  })

  alert("Struk dicetak")
}
	
