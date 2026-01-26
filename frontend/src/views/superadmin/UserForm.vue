<template>
  <div class="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] modal-backdrop">
    <div class="w-[420px] max-h-[85vh] bg-bg-card rounded-lg shadow-2xl animate-[pop_0.2s_ease] flex flex-col modal">
      <!-- HEADER -->
      <div class="flex justify-between items-center p-4 border-b border-gray-800">
        <h3 class="text-lg font-semibold m-0">{{ edit ? "Edit User" : "Add New User" }}</h3>
        <button class="bg-transparent border-none text-xl text-gray-500 cursor-pointer hover:text-white transition-colors" @click="$emit('close')">×</button>
      </div>

      <!-- BODY -->
      <div class="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
        <div class="flex flex-col mb-3">
          <label class="text-xs text-gray-500 mb-1">Full Name</label>
          <input
            v-model="form.name"
            placeholder="Full name"
            class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
          />
        </div>
        <div class="flex flex-col mb-3">
          <label class="text-xs text-gray-500 mb-1">Phone</label>
          <input
            v-model="form.phone"
            placeholder="08xxxxxxxxxx"
            class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div class="flex flex-col mb-3">
          <label class="text-xs text-gray-500 mb-1">Username</label>
          <input
            v-model="form.username"
            :disabled="edit"
            placeholder="username"
            class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div class="flex flex-col mb-3" v-if="!edit">
          <label class="text-xs text-gray-500 mb-1">Password</label>
          <input
            type="password"
            v-model="form.password"
            placeholder="Default: 123456"
            class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors"
          />
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col mb-3">
            <label class="text-xs text-gray-500 mb-1">Role</label>
            <select v-model="form.role_id" class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors cursor-pointer">
              <option disabled value="">Select Role</option>
              <option
                v-for="r in roles"
                :key="r.id"
                :value="r.id"
              >
                {{ r.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col mb-3">
            <label class="text-xs text-gray-500 mb-1">Branch</label>
            <select v-model="form.branch_id" class="bg-black border border-gray-800 text-white p-2 rounded focus:outline-none focus:border-gold transition-colors cursor-pointer">
              <option value="">All / None</option>
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
      </div>

      <!-- FOOTER -->
      <div class="flex justify-end gap-3 p-4 border-t border-gray-800">
        <button class="bg-transparent border border-gold text-gold px-4 py-2 rounded cursor-pointer hover:bg-gold hover:text-black transition-all" @click="$emit('close')">
          Cancel
        </button>
        <button class="bg-gold text-black px-4 py-2 rounded cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed" @click="save" :disabled="loading">
          {{ loading ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"
const emit = defineEmits(["saved", "close"])
const props = defineProps({
  edit: Boolean,
  data: Object,
})
const form = ref({
  name:"",
  username:"",
  phone: "",
  password: "",
  role_id: "",
  branch_id: "",
})

const loading = ref(false)
const roles = ref([])
const branches = ref([])


/* INIT */
onMounted(async () => {
  const [r, b] = await Promise.all([
    api.get("/roles"),
    api.get("/branches"),
  ])

  roles.value = r.data.data || r.data
  branches.value = b.data.data || b.data

  if (props.edit && props.data) {
  form.value = {
    name: props.data.name,
    username: props.data.username,
    phone: props.data.phone,
    role_id: props.data.role_id,
    branch_id: props.data.branch_id || "",
    password: ""
  }
}

})

/* SAVE */
const save = async () => {
  if (!form.value.name || !form.value.phone || !form.value.username || !form.value.role_id) {
    return alert("Name, Phone, Username & Role required")
  }

  loading.value = true
  try {
    if (props.edit) {
      // ⛔ JANGAN kirim password saat edit
      await api.put(`/users/${props.data.id}`, {
        role_id: form.value.role_id,
        branch_id: form.value.branch_id
      })

      emit("saved", {
        id: props.data.id,
        role_id: form.value.role_id,
        branch_id: form.value.branch_id
      })
    } else {
      // ✅ DEFAULT PASSWORD
      if (!form.value.password) {
        form.value.password = "123456"
      }

      await api.post("/users", form.value)
      emit("saved")
    }
  } catch (err) {
    console.error(err.response?.data)
    alert(err.response?.data?.message || "Failed save user")
  } finally {
    loading.value = false
  }
}

</script>
