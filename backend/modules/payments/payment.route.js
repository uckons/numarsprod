const controller = require("./payment.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Kasir / Supervisor: bayar order
  app.post(
    "/api/payments",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.pay
  )

  // Owner / Manager: lihat pembayaran
  app.get(
    "/api/payments",
    auth,
    rbac(["Owner", "Manager"]),
    controller.getAll
  )
}
