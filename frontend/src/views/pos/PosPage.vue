<template>
  <PosLayout>
    <div class="pos-body">
      <div class="pos-services">
        <PosServiceList />
      </div>

      <div class="pos-cart">
        <PosCart />
      </div>
    </div>
  </PosLayout>
</template>

<script setup>
import PosLayout from "./PosLayout.vue"
import PosServiceList from "./PosServiceList.vue"
import PosCart from "./PosCart.vue"
</script>

<style scoped>
.pos-body {
  display: grid;
  grid-template-columns: 1fr 380px;
  height: calc(100vh - 56px);
}

/* TABLET + MOBILE */
@media (max-width: 1024px) {
  .pos-body {
    grid-template-columns: 1fr;
  }

  .pos-cart {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 60vh;
    background: #0e0e0e;
    border-top: 1px solid #222;
    z-index: 50;
  }
}
</style>
