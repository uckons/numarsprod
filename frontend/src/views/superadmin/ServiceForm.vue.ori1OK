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

    <!-- SUCCESS POPUP (satu popup, overlay fixed supaya selalu centered) -->
    <div v-if="success" class="success-overlay" @click.self="confirmSuccess">
      <div class="success-box" role="dialog" aria-modal="true" aria-labelledby="successTitle">
        <h4 id="successTitle">Success</h4>
        <p>Service berhasil disimpan</p>
        <button class="btn-primary" @click="confirmSuccess">OK</button>
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

/* SUCCESS POPUP (overlay di atas modal, selalu centered) */
.success-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.success-box {
  background: linear-gradient(145deg, #0e0e0e, #151515);
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  width: 320px;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
}

.success-box h4 {
  color: #2ecc71;
  margin-bottom: 8px;
}

.success-box p {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 16px;
}
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
/* Tombol dan layout lainnya tetap */
</style>
