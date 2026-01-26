<template>
  <div class="lock">
    <div class="card">
      <h2>🔒 POS Terkunci</h2>
      <p>Masukkan password kasir</p>

      <input
        type="password"
        v-model="password"
        placeholder="Password"
        @keyup.enter="unlock"
      />

      <button @click="unlock">Buka</button>

      <p v-if="error" class="error">Password salah</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { usePosStore } from "@/store/pos.store"
import { useAuthStore } from "@/store/auth.store"

const pos = usePosStore()
const auth = useAuthStore()

const password = ref("")
const error = ref(false)

const unlock = () => {
  if (password.value === auth.user.password_plain) {
    pos.unlock()
  } else {
    error.value = true
  }
}
</script>

<style scoped>
.lock {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.85);
  display: grid;
  place-items: center;
  z-index: 9999;
}
.card {
  background: #111;
  padding: 24px;
  border-radius: 16px;
  width: 280px;
  text-align: center;
}
input {
  width: 100%;
  padding: 10px;
  margin: 12px 0;
}
button {
  width: 100%;
  padding: 10px;
  background: #c9a24d;
  border: none;
  font-weight: bold;
}
.error {
  color: #e74c3c;
  margin-top: 10px;
}
</style>
