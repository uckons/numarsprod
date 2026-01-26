<template>
  <div class="layout">
    <!-- SIDEBAR -->
    <aside class="sidebar">
      <h2>SUPER ADMIN</h2>

      <nav>
        <button :class="{active:tab==='users'}" @click="tab='users'"> <UsersIcon size="18" /> Users</button>
        <button :class="{active:tab==='branches'}" @click="tab='branches'"> <UsersIcon size="18" />Branches</button>
        <button :class="{active:tab==='orders'}" @click="tab='orders'"> <UsersIcon size="18" />Orders</button>
        <button :class="{active:tab==='timers'}" @click="tab='timers'"> <UsersIcon size="18" />Timers</button>
        <button :class="{active:tab==='audit'}" @click="tab='audit'"> <ShieldCheck size="18" /> Audit Logs</button>
        <button :class="{active:tab==='services'}" @click="tab='services'"> <Store size="18" /> Services</button>

      </nav>

      <!-- LOGOUT -->
      <button class="logout" @click="logout"> <UsersIcon size="18" />Logout</button>
    </aside>

    <!-- CONTENT -->
    <main class="content">
      <Users v-if="tab==='users'" />
      <Branches v-if="tab==='branches'" />
      <Orders v-if="tab==='orders'" />
      <Timers v-if="tab==='timers'" />
      <Services v-if="tab==='services'" :branch-id="1" />
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/store/auth.store"
import { Users as UsersIcon, Store, ClipboardList, Timer, LogOut } from "lucide-vue-next"
import AuditLogs from "./AuditLogs.vue"
import { ShieldCheck } from "lucide-vue-next"

import Users from "./Users.vue"
import Branches from "./Branches.vue"
import Orders from "./Orders.vue"
import Timers from "./Timers.vue"
import Services from "./Services.vue"


const tab = ref("users")
const auth = useAuthStore()
const router = useRouter()

const logout = () => {
  auth.logout()
  router.push("/login")
}
</script>
<AuditLogs v-if="tab==='audit'" />

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-main);
}

.sidebar {
  width: 220px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--gold);
  padding: var(--space-lg);
  display: flex;
  flex-direction: column;
  transition: transform var(--transition-base) ease;
}

.sidebar h2 {
  color: var(--gold);
  margin-bottom: var(--space-lg);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-semibold);
}

nav button {
  width: 100%;
  background: transparent;
  border: none;
  color: var(--text-main);
  padding: var(--space-sm) var(--space-md);
  text-align: left;
  cursor: pointer;
  border-radius: var(--radius-xs);
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-xs);
}

nav button:hover {
  background: var(--gold-soft);
}

nav button.active {
  background: var(--gold);
  color: #000;
  font-weight: var(--font-weight-semibold);
}

.logout {
  margin-top: auto;
  background: var(--danger-dark);
  border: none;
  padding: var(--space-sm) var(--space-md);
  color: var(--text-main);
  cursor: pointer;
  border-radius: var(--radius-xs);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  transition: all var(--transition-fast);
}

.logout:hover {
  background: var(--danger);
}

.content {
  flex: 1;
  padding: var(--space-xl);
  overflow-x: hidden;
}

/* ======================
   MOBILE-FIRST RESPONSIVE
====================== */

/* Mobile - Sidebar hidden by default */
@media (max-width: 768px) {
  .layout {
    flex-direction: column;
  }
  
  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--gold);
    padding: var(--space-md);
  }
  
  .sidebar h2 {
    font-size: var(--font-size-lg);
    margin-bottom: var(--space-md);
  }
  
  nav {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: var(--space-xs);
  }
  
  nav button {
    font-size: var(--font-size-xs);
    padding: var(--space-sm);
  }
  
  .content {
    padding: var(--space-md);
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  nav {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    padding: var(--space-sm);
  }
}

/* Tablet and Desktop - Show sidebar */
@media (min-width: 769px) {
  .sidebar {
    position: sticky;
    top: 0;
    height: 100vh;
    overflow-y: auto;
  }
}

/* Large Desktop */
@media (min-width: 1024px) {
  .sidebar {
    width: 260px;
  }
  
  .content {
    padding: var(--space-2xl) var(--space-3xl);
  }
}
</style>
