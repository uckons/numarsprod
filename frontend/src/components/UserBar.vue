<template>
  <div class="user-bar-wrap">
    <div class="user-bar">
      <div class="identity">
        <strong>{{ auth.user?.name || auth.user?.username || 'User' }}</strong>
        <small>{{ auth.user?.role || '-' }}</small>
      </div>
      <div class="actions">
        <button class="btn-pass" @click="changePassword">Ganti Password</button>
        <button class="btn-logout" @click="logout">Logout</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router"
import { useAuthStore } from "../store/auth.store"
import Swal from "sweetalert2"
import api from "@/services/api"

const router = useRouter()
const auth = useAuthStore()

const changePassword = async () => {
  const { value: formValues } = await Swal.fire({
    title: 'Ganti Password',
    html:
      '<input id="swal-current-password" class="swal2-input" type="password" placeholder="Password lama">' +
      '<input id="swal-new-password" class="swal2-input" type="password" placeholder="Password baru">',
    focusConfirm: false,
    showCancelButton: true,
    confirmButtonText: 'Simpan',
    cancelButtonText: 'Batal',
    preConfirm: () => {
      const current_password = document.getElementById('swal-current-password')?.value || ''
      const new_password = document.getElementById('swal-new-password')?.value || ''
      const policy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

      if (!current_password || !new_password) {
        Swal.showValidationMessage('Password lama dan password baru wajib diisi')
        return false
      }
      if (!policy.test(new_password)) {
        Swal.showValidationMessage('Password baru minimal 8 karakter dan wajib huruf besar, huruf kecil, angka, dan karakter khusus dan jangan gunakan tanda @')
        return false
      }
      return { current_password, new_password }
    }
  })

  if (!formValues) return

  try {
    await api.put('/users/change-password', formValues)
    await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Password berhasil diubah' })
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal mengubah password' })
  }
}

const logout = () => {
  auth.logout()
  router.push("/login")
}
</script>

<style scoped>
.user-bar-wrap {
  padding: 12px 20px 0;
}

.user-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: linear-gradient(145deg, rgba(21,21,21,.95), rgba(12,12,12,.95));
  border: 1px solid #2d2d2d;
  border-radius: 14px;
  padding: 10px 14px;
}

.identity {
  display: grid;
  gap: 2px;
}

.identity strong {
  color: #fff;
  font-size: 14px;
}

.identity small {
  color: #b7bcc8;
  font-size: 12px;
}

.actions { display: flex; gap: 8px; }
button {
  border: none;
  border-radius: 10px;
  font-weight: 700;
  padding: 8px 14px;
  cursor: pointer;
}
.btn-pass { background: transparent; border: 1px solid #f5c518; color: #f5c518; }
.btn-logout { background: #f5c518; color: #111; }
</style>
