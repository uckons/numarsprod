const db = require("../../config/db")
const bcrypt = require("bcrypt")

/**
 * LIST USERS
 * - SuperAdmin: semua user
 * - Role lain : hanya cabangnya
 */
exports.list = async (actor) => {
  // 🔥 SUPERADMIN → LIHAT SEMUA
  if (actor.role === "SuperAdmin") {
    const { rows } = await db.query(`
      SELECT 
        u.id,
        u.username,
        r.name AS role,
        b.name AS branch,
        u.is_active
      FROM users u
      JOIN roles r ON r.id = u.role_id
      LEFT JOIN branches b ON b.id = u.branch_id
      WHERE u.deleted_at IS NULL
      ORDER BY u.id DESC
    `)
    return rows
  }

  // 🔒 ROLE LAIN → HANYA CABANG SENDIRI
  const { rows } = await db.query(`
    SELECT 
      u.id,
      u.username,
      r.name AS role,
      b.name AS branch,
      u.is_active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN branches b ON b.id = u.branch_id
    WHERE 
      u.deleted_at IS NULL
      AND u.branch_id = $1
    ORDER BY u.id DESC
  `, [actor.branch_id])

  return rows
}

/**
 * CREATE USER
 */
exports.create = async (data, actor) => {
  const hash = await bcrypt.hash(data.password, 10)

  // 🔒 Owner tidak boleh create user lintas cabang
  const branchId =
    actor.role === "SuperAdmin"
      ? data.branch_id
      : actor.branch_id

  await db.query(`
    INSERT INTO users (username, password, role_id, branch_id)
    VALUES ($1,$2,$3,$4)
  `, [data.username, hash, data.role_id, branchId])

  await audit(actor.id, "CREATE_USER", data.username)
  return { success: true }
}

/**
 * UPDATE USER
 */
exports.update = async (id, data, actor) => {
  await db.query(`
    UPDATE users
    SET role_id = $1,
        branch_id = $2
    WHERE id = $3
  `, [data.role_id, data.branch_id, id])

  await audit(actor.id, "UPDATE_USER", id)
  return { success: true }
}

/**
 * RESET PASSWORD
 */
exports.resetPassword = async (id, actor) => {
  const hash = await bcrypt.hash("123456", 10)
  await db.query(
    `UPDATE users SET password = $1 WHERE id = $2`,
    [hash, id]
  )

  await audit(actor.id, "RESET_PASSWORD", id)
  return { success: true, password: "123456" }
}

/**
 * ENABLE / DISABLE USER
 */
exports.toggleActive = async (id, actor) => {
  await db.query(
    `UPDATE users SET is_active = NOT is_active WHERE id = $1`,
    [id]
  )

  await audit(actor.id, "TOGGLE_USER", id)
  return { success: true }
}

/**
 * SOFT DELETE USER
 */
exports.remove = async (id, actor) => {
  await db.query(
    `UPDATE users SET deleted_at = NOW() WHERE id = $1`,
    [id]
  )

  await audit(actor.id, "DELETE_USER", id)
  return { success: true }
}

/**
 * AUDIT LOG
 */
async function audit(user_id, action, target) {
  await db.query(`
    INSERT INTO audit_logs (user_id, action, target)
    VALUES ($1,$2,$3)
  `, [user_id, action, target])
}
