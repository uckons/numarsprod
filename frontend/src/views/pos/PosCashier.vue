<template>
  <PosLayout>
    <div class="pos-body">
      <div class="left">
        <PosServiceList @add="addToCart" />
      </div>

      <div class="right">
        <PosCart
          :items="cart"
          @checkout="checkout"
        />
      </div>
    </div>
  </PosLayout>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import PosLayout from "./PosLayout.vue"
import PosServiceList from "./PosServiceList.vue"
import PosCart from "./PosCart.vue"
import api from "@/services/api"

const cart = ref([])

const addToCart = (service) => {
  const existing = cart.value.find(i => i.id === service.id)
  if (existing) {
    existing.qty++
  } else {
    cart.value.push({ ...service, qty: 1 })
  }
}

const checkout = async () => {
  const payload = {
    items: cart.value,
    payment_method: "CASH",
    total: cart.value.reduce((s,i)=>s+i.base_price*i.qty,0)
  }

  await api.post("/orders/pos", payload)
  alert("Order berhasil")
  cart.value = []
}
</script>

<style scoped>
.pos-body {
  display: grid;
  grid-template-columns: 1fr 420px;
  height: 100%;
}
.left {
  padding: 16px;
  overflow-y: auto;
}
.right {
  border-left: 1px solid #222;
}
</style>
