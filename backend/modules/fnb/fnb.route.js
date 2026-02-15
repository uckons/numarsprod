const controller = require("./fnb.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Bar / Supervisor: list item
  app.get(
    "/api/fnb",
    auth,
  //  rbac(["Staff Bar", "Supervisor", "Manager"]),
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager", "Staff Bar", "Kasir"]),
    controller.getAll
  )

  // Supervisor / Manager: tambah item
  app.post(
    "/api/fnb",
    auth,
    //rbac(["Supervisor", "Manager"]),
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.create
  )

  // Supervisor / Manager: update item
  app.put(
    "/api/fnb/:id",
    auth,
    //rbac(["Supervisor", "Manager"]),
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.update
  )


  app.delete(
    "/api/fnb/:id",
    auth,
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.remove
  )

  app.post(
    "/api/fnb/remove-duplicates",
    auth,
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.removeDuplicates
  )

  app.post(
    "/api/fnb/:id/stock-adjustments",
    auth,
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager", "Staff Bar", "Kasir"]),
    controller.requestStockAdjustment
  )

  app.get(
    "/api/fnb/stock/requests",
    auth,
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.getStockAdjustmentRequests
  )

  app.post(
    "/api/fnb/stock/requests/:requestId/approve",
    auth,
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.approveStockAdjustment
  )

  app.post(
    "/api/fnb/stock/requests/:requestId/reject",
    auth,
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager"]),
    controller.rejectStockAdjustment
  )

}
