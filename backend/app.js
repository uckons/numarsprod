const express = require("express")
const cors = require("cors")

require("dotenv").config()

const app = express()

app.use(cors())
app.use(express.json())

// 🔹 HEALTH CHECK
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" })
})

// 🔹 ROUTES (PASTIKAN SEMUA EXPORT ROUTER)
app.use("/api/auth", require("./modules/auth/auth.route"))
//app.use("/api/users", require("./modules/users/user.route"))
app.use("/api/orders", require("./modules/orders/order.route"))
//app.use("/api/reports", require("./modules/reports/report.route"))
app.use("/api/timers", require("./modules/timers/timer.route"))
app.use("/api/revert-payment", require("./modules/revert-payment/revert.route"))
app.use("/api/printers", require("./modules/printers/printer.route"))
app.use("/api/superadmin", require("./modules/superadmin/superadmin.route"))
app.use("/api/users", require("./modules/users/user.route"))
app.use("/api/roles", require("./modules/roles/role.route"))
app.use("/api/branches", require("./modules/branches/branch.route"))
app.use("/api/audit-logs", require("./modules/audit/audit.route"))
//app.use("/api/services", require("./modules/services/service.route"))

// ❗ JANGAN load module yang belum siap
// app.use("/api/payments", require("./modules/payments/payment.route"))
// app.use("/api/timers", require("./modules/timers/timer.route"))
// app.use("/api/commissions", require("./modules/commissions/commission.route"))

module.exports = app
