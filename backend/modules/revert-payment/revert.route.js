const express = require("express")
const router = express.Router()
const c = require("./revert.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// hanya Owner / Supervisor
router.post(
  "/",
  auth,
  rbac(["Owner", "Supervisor"]),
  c.revertPayment
)

module.exports = router
