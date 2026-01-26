const jwt = require("jsonwebtoken")

module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader) {
      return res.status(401).json({ message: "No token" })
    }

    const token = authHeader.split(" ")[1]
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    const db = req.app.get("db")

    const { rows } = await db.query(
      `
      SELECT u.id, u.branch_id, r.id AS role_id, r.name AS role
      FROM users u
      JOIN roles r ON r.id = u.role_id
      WHERE u.id = $1
      `,
      [decoded.id]
    )

    if (!rows.length) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = {
      id: rows[0].id,
      role_id: rows[0].role_id,   // ? angka (4)
      role: rows[0].role,         // ? string ("Kasir")
      branch_id: rows[0].branch_id
    }

    next()
  } catch (err) {
    console.error("AUTH ERROR", err)
    res.status(401).json({ message: "Invalid token" })
  }
}
