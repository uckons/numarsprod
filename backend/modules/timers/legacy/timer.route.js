const express = require("express")
const router = express.Router()
const c = require("./timer.controller")

router.post("/start-by-order", c.startTimersByOrder)
router.post("/:id/pause", c.pauseTimer)
router.post("/:id/resume", c.resumeTimer)
router.post("/:id/extend", c.extendTimer)

module.exports = router
