const db = require("../config/db")

exports.getSecurity = async (req, res) => {
  const { rows } = await db.query(
    "SELECT idle_timeout_minutes FROM system_settings WHERE id=1"
  )
  res.json(rows[0])
}

exports.updateSecurity = async (req, res) => {
  const { idle_timeout_minutes } = req.body

  if (!idle_timeout_minutes || idle_timeout_minutes < 1) {
    return res.status(400).json({ message: "Invalid idle time" })
  }

  await db.query(
    `UPDATE system_settings 
     SET idle_timeout_minutes=$1, updated_at=NOW()
     WHERE id=1`,
    [idle_timeout_minutes]
  )

  res.json({ success: true })
}
