const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const controller = require("./order.controller")

// CREATE FROM POS (checkout langsung)
//router.post("/pos", auth, controller.createFromPos)

// GET ALL ORDERS (by branch user)
router.get("/", auth, controller.getAll)

// CREATE EMPTY ORDER (kasir buka order)
router.post("/", auth, controller.create)

// ADD ITEM TO ORDER
router.post("/:id/items", auth, controller.addItem)

// CLOSE ORDER
router.post("/:id/close", auth, controller.close)
// CANCEL / DELETE ORDER
router.delete("/:id", auth, controller.cancel)


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
module.exports = router
