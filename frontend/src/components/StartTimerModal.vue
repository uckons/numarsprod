<template>
<div class="overlay">
  <div class="modal">
    <!-- HEADER -->
    <div class="modal-header">
      <h2>Mulai Timer</h2>
      <span class="subtitle">Atur service & terapis</span>
    </div>

    <div class="divider"></div>

    <!-- SERVICE -->
    <div class="field">
      <label>Pilih Service</label>
      <select v-model="selectedServiceId" @change="onServiceChange" :disabled="loadingServices">
        <option value="">-- Pilih Service --</option>
        <option v-for="svc in services" :key="svc.id" :value="svc.id">
          <!--{{ svc.name }} • {{ svc.duration_minutes }} menit-->
          {{ svc.name }}
          •
          {{ svc.duration_minutes ? `${svc.duration_minutes} menit` : 'Durasi manual' }}
        </option>
      </select>
      <span v-if="loadingServices" class="loading-text">Memuat service…</span>
    </div>

    <!-- THERAPIST -->
    <div class="field" v-if="serviceType && serviceType !== 'LOUNGE'">
      <label>
        Nama Terapis
        <small v-if="comboQty > 1">(wajib {{ comboQty }} terapis untuk combo)</small>
      </label>
      <div v-if="comboQty > 1" class="therapist-grid">
        <select
          v-for="idx in comboQty"
          :key="idx"
          v-model="selectedTherapistIds[idx - 1]"
          :disabled="loadingTherapists || !serviceType"
        >
          <option value="">-- Pilih Terapis #{{ idx }} --</option>
          <option v-for="t in therapists" :key="t.id" :value="t.id">
            {{ t.name }} <span v-if="t.grade_name">({{ t.grade_name }})</span>
          </option>
        </select>
      </div>
      <select v-else v-model="selectedTherapistIds[0]" :disabled="loadingTherapists || !serviceType">
        <option value="">-- Pilih Terapis --</option>
        <option v-for="t in therapists" :key="t.id" :value="t.id">
          {{ t.name }} <span v-if="t.grade_name">({{ t.grade_name }})</span>
        </option>
      </select>
      <span v-if="loadingTherapists" class="loading-text">Memuat terapis…</span>
    </div>

    <!-- ROOM / SOFA -->
    <div class="field" v-if="serviceType">
      <label>{{ serviceType === 'SPA' ? 'Room' : 'Tabel / Sofa' }}</label>
      <select v-model="selectedRoomId" :disabled="loadingRooms">
        <option value="">-- Pilih --</option>
        <option v-for="r in rooms" :key="r.id" :value="r.id" :disabled="r.is_occupied">
          {{ r.name }} {{ r.is_occupied ? '• Occupied' : '' }}
        </option>
      </select>
      <span v-if="loadingRooms" class="loading-text">Memuat data…</span>
    </div>
    <!-- MANUAL DURATION -->
    <div class="field" v-if="serviceType && duration === 0">
      <label>Durasi (menit)</label>
      <input
        type="number"
        min="1"
        v-model.number="manualDuration"
        placeholder="Masukkan durasi"
      />
    </div>
    <!-- DURATION -->
    <div class="duration-box" v-if="duration">
      ⏱ Durasi Service
      <strong>{{ duration }} menit</strong>
    </div>

    <!-- ERROR -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>

    <!-- ACTION -->
    <div class="actions">
      <button class="cancel" @click="$emit('close')">Batal</button>
      <button class="start" @click="submit" :disabled="isSubmitting">
        {{ isSubmitting ? 'Memproses…' : 'Mulai Timer' }}
      </button>
    </div>
  </div>
</div>

</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import api from "@/services/api"

const emit = defineEmits(["close", "start"])

// State
const services = ref([])
const therapists = ref([])
const rooms = ref([])

const selectedServiceId = ref("")
const selectedTherapistIds = ref([""])
const selectedRoomId = ref("")
const manualDuration = ref(0)

const loadingServices = ref(false)
const loadingTherapists = ref(false)
const loadingRooms = ref(false)
const isSubmitting = ref(false)
const errorMessage = ref("")

// Computed
const selectedService = computed(() => {
  return services.value.find(s => s.id === parseInt(selectedServiceId.value))
})

const serviceType = computed(() => {
  return selectedService.value?.type || ""
})
const parseComboQty = (service) => {
  if (!service) return 1
  if (!["SPA", "LC", "LOUNGE"].includes(service.type)) return 1
  const match = String(service.name || "").match(/combo\s*(\d+)/i)
  const qty = match ? Number(match[1]) : 1
  return Number.isInteger(qty) && qty > 1 ? qty : 1
}


const duration = computed(() => {
  return selectedService.value?.duration_minutes || 0
})
const effectiveDuration = computed(() => {
  return duration.value || manualDuration.value
})
const comboQty = computed(() => parseComboQty(selectedService.value))
// Methods
const normalizeServicePayload = (payload) => {
  if (Array.isArray(payload)) return payload

  const candidates = [
    payload?.data,
    payload?.rows,
    payload?.items,
    payload?.results,
    payload?.services,
    payload?.data?.data,
    payload?.data?.rows,
    payload?.data?.items,
    payload?.data?.results,
    payload?.data?.services
  ]

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate
  }

  return []
}

