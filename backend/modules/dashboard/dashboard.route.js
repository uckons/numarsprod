const express = require("express")
const router = express.Router()
const auth = require("../../middlewares/auth.middleware")
const controller = require("./dashboard.controller")

router.get("/kasir", auth, controller.kasir)

module.exports = router
