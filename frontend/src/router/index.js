import { createRouter, createWebHistory } from "vue-router"
import { useAuthStore } from "../store/auth.store"

import Login from "../views/Login.vue"
import SuperAdminDashboard from "../views/superadmin/SuperAdminDashboard.vue"
import OwnerDashboard from "../views/owner/OwnerDashboard.vue"
import ManagerDashboard from "../views/manager/ManagerDashboard.vue"
import KasirDashboard from "../views/kasir/KasirDashboard.vue"
import TerapisDashboard from "../views/terapis/TerapisDashboard.vue"

const routes = [
  { path: "/login", component: Login },

  // 🔥 SUPER ADMIN (GLOBAL)
  { path: "/superadmin", component: SuperAdminDashboard, meta: { auth: true, roles: ["SuperAdmin"] }},

  // OWNER
  { path: "/owner",component: OwnerDashboard,meta: { auth: true, roles: ["SuperAdmin", "Owner"] }},

  // MANAGER
  { path: "/manager",
    component: ManagerDashboard,
    meta: { auth: true, roles: ["Manager"] }
  },

  // KASIR
  {
    path: "/kasir",
    component: KasirDashboard,
    meta: { auth: true, roles: ["Kasir"] }
  },

  // TERAPIS
  {
    path: "/terapis",
    component: TerapisDashboard,
    meta: { auth: true, roles: ["Terapis"] }
  },

  { path: "/", redirect: "/login" },
]

//const routes = [
//  { path: "/login", component: Login },
//  { path: "/owner", component: OwnerDashboard, meta: { auth: true, roles: ["SuperAdmin","Owner"] } },
//  { path: "/manager", component: ManagerDashboard, meta: { auth: true, roles: ["Manager"] } },
//  { path: "/kasir", component: KasirDashboard, meta: { auth: true, roles: ["Kasir"] } },
//  { path: "/terapis", component: TerapisDashboard, meta: { auth: true, roles: ["Terapis"] } },
//  { path: "/", redirect: "/login" },
//]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.auth && !auth.isLoggedIn) return "/login"
  if (to.meta.roles && !to.meta.roles.includes(auth.role)) return "/login"
})

export default router
