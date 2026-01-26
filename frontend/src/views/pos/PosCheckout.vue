<template>
  <div class="overlay">
    <div class="modal">
      <!-- HEADER -->
      <div class="modal-header">
        <h3>Checkout</h3>
        <button class="close" @click="$emit('close')">×</button>
      </div>

      <!-- BODY -->
      <div class="modal-body">
        <div class="summary">
          <div v-for="i in items" :key="i.id" class="line">
            <span>{{ i.name }} × {{ i.qty }}</span>
            <strong>Rp {{ format(i.base_price * i.qty) }}</strong>
          </div>

          <div class="total">
            <span>Total</span>
            <strong>Rp {{ format(total) }}</strong>
          </div>
        </div>

        <div class="form-group">
          <label>Payment Method</label>
          <select v-model="method">
            <option value="CASH">Cash</option>
            <option value="QRIS">QRIS</option>
          </select>
        </div>
      </div>

      <!-- FOOTER -->
      <div class="modal-footer">
        <button class="btn-outline" @click="$emit('close')">
          Cancel
        </button>
        <button class="btn-primary" @click="pay" :disabled="loading">
          {{ loading ? "Processing..." : "Pay Now" }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue"

const props = defineProps({
  items: Array
})

const emit = defineEmits(["success", "close"])

const method = ref("CASH")
const loading = ref(false)

const total = computed(() =>
  props.items.reduce((s, i) => s + i.base_price * i.qty, 0)
)

const pay = async () => {
  loading.value = true
  emit("success", {
    method: method.value,
    total: total.value
  })
  loading.value = false
}

const format = (v) =>
  Number(v || 0).toLocaleString("id-ID")
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}

.modal {
  width: 420px;
  background: var(--bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-strong);
}

.modal-header,
.modal-footer {
  padding: 16px;
  border-bottom: 1px solid var(--border-soft);
}

.modal-footer {
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.modal-body {
  padding: 16px;
}

.summary .line {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.total {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-soft);
  display: flex;
  justify-content: space-between;
  font-size: 18px;
}

.close {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
}
</style>
