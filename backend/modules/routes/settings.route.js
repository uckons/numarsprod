const router = require("express").Router()
const auth = require("../middlewares/auth.middleware")
const rbac = require("../middlewares/rbac.middleware")
const c = require("./settings.controller")

router.get("/security", auth, c.getSecurity)
router.put("/security", auth, rbac(["SuperAdmin"]), c.updateSecurity)

module.exports = router
