const controller = require("./printer.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Kasir / Supervisor: cetak struk order
  app.post(
    "/api/printer/receipt",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.printReceipt
  )
}
