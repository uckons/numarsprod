const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./printer.controller")

router.post(
  "/print-order",
  auth,
  controller.printOrder
)

module.exports = router

