<template>
  <Line :data="chartData" />
</template>

<script setup>
import { ref, onMounted } from "vue"
import { Line } from "vue-chartjs"
import {
  Chart as ChartJS,
  LineElement, CategoryScale, LinearScale, PointElement
} from "chart.js"
import api from "@/services/api"

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement)

const chartData = ref({ labels: [], datasets: [] })

onMounted(async () => {
  const res = await api.get("/superadmin/revenue-chart")
  chartData.value = {
    labels: res.data.map(i => i.day),
    datasets: [{
      label: "Revenue",
      data: res.data.map(i => i.total),
      borderColor: "#C9A24D"
    }]
  }
})
</script>

