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
  position: fixed;
  bottom: var(--space-2xl);
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-dark);
  border: 1px solid var(--gold);
  padding: var(--space-md) var(--space-xl);
  border-radius: var(--radius-full);
  display: flex;
  gap: var(--space-xl);
  align-items: center;
  box-shadow: var(--shadow-hover);
  z-index: var(--z-fixed);
}

.bulk span {
  color: var(--text-main);
  font-weight: var(--font-weight-medium);
  font-size: var(--font-size-sm);
}

.bulk button {
  padding: var(--space-sm) var(--space-lg);
  border: none;
  border-radius: var(--radius-xs);
  cursor: pointer;
  font-weight: var(--font-weight-semibold);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
}

.bulk button:hover {
  transform: translateY(-2px);
}

.bulk button:not(.danger) {
  background: var(--gold);
  color: #000;
}

.danger { 
  background: var(--danger-dark);
  color: var(--text-main);
}

.danger:hover {
  background: var(--danger);
}

/* Mobile optimization */
@media (max-width: 640px) {
  .bulk {
    bottom: var(--space-lg);
    padding: var(--space-sm) var(--space-md);
    gap: var(--space-md);
    flex-wrap: wrap;
    justify-content: center;
    max-width: calc(100% - var(--space-3xl));
  }
  
  .bulk span {
    font-size: var(--font-size-xs);
  }
  
  .bulk button {
    font-size: var(--font-size-xs);
    padding: var(--space-xs) var(--space-md);
  }
}
</style>
