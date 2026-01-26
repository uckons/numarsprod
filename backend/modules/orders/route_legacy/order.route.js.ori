const controller = require("./order.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // KASIR & SUPERVISOR: buat order
  app.post(
    "/api/orders",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.create
  )

  // KASIR & SUPERVISOR: tambah item ke order
  app.post(
    "/api/orders/:id/items",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.addItem
  )

  // OWNER, MANAGER, SUPERVISOR: lihat order per cabang
  app.get(
    "/api/orders",
    auth,
    rbac(["Owner", "Manager", "Supervisor"]),
    controller.getAll
  )

  // KASIR & SUPERVISOR: tutup order (CLOSED)
  app.post(
    "/api/orders/:id/close",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.close
  )
}
