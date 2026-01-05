const express = require("express")
const router = express.Router()

const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")

// ⬇️ CONTROLLER STUB (AMAN)
const controller = {
  summary: (req, res) => {
    res.json({
      message: "Report summary (stub)"
    })
  }
}

// ✅ PASTIKAN SEMUA ARGUMEN ADALAH FUNCTION
router.get(
  "/summary",
  auth,
  rbac(["Owner", "Manager", "SuperAdmin"]),
  controller.summary
)

module.exports = router
