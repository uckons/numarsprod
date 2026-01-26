<template>
  <div class="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-soft border border-gold px-5 py-3 rounded-full flex items-center gap-5 shadow-[0_8px_24px_rgba(0,0,0,0.35)] z-30">
    <span class="text-text-main font-medium">{{ count }} selected</span>
    <div class="flex gap-2">
      <button 
        @click="$emit('disable')"
        class="bg-warn text-black px-4 py-2 rounded-[10px] font-medium hover:-translate-y-0.5 transition-transform cursor-pointer"
      >
        Toggle Active
      </button>
      <button 
        @click="$emit('delete')"
        class="bg-danger text-white px-4 py-2 rounded-[10px] font-medium hover:-translate-y-0.5 transition-transform cursor-pointer"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({ count: Number })
</script>
