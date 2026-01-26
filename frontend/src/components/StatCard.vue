<template>
  <div class="card">
    <p class="label">{{ label }}</p>
    <h2>{{ value }}</h2>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number]
})
</script>

<style scoped>
.card {
  background: var(--bg-card);
  padding: 20px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-soft);
}
.label {
  color: var(--text-muted);
  font-size: 13px;
}
h2 {
  margin-top: 6px;
  color: var(--gold);
}
</style>
