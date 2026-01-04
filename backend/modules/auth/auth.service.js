const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

exports.login = async (db, phone, password) => {
  const { rows } = await db.query(
    `
    SELECT
      u.id,
      u.name,
      u.password,
      u.branch_id,
      r.name AS role
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE u.phone = $1 AND u.active = true
    `,
    [phone]
  )

  if (!rows.length) {
    throw new Error("User not found or inactive")
  }

  const user = rows[0]

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    throw new Error("Invalid password")
  }

  const payload = {
    id: user.id,
    name: user.name,
    role: user.role,
    branch_id: user.branch_id
  }

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET || "NUMARS_SUPER_SECRET",
    { expiresIn: "12h" }
  )

  return {
    token,
    user: payload
  }
}
