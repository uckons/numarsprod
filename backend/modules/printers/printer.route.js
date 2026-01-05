//const express = require("express")
//const router = express.Router()
//const c = require("./printer.controller")
//const auth = require("../../middlewares/auth.middleware")

//router.post("/print", auth, c.printOrder)

//module.exports = router
const router = require("express").Router()
const c = require("./printer.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// 🔁 REPRINT STRUK
router.post(
  "/reprint/:order_id",
  auth,
  rbac(["Owner", "Supervisor", "Kasir"]),
  c.reprint
)

module.exports = router
