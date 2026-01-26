<template>
  <PosLayout>
    <PosLockScreen v-if="pos.locked" />
    <div v-else class="pos-body">
      <div class="left">
        <PosServiceList />
      </div>

      <div class="right">
        <PosCart />
      </div>
    </div>
  </PosLayout>
</template>

<script setup>
import PosLayout from "./PosLayout.vue"
import PosServiceList from "./PosServiceList.vue"
import PosCart from "./PosCart.vue"
import PosLockScreen from "./PosLockScreen.vue"
import { onMounted, onUnmounted } from "vue"
import { usePosStore } from "@/store/pos.store"
import { useRouter } from "vue-router"

const router = useRouter()
const pos = usePosStore()
let idleTimer

const resetIdle = () => {
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    pos.lock()
  }, 15 * 60 * 1000) // 2 menit
}

onMounted(() => {
  ["mousemove","keydown","click","touchstart"].forEach(e =>
    window.addEventListener(e, resetIdle)
  )
  resetIdle()
})

onUnmounted(() => {
  ["mousemove","keydown","click","touchstart"].forEach(e =>
    window.removeEventListener(e, resetIdle)
  )
  clearTimeout(idleTimer)
})
const onKey = (e) => {
  if (e.key === "Escape") {
    if (pos.items.length > 0) {
      const ok = confirm(
        "Masih ada item di cart.\nKeluar dari POS?"
      )
      if (!ok) return
    }
    router.push("/kasir")
  }
}
const closePos = () => {
  router.push("/kasir")
}
onMounted(() => {
  window.addEventListener("keydown", onKey)
})

onUnmounted(() => {
  window.removeEventListener("keydown", onKey)
})

</script>

<style scoped>
.pos-body {
  height: 100%;
  display: grid;
  grid-template-columns: 1fr 420px;
}

/* LEFT = SERVICES */
.left {
  padding: 16px;
  overflow-y: auto;
}

/* RIGHT = CART */
.right {
  border-left: 1px solid #222;
  background: #0e0e0e;
}

/* ?? RESPONSIVE */
@media (max-width: 900px) {
  .pos-body {
    grid-template-columns: 1fr;
  }

  .right {
    border-left: none;
    border-top: 1px solid #222;
  }
}
</style>
