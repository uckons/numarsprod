const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./timer.controller")

// START TIMER (kasir klik start)
router.post("/start", auth, controller.startTimer)
router.post("/start", auth, controller.startManual)
router.post("/from-order/:orderId", auth, controller.createFromOrder)
router.post("/extend/:id",auth,controller.extendTimer)

// GET ACTIVE TIMERS (POS dashboard)
router.get("/active", auth, controller.getActive)

// GET TIMER SLOTS (30 permanent slots with active timers merged)
router.get("/slots", auth, controller.getTimerSlots)

// STOP / FINISH TIMER
router.post("/:id/stop", auth, controller.stop)

// NEW ENDPOINTS FOR TIMER MODAL
router.get("/therapists", auth, controller.getTherapists)
router.get("/rooms", auth, controller.getRooms)

module.exports = router
