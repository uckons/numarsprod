const router = require("express").Router()
const auth = require("../../middlewares/auth.middleware")
const rbac = require("../../middlewares/rbac.middleware")
const db = require("../../config/db")

router.get("/", auth, rbac(["SuperAdmin"]), async (req, res) => {
  const { user_id, from, to } = req.query

  let where = "1=1"
  const params = []

  if (user_id) {
    params.push(user_id)
    where += ` AND a.user_id = $${params.length}`
  }

  if (from) {
    params.push(from)
    where += ` AND a.created_at >= $${params.length}`
  }

  if (to) {
    params.push(to)
    where += ` AND a.created_at <= $${params.length}`
  }

  const { rows } = await db.query(`
    SELECT 
      a.id,
      a.action,
      a.target,
      a.created_at,
      u.username
    FROM audit_logs a
    JOIN users u ON u.id = a.user_id
    WHERE ${where}
    ORDER BY a.created_at DESC
    LIMIT 500
  `, params)

  res.json(rows)
})

module.exports = router
