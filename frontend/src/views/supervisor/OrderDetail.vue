<template>
  <div class="order-detail">
    <h2>Order #{{ order.id }}</h2>

    <p>Status: <b>{{ order.status }}</b></p>
    <p>Total: Rp {{ format(order.total_amount) }}</p>

    <!-- 🔴 REVERT BUTTON -->
    <button
      v-if="canRevert"
      class="danger"
      @click="revertPayment"
    >
      Revert Payment
    </button>
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

<style scoped>
.order-detail {
  padding: 20px;
}

.danger {
  background: #e74c3c;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  margin-top: 16px;
  cursor: pointer;
}
</style>
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
	
