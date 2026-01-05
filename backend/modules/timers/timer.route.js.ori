const controller = require("./timer.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

module.exports = app => {

  // Supervisor / Kasir: start timer manual (opsional)
  app.post(
    "/api/timers/start",
    auth,
    rbac(["Kasir", "Supervisor"]),
    controller.start
  )

  // Supervisor: pause timer
  app.post(
    "/api/timers/:id/pause",
    auth,
    rbac(["Supervisor"]),
    controller.pause
  )

  // Supervisor: resume timer
  app.post(
    "/api/timers/:id/resume",
    auth,
    rbac(["Supervisor"]),
    controller.resume
  )

  // Supervisor: extend timer
  app.post(
    "/api/timers/:id/extend",
    auth,
    rbac(["Supervisor"]),
    controller.extend
  )

  // Semua role (terapis, supervisor): lihat timer aktif
  app.get(
    "/api/timers/active",
    auth,
    controller.getActive
  )
}
