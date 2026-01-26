<template>
  <div class="box">
    <h2>Branch Management</h2>

    <form @submit.prevent="create">
      <input v-model="name" placeholder="Nama cabang" />
      <button>Tambah Cabang</button>
    </form>

    <table>
      <tr>
        <th>ID</th>
        <th>Nama</th>
      </tr>
      <tr v-for="b in branches" :key="b.id">
        <td>{{ b.id }}</td>
        <td>{{ b.name }}</td>
      </tr>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import api from "@/services/api"

const branches = ref([])
const name = ref("")

const load = async () => {
  branches.value = (await api.get("/superadmin/branches")).data
}

const create = async () => {
  if (!name.value) return alert("Nama cabang wajib")
  await api.post("/superadmin/branches", { name: name.value })
  name.value = ""
  load()
}

onMounted(load)
</script>

<style scoped>
.box { padding:16px }
input { background:#000;color:#fff;border:1px solid #C9A24D;padding:8px }
button { background:#C9A24D;border:none;padding:8px }
table { width:100%;margin-top:10px }
</style>
