<template>
  <section class="card">
    <h2>Printer Agent UIX</h2>
    <p class="muted">Set manual konfigurasi agent, cek status, lalu test print dari sini.</p>

    <div class="grid">
      <label>
        Agent URL
        <input v-model.trim="form.agent_url" placeholder="http://172.200.201.100:19000" />
      </label>
      <label>
        Agent Token
        <input v-model.trim="form.agent_token" placeholder="opsional" />
      </label>
      <label>
        Printer Name
        <input v-model.trim="form.agent_printer_name" placeholder="contoh: POS-58" />
      </label>
    </div>

    <div class="actions">
      <button class="btn gold" :disabled="loading" @click="saveConfig">Simpan Config Lokal</button>
      <button class="btn" :disabled="loading" @click="loadConfig">Reload Config</button>
      <button class="btn" :disabled="loading" @click="checkDiagnostics">Cek Status Agent</button>
      <button class="btn" :disabled="loading" @click="testPrint">Test Print</button>
    </div>

    <div v-if="diagnostics" class="result">
      <h3>Status</h3>
      <p><strong>Health:</strong> {{ diagnostics.health?.status }} - {{ diagnostics.health?.data?.service || 'OK' }}</p>
      <p><strong>Default Printer:</strong> {{ diagnostics.printers?.data?.defaultPrinter || '-' }}</p>
      <p><strong>Agent DataType:</strong> {{ diagnostics.health?.data?.dataType || '-' }}</p>
      <ul>
        <li v-for="name in diagnostics.printers?.data?.printers || []" :key="name">{{ name }}</li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue"
import api from "@/services/api"
import Swal from "sweetalert2"
import { getPrinterAgentConfig, setPrinterAgentConfig } from "@/utils/printerAgentConfig"

const loading = ref(false)
const diagnostics = ref(null)
const form = ref(getPrinterAgentConfig())

const saveConfig = async () => {
  setPrinterAgentConfig(form.value)
  await Swal.fire({ icon: "success", title: "Tersimpan", text: "Config agent disimpan di browser ini." })
}

const loadConfig = () => {
  form.value = getPrinterAgentConfig()
}

const checkDiagnostics = async () => {
  loading.value = true
  diagnostics.value = null
  try {
    setPrinterAgentConfig(form.value)
    const res = await api.post("/printers/agent-diagnostics", { printer: form.value })
    diagnostics.value = res.data
    await Swal.fire({ icon: "success", title: "Agent reachable", text: "Status health dan daftar printer berhasil diambil." })
  } catch (err) {
    await Swal.fire({ icon: "error", title: "Diagnosa gagal", text: err.response?.data?.message || err.message || "Gagal cek agent" })
  } finally {
    loading.value = false
  }
}

const testPrint = async () => {
  loading.value = true
  try {
    setPrinterAgentConfig(form.value)
    await api.post("/printers/test-agent-print", { printer: form.value })
    await Swal.fire({ icon: "success", title: "Test print dikirim", text: "Cek printer apakah struk test tercetak." })
  } catch (err) {
    const backendMessage = err.response?.data?.message || err.message || "Gagal test print"
    const hint = backendMessage.includes("datatype is invalid")
      ? "Datatype printer tidak cocok. Ubah DataType di agent-config.json (RAW biasanya aman), lalu restart print agent."
      : backendMessage

    await Swal.fire({ icon: "error", title: "Test print gagal", text: hint })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.card { background: #141414; border: 1px solid #2a2a2a; border-radius: 12px; padding: 16px; }
.muted { color: #b9b9b9; margin-bottom: 12px; }
.grid { display: grid; gap: 10px; }
label { display: grid; gap: 6px; font-size: 13px; }
input { background: #0f0f0f; border: 1px solid #444; color: #fff; border-radius: 8px; padding: 10px; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.btn { border: 1px solid #444; background: #1f1f1f; color: #fff; padding: 8px 12px; border-radius: 8px; cursor: pointer; }
.btn.gold { background: #c9a24d; color: #111; border-color: #c9a24d; }
.result { margin-top: 14px; border-top: 1px solid #2b2b2b; padding-top: 12px; }
.result ul { margin: 8px 0 0; padding-left: 20px; }
</style>
