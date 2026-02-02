<template>
  <div class="overlay">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>{{ edit ? "Edit User" : "Add New User" }}</h3>
        <button class="close" @click="$emit('close')">×</button>
      </div>

      <!-- BODY -->
      <div class="modal-body">
        <div class="form-group">
          <label>Full Name</label>
          <input v-model="form.name" placeholder="Full name" />
        </div>

        <div class="form-group">
          <label>Phone</label>
          <input v-model="form.phone" placeholder="08xxxxxxxxxx" />
        </div>

        <div class="form-group">
          <label>Username</label>
          <input v-model="form.username" :disabled="edit" placeholder="username" />
        </div>

        <div class="form-group" v-if="!edit">
          <label>Password</label>
          <input type="password" v-model="form.password" placeholder="Default: 123456" />
        </div>

        <div class="row">
          <div class="form-group">
            <label>Role</label>
            <select v-model="form.role_id">
              <option disabled value="">Select Role</option>
              <option v-for="r in roles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>

          <div class="form-group">
            <label>Branch</label>
            <select v-model="form.branch_id">
              <option value="">All / None</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="btn-outline" @click="$emit('close')">Cancel</button>
        <button class="btn-primary" @click="save" :disabled="loading">{{ loading ? "Saving..." : "Save" }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "../../services/api"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css" // base styles; can be moved to main.js if desired

const emit = defineEmits(["saved", "close"])
const props = defineProps({
  edit: Boolean,
  data: Object,
})

const form = ref({
  name: "",
  username: "",
  phone: "",
  password: "",
  role_id: "",
  branch_id: "",
})

const loading = ref(false)
const roles = ref([])
const branches = ref([])

/* ===== Add Swal theme mixin (black & gold) ===== */
const SwalTheme = Swal.mixin({
  customClass: {
    popup: "swal-theme-popup",
    title: "swal-theme-title",
    content: "swal-theme-content",
    confirmButton: "swal-theme-confirm",
    cancelButton: "swal-theme-cancel",
    denyButton: "swal-theme-deny"
  },
  buttonsStyling: false
})
/* ============================================= */

/* INIT */
onMounted(async () => {
  try {
    const [r, b] = await Promise.all([api.get("/roles"), api.get("/branches")])
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
  } catch (err) {
    // optional: show error fetching roles/branches
    console.error(err)
    await SwalTheme.fire({
      icon: "error",
      title: "Gagal memuat data",
      text: err?.response?.data?.message || "Failed to load roles or branches",
      confirmButtonText: "OK"
    })
  }
})

/* SAVE */
const save = async () => {
  if (!form.value.name || !form.value.phone || !form.value.username || !form.value.role_id) {
    await SwalTheme.fire({
      icon: "warning",
      title: "Validasi",
      text: "Name, Phone, Username & Role required",
      confirmButtonText: "OK"
    })
    return
  }

  loading.value = true
  try {
    if (props.edit) {
      // ⛔ do not send password when editing
      await api.put(`/users/${props.data.id}`, {
        role_id: form.value.role_id,
        branch_id: form.value.branch_id
      })

      await SwalTheme.fire({
        icon: "success",
        title: "Berhasil",
        text: "User berhasil diperbarui",
        confirmButtonText: "OK"
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

      await SwalTheme.fire({
        icon: "success",
        title: "Berhasil",
        text: "User berhasil dibuat",
        confirmButtonText: "OK"
      })

      emit("saved")
    }
  } catch (err) {
    console.error(err?.response?.data || err)
    await SwalTheme.fire({
      icon: "error",
      title: "Gagal",
      text: err?.response?.data?.message || "Failed save user",
      confirmButtonText: "OK"
    })
  } finally {
    loading.value = false
  }
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
  z-index: 100;
}

.modal {
  width: 420px;
  max-height: 85vh;
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-strong);
  animation: pop .2s ease;
  display: flex;
  flex-direction: column;
}

@keyframes pop {
  from { transform: scale(.95); opacity: 0 }
  to { transform: scale(1); opacity: 1 }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-soft);
}

.modal-header h3 {
  margin: 0;
}

.close {
  background: none;
  border: none;
  font-size: 22px;
  color: var(--text-muted);
  cursor: pointer;
}

.modal-body {
  padding: 16px;
  overflow-y: auto;
  max-height: calc(85vh - 120px);
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

label {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 4px;
}

input, select {
  background: #000;
  border: 1px solid var(--border-soft);
  color: white;
  padding: 8px;
  border-radius: var(--radius);
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px;
  border-top: 1px solid var(--border-soft);
}

.btn-primary {
  background: var(--gold);
  color: black;
  padding: 8px 14px;
}

.btn-outline {
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: 8px 14px;
}

/* ===== SweetAlert2 Black & Gold theme (scoped using :deep) =====
   Using :deep(...) avoids deprecated ::v-deep combinator warnings.
*/
:deep(.swal-theme-popup) {
  background: linear-gradient(145deg, #0e0e0e, #151515) !important;
  color: #fff !important;
  border-radius: 12px !important;
  border: 1px solid rgba(255, 215, 0, 0.08) !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6) !important;
}

:deep(.swal-theme-title) {
  color: var(--gold, #f5c518) !important;
  font-weight: 600;
}

:deep(.swal-theme-content) {
  color: #cfcfcf !important;
  font-size: 14px;
}

:deep(.swal-theme-confirm) {
  background: var(--gold, #f5c518) !important;
  color: #000 !important;
  border: none !important;
  padding: 8px 16px !important;
  border-radius: 8px !important;
  box-shadow: none !important;
}

:deep(.swal-theme-cancel) {
  background: transparent !important;
  color: var(--gold, #f5c518) !important;
  border: 1px solid var(--gold, #f5c518) !important;
  padding: 7px 14px !important;
  border-radius: 8px !important;
}

:deep(.swal-theme-deny) {
  background: transparent !important;
  color: var(--gold, #f5c518) !important;
  border: 1px solid rgba(255, 215, 0, 0.12) !important;
  padding: 7px 14px !important;
  border-radius: 8px !important;
}

/* success icon overrides */
:deep(.swal2-success-ring),
:deep(.swal2-success-fix) {
  border-color: var(--gold, #f5c518) !important;
}
:deep(.swal2-success-line-tip),
:deep(.swal2-success-line-long) {
  background-color: var(--gold, #f5c518) !important;
}
</style>