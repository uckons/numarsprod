<template>
  <div class="cart">
    <h3>🛒 Cart</h3>

    <div v-if="items.length === 0" class="empty">
      Belum ada item
    </div>

    <div
      v-for="i in items"
      :key="i.id"
      class="cart-item"
    >
      <div class="info">
        <strong>{{ i.name }}</strong>
        <small>Rp {{ format(i.base_price) }}</small>
      </div>

      <div class="qty">
        <button @click="dec(i)">−</button>
        <span>{{ i.qty }}</span>
        <button @click="inc(i)">+</button>
      </div>

      <div class="total">
        Rp {{ format(i.base_price * i.qty) }}
      </div>

      <button class="remove" @click="remove(i.id)">✕</button>
    </div>

    <div v-if="items.length" class="summary">
      <div class="row">
        <span>Total</span>
        <strong>Rp {{ format(grandTotal) }}</strong>
      </div>

      <button class="checkout" @click="checkout">
        Bayar
      </button>

      <button class="cancel" @click="clear">
        Batalkan Order
      </button>
    </div>
  </div>

<div v-if="showSuccess" class="success-overlay">
  <div class="success-modal">
    <div class="icon">✅</div>

    <h2>Transaksi Berhasil</h2>
    <p class="order-id">Order #{{ lastOrder.order_id }}</p>

    <div class="total">
      Rp {{ format(lastOrder.total) }}
    </div>

    <!-- 🧾 BREAKDOWN -->
    <div class="items">
      <div
        v-for="i in lastOrder.items"
        :key="i.id"
        class="item"
      >
        <span>
          {{ i.name }} × {{ i.qty }}
        </span>
        <strong>
          Rp {{ format(i.base_price * i.qty) }}
        </strong>
      </div>
    </div>

    <div class="actions">
      <button class="print" @click="printOrder">🖨 Cetak </button>
        <button class="close" @click="closeSuccess">
        Tutup
      </button>
    </div>
  </div>
</div>

</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { usePosStore } from "@/store/pos.store"
import api from "@/services/api"
//import { ref, onMounted } from "vue"
import { useRouter } from "vue-router"
const router = useRouter()
const pos = usePosStore()
//const items = pos.items
const items = computed(() => pos.items || []) 
//onMounted(async () => {
//  if (!pos.orderId) {
//    await pos.createOrder()
//  }
//})
//const inc = (i) => i.qty++
//const dec = (i) => {
//  if (i.qty > 1) i.qty--
//}

const inc = (i) => pos.inc(i.id)
const dec = (i) => pos.dec(i.id)
const remove = (id) => pos.remove(id)
//const remove = (id) => pos.remove(id)

//const clear = () => pos.clear()
//const clear = async () => {
//  if (!pos.orderId) {
//    pos.clear()
//    return
//  }

//  if (!confirm("Batalkan order ini?")) return

  //await api.delete(`/orders/${pos.orderId}`)
//  pos.cancel()
//}
const clear = () => {
  if (!confirm("Batalkan order ini?")) return
  pos.clear()
}

const grandTotal = computed(() =>
  items.value.reduce((sum, i) => sum + Number(i.base_price) * i.qty, 0)
)
const closeSuccess = async () => {
  try {
    await api.post(
      `/timers/from-order/${lastOrder.value.order_id}`
    )
  } catch (e) {
    console.warn("Timer tidak dibuat:", e.message)
  }

  showSuccess.value = false
  pos.clear()
  router.push("/kasir")
}
const showSuccess = ref(false)
const lastOrder = ref({
  order_id: null,
  total: 0,
  items: []
})

