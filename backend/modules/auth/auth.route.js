const controller = require("./auth.controller")

module.exports = app => {
  app.post("/api/auth/login", controller.login)
}
