<template>
  <div class="layout">
    <aside class="sidebar">
      <h1 class="logo">NUMARS</h1>

      <nav>
        <slot name="menu" />
      </nav>

      <button class="logout" @click="$emit('logout')">
        Logout
      </button>
    </aside>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: var(--bg-sidebar);
  padding: 20px;
  border-right: 1px solid var(--border-soft);
  display: flex;
  flex-direction: column;
}

.logo {
  margin-bottom: 24px;
}

nav a {
  display: block;
  padding: 10px;
  border-radius: var(--radius);
  color: var(--text-main);
  text-decoration: none;
  margin-bottom: 6px;
}
nav a.router-link-active {
  background: rgba(201,162,77,.15);
  color: var(--gold);
}

.logout {
  margin-top: auto;
  background: none;
  border: 1px solid var(--gold);
  color: var(--gold);
  padding: 10px;
  border-radius: var(--radius);
  cursor: pointer;
}

.content {
  flex: 1;
  padding: 24px;
}
</style>
