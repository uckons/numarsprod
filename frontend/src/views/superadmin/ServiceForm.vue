<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] modal-backdrop">
    <div class="w-[440px] bg-bg-card rounded-lg shadow-2xl z-[150] modal">
      <!-- HEADER -->
      <div class="flex justify-between items-center p-4 border-b border-gray-800">
        <h3 class="text-lg font-semibold m-0">{{ edit ? "Edit Service" : "Add New Service" }}</h3>
        <button class="bg-transparent border-none text-xl text-gray-500 cursor-pointer hover:text-white transition-colors" @click="closeForm">X</button>
      </div>

      <!-- BODY -->
      <form class="p-4" @submit.prevent="save">
        <div class="flex flex-col mb-3">
          <label class="text-xs text-gray-500 mb-1">Name</label>
          <input 
            v-model="form.name" 
            placeholder="Service name" 
            class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col mb-3">
            <label class="text-xs text-gray-500 mb-1">Type</label>
            <select 
              v-model="form.type" 
              class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors cursor-pointer"
            >
              <option disabled value="">Select</option>
              <option>SPA</option>
              <option>LC</option>
              <option>FNB</option>
              <option>KARAOKE</option>
            </select>
          </div>

          <div class="flex flex-col mb-3">
            <label class="text-xs text-gray-500 mb-1">Branch</label>
            <select 
              v-model="form.branch_id" 
              class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors cursor-pointer"
            >
              <option disabled value="">Select Branch</option>
              <option
                v-for="b in branches"
                :key="b.id"
                :value="b.id"
              >
                {{ b.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col mb-3">
            <label class="text-xs text-gray-500 mb-1">Duration (minutes)</label>
            <input 
              type="number" 
              v-model.number="form.duration_minutes" 
              class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <div class="flex flex-col mb-3">
            <label class="text-xs text-gray-500 mb-1">Base Price</label>
            <input 
              type="number" 
              v-model.number="form.base_price" 
              class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
            />
          </div>
        </div>

        <!-- FOOTER -->
        <div class="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button 
            type="button" 
            class="bg-transparent border border-gold text-gold px-4 py-2 rounded cursor-pointer hover:bg-gold hover:text-black transition-all" 
            @click="closeForm"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            class="bg-gold text-black px-4 py-2 rounded cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" 
            :disabled="loading"
          >
            {{ loading ? "Saving..." : "Save" }}
          </button>
        </div>
      </form>
    </div>

    <!-- SUCCESS POPUP -->
    <div 
      v-if="success" 
      class="fixed inset-0 bg-black/60 flex items-center justify-center z-[300]" 
      @click.self="confirmSuccess"
    >
      <div class="bg-gradient-to-br from-[#0e0e0e] to-[#151515] p-6 rounded-2xl text-center w-80 shadow-3xl" role="dialog" aria-modal="true" aria-labelledby="successTitle">
        <h4 id="successTitle" class="text-success text-xl mb-2">Success</h4>
        <p class="text-gray-400 text-sm mb-4">Service berhasil disimpan</p>
        <button class="bg-gold text-black px-4 py-2 rounded cursor-pointer hover:opacity-90 transition-opacity" @click="confirmSuccess">OK</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const emit = defineEmits(["saved", "close"])
const props = defineProps({
  edit: Boolean,
  data: Object
})

const form = ref({
  name: "",
  type: "",
  base_price: 0,
  duration_minutes: null,
  branch_id: null
})

const branches = ref([])
const loading = ref(false)
const success = ref(false)

/* INIT */
onMounted(async () => {
  try {
    const res = await api.get("/branches")
    branches.value = res.data.data || res.data
  } catch (err) {
    // fallback atau notify user
    branches.value = []
  }

  if (!props.edit) {
    form.value.branch_id = 1 // default Pondok Indah (pastikan id 1 valid)
  }

  if (props.edit && props.data) {
    Object.assign(form.value, props.data)
  }
})

/* ACTIONS */
const closeForm = () => {
  emit("close")
}

const save = async () => {
  if (!form.value.name || !form.value.type || !form.value.branch_id) {
    alert("Name, Type dan Branch wajib diisi")
    return
  }

  loading.value = true
  try {
    if (props.edit) {
      await api.put(`/services/${props.data.id}`, form.value)
    } else {
      await api.post("/services", form.value)
    }

    success.value = true
  } catch (e) {
    alert("Failed to save service")
  } finally {
    loading.value = false
  }
}

const confirmSuccess = () => {
  success.value = false
  emit("saved")
  emit("close")
}
</script>
