const express = require("express")
const router = express.Router()

const controller = require("./user.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// 🔐 HANYA SUPER ADMIN BOLEH
router.get(
  "/",
  auth,
  rbac(["SuperAdmin"]),
  controller.listUsers
)

// 🔐 SUPER ADMIN BUAT USER
router.post(
  "/",
  auth,
  rbac(["SuperAdmin"]),
  controller.createUser
)

module.exports = router
