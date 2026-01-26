<template>
  <div class="card">
    <h3>Services</h3>

    <input
      v-model="q"
      @input="load"
      placeholder="Search..."
      class="input"
    />

    <div class="list">
      <div
        v-for="s in services"
        :key="s.id"
        class="item"
        @click="$emit('add', s)"
      >
        <strong>{{ s.name }}</strong>
        <span>Rp {{ format(s.base_price) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue"
import api from "@/services/api"

const props = defineProps({ branchId: Number })
const services = ref([])
const q = ref("")

const load = async () => {
  const res = await api.get("/services", {
    params: { branch_id: props.branchId, q: q.value }
  })
  services.value = res.data.data || res.data
}

onMounted(load)
watch(() => props.branchId, load)

const format = (v) =>
  Number(v).toLocaleString("id-ID")
</script>
