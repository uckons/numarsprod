const controller = require("./fnb.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Bar / Supervisor: list item
  app.get(
    "/api/fnb",
    auth,
  //  rbac(["Staff Bar", "Supervisor", "Manager"]),
    rbac(["SuperAdmin", "Owner", "Supervisor", "Manager", "Staff Bar"]),
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
}
