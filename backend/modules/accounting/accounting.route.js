const express = require("express")
const router = express.Router()
const c = require("./accounting.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

router.get("/cash-flow", auth, rbac(["Owner","Manager"]), c.cashFlow)
router.get("/profit-loss", auth, rbac(["Owner","Manager"]), c.profitLoss)

module.exports = router
