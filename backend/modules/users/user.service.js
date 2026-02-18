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
        u.name,
        u.username,
        u.phone,
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
      u.name,
      u.username,
      u.phone,
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
    INSERT INTO users (name, username, phone, password, role_id, branch_id)
    VALUES ($1,$2,$3,$4,$5,$6)
  `, [data.name, data.username, data.phone, hash, data.role_id, branchId])

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
  const hash = await bcrypt.hash("Numars!212#", 10)
  await db.query(
    `UPDATE users SET password = $1 WHERE id = $2`,
    [hash, id]
  )

  await audit(actor.id, "RESET_PASSWORD", id)
  return { success: true, password: "Numars!212#" }
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
exports.search = async (actor, query) => {
  const { q = "", role = "", page = 1, limit = 10 } = query
  const offset = (page - 1) * limit

  const params = []
  let where = "u.deleted_at IS NULL"

  // 🔒 Role-based scope
  if (actor.role !== "SuperAdmin") {
    params.push(actor.branch_id)
    where += ` AND u.branch_id = $${params.length}`
  }

  if (q) {
    params.push(`%${q}%`)
    /**where += ` AND u.username ILIKE $${params.length}`
  }*/
    where += ` AND (u.username ILIKE $${params.length} OR u.name ILIKE $${params.length})`
  }

  if (role) {
    params.push(role)
    where += ` AND r.name = $${params.length}`
  }

  const data = await db.query(`
    SELECT
      u.id,
      u.name,
      u.phone,
      u.username,
      r.name AS role,
      b.name AS branch,
      u.is_active
    FROM users u
    JOIN roles r ON r.id = u.role_id
    LEFT JOIN branches b ON b.id = u.branch_id
    WHERE ${where}
    ORDER BY u.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params)

  const total = await db.query(`
    SELECT COUNT(*) 
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE ${where}
  `, params)

  return {
    data: data.rows,
    total: Number(total.rows[0].count)
  }
}
exports.stats = async (actor) => {
  const where =
    actor.role === "SuperAdmin"
      ? ""
      : "WHERE branch_id = $1"

  const params =
    actor.role === "SuperAdmin"
      ? []
      : [actor.branch_id]

  const { rows } = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE is_active = true) AS active,
      COUNT(*) FILTER (WHERE is_active = false) AS disabled,
      COUNT(*) FILTER (
        WHERE created_at >= date_trunc('month', NOW())
      ) AS new_month
    FROM users
    ${where}
  `, params)

  return rows[0]
}

const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

exports.changePassword = async (actor, payload = {}) => {
  const currentPassword = String(payload.current_password || '')
  const newPassword = String(payload.new_password || '')

  if (!currentPassword || !newPassword) {
    throw new Error('Password lama dan password baru wajib diisi')
  }

  if (!passwordPolicyRegex.test(newPassword)) {
    throw new Error('Password baru minimal 8 karakter dan wajib mengandung huruf besar, huruf kecil, angka, serta karakter khusus')
  }

  const { rows } = await db.query('SELECT id, password FROM users WHERE id = $1 AND deleted_at IS NULL LIMIT 1', [actor.id])
  if (!rows.length) throw new Error('User tidak ditemukan')

  const validCurrent = await bcrypt.compare(currentPassword, rows[0].password)
  if (!validCurrent) throw new Error('Password lama salah')

  const isSame = await bcrypt.compare(newPassword, rows[0].password)
  if (isSame) throw new Error('Password baru tidak boleh sama dengan password lama')

  const hash = await bcrypt.hash(newPassword, 10)
  await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, actor.id])
  await audit(actor.id, 'CHANGE_PASSWORD', actor.id)

  return { success: true }
}
