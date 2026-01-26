<template>
  <div class="flex min-h-screen bg-bg-main">
    <!-- Mobile Menu Button -->
    <button 
      @click="mobileMenuOpen = !mobileMenuOpen"
      class="lg:hidden fixed top-4 left-4 z-50 p-2 bg-bg-card border border-gold text-gold rounded-[10px] hover:bg-gold-soft transition-colors"
      aria-label="Toggle menu"
    >
      <svg v-if="!mobileMenuOpen" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
      </svg>
      <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>

    <!-- Sidebar Overlay (Mobile) -->
    <div 
      v-if="mobileMenuOpen"
      @click="mobileMenuOpen = false"
      class="lg:hidden fixed inset-0 bg-black/60 z-40"
    ></div>

    <!-- Sidebar -->
    <aside 
      :class="[
        'fixed lg:static inset-y-0 left-0 z-40',
        'w-60 bg-bg-soft border-r border-border-soft',
        'flex flex-col p-5',
        'transition-transform duration-300 ease-in-out',
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      ]"
    >
      <h1 class="text-gold text-2xl font-bold mb-6 tracking-tight">NUMARS</h1>

      <nav class="flex-1">
        <slot name="menu" />
      </nav>

      <button 
        class="bg-transparent border border-gold text-gold px-4 py-2.5 rounded-[10px] cursor-pointer hover:bg-gold-soft transition-colors mt-auto"
        @click="$emit('logout')"
      >
        Logout
      </button>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-5 md:p-6 lg:ml-0">
      <slot />
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const mobileMenuOpen = ref(false)
</script>
