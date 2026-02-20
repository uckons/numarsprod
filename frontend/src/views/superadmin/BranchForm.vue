<template>
  <div class="overlay">
    <div class="modal">
      <h3>{{ edit ? "Edit Branch" : "Add Branch" }}</h3>

      <input v-model="form.name" placeholder="Branch name" />
      <input v-model="form.address" placeholder="Address" />
      <input v-model="form.phone" placeholder="Phone" />

      <label class="file-label">Logo Outlet</label>
      <input type="file" accept="image/*" @change="onLogoChange" />
      <input v-model="form.logo_url" placeholder="atau paste URL logo" />
      <img v-if="form.logo_url" :src="form.logo_url" class="logo-preview" alt="logo preview" />

      <div class="row">
        <input type="time" v-model="form.open_time" />
        <input type="time" v-model="form.close_time" />
      </div>

      <div class="actions">
        <button @click="$emit('close')" :disabled="loading">Cancel</button>
        <button class="primary" @click="save" :disabled="loading">
          {{ loading ? "Saving..." : "Save" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css" // base styles

const emit = defineEmits(["saved", "close"])
const props = defineProps({ edit: Boolean, data: Object })

const form = ref({
  name: "",
  address: "",
  phone: "",
  logo_url: "",
  open_time: "10:00",
  close_time: "03:00"
})

const loading = ref(false)

/* SweetAlert2 theme mixin (black & gold) */
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

onMounted(() => {
  if (props.edit && props.data) {
    form.value = { ...props.data }
  }
})

const save = async () => {
  if (!form.value.name) {
    await SwalTheme.fire({
      icon: "warning",
      title: "Validasi",
      text: "Name required",
      confirmButtonText: "OK"
    })
    return
  }

  loading.value = true
  try {
    if (props.edit) {
      await api.put(`/branches/${props.data.id}`, form.value)
      await SwalTheme.fire({
        icon: "success",
        title: "Berhasil",
        text: "Branch berhasil diperbarui",
        confirmButtonText: "OK"
      })
    } else {
      await api.post("/branches", form.value)
      await SwalTheme.fire({
        icon: "success",
        title: "Berhasil",
        text: "Branch berhasil dibuat",
        confirmButtonText: "OK"
      })
    }

    emit("saved")
  } catch (err) {
    console.error(err)
    await SwalTheme.fire({
      icon: "error",
      title: "Gagal",
      text: err?.response?.data?.message || "Failed to save branch",
      confirmButtonText: "OK"
    })
  } finally {
    loading.value = false
  }
}

const onLogoChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.value.logo_url = String(reader.result || "")
  }
  reader.readAsDataURL(file)
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
}

.modal {
  width: 400px;
  background: #111;
  padding: 20px;
  border-radius: 10px;
}

input {
  width: 100%;
  margin-bottom: 10px;
  padding: 8px;
  background: black;
  border: 1px solid #333;
  color: white;
}

.file-label {
  display: block;
  margin-bottom: 6px;
  color: #ddd;
  font-size: 13px;
}

.logo-preview {
  max-width: 120px;
  max-height: 80px;
  object-fit: contain;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 10px;
  background: #0b0b0b;
}

.row {
  display: flex;
  gap: 10px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.primary {
  background: #C9A24D;
  color: black;
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
