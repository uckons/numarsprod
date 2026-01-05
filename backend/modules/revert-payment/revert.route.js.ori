const controller = require("./revert.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Supervisor / Manager: revert payment
  app.post(
    "/api/payments/revert",
    auth,
    rbac(["Supervisor", "Manager"]),
    controller.revert
  )
}
