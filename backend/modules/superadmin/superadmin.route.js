const router = require("express").Router()
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")
const audit = require("../../middlewares/audit.middleware")
const c = require("./superadmin.controller")

// 🔐 SEMUA HARUS LOGIN + SUPERADMIN
router.use(auth, rbac("SuperAdmin"))

/* ================= DASHBOARD ================= */
router.get("/dashboard", c.dashboard)

/* ================= USERS ================= */
router.post(
  "/users",
  audit("CREATE_USER"),
  c.createUser
)

router.put(
  "/users/:id/reset",
  audit("RESET_PASSWORD"),
  c.resetPassword
)

router.put(
  "/users/:id/toggle",
  audit("TOGGLE_USER"),
  c.toggleUser
)

router.post(
  "/users/:id/force-logout",
  audit("FORCE_LOGOUT"),
  c.forceLogout
)

/* ================= BRANCH ================= */
router.post(
  "/branches",
  audit("CREATE_BRANCH"),
  c.createBranch
)

/* ================= VIEW ONLY ================= */
router.get("/users", c.users)
router.get("/branches", c.branches)
router.get("/orders", c.orders)
router.get("/timers", c.timers)
router.get("/audit-logs", c.auditLogs)

module.exports = router
