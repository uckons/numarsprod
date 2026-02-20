<template>
  <div class="pos-layout">
    <!-- HEADER -->
    <header class="pos-header">
      <h2>SKY ePOS</h2>

      <div class="right">
        <!-- <span>{{ user.name }}</span> -->
        <button class="back" @click="goBack">Kembali</button>
      </div>
    </header>

    <!-- CONTENT -->
    <main class="pos-main">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { useAuthStore } from "@/store/auth.store"
import { useRouter } from "vue-router"
import { usePosStore } from "@/store/pos.store"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css"

const auth = useAuthStore()
const router = useRouter()
const user = auth.user
const pos = usePosStore()

/* SweetAlert2 theme mixin (black & gold) */
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

const goBack = async () => {
  if (pos.items.length > 0) {
    const res = await SwalTheme.fire({
      icon: "warning",
      title: "Masih ada order di cart",
      text: "Yakin ingin keluar dari POS? Order yang belum diselesaikan akan tetap ada di cart.",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal"
    })
    if (!res.isConfirmed) return
  }

  router.push("/kasir")
}

const closePos = () => {
  router.push("/kasir")
}
</script>

<style scoped>
.pos-layout {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0b0b0b;
  color: white;
}

/* HEADER */
.pos-header {
  height: 56px;
  padding: 0 16px;
  background: #111;
  border-bottom: 1px solid #222;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pos-header h2 {
  margin: 0;
  font-size: 18px;
  color: #c9a24d;
}

.pos-header .right {
  display: flex;
  gap: 12px;
  align-items: center;
}

button {
  background: #c0392b;
  border: none;
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
}
.back {
  background: #c0392b;
  border: none;
  color: white;
  font-size: 14px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
}
/* MAIN */
.pos-main {
  flex: 1;
  overflow: hidden;
}

/* ===== SweetAlert2 Black & Gold theme (scoped using :deep) =====
   Using :deep(...) avoids deprecated ::v-deep combinator warnings.
*/
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

:deep(.swal-theme-confirm) {
  background: var(--gold, #f5c518) !important;
  color: #000 !important;
  border: none !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}

:deep(.swal-theme-cancel) {
  background: transparent !important;
  color: var(--gold, #f5c518) !important;
  border: 1px solid var(--gold, #f5c518) !important;
  padding: 7px 14px !important;
  border-radius: 8px !important;
}
</style>
