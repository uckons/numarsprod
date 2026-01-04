const controller = require("./commission.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Supervisor / Manager: hitung komisi order
  app.post(
    "/api/commissions/calculate",
    auth,
    rbac(["Supervisor", "Manager"]),
    controller.calculate
  )

  // Supervisor / Manager: override komisi
  app.post(
    "/api/commissions/override",
    auth,
    rbac(["Supervisor", "Manager"]),
    controller.override
  )

  // Owner / Manager: lihat komisi
  app.get(
    "/api/commissions",
    auth,
    rbac(["Owner", "Manager"]),
    controller.getAll
  )
}
