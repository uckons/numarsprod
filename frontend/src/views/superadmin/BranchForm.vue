<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] modal-backdrop">
    <div class="w-[400px] bg-bg-card p-5 rounded-lg shadow-2xl animate-[pop_0.2s_ease] modal">
      <h3 class="text-lg font-semibold mb-4">{{ edit ? "Edit Branch" : "Add Branch" }}</h3>

      <input 
        v-model="form.name" 
        placeholder="Branch name" 
        class="w-full mb-3 p-2 bg-black border border-gray-800 text-white rounded focus:outline-none focus:border-gold transition-colors"
      />
      <input 
        v-model="form.address" 
        placeholder="Address" 
        class="w-full mb-3 p-2 bg-black border border-gray-800 text-white rounded focus:outline-none focus:border-gold transition-colors"
      />

      <div class="flex gap-3 mb-3">
        <input 
          type="time" 
          v-model="form.open_time" 
          class="flex-1 p-2 bg-black border border-gray-800 text-white rounded focus:outline-none focus:border-gold transition-colors"
        />
        <input 
          type="time" 
          v-model="form.close_time" 
          class="flex-1 p-2 bg-black border border-gray-800 text-white rounded focus:outline-none focus:border-gold transition-colors"
        />
      </div>

      <div class="flex justify-end gap-3">
        <button 
          @click="$emit('close')" 
          class="px-4 py-2 bg-transparent border border-gold text-gold rounded cursor-pointer hover:bg-gold hover:text-black transition-all"
        >
          Cancel
        </button>
        <button 
          class="px-4 py-2 bg-gold text-black rounded cursor-pointer hover:opacity-90 transition-opacity" 
          @click="save"
        >
          Save
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const emit = defineEmits(["saved", "close"])
const props = defineProps({ edit: Boolean, data: Object })

const form = ref({
  name: "",
  address: "",
  open_time: "10:00",
  close_time: "03:00"
})

onMounted(() => {
  if (props.edit && props.data) {
    form.value = { ...props.data }
  }
})

const save = async () => {
  if (!form.value.name) return alert("Name required")

  if (props.edit) {
    await api.put(`/branches/${props.data.id}`, form.value)
  } else {
    await api.post("/branches", form.value)
  }

  emit("saved")
}
</script>
