<template>
  <div class="kasir-pos">
    <h1>Kasir POS</h1>

    <!-- ORDER INFO -->
    <div class="card">
      <h3>Order Aktif</h3>

      <select v-model="orderId">
        <option disabled value="">Pilih Order</option>
        <option v-for="o in orders" :key="o.id" :value="o.id">
          Order #{{ o.id }} — {{ o.customer_name || "Walk-in" }}
        </option>
      </select>
    </div>

    <!-- TERAPIS -->
    <div class="card">
      <h3>Pilih Terapis</h3>

      <div class="checkbox-list">
        <label v-for="t in therapists" :key="t.id">
          <input
            type="checkbox"
            :value="t.id"
            v-model="selectedTherapists"
          />
          {{ t.name }}
        </label>
      </div>
    </div>

    <!-- DURASI -->
    <div class="card">
      <h3>Durasi</h3>
      <select v-model="duration">
        <option :value="60">SPA / Massage (60 menit)</option>
        <option :value="180">Karaoke (3 jam)</option>
        <option :value="9999">Lounge (No Limit)</option>
      </select>
    </div>

    <!-- PAYMENT -->
    <div class="card">
      <h3>Pembayaran</h3>

      <select v-model="paymentMethod">
        <option disabled value="">Metode Bayar</option>
        <option value="CASH">Cash</option>
        <option value="QRIS">QRIS</option>
        <option value="TRANSFER">Transfer</option>
      </select>

      <button
        class="pay-btn"
        :disabled="loading"
        @click="payOrder"
      >
        {{ loading ? "Processing..." : "BAYAR & START TIMER" }}
      </button>

      <p v-if="error" class="error">{{ error }}</p>
      <p v-if="success" class="success">{{ success }}</p>
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

<style scoped>
.kasir-pos {
  padding: var(--space-xl);
  background: var(--bg-main);
  min-height: 100vh;
  color: var(--text-main);
}

h1 {
  color: var(--gold);
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.card {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  padding: var(--space-lg);
  margin-bottom: var(--space-lg);
  border-radius: var(--radius);
}

.card h3 {
  color: var(--text-main);
  margin-bottom: var(--space-md);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
}

select {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-main);
  color: var(--text-main);
  border: 1px solid var(--border-light);
  margin-top: var(--space-sm);
  border-radius: var(--radius-xs);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
}

select:focus {
  outline: none;
  border-color: var(--gold);
}

.checkbox-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-sm);
}

label {
  font-size: var(--font-size-sm);
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

input[type="checkbox"] {
  cursor: pointer;
  accent-color: var(--gold);
}

.pay-btn {
  width: 100%;
  margin-top: var(--space-md);
  padding: var(--space-md);
  background: var(--gold);
  color: #000;
  font-weight: var(--font-weight-bold);
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

.pay-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.pay-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  color: var(--danger);
  margin-top: var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.success {
  color: var(--success);
  margin-top: var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Mobile optimization */
@media (max-width: 768px) {
  .kasir-pos {
    padding: var(--space-lg);
  }
  
  h1 {
    font-size: var(--font-size-xl);
  }
  
  .card {
    padding: var(--space-md);
  }
}

@media (max-width: 480px) {
  .kasir-pos {
    padding: var(--space-md);
  }
  
  .checkbox-list {
    flex-direction: column;
  }
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
<label>
  <input
    type="checkbox"
    :value="p.id"
    v-model="selectedProducts"
  />
  {{ p.name }}
</label>
