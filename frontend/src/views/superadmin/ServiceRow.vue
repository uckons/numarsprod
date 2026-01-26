<template>
  <tr class="row">
    <td class="name">{{ service.name }}</td>

    <td>
      <input
        type="number"
        v-model="local.duration_minutes"
        @blur="save"
      /> min
    </td>

    <td>
      <input
        type="number"
        v-model="local.base_price"
        @blur="save"
      />
    </td>

    <td>
      <span :class="service.is_active ? 'on' : 'off'">
        {{ service.is_active ? "ACTIVE" : "DRAFT" }}
      </span>
    </td>

    <td>
      <button
        class="toggle"
        @click="toggle"
      >
        {{ service.is_active ? "Disable" : "Enable" }}
      </button>
    </td>
  </tr>
</template>

<script setup>
import { reactive } from "vue"
import api from "@/services/api"

const props = defineProps({
  service: Object
})
const emit = defineEmits(["updated"])

const local = reactive({
  base_price: props.service.base_price,
  duration_minutes: props.service.duration_minutes
})

const save = async () => {
  await api.put(`/services/${props.service.id}`, local)
  emit("updated")
}

const toggle = async () => {
  await api.put(`/services/${props.service.id}/toggle`)
  emit("updated")
}
</script>

<style scoped>
.row {
  transition: all .2s ease;
}
.row:hover {
  background: rgba(201,162,77,.08);
  transform: translateX(2px);
}
input {
  width: 80px;
  background: #000;
  border: 1px solid var(--border-soft);
  color: white;
  padding: 6px;
  border-radius: 6px;
}
.toggle {
  background: var(--gold);
  border: none;
  padding: 6px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform .15s ease;
}
.toggle:hover {
  transform: scale(1.05);
}
.on {
  color: #2ecc71;
}
.off {
  color: #e67e22;
}
.name {
  font-weight: 600;
}
</style>
