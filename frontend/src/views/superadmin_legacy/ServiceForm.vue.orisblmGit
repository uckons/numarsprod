<template>
  <div class="overlay">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>{{ edit ? "Edit Service" : "Add New Service" }}</h3>
        <button class="close" @click="closeForm">X</button>
      </div>
<!-- SUCCESS POPUP -->
<div v-if="showSuccess" class="success-popup">
  <h3>Success</h3>
  <p>Service has been saved successfully</p>

  <button class="btn-primary" @click="confirmSuccess">
    OK
  </button>
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
            <input type="number" v-model="form.duration_minutes" />
          </div>

          <div class="form-group">
            <label>Base Price</label>
            <input type="number" v-model="form.base_price" />
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

    <!-- SUCCESS POPUP -->
    <div v-if="success" class="success-popup">
      <div class="success-box">
        <h4>Success</h4>
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
  const res = await api.get("/branches")
  branches.value = res.data.data || res.data

  if (!props.edit) {
    form.value.branch_id = 1 // default Pondok Indah
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
   /* emit("saved") */
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
/* overlay & modal tetap */
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
}

/* SUCCESS POPUP */
.success-popup {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.success-box {
  background: #111;
  border-radius: 14px;
  padding: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
}

.success-popup {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.success-popup > div,
.success-popup {
  background: linear-gradient(145deg, #0e0e0e, #151515);
  padding: 24px;
  border-radius: 16px;
  text-align: center;
  width: 300px;
  box-shadow: 0 20px 60px rgba(0,0,0,.6);
}

.success-popup h3 {
  margin-bottom: 8px;
  color: #2ecc71;
}

.success-popup p {
  color: #aaa;
  font-size: 13px;
  margin-bottom: 16px;
}

.success-box h4 {
  color: #2ecc71;
  margin-bottom: 8px;
}

</style>
