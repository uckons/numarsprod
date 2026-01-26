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
  background: rgba(0,0,0,.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}

.modal {
  width: 340px;
  background: #0f0f0f;
  border: 1px solid #222;
  border-radius: 16px;
  padding: 20px;
  color: #fff;
}

h2 {
  margin: 0 0 16px;
  font-size: 18px;
}

.field {
  margin-bottom: 12px;
}

label {
  font-size: 12px;
  color: #aaa;
  display: block;
  margin-bottom: 4px;
}

input, select {
  width: 100%;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid #222;
  background: #111;
  color: #fff;
}

.duration {
  margin: 14px 0;
  font-size: 14px;
  color: #c9a24d;
  text-align: center;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

button {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  border: none;
  font-weight: 700;
  cursor: pointer;
}

.cancel {
  background: #222;
  color: #aaa;
}

.start {
  background: #c9a24d;
  color: #000;
}
</style>
