const router = require("express").Router()
const auth = require("../../middlewares/auth.middleware")

router.get("/", auth, async (req, res) => {
  const { rows } = await require("../../config/db").query(
    "SELECT id, name FROM branches ORDER BY name"
  )
  res.json(rows)
})

module.exports = router
