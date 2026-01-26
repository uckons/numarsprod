<template>
  <div class="overlay">
    <div class="modal">
      <h2>Mulai Timer</h2>

      <!-- SERVICE TYPE -->
      <div class="field">
        <label>Tipe Service</label>
        <select v-model="serviceType">
          <option value="SPA">SPA</option>
          <option value="LC">LC</option>
        </select>
      </div>

      <!-- THERAPIST -->
      <div class="field">
        <label>Nama Terapis</label>
        <input v-model="therapist" placeholder="Nama terapis" />
      </div>

      <!-- ROOM / SOFA -->
      <div class="field" v-if="serviceType === 'SPA'">
        <label>Room</label>
        <input v-model="room" placeholder="Room No" />
      </div>

      <div class="field" v-if="serviceType === 'LC'">
        <label>Sofa</label>
        <input v-model="sofa" placeholder="Sofa No" />
      </div>

      <!-- DURATION (FIX, READONLY) -->
      <div class="duration">
        ? Durasi: <strong>{{ duration }} menit</strong>
      </div>

      <!-- ACTIONS -->
      <div class="actions">
        <button class="cancel" @click="$emit('close')">
          Batal
        </button>
        <button class="start" @click="submit">
          Mulai
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"

const emit = defineEmits(["close", "start"])

const serviceType = ref("SPA")
const therapist = ref("")
const room = ref("")
const sofa = ref("")

/**
 * ? DURASI FIX SESUAI SERVICE
 * (NANTI BISA DIAMBIL DARI DB)
 */
const duration = computed(() => {
  if (serviceType.value === "SPA") return 60
  if (serviceType.value === "LC") return 180
  return 60
})

const submit = () => {
  if (!therapist.value) {
    alert("Nama terapis wajib diisi")
    return
  }

  emit("start", {
    service_type: serviceType.value,
    therapist_name: therapist.value,
    room_no: serviceType.value === "SPA" ? room.value : null,
    sofa_no: serviceType.value === "LC" ? sofa.value : null,
    duration: duration.value
  })
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal-backdrop);
  padding: var(--space-lg);
}

.modal {
  width: 100%;
  max-width: 380px;
  background: var(--bg-dark);
  border: 1px solid var(--border-medium);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  color: var(--text-main);
  box-shadow: var(--shadow-hover);
}

h2 {
  margin: 0 0 var(--space-lg);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-main);
}

.field {
  margin-bottom: var(--space-md);
}

label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: var(--font-weight-medium);
}

input, select {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-sm);
  border: 1px solid var(--border-medium);
  background: var(--bg-card);
  color: var(--text-main);
  font-size: var(--font-size-sm);
  transition: border-color var(--transition-fast);
}

input:focus, select:focus {
  outline: none;
  border-color: var(--gold);
}

.duration {
  margin: var(--space-md) 0;
  font-size: var(--font-size-sm);
  color: var(--gold);
  text-align: center;
  font-weight: var(--font-weight-medium);
  padding: var(--space-sm);
  background: var(--gold-soft);
  border-radius: var(--radius-xs);
}

.actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}

button {
  flex: 1;
  padding: var(--space-md);
  border-radius: var(--radius-xs);
  border: none;
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-size: var(--font-size-sm);
  transition: all var(--transition-fast);
}

button:hover {
  transform: translateY(-2px);
}

.cancel {
  background: var(--border-medium);
  color: var(--text-secondary);
}

.cancel:hover {
  background: var(--border-light);
}

.start {
  background: var(--gold);
  color: #000;
}

.start:hover {
  box-shadow: var(--shadow-soft);
}

/* Mobile optimization */
@media (max-width: 480px) {
  .modal {
    padding: var(--space-lg);
    max-width: 340px;
  }
  
  h2 {
    font-size: var(--font-size-base);
  }
  
  .actions {
    flex-direction: column;
  }
  
  button {
    width: 100%;
  }
}
</style>
