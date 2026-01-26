<template>
  <div class="flex min-h-screen bg-bg-main text-white">
    <!-- MOBILE MENU TOGGLE -->
    <button 
      @click="mobileMenuOpen = !mobileMenuOpen"
      class="md:hidden fixed top-4 left-4 z-50 p-2 bg-bg-card border border-gold rounded-lg"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>

    <!-- SIDEBAR -->
    <aside 
      :class="[
        'sidebar fixed md:static inset-y-0 left-0 z-40 w-56 bg-[#111] border-r border-gold p-4 flex flex-col transition-transform duration-300 md:translate-x-0',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <h2 class="text-gold text-xl font-semibold mb-4">SUPER ADMIN</h2>

      <nav class="flex-1 space-y-1">
        <button 
          :class="['flex items-center gap-2 w-full px-3 py-2.5 text-left rounded transition-colors', tab==='users' ? 'bg-gold text-black font-semibold' : 'text-white hover:bg-bg-soft']" 
          @click="selectTab('users')"
        >
          <UsersIcon size="18" /> Users
        </button>
        <button 
          :class="['flex items-center gap-2 w-full px-3 py-2.5 text-left rounded transition-colors', tab==='branches' ? 'bg-gold text-black font-semibold' : 'text-white hover:bg-bg-soft']" 
          @click="selectTab('branches')"
        >
          <Store size="18" /> Branches
        </button>
        <button 
          :class="['flex items-center gap-2 w-full px-3 py-2.5 text-left rounded transition-colors', tab==='orders' ? 'bg-gold text-black font-semibold' : 'text-white hover:bg-bg-soft']" 
          @click="selectTab('orders')"
        >
          <ClipboardList size="18" /> Orders
        </button>
        <button 
          :class="['flex items-center gap-2 w-full px-3 py-2.5 text-left rounded transition-colors', tab==='timers' ? 'bg-gold text-black font-semibold' : 'text-white hover:bg-bg-soft']" 
          @click="selectTab('timers')"
        >
          <Timer size="18" /> Timers
        </button>
        <button 
          :class="['flex items-center gap-2 w-full px-3 py-2.5 text-left rounded transition-colors', tab==='audit' ? 'bg-gold text-black font-semibold' : 'text-white hover:bg-bg-soft']" 
          @click="selectTab('audit')"
        >
          <ShieldCheck size="18" /> Audit Logs
        </button>
        <button 
          :class="['flex items-center gap-2 w-full px-3 py-2.5 text-left rounded transition-colors', tab==='services' ? 'bg-gold text-black font-semibold' : 'text-white hover:bg-bg-soft']" 
          @click="selectTab('services')"
        >
          <Store size="18" /> Services
        </button>
      </nav>

      <!-- LOGOUT -->
      <button 
        class="flex items-center gap-2 w-full px-3 py-2.5 mt-auto bg-danger text-white rounded hover:opacity-90 transition-opacity" 
        @click="logout"
      >
        <LogOut size="18" /> Logout
      </button>
    </aside>

    <!-- OVERLAY FOR MOBILE -->
    <div 
      v-if="mobileMenuOpen" 
      @click="mobileMenuOpen = false"
      class="md:hidden fixed inset-0 bg-black/50 z-30"
    ></div>

    <!-- CONTENT -->
    <main class="flex-1 p-4 md:p-5 ml-0 md:ml-0">
      <Users v-if="tab==='users'" />
      <Branches v-if="tab==='branches'" />
      <Orders v-if="tab==='orders'" />
      <Timers v-if="tab==='timers'" />
      <AuditLogs v-if="tab==='audit'" />
      <Services v-if="tab==='services'" :branch-id="1" />
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useAuthStore } from "@/store/auth.store"
import { Users as UsersIcon, Store, ClipboardList, Timer, LogOut, ShieldCheck } from "lucide-vue-next"
import AuditLogs from "./AuditLogs.vue"

import Users from "./Users.vue"
import Branches from "./Branches.vue"
import Orders from "./Orders.vue"
import Timers from "./Timers.vue"
import Services from "./Services.vue"

const tab = ref("users")
const mobileMenuOpen = ref(false)
const auth = useAuthStore()
const router = useRouter()

const selectTab = (newTab) => {
  tab.value = newTab
  mobileMenuOpen.value = false // Close mobile menu on tab select
}

const logout = () => {
  auth.logout()
  router.push("/login")
}
</script>
