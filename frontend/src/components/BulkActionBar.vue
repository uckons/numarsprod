<template>
  <div class="bulk">
    <span>{{ count }} selected</span>
    <div>
      <button @click="$emit('disable')">Toggle Active</button>
      <button class="danger" @click="$emit('delete')">Delete</button>
    </div>
  </div>
</template>

<script setup>
defineProps({ count: Number })
</script>

<style scoped>
.bulk {
  position:fixed;
  bottom:24px;
  left:50%;
  transform:translateX(-50%);
  background:#1a1a1a;
  border:1px solid #c9a24d;
  padding:12px 20px;
  border-radius:999px;
  display:flex;
  gap:20px;
  align-items:center;
}
.danger { background:#c0392b; }
</style>
