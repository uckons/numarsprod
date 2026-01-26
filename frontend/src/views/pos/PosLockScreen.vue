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
  background: rgba(0, 0, 0, 0.85);
  display: grid;
  place-items: center;
  z-index: var(--z-max);
  padding: var(--space-lg);
}

.card {
  background: var(--bg-card);
  padding: var(--space-2xl);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 320px;
  text-align: center;
  border: 1px solid var(--border-medium);
  box-shadow: var(--shadow-hover);
}

.card h2 {
  color: var(--text-main);
  margin-bottom: var(--space-md);
}

.card p {
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
}

input {
  width: 100%;
  padding: var(--space-md);
  margin: var(--space-md) 0;
  background: var(--bg-input);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xs);
  color: var(--text-main);
  font-size: var(--font-size-sm);
}

input:focus {
  outline: none;
  border-color: var(--gold);
}

button {
  width: 100%;
  padding: var(--space-md);
  background: var(--gold);
  border: none;
  font-weight: var(--font-weight-bold);
  color: #000;
  border-radius: var(--radius-xs);
  cursor: pointer;
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

.error {
  color: var(--danger);
  margin-top: var(--space-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

/* Mobile optimization */
@media (max-width: 480px) {
  .card {
    padding: var(--space-xl);
    max-width: 280px;
  }
  
  .lock {
    padding: var(--space-md);
  }
}
</style>
