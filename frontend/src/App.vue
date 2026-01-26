<template>
  <router-view v-slot="{ Component, route }">
    <transition :name="route.meta.transition || 'fade'">
      <component :is="Component" />
    </transition>
  </router-view>
</template>


<script setup>
// Root App — semua view dirender lewat router
//import { useIdleLock } from "@/composables/useIdleLock"
//import LockScreen from "@/components/LockScreen.vue"

//const { locked, unlock } = useIdleLock()
</script>
<style>
/* optional global overrides */
</style>
