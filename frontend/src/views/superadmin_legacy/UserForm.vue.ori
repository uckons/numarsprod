<template>
  <div class="overlay">
    <div class="modal">
      <h3>{{ edit ? "Edit User" : "Tambah User" }}</h3>

      <!-- USERNAME -->
      <label>Username</label>
      <input
        v-model="form.username"
        placeholder="Username"
        :disabled="edit"
      />

      <!-- ROLE -->
      <label>Role</label>
      <select v-model="form.role_id">
        <option value="">-- Pilih Role --</option>
        <option
          v-for="r in roles"
          :key="r.id"
          :value="r.id"
        >
          {{ r.name }}
        </option>
      </select>

      <!-- BRANCH -->
      <label>Cabang</label>
      <select v-model="form.branch_id">
        <option value="">-- Pilih Cabang --</option>
        <option
          v-for="b in branches"
          :key="b.id"
          :value="b.id"
        >
          {{ b.name }}
        </option>
      </select>

      <!-- ACTION -->
      <div class="actions">
        <button class="primary" @click="submit">
          {{ edit ? "Simpan Perubahan" : "Buat User" }}
        </button>
        <button class="ghost" @click="$emit('close')">
          Batal
        </button>
      </div>

      <p v-if="error" class="error">{{ error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"

const props = defineProps({
  edit: Boolean,
  data: Object
})

const emit = defineEmits(["saved", "close"])

const roles = ref([])
const branches = ref([])
const error = ref("")

const form = ref({
  username: "",
  role_id: "",
  branch_id: ""
})

onMounted(async () => {
  try {
    const [r, b] = await Promise.all([
      api.get("/roles"),
      api.get("/branches")
    ])

    roles.value = r.data
    branches.value = b.data

    // MODE EDIT
    if (props.edit && props.data) {
      form.value = {
        username: props.data.username,
        role_id: props.data.role_id || "",
        branch_id: props.data.branch_id || ""
      }
    }
  } catch (err) {
    error.value = "Gagal load role / cabang"
  }
})

const submit = async () => {
  error.value = ""

  if (!form.value.username || !form.value.role_id) {
    error.value = "Username & Role wajib diisi"
    return
  }

  // EDIT → biarkan parent handle API (optimistic)
  if (props.edit) {
    emit("saved", {
      id: props.data.id,
      username: form.value.username,
      role_id: form.value.role_id,
      branch_id: form.value.branch_id
    })
    return
  }

  // CREATE USER
  try {
    await api.post("/users", {
      ...form.value,
      password: "123456"
    })
    emit("saved")
  } catch (err) {
    error.value =
      err.response?.data?.message || "Gagal buat user"
  }
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

.modal {
  width: 360px;
  background: #0e0e0e;
  border: 1px solid #C9A24D;
  padding: 20px;
  color: #fff;
}

h3 {
  margin-bottom: 16px;
  color: #C9A24D;
}

label {
  font-size: 13px;
  color: #aaa;
}

input, select {
  width: 100%;
  margin: 6px 0 14px;
  padding: 8px;
  background: #000;
  border: 1px solid #333;
  color: #fff;
}

input:disabled {
  opacity: .6;
}

.actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.primary {
  background: #C9A24D;
  border: none;
  padding: 8px 14px;
  font-weight: bold;
  cursor: pointer;
}

.ghost {
  background: none;
  border: 1px solid #555;
  color: #aaa;
  padding: 8px 14px;
  cursor: pointer;
}

.error {
  margin-top: 10px;
  color: #e74c3c;
  font-size: 13px;
}
</style>
