const router = require("express").Router()
const c = require("./dashboard.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// OWNER DASHBOARD
router.get("/owner/summary", auth, rbac(["Owner"]), c.ownerSummary)
router.get("/owner/daily", auth, rbac(["Owner"]), c.ownerDaily)

module.exports = router
