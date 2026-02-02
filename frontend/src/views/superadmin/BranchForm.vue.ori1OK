<template>
  <div class="overlay">
    <div class="modal">
      <h3>{{ edit ? "Edit Branch" : "Add Branch" }}</h3>

      <input v-model="form.name" placeholder="Branch name" />
      <input v-model="form.address" placeholder="Address" />

      <div class="row">
        <input type="time" v-model="form.open_time" />
        <input type="time" v-model="form.close_time" />
      </div>

      <div class="actions">
        <button @click="$emit('close')">Cancel</button>
        <button class="primary" @click="save">Save</button>
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
</style>
