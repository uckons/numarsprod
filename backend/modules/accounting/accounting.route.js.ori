const controller = require("./accounting.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Kasir: closing shift
  app.post(
    "/api/accounting/close-shift",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.closeShift
  )

  // Manager / Owner: list jurnal
  app.get(
    "/api/accounting/entries",
    auth,
    rbac(["Manager", "Owner"]),
    controller.getEntries
  )
}
