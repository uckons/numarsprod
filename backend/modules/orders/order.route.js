const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./order.controller")

// GET ALL ORDERS (by branch user)
router.get("/", auth, controller.getAll)
router.get("/kasir", auth, controller.getKasirOrders)

// CREATE FROM POS (static routes MUST be before "/:id" routes)
router.get("/kasir",auth,controller.getKasirOrders)
// GET ORDER BY ID
router.get("/:id(\\d+)", auth, controller.getById)
// 🖨️ GET ORDER DETAIL FOR REPRINT
router.get("/:id(\\d+)/detail", auth, controller.getOrderDetail)
// CREATE EMPTY ORDER (kasir buka order)
router.post("/", auth, controller.create)

// ADD ITEM TO ORDER
router.post("/:id(\\d+)/items", auth, controller.addItem)

// CLOSE ORDER
router.post("/:id(\\d+)/close", auth, controller.close)
router.post("/:id(\\d+)/draft", auth, controller.saveDraft)
// CANCEL / DELETE ORDER
router.delete("/:id(\\d+)", auth, controller.cancel)


// CREATE FROM POS (checkout langsung)
//router.post("/pos", auth, controller.createFromPos)
router.post(
  "/pos",
  auth,
  (req, res, next) => {
    if (req.user.role !== "Kasir") {
      return res.status(403).json({
        message: "Only cashier can create POS order"
      })
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
      return res.status(403).json({
        message: "Only cashier can create POS order"
      })
    }
    next()
  },
  controller.createDraftFromPos
)

// CREATE EMPTY ORDER (kasir buka order)
router.post("/", auth, controller.create)

// GET ORDER BY ID
router.get("/:id", auth, controller.getById)
// 🖨️ GET ORDER DETAIL FOR REPRINT
router.get("/:id/detail", auth, controller.getOrderDetail)

// ADD ITEM TO ORDER
router.post("/:id/items", auth, controller.addItem)

// CLOSE / DRAFT / CANCEL ORDER
router.post("/:id/close", auth, controller.close)
router.post("/:id/draft", auth, controller.saveDraft)
router.delete("/:id", auth, controller.cancel)

module.exports = router
