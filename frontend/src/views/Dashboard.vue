<template>
  <div class="dashboard">
    <h1>Dashboard</h1>
    <p>Login berhasil 🎉</p>
  </div>
</template>

<script setup>
</script>

<style scoped>
.dashboard {
  padding: var(--space-xl);
  background: var(--bg-main);
  min-height: 100vh;
  color: var(--text-main);
}

h1 {
  color: var(--gold);
  margin-bottom: var(--space-md);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

p {
  color: var(--text-muted);
  font-size: var(--font-size-base);
}

@media (max-width: 768px) {
  .dashboard {
    padding: var(--space-lg);
  }
  
  h1 {
    font-size: var(--font-size-xl);
  }
}

@media (max-width: 480px) {
  .dashboard {
    padding: var(--space-md);
  }
}
</style>
