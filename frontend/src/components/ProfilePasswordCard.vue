<template>
  <section class="card profile-card">
    <div class="profile-head">
      <div>
        <h3>Profil & Keamanan</h3>
        <p class="muted">Kelola password akun Anda untuk keamanan akses dashboard.</p>
      </div>
      <div class="identity-pill">
        <strong>{{ auth.user?.name || auth.user?.username || 'User' }}</strong>
        <small>{{ auth.user?.role || '-' }}</small>
      </div>
    </div>

    <form class="password-form" @submit.prevent="submitChangePassword">
      <label>
        Password Lama
        <input v-model="form.current_password" type="password" placeholder="Masukkan password lama" required />
      </label>
      <label>
        Password Baru
        <input v-model="form.new_password" type="password" placeholder="Minimal 8 karakter" required />
      </label>
      <label>
        Konfirmasi Password Baru
        <input v-model="form.confirm_password" type="password" placeholder="Ulangi password baru" required />
      </label>
      <button class="btn-primary" type="submit" :disabled="submitting">
        {{ submitting ? 'Menyimpan...' : 'Simpan Password Baru' }}
      </button>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue'
import Swal from 'sweetalert2'
import api from '@/services/api'
import { useAuthStore } from '@/store/auth.store'

const auth = useAuthStore()
const submitting = ref(false)
const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: ''
})

const resetForm = () => {
  form.current_password = ''
  form.new_password = ''
  form.confirm_password = ''
}

const submitChangePassword = async () => {
  const policy = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

  if (!form.current_password || !form.new_password || !form.confirm_password) {
    await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Semua field password wajib diisi.' })
    return
  }

  if (!policy.test(form.new_password)) {
    await Swal.fire({
      icon: 'warning',
      title: 'Password Tidak Valid',
      text: 'Password baru minimal 8 karakter dan wajib huruf besar, huruf kecil, angka, dan karakter khusus dan jangan gunakan tanda @'
    })
    return
  }

  if (form.new_password !== form.confirm_password) {
    await Swal.fire({ icon: 'warning', title: 'Validasi', text: 'Konfirmasi password baru tidak sama.' })
    return
  }

  submitting.value = true
  try {
    await api.put('/users/change-password', {
      current_password: form.current_password,
      new_password: form.new_password
    })

    await Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Password berhasil diubah.' })
    resetForm()
  } catch (err) {
    await Swal.fire({ icon: 'error', title: 'Gagal', text: err.response?.data?.message || 'Gagal mengubah password.' })
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.profile-card { display: grid; gap: 14px; }
.profile-head {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  flex-wrap: wrap;
}
.identity-pill {
  border: 1px solid #2c2f3a;
  background: #171b27;
  border-radius: 12px;
  padding: 8px 12px;
  display: grid;
  gap: 2px;
}
.identity-pill strong { color: #fff; font-size: 14px; }
.identity-pill small { color: #a4afc2; font-size: 12px; text-transform: capitalize; }
.password-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  align-items: end;
}
.password-form label {
  display: grid;
  gap: 6px;
  color: #d5d9e4;
  font-size: 13px;
}
.password-form input {
  width: 100%;
  background: #0f121c;
  border: 1px solid #2e3546;
  color: #f3f4f7;
  border-radius: 10px;
  padding: 10px 12px;
}
.password-form button { min-height: 42px; }
</style>
