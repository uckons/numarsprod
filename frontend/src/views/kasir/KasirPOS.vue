<template>
  <div class="min-h-screen p-4 md:p-6 lg:p-8 bg-bg-main text-white">
    <h1 class="text-2xl md:text-3xl font-bold text-gold mb-4 md:mb-6">Kasir POS</h1>

    <!-- ORDER INFO -->
    <div class="bg-bg-card border border-gray-700 rounded-xl p-4 mb-4 transition-all hover:border-gray-600">
      <h3 class="text-lg md:text-xl font-semibold mb-3 text-white">Order Aktif</h3>

      <select 
        v-model="orderId"
        class="w-full px-3 py-2.5 bg-black text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
      >
        <option disabled value="">Pilih Order</option>
        <option v-for="o in orders" :key="o.id" :value="o.id">
          Order #{{ o.id }} — {{ o.customer_name || "Walk-in" }}
        </option>
      </select>
    </div>

    <!-- TERAPIS -->
    <div class="bg-bg-card border border-gray-700 rounded-xl p-4 mb-4 transition-all hover:border-gray-600">
      <h3 class="text-lg md:text-xl font-semibold mb-3 text-white">Pilih Terapis</h3>

      <div class="flex flex-wrap gap-3 mt-2">
        <label 
          v-for="t in therapists" 
          :key="t.id"
          class="flex items-center gap-2 text-sm md:text-base cursor-pointer hover:text-gold transition-colors"
        >
          <input
            type="checkbox"
            :value="t.id"
            v-model="selectedTherapists"
            class="w-4 h-4 cursor-pointer accent-gold"
          />
          {{ t.name }}
        </label>
      </div>
    </div>

    <!-- DURASI -->
    <div class="bg-bg-card border border-gray-700 rounded-xl p-4 mb-4 transition-all hover:border-gray-600">
      <h3 class="text-lg md:text-xl font-semibold mb-3 text-white">Durasi</h3>
      <select 
        v-model="duration"
        class="w-full px-3 py-2.5 bg-black text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
      >
        <option :value="60">SPA / Massage (60 menit)</option>
        <option :value="180">Karaoke (3 jam)</option>
        <option :value="9999">Lounge (No Limit)</option>
      </select>
    </div>

    <!-- PAYMENT -->
    <div class="bg-bg-card border border-gray-700 rounded-xl p-4 mb-4 transition-all hover:border-gray-600">
      <h3 class="text-lg md:text-xl font-semibold mb-3 text-white">Pembayaran</h3>

      <select 
        v-model="paymentMethod"
        class="w-full px-3 py-2.5 bg-black text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold focus:border-transparent transition-all"
      >
        <option disabled value="">Metode Bayar</option>
        <option value="CASH">Cash</option>
        <option value="QRIS">QRIS</option>
        <option value="TRANSFER">Transfer</option>
      </select>

      <button
        class="w-full mt-3 px-4 py-3 bg-gold text-black font-bold rounded-lg cursor-pointer transition-all duration-200 hover:bg-yellow-500 disabled:opacity-60 disabled:cursor-not-allowed"
        :disabled="loading"
        @click="payOrder"
      >
        {{ loading ? "Processing..." : "BAYAR & START TIMER" }}
      </button>

      <p v-if="error" class="text-danger mt-3 text-sm md:text-base">{{ error }}</p>
      <p v-if="success" class="text-success mt-3 text-sm md:text-base">{{ success }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useAuthStore } from "../../store/auth.store"

const auth = useAuthStore()

/* ======================
   STATE
====================== */
const orders = ref([])
const therapists = ref([])

const orderId = ref("")
const selectedTherapists = ref([])
const duration = ref(60)
const paymentMethod = ref("")

const loading = ref(false)
const error = ref("")
const success = ref("")

/* ======================
   LOAD DATA
====================== */
const loadOrders = async () => {
  const res = await fetch("/api/orders/UNPAID", {
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
  orders.value = await res.json()
}

const loadTherapists = async () => {
  const res = await fetch("/api/therapists", {
    headers: {
      Authorization: `Bearer ${auth.token}`
    }
  })
  therapists.value = await res.json()
}

/* ======================
   PAY ORDER (AUTO TIMER)
====================== */
const payOrder = async () => {
  error.value = ""
  success.value = ""

  if (!orderId.value) {
    error.value = "Order belum dipilih"
    return
  }

  if (selectedTherapists.value.length === 0) {
    error.value = "Pilih minimal 1 terapis"
    return
  }

  if (!paymentMethod.value) {
    error.value = "Pilih metode pembayaran"
    return
  }

  loading.value = true

  try {
    const res = await fetch("/api/payments/pay", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${auth.token}`
      },
      body: JSON.stringify({
        order_id: orderId.value,
        therapist_ids: selectedTherapists.value,
        duration: duration.value,
        method: paymentMethod.value
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.message)

    success.value = "Pembayaran berhasil. Timer dimulai."
    orderId.value = ""
    selectedTherapists.value = []
    paymentMethod.value = ""

    await loadOrders()

  } catch (err) {
    error.value = err.message || "Payment gagal"
  } finally {
    loading.value = false
  }
}

/* ======================
   INIT
====================== */
onMounted(() => {
  loadOrders()
  loadTherapists()
})
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
<label>
  <input
    type="checkbox"
    :value="p.id"
    v-model="selectedProducts"
  />
  {{ p.name }}
</label>