const checkout = async () => {
  try {
    const payload = {
      items: items.value.map(i => ({
        id: i.id,
        qty: i.qty,
        base_price: i.base_price
      })),
      payment_method: "CASH"
    }

    const res = await api.post("/orders/pos", payload)

    lastOrder.value = {
      order_id: res.data.order_id,
      total: res.data.total,
      items: JSON.parse(JSON.stringify(items.value))
    }

    showSuccess.value = true
    pos.clear()
  } catch (err) {
    alert(err.response?.data?.message || err.message)
  }
}
// setelah checkout sukses
//for (const i of items) {
//  if (i.duration_minutes && i.duration_minutes > 0) {
//    await api.post("/timers", {
//      order_id: orderId,
//      service_id: i.id,
//      duration_minutes: i.duration_minutes
//    })
//  }
//}
const printOrder = async () => {
  try {
    await api.post(
      `/printers/print-order`,
      { order_id: lastOrder.value.order_id }
    )
    alert("🖨 Struk dikirim ke printer")
  } catch (err) {
    alert("Gagal cetak: " + err.message)
  }
}


const format = n =>
  Number(n || 0).toLocaleString("id-ID")
</script>

<style scoped>
.cart {
  padding: 16px;
  height: 100%;
  background: #0e0e0e;
  color: #fff;
  display: flex;
  flex-direction: column;
}

/* ======================
   HEADER
====================== */
.cart h3 {
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 700;
  color: #c9a24d;
  letter-spacing: .3px;
}

/* ======================
   EMPTY STATE
====================== */
.empty {
  margin-top: 40px;
  text-align: center;
  font-size: 14px;
  color: #777;
}

/* ======================
   ITEM ROW
====================== */
.cart-item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: 10px;
  padding: 12px 0;
  border-bottom: 1px solid #222;
  align-items: center;
}

/* ITEM INFO */
.info strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.3;
}

.info small {
  display: block;
  margin-top: 2px;
  font-size: 12px;
  color: #888;
}

/* ======================
   QTY
====================== */
.qty {
  display: flex;
  align-items: center;
  gap: 6px;
}

.qty span {
  min-width: 20px;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
}

.qty button {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: #1c1c1c;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
}

/* ======================
   ITEM TOTAL
====================== */
.total {
  font-size: 14px;
  font-weight: 600;
  color: #c9a24d;
  text-align: right;
}

/* REMOVE */
.remove {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 16px;
  cursor: pointer;
}

/* ======================
   SUMMARY
====================== */
.summary {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid #222;
}

.summary .row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.summary .row span {
  font-size: 14px;
  color: #aaa;
}

.summary .row strong {
  font-size: 20px;
  font-weight: 700;
  color: #c9a24d;
}

/* ======================
   BUTTONS
====================== */
.checkout {
  width: 100%;
  padding: 14px;
  font-size: 15px;
  font-weight: 700;
  background: #c9a24d;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.cancel {
  margin-top: 8px;
  width: 100%;
  padding: 12px;
  font-size: 13px;
  background: #1c1c1c;
  color: #bbb;
  border: none;
  border-radius: 10px;
  cursor: pointer;
}

.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.success-modal {
  width: 100%;
  max-width: 420px;
  background: #0e0e0e;
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  border: 1px solid #222;
  animation: pop .2s ease;
}

@keyframes pop {
  from { transform: scale(.95); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}

.success-modal .icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.success-modal h2 {
  margin: 6px 0;
  font-size: 20px;
  color: #c9a24d;
}

.order-id {
  font-size: 12px;
  color: #888;
}

.success-modal .total {
  font-size: 32px;
  font-weight: 800;
  margin: 14px 0;
  color: #2ecc71;
}

.items {
  margin-top: 14px;
  text-align: left;
  border-top: 1px solid #222;
  padding-top: 12px;
}

.item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 6px;
}

.actions {
  display: flex;
  gap: 12px;
  margin-top: 18px;
}

.actions button {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
}

.actions .print {
  flex: 1;
  background: #c9a24d;
  color: #000;
  font-weight: 700;
  border-radius: 12px;
  padding: 12px;
}

.actions .close {
  flex: 1;
  background: #222;
  color: #fff;
  border-radius: 12px;
  padding: 12px;
}


</style>
