<template>
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[999]">
    <div class="w-[340px] bg-[#0f0f0f] border border-[#222] rounded-2xl p-5 text-white">
      <h2 class="m-0 mb-4 text-lg">Mulai Timer</h2>

      <!-- SERVICE TYPE -->
      <div class="mb-3">
        <label class="text-xs text-[#aaa] block mb-1">Tipe Service</label>
        <select v-model="serviceType" class="w-full px-2.5 py-2 rounded-[10px] border border-[#222] bg-[#111] text-white">
          <option value="SPA">SPA</option>
          <option value="LC">LC</option>
        </select>
      </div>

      <!-- THERAPIST -->
      <div class="mb-3">
        <label class="text-xs text-[#aaa] block mb-1">Nama Terapis</label>
        <input v-model="therapist" placeholder="Nama terapis" class="w-full px-2.5 py-2 rounded-[10px] border border-[#222] bg-[#111] text-white" />
      </div>

      <!-- ROOM / SOFA -->
      <div class="mb-3" v-if="serviceType === 'SPA'">
        <label class="text-xs text-[#aaa] block mb-1">Room</label>
        <input v-model="room" placeholder="Room No" class="w-full px-2.5 py-2 rounded-[10px] border border-[#222] bg-[#111] text-white" />
      </div>

      <div class="mb-3" v-if="serviceType === 'LC'">
        <label class="text-xs text-[#aaa] block mb-1">Sofa</label>
        <input v-model="sofa" placeholder="Sofa No" class="w-full px-2.5 py-2 rounded-[10px] border border-[#222] bg-[#111] text-white" />
      </div>

      <!-- DURATION (FIX, READONLY) -->
      <div class="my-3.5 text-sm text-gold text-center">
        ? Durasi: <strong>{{ duration }} menit</strong>
      </div>

      <!-- ACTIONS -->
      <div class="flex gap-2.5 mt-2.5">
        <button class="flex-1 py-2.5 rounded-xl border-0 font-bold cursor-pointer bg-[#222] text-[#aaa]" @click="$emit('close')">
          Batal
        </button>
        <button class="flex-1 py-2.5 rounded-xl border-0 font-bold cursor-pointer bg-gold text-black" @click="submit">
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
