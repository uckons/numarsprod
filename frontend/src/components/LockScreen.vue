<template>
  <div class="lock">
    <div class="card">
      <h2>Session Locked</h2>
      <p>Enter password to continue</p>

      <input
        type="password"
        v-model="password"
        placeholder="Password"
      />

      <button @click="unlock" :disabled="loading">
        {{ loading ? "Checking..." : "Unlock" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue"
import api from "@/services/api"
import { useAuthStore } from "@/store/auth.store"

const emit = defineEmits(["unlocked"])
const auth = useAuthStore()
const password = ref("")
const loading = ref(false)

const unlock = async () => {
  loading.value = true
  try {
    await api.post("/auth/verify", {
      username: auth.user.username,
      password: password.value
    })
    emit("unlocked")
    password.value = ""
  } catch {
    alert("Wrong password")
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.lock {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-max);
  padding: var(--space-lg);
}

.card {
  width: 100%;
  max-width: 360px;
  background: var(--bg-card);
  border: 1px solid var(--gold);
  padding: var(--space-2xl);
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-hover);
}

.card h2 {
  color: var(--text-main);
  margin-bottom: var(--space-sm);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

.card p {
  color: var(--text-muted);
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-sm);
}

input {
  width: 100%;
  padding: var(--space-md);
  background: var(--bg-input);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-xs);
  color: var(--text-main);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-md);
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

button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-soft);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 480px) {
  .card {
    max-width: 320px;
    padding: var(--space-xl);
  }
}
</style>
