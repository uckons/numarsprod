const router = require("express").Router()
const c = require("./branch.controller")
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

router.use(auth, rbac(["SuperAdmin"]))

router.get("/", c.list)
router.get("/stats", c.stats)
router.post("/", c.create)
router.put("/:id", c.update)
router.put("/:id/toggle", c.toggle)

module.exports = router
