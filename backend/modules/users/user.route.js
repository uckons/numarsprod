const router = require("express").Router()
const c = require("./user.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// 🔐 Semua user login boleh LIST (filter ada di service)
router.get("/stats", auth, c.stats)
router.get("/", auth, c.list)
router.get("/search", auth, c.search)
router.put("/change-password", auth, c.changePassword)

// 🔒 HANYA SUPERADMIN
router.post("/", auth, rbac(["SuperAdmin"]), c.create)
router.put("/:id", auth, rbac(["SuperAdmin"]), c.update)
router.put("/:id/reset-password", auth, rbac(["SuperAdmin"]), c.resetPassword)
router.put("/:id/toggle", auth, rbac(["SuperAdmin"]), c.toggleActive)
router.delete("/:id", auth, rbac(["SuperAdmin"]), c.remove)

module.exports = router
