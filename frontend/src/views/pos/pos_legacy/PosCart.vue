<template>
  <div class="card">
    <h3>Order</h3>

    <div v-if="!order" class="empty">
      No active order
    </div>

    <div v-else>
      <div
        v-for="i in items"
        :key="i.id"
        class="row"
      >
        <div class="info">
          <strong>{{ i.service_name }}</strong>
          <small>Rp {{ format(i.price) }}</small>
        </div>

        <div class="qty">
          <button @click="dec(i)">-</button>
          <span>{{ i.qty }}</span>
          <button @click="inc(i)">+</button>
        </div>

        <div class="right">
          <strong>Rp {{ format(i.subtotal) }}</strong>
          <button class="remove" @click="remove(i)">×</button>
        </div>
      </div>

      <hr />

      <div class="total">
        <span>Total</span>
        <strong>Rp {{ format(order.total_amount) }}</strong>
      </div>

      <button
        class="btn-primary full"
        @click="$emit('checkout')"
      >
        Checkout
      </button>
    </div>
  </div>
</template>

<script setup>
import api from "@/services/api"

const props = defineProps({
  order: Object,
  items: Array
})

const emit = defineEmits(["updated", "checkout"])

const reload = async () => {
  const res = await api.get(`/pos/orders/${props.order.id}`)
  emit("updated", res.data)
}

const inc = async (item) => {
  await api.put(
    `/pos/orders/${props.order.id}/items/${item.id}`,
    { qty: item.qty + 1 }
  )
  await reload()
}

const dec = async (item) => {
  if (item.qty <= 1) return
  await api.put(
    `/pos/orders/${props.order.id}/items/${item.id}`,
    { qty: item.qty - 1 }
  )
  await reload()
}

const remove = async (item) => {
  if (!confirm("Remove item?")) return
  await api.delete(
    `/pos/orders/${props.order.id}/items/${item.id}`
  )
  await reload()
}

const format = (v) =>
  Number(v || 0).toLocaleString("id-ID")
</script>

<style scoped>
.row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #222;
}

.info small {
  color: #888;
  font-size: 12px;
}

.qty {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty button {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #222;
  color: #fff;
  font-size: 18px;
}

.right {
  text-align: right;
}

.remove {
  background: none;
  border: none;
  color: #e74c3c;
  font-size: 18px;
  cursor: pointer;
}

.full {
  width: 100%;
  margin-top: 12px;
}
</style>
