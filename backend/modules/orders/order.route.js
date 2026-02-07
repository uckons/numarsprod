const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./order.controller")

router.get("/", auth, controller.getAll)
router.get("/kasir", auth, controller.getKasirOrders)

router.post(
  "/pos",
  auth,
  (req, res, next) => {
    if (req.user.role !== "Kasir") {
      return res.status(403).json({ message: "Only cashier can create POS order" })
    }
    next()
  },
  controller.createFromPos
)

router.post(
  "/pos/draft",
  auth,
  (req, res, next) => {
    if (req.user.role !== "Kasir") {
      return res.status(403).json({ message: "Only cashier can create POS order" })
    }
    next()
  },
  controller.createDraftFromPos
)

router.post("/", auth, controller.create)

router.get("/:id", auth, controller.getById)
router.get("/:id/detail", auth, controller.getOrderDetail)

router.post("/:id/items", auth, controller.addItem)

router.post("/:id/close", auth, controller.close)
router.post("/:id/draft", auth, controller.saveDraft)
router.delete("/:id", auth, controller.cancel)

module.exports = router
