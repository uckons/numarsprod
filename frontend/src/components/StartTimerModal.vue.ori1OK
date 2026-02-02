<template>
  <div class="overlay">
    <div class="modal">
      <h2>Mulai Timer</h2>

      <!-- SERVICE TYPE -->
      <div class="field">
        <label>Pilih Service</label>
        <select v-model="selectedServiceId" @change="onServiceChange" :disabled="loadingServices">
          <option value="">-- Pilih Service --</option>
          <option v-for="svc in services" :key="svc.id" :value="svc.id">
            {{ svc.name }} ({{ svc.duration_minutes }} menit)
          </option>
        </select>
        <span v-if="loadingServices" class="loading-text">Memuat...</span>
      </div>

      <!-- THERAPIST -->
      <div class="field">
        <label>Nama Terapis</label>
        <select v-model="selectedTherapistId" :disabled="loadingTherapists || !serviceType">
          <option value="">-- Pilih Terapis --</option>
          <option v-for="t in therapists" :key="t.id" :value="t.id">
            {{ t.name }} {{ t.grade_name ? `(${t.grade_name})` : '' }}
          </option>
        </select>
        <span v-if="loadingTherapists" class="loading-text">Memuat...</span>
      </div>

      <!-- ROOM / SOFA -->
      <div class="field" v-if="serviceType">
        <label>{{ serviceType === 'SPA' ? 'Room' : 'Sofa' }}</label>
        <select v-model="selectedRoomId" :disabled="loadingRooms || !serviceType">
          <option value="">-- Pilih {{ serviceType === 'SPA' ? 'Room' : 'Sofa' }} --</option>
          <option 
            v-for="r in rooms" 
            :key="r.id" 
            :value="r.id"
            :disabled="r.is_occupied"
          >
            {{ r.name }} {{ r.is_occupied ? '❌ Occupied' : '✅ Free' }}
          </option>
        </select>
        <span v-if="loadingRooms" class="loading-text">Memuat...</span>
      </div>

      <!-- DURATION (FIX, READONLY) -->
      <div class="duration" v-if="duration">
        ⏱ Durasi: <strong>{{ duration }} menit</strong>
      </div>

      <!-- ERROR MESSAGE -->
      <div v-if="errorMessage" class="error-message">
        {{ errorMessage }}
      </div>

      <!-- ACTIONS -->
      <div class="actions">
        <button class="cancel" @click="$emit('close')">
          Batal
        </button>
        <button class="start" @click="submit" :disabled="isSubmitting">
          {{ isSubmitting ? 'Memproses...' : 'Mulai' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from "vue"
import api from "@/services/api"

const emit = defineEmits(["close", "start"])

// State
const services = ref([])
const therapists = ref([])
const rooms = ref([])

const selectedServiceId = ref("")
const selectedTherapistId = ref("")
const selectedRoomId = ref("")

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

const duration = computed(() => {
  return selectedService.value?.duration_minutes || 0
})

// Methods
const fetchServices = async () => {
  try {
    loadingServices.value = true
    errorMessage.value = ""
    
    // Fetch all services (will be filtered by active services on backend)
    const res = await api.get("/services")
    services.value = res.data.filter(s => s.is_active && s.duration_minutes > 0)
  } catch (err) {
    console.error("Error fetching services:", err)
    errorMessage.value = "Gagal memuat daftar service"
  } finally {
    loadingServices.value = false
  }
}

const fetchTherapists = async () => {
  if (!serviceType.value) return
  
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
  selectedTherapistId.value = ""
  selectedRoomId.value = ""
  
  // Fetch therapists and rooms for the new service type
  if (serviceType.value) {
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
  
  if (!selectedTherapistId.value) {
    errorMessage.value = "Silakan pilih terapis"
    return
  }
  
  if (!selectedRoomId.value && serviceType.value) {
    errorMessage.value = `Silakan pilih ${serviceType.value === 'SPA' ? 'room' : 'sofa'}`
    return
  }
  
  isSubmitting.value = true
  
  emit("start", {
    service_id: parseInt(selectedServiceId.value),
    service_type: serviceType.value,
    therapist_id: parseInt(selectedTherapistId.value),
    room_id: parseInt(selectedRoomId.value),
    duration_minutes: duration.value
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
  width: 340px;
  background: #0f0f0f;
  border: 1px solid #222;
  border-radius: 16px;
  padding: 20px;
  color: #fff;
  max-height: 90vh;
  overflow-y: auto;
}

h2 {
  margin: 0 0 16px;
  font-size: 18px;
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
  background: #c9a24d;
  color: #000;
}

.start:hover:not(:disabled) {
  background: #d4b05d;
}

.cancel:hover {
  background: #333;
}
</style>
