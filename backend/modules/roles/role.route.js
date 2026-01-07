const router = require("express").Router()
const c = require("./role.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// Semua user login boleh lihat role
router.get("/", auth, c.list)

module.exports = router
