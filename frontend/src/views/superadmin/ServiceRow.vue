<template>
  <tr class="transition-all duration-200 hover:bg-gold/10 hover:translate-x-0.5">
    <td class="font-semibold">{{ service.name }}</td>

    <td>
      <input
        type="number"
        v-model="local.duration_minutes"
        @blur="save"
        class="w-20 bg-black border border-gray-800 text-white p-1.5 rounded-md focus:outline-none focus:border-gold transition-colors"
      /> min
    </td>

    <td>
      <input
        type="number"
        v-model="local.base_price"
        @blur="save"
        class="w-20 bg-black border border-gray-800 text-white p-1.5 rounded-md focus:outline-none focus:border-gold transition-colors"
      />
    </td>

    <td>
      <span :class="service.is_active ? 'text-success' : 'text-warn'">
        {{ service.is_active ? "ACTIVE" : "DRAFT" }}
      </span>
    </td>

    <td>
      <button
        class="bg-gold border-none px-3 py-1.5 rounded-lg cursor-pointer transition-transform hover:scale-105"
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
