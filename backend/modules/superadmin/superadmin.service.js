const db = require("../../config/db")
const bcrypt = require("bcrypt")

exports.dashboard = async () => {
  const users = await db.query("SELECT COUNT(*) FROM users")
  const branches = await db.query("SELECT COUNT(*) FROM branches")
  const orders = await db.query("SELECT COUNT(*) FROM orders WHERE status='PAID'")
  const revenue = await db.query("SELECT COALESCE(SUM(total),0) FROM orders WHERE status='PAID'")

  return {
    users: users.rows[0].count,
    branches: branches.rows[0].count,
    orders: orders.rows[0].count,
    revenue: revenue.rows[0].coalesce
  }
}

exports.users = async () => {
  return (await db.query(`
    SELECT u.id,u.username,u.role,u.active,b.name branch
    FROM users u
    LEFT JOIN branches b ON b.id=u.branch_id
    ORDER BY u.id
  `)).rows
}

exports.createUser = async ({ username, password, role, branch_id }) => {
  const hash = await bcrypt.hash(password, 10)
  return db.query(
    "INSERT INTO users(username,password,role,branch_id) VALUES($1,$2,$3,$4)",
    [username, hash, role, branch_id || null]
  )
}

exports.toggleUser = async (id) => {
  return db.query("UPDATE users SET active = NOT active WHERE id=$1", [id])
}

exports.resetPassword = async (id) => {
  const hash = await bcrypt.hash("123456", 10)
  return db.query("UPDATE users SET password=$1 WHERE id=$2", [hash, id])
}

exports.branches = async () => {
  return (await db.query("SELECT * FROM branches ORDER BY id")).rows
}

exports.createBranch = async ({ name }) => {
  return db.query("INSERT INTO branches(name) VALUES($1)", [name])
}

//exports.orders = async () => {
//  return (await db.query(`
//    SELECT id, total, category, created_at
//    FROM orders
//    ORDER BY created_at DESC
//    LIMIT 50
//  `)).rows
//}
//exports.orders = async (db) => {
//  const rows = await db.query(`
//    SELECT
//      COUNT(DISTINCT o.id) AS total_orders,

//      COUNT(DISTINCT o.id) FILTER (WHERE s.type = 'SPA') AS spa,
//      COUNT(DISTINCT o.id) FILTER (WHERE s.type = 'LC') AS lc,
//      COUNT(DISTINCT o.id) FILTER (WHERE s.type = 'FNB') AS fnb,
//      COUNT(DISTINCT o.id) FILTER (WHERE s.type = 'KARAOKE') AS karaoke

//    FROM orders o
//    LEFT JOIN order_items oi ON oi.order_id = o.id
//    LEFT JOIN services s ON s.id = oi.service_id
//    WHERE DATE(o.created_at) = CURRENT_DATE
//  `)
//
//  return rows.rows[0]
//}
exports.orders = async () => {
  const { rows } = await db.query(`
    SELECT
      o.id,
      o.branch_id,
      b.name AS branch_name,
      o.status,
      COALESCE(SUM(oi.subtotal), 0) AS total,
      o.created_at,
      STRING_AGG(DISTINCT s.type::text, ', ') AS category
    FROM orders o
    LEFT JOIN branches b ON b.id = o.branch_id
    LEFT JOIN order_items oi ON oi.order_id = o.id
    LEFT JOIN services s ON s.id = oi.service_id
    GROUP BY o.id, o.branch_id, b.name, o.status, o.created_at
    ORDER BY o.created_at DESC
    LIMIT 2000
  `)

  return rows
}



exports.timers = async () => {
  return (await db.query(`
    SELECT t.*, u.name therapist
    FROM timers t
    LEFT JOIN therapists u ON u.id=t.therapist_id
    ORDER BY t.start_time DESC
  `)).rows
}
exports.revenueChart = async () => {
  const q = await db.query(`
    SELECT DATE(created_at) as day, SUM(total) as total
    FROM orders
    WHERE status='PAID'
    GROUP BY day
    ORDER BY day
  `)
  return q.rows
}

exports.forceLogout = async (userId) => {
  await db.query("UPDATE users SET token_version = token_version + 1 WHERE id=$1",[userId])
}
exports.auditLogs = async ({ user_id, from, to }) => {
  const params = []
  let where = []

  if (user_id) {
    params.push(user_id)
    where.push(`a.user_id = $${params.length}`)
  }

  if (from) {
    params.push(from)
    where.push(`a.created_at >= $${params.length}`)
  }

  if (to) {
    params.push(to)
    where.push(`a.created_at <= $${params.length}`)
  }

  const sql = `
    SELECT 
      a.id,
      a.action,
      a.created_at,
      u.username
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ${where.length ? "WHERE " + where.join(" AND ") : ""}
    ORDER BY a.created_at DESC
    LIMIT 200
  `

  return (await db.query(sql, params)).rows
}
