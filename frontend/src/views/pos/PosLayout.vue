<template>
  <div class="pos-layout">
    <!-- HEADER -->
    <header class="pos-header">
      <h2>NUMARS POS</h2>

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

const auth = useAuthStore()
const router = useRouter()
const user = auth.user
const pos = usePosStore() // ⬅️ INI YANG KURANG

//const logout = () => {
//  auth.logout()
//  router.push("/login")
//}
const goBack = () => {
  if (pos.items.length > 0) {
    const ok = confirm(
      "Masih ada order di cart.\nYakin ingin keluar dari POS?"
    )
    if (!ok) return
  }

  router.push("/kasir")
}
const closePos = () => {
  router.push("/kasir")
}
//const closePos = () => {
//  if (pos.items.length > 0) {
//    if (!confirm("Batalkan order dan keluar dari POS?")) return
//    pos.clear()
//  }
//  showPos.value = false
//}

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
</style>
