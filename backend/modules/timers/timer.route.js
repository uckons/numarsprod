const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./timer.controller")

// START TIMER (kasir klik start)
router.post("/start", auth, controller.startTimer)
router.post("/start", auth, controller.startManual)
router.post("/from-order/:orderId", auth, controller.createFromOrder)
// GET ACTIVE TIMERS (POS dashboard)
router.get("/active", auth, controller.getActive)

// STOP / FINISH TIMER
router.post("/:id/stop", auth, controller.stop)


module.exports = router
