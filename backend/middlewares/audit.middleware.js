const db = require("../config/db")

module.exports = (action) => {
  return async (req, res, next) => {
    try {
      await db.query(
        "INSERT INTO audit_logs(user_id, action) VALUES($1,$2)",
        [req.user.id, action]
      )
    } catch (e) {
      console.error("Audit log error:", e.message)
    }
    next()
  }
}
