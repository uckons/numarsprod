<template>
  <div class="bg-bg-card p-5 rounded-2xl shadow-lg">
    <p class="text-text-muted text-[13px]">{{ label }}</p>
    <h2 class="mt-1.5 text-gold">{{ value }}</h2>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number]
})
</script>
