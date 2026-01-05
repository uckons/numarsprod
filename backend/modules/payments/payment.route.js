const express = require("express")
const router = express.Router()
const c = require("./payment.controller")
const auth = require("../../middlewares/auth.middleware")

router.post("/pay", auth, c.payOrder)

module.exports = router
