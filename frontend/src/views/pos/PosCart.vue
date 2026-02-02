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

      <button class="checkout" @click="checkout" :disabled="loading">
        {{ loading ? "Processing..." : "Bayar" }}
      </button>

      <button class="cancel" @click="clear">
        Batalkan Order
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"
import { usePosStore } from "@/store/pos.store"
import api from "@/services/api"
import { useRouter } from "vue-router"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

const router = useRouter()
const pos = usePosStore()

const items = computed(() => pos.items || [])

const inc = (i) => pos.inc(i.id)
const dec = (i) => pos.dec(i.id)
const remove = (id) => pos.remove(id)

const SwalTheme = Swal.mixin({
  customClass: {
    popup: "swal-theme-popup",
    title: "swal-theme-title",
    content: "swal-theme-content",
    confirmButton: "swal-theme-confirm",
    cancelButton: "swal-theme-cancel",
    denyButton: "swal-theme-deny"
  },
  buttonsStyling: false
})

const grandTotal = computed(() =>
  items.value.reduce((sum, i) => sum + Number(i.base_price) * i.qty, 0)
)

const loading = ref(false)
const lastOrder = ref({
  order_id: null,
  total: 0,
  items: []
})

const format = n =>
  Number(n || 0).toLocaleString("id-ID")

const clear = async () => {
  const res = await SwalTheme.fire({
    icon: "warning",
    title: "Batalkan order ini?",
    text: "Semua item di cart akan dihapus.",
    showCancelButton: true,
    confirmButtonText: "Ya, batalkan",
    cancelButtonText: "Tidak"
  })

  if (!res.isConfirmed) return
  // Jika perlu panggil API untuk membatalkan order yang telah dibuat di server, lakukan di sini.
  pos.clear()
  await SwalTheme.fire({
    icon: "success",
    title: "Dibatalkan",
    text: "Order telah dibatalkan",
    confirmButtonText: "OK"
  })
}

const checkout = async () => {
  if (items.value.length === 0) {
    await SwalTheme.fire({
      icon: "info",
      title: "Kosong",
      text: "Tidak ada item untuk dibayar",
      confirmButtonText: "OK"
    })
    return
  }

  loading.value = true
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

    // Clear local cart immediately (same behavior as sebelumnya)
    pos.clear()

    // Build HTML breakdown for SweetAlert
    const itemsHtml = lastOrder.value.items.map(i =>
      `<div style="display:flex;justify-content:space-between;margin:6px 0;"><span>${i.name} × ${i.qty}</span><strong>Rp ${format(i.base_price * i.qty)}</strong></div>`
    ).join("")

    const html = `
      <p class="order-id" style="margin:6px 0 10px;color:#888;">Order #${lastOrder.value.order_id}</p>
      <div style="font-size:28px;font-weight:800;margin:6px 0;color:#2ecc71;">Rp ${format(lastOrder.value.total)}</div>
      <div style="text-align:left;margin-top:10px;">${itemsHtml}</div>
    `

    // Show SweetAlert success with option to print
    const result = await SwalTheme.fire({
      icon: "success",
      title: "Transaksi Berhasil",
      html,
      showDenyButton: true,
      denyButtonText: "🖨 Cetak",
      confirmButtonText: "Tutup"
    })

    if (result.isDenied) {
      await printOrder(lastOrder.value.order_id)
      // after printing, still proceed to close flow below
    }

    // After user closes success dialog, attempt to create timers and navigate
    try {
      await api.post(`/timers/from-order/${lastOrder.value.order_id}`)
    } catch (e) {
      // not critical; just warn
      console.warn("Timer tidak dibuat:", e?.message || e)
    }

    router.push("/kasir")
  } catch (err) {
    await SwalTheme.fire({
      icon: "error",
      title: "Gagal",
      text: err.response?.data?.message || err.message || "Failed to checkout",
      confirmButtonText: "OK"
    })
  } finally {
    loading.value = false
  }
}

const printOrder = async (order_id = lastOrder.value.order_id) => {
  try {
    await api.post(`/printers/print-order`, { order_id })
    await SwalTheme.fire({
      icon: "success",
      title: "Struk dikirim",
      text: "🖨 Struk dikirim ke printer",
      confirmButtonText: "OK"
    })
  } catch (err) {
    await SwalTheme.fire({
      icon: "error",
      title: "Gagal cetak",
      text: err.response?.data?.message || err.message || "Gagal cetak",
      confirmButtonText: "OK"
    })
  }
}
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

/* ===== SweetAlert2 Black & Gold theme (scoped using :deep) ===== */
:deep(.swal-theme-popup) {
  background: linear-gradient(145deg, #0e0e0e, #151515) !important;
  color: #fff !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 215, 0, 0.08) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6) !important;
}

:deep(.swal-theme-title) {
  color: var(--gold, #f5c518) !important;
  font-weight: 600;
}

:deep(.swal-theme-content) {
  color: #cfcfcf !important;
  font-size: 14px;
}

/* Buttons */
:deep(.swal-theme-confirm) {
  background: var(--gold, #f5c518) !important;
  color: #000 !important;
  border: none !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
}

:deep(.swal-theme-cancel) {
  background: transparent !important;
  color: var(--gold, #f5c518) !important;
  border: 1px solid var(--gold, #f5c518) !important;
  padding: 7px 14px !important;
  border-radius: 8px !important;
}

:deep(.swal-theme-deny) {
  background: transparent !important;
  color: var(--gold, #f5c518) !important;
  border: 1px solid rgba(255, 215, 0, 0.12) !important;
  padding: 7px 14px !important;
  border-radius: 8px !important;
}

/* success icon overrides */
:deep(.swal2-success-ring),
:deep(.swal2-success-fix) {
  border-color: var(--gold, #f5c518) !important;
}
:deep(.swal2-success-line-tip),
:deep(.swal2-success-line-long) {
  background-color: var(--gold, #f5c518) !important;
}
</style>