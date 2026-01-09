const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const db = require("../../config/db")

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({ message: "Username & password required" })
    }

    const { rows } = await db.query(
      `SELECT u.id, u.username, u.password, r.name AS role
       FROM users u
       JOIN roles r ON r.id = u.role_id
       WHERE u.username = $1
       LIMIT 1`,
      [username]
    )

    if (rows.length === 0) {
      return res.status(401).json({ message: "User tidak ditemukan" })
    }

    const user = rows[0]
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(401).json({ message: "Password salah" })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        username: user.username
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    })
  } catch (err) {
    console.error("LOGIN ERROR:", err)
    res.status(500).json({ message: "Login error" })
  }
}