const fetchServices = async () => {
  try {
    loadingServices.value = true
    errorMessage.value = ""

    const res = await api.get("/services", {
      params: { is_active: true, _ts: Date.now() },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache"
      }
    })

    const allServices = normalizeServicePayload(res.data)
    services.value = allServices.filter(s => s?.type !== "FNB")

    if (!services.value.length) {
      errorMessage.value = "Tidak ada service aktif yang bisa dipilih"
    }
  } catch (err) {
    console.error("Error fetching services:", err)
    errorMessage.value = err.response?.data?.message || "Gagal memuat daftar service"
  } finally {
    loadingServices.value = false
  }
}

const fetchTherapists = async () => {
  //if (!serviceType.value) return
  if (!serviceType.value || serviceType.value === "LOUNGE") return
  try {
    loadingTherapists.value = true
    errorMessage.value = ""
    
    const res = await api.get("/timers/therapists", {
      params: { service_type: serviceType.value }
    })
    therapists.value = res.data
  } catch (err) {
    console.error("Error fetching therapists:", err)
    errorMessage.value = "Gagal memuat daftar terapis"
  } finally {
    loadingTherapists.value = false
  }
}

const fetchRooms = async () => {
  if (!serviceType.value) return
  
  try {
    loadingRooms.value = true
    errorMessage.value = ""
    
    const res = await api.get("/timers/rooms", {
      params: { service_type: serviceType.value }
    })
    rooms.value = res.data
  } catch (err) {
    console.error("Error fetching rooms:", err)
    errorMessage.value = "Gagal memuat daftar room/sofa"
  } finally {
    loadingRooms.value = false
  }
}

const onServiceChange = () => {
  // Reset selections when service changes
  selectedTherapistIds.value = Array(comboQty.value).fill("")
  selectedRoomId.value = ""
  manualDuration.value = 0
  // Fetch therapists and rooms for the new service type
  if (serviceType.value) {
    selectedTherapistIds.value = Array(comboQty.value).fill("")
    fetchTherapists()
    fetchRooms()
  }
}

const submit = () => {
  errorMessage.value = ""
  
  // Validation
  if (!selectedServiceId.value) {
    errorMessage.value = "Silakan pilih service"
    return
  }
  
  const normalizedTherapistIds = selectedTherapistIds.value
    .map(id => Number(id))
    .filter(id => Number.isInteger(id) && id > 0)

  if (serviceType.value !== "LOUNGE") {
    if (!normalizedTherapistIds.length) {
      errorMessage.value = "Silakan pilih terapis"
      return
    }

    if (comboQty.value > 1 && normalizedTherapistIds.length !== comboQty.value) {
      errorMessage.value = `Combo membutuhkan ${comboQty.value} terapis`
      return
    }

    if (new Set(normalizedTherapistIds).size !== normalizedTherapistIds.length) {
      errorMessage.value = "Terapis combo harus berbeda"
      return
    }
  }
  
  if (!selectedRoomId.value && serviceType.value) {
    errorMessage.value = `Silakan pilih ${serviceType.value === 'SPA' ? 'room' : 'tabel/sofa'}`
    return
  }
  if (duration.value === 0 && !manualDuration.value) {
    errorMessage.value = "Silakan isi durasi service"
    return
  }
  isSubmitting.value = true
  
  emit("start", {
    service_id: parseInt(selectedServiceId.value),
    service_type: serviceType.value,
    therapist_id: normalizedTherapistIds[0] || null,
    therapist_ids: normalizedTherapistIds,
    combo_qty: comboQty.value,
    room_id: parseInt(selectedRoomId.value),
    duration_minutes: effectiveDuration.value
  })
  
  // Reset submitting state after a delay
  setTimeout(() => {
    isSubmitting.value = false
  }, 1000)
}

// Lifecycle
onMounted(() => {
  fetchServices()
})
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
  width: 420px;
  background: linear-gradient(180deg, #0f0f0f, #0a0a0a);
  border: 1px solid #2a2a2a;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
}
.modal-header {
  text-align: center;
}

.therapist-grid {
  display: grid;
  gap: 8px;
}
.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
}
.subtitle {
  font-size: 12px;
  color: #888;
}
.divider {
  height: 1px;
  background: #222;
  margin: 14px 0 18px;
}
.field select {
  height: 42px;
}
.duration-box {
  background: rgba(201,162,77,.1);
  border: 1px solid rgba(201,162,77,.3);
  padding: 12px;
  border-radius: 14px;
  text-align: center;
  margin: 16px 0;
  font-size: 14px;
}

.duration-box strong {
  display: block;
  font-size: 20px;
  margin-top: 4px;
}
.actions button {
  height: 44px;
  font-size: 14px;
}
h2 {
  text-align: center;
  font-weight: 700;
  letter-spacing: .5px;
}

.field {
  margin-bottom: 12px;
  position: relative;
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

select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

select option:disabled {
  color: #666;
}

.loading-text {
  font-size: 11px;
  color: #c9a24d;
  margin-top: 4px;
  display: block;
}

.duration {
  margin: 14px 0;
  font-size: 14px;
  color: #c9a24d;
  text-align: center;
}

.error-message {
  background: rgba(255, 59, 48, 0.1);
  border: 1px solid rgba(255, 59, 48, 0.3);
  color: #ff3b30;
  padding: 10px;
  border-radius: 10px;
  font-size: 12px;
  margin: 10px 0;
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
  transition: opacity 0.2s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel {
  background: #222;
  color: #aaa;
}

.start {
  background: linear-gradient(135deg, #c9a24d, #e0c068);
  color: #000;
}

.start:hover:not(:disabled) {
  transform: translateY(-1px);
}
.cancel:hover {
  background: #333;
}
</style>
