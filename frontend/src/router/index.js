import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "../store/auth.store"

import Login from "../views/Login.vue"
import OwnerDashboard from "../views/owner/OwnerDashboard.vue"
import KasirPOS from "../views/kasir/KasirPOS.vue"
import TerapisDashboard from "../views/terapis/TerapisDashboard.vue"

const routes = [
  { path: "/login", component: Login },

  {
    path: "/owner",
    component: OwnerDashboard,
    meta: { requiresAuth: true, role: ["Owner"] }
  },
  {
    path: "/kasir",
    component: KasirPOS,
    meta: { requiresAuth: true, role: ["Kasir"] }
  },
  {
    path: "/terapis",
    component: TerapisDashboard,
    meta: { requiresAuth: true, role: ["Terapis"] }
  },

  // ROOT → AUTO REDIRECT SESUAI ROLE
  {
    path: "/",
    redirect: () => {
      const auth = useAuthStore()
      if (!auth.user) return "/login"

      switch (auth.user.role) {
        case "Owner":
          return "/owner"
        case "Kasir":
          return "/kasir"
        case "Terapis":
          return "/terapis"
        default:
          return "/login"
      }
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 🔐 GLOBAL GUARD
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // belum login
  if (to.meta.requiresAuth && !auth.isLoggedIn) {
    return next("/login")
  }

  // sudah login tapi akses role lain
  if (
    to.meta.role &&
    auth.user &&
    !to.meta.role.includes(auth.user.role)
  ) {
    // kembalikan ke dashboard sesuai role
    return next("/")
  }

  // sudah login jangan balik ke login
  if (to.path === "/login" && auth.isLoggedIn) {
    return next("/")
  }

  next()
})

export default router
