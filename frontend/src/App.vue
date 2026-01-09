<template>
  <router-view />
  <LockScreen v-if="locked" @unlocked="unlock" />
</template>

<script setup>
// Root App — semua view dirender lewat router
import { useIdleLock } from "@/composables/useIdleLock"
import LockScreen from "@/components/LockScreen.vue"

const { locked, unlock } = useIdleLock()
</script>
<style>
/* optional global overrides */
</style>
