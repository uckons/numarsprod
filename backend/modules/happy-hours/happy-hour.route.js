const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./happy-hour.controller")

router.get("/", auth, controller.list)
router.put("/:service_type", auth, controller.upsert)

module.exports = router