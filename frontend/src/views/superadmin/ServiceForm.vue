<template>
  <div class="overlay">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>{{ edit ? "Edit Service" : "Add New Service" }}</h3>
        <button class="close" @click="closeForm">X</button>
      </div>

      <!-- BODY -->
      <form class="modal-body" @submit.prevent="save">
        <div class="form-group">
          <label>Name</label>
          <input v-model="form.name" placeholder="Service name" />
        </div>

        <div class="row">
          <div class="form-group">
            <label>Type</label>
            <select v-model="form.type">
              <option disabled value="">Select</option>
              <option>SPA</option>
              <option>LC</option>
              <option>FNB</option>
              <option>LOUNGE</option>
              <option>KARAOKE</option>
            </select>
          </div>

          <div class="form-group">
            <label>Branch</label>
            <select v-model="form.branch_id">
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

        <div class="row">
          <div class="form-group">
            <label>Duration (minutes)</label>
            <input type="number" v-model.number="form.duration_minutes" />
          </div>

          <div class="form-group">
            <label>Base Price</label>
            <input type="number" v-model.number="form.base_price" />
          </div>
        </div>
          <div class="row" v-if="form.type === 'SPA' || form.type === 'LC'">
          <div class="form-group">
            <label>Happy Hour Aktif</label>
            <input type="checkbox" v-model="form.happy_hour_enabled" />
          </div>

          <div class="form-group">
            <label>Harga Happy Hour</label>
            <input
              type="number"
              v-model.number="form.happy_hour_price"
              :disabled="!form.happy_hour_enabled"
            />
          </div>
        </div>
        <!-- FOOTER -->
        <div class="modal-footer">
          <button type="button" class="btn-outline" @click="closeForm">
            Cancel
          </button>
          <button type="submit" class="btn-primary" :disabled="loading">
            {{ loading ? "Saving..." : "Save" }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"
import Swal from "sweetalert2"
import "sweetalert2/dist/sweetalert2.min.css" // tetap import base css (boleh dipindah ke main jika ingin global)

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
  branch_id: null,
  happy_hour_enabled: false,
  happy_hour_price: 0

})

const branches = ref([])
const loading = ref(false)

/* ===== Add this Swal theme mixin (black & gold) ===== */
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
/* ================================================== */

/* INIT */
onMounted(async () => {
  try {
    const res = await api.get("/branches")
    branches.value = res.data.data || res.data
  } catch (err) {
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
    await SwalTheme.fire({
      icon: "warning",
      title: "Validasi",
      text: "Name, Type dan Branch wajib diisi",
      confirmButtonText: "OK"
    })
    return
  }

  loading.value = true
  try {
    if (props.edit) {
      await api.put(`/services/${props.data.id}`, form.value)
    } else {
      await api.post("/services", form.value)
    }

    await SwalTheme.fire({
      icon: "success",
      title: "Berhasil",
      text: "Service berhasil disimpan",
      confirmButtonText: "OK"
    })

    emit("saved")
    emit("close")
  } catch (e) {
    await SwalTheme.fire({
      icon: "error",
      title: "Gagal",
      text: "Failed to save service",
      confirmButtonText: "OK"
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* overlay & modal */
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
  width: 440px;
  background: var(--bg-card);
  border-radius: var(--radius);
  box-shadow: var(--shadow-strong);
  z-index: 150;
}

/* modal styling (success-overlay dibuang karena pake Swal) */

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-soft);
}
.modal-body {
  padding: 16px;
}
.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
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
}
.btn-outline {
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
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