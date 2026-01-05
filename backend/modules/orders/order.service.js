exports.createOrder = async (db, user) => {
  const { rows } = await db.query(
    `INSERT INTO orders (branch_id, cashier_id, status, total)
     VALUES ($1, $2, 'OPEN', 0)
     RETURNING *`,
    [user.branch_id, user.id]
  )

  return rows[0]
}

exports.addItem = async (db, orderId, serviceId, qty) => {
  // Ambil service
  const serviceRes = await db.query(
    `SELECT price, duration_minutes
     FROM services WHERE id = $1 AND active = true`,
    [serviceId]
  )

  if (!serviceRes.rows.length) {
    throw new Error("Service not found or inactive")
  }

  const service = serviceRes.rows[0]
  const price = service.price * qty
  const duration = service.duration_minutes * qty

  // Insert item
  const itemRes = await db.query(
    `INSERT INTO order_items
     (order_id, service_id, qty, price, duration_minutes)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [orderId, serviceId, qty, price, duration]
  )

  // Update total order
  await db.query(
    `UPDATE orders
     SET total = (
       SELECT COALESCE(SUM(price), 0)
       FROM order_items WHERE order_id = $1
     )
     WHERE id = $1`,
    [orderId]
  )

  return itemRes.rows[0]
}

exports.getOrdersByBranch = async (db, user) => {
  // Owner & Manager boleh lihat semua
  if (["Owner", "Manager"].includes(user.role)) {
    const { rows } = await db.query(
      `SELECT * FROM orders ORDER BY created_at DESC`
    )
    return rows
  }

  // Supervisor lihat per cabang
  const { rows } = await db.query(
    `SELECT * FROM orders
     WHERE branch_id = $1
     ORDER BY created_at DESC`,
    [user.branch_id]
  )
  return rows
}

exports.closeOrder = async (db, orderId) => {
  const { rows } = await db.query(
    `UPDATE orders
     SET status = 'CLOSED'
     WHERE id = $1 AND status = 'PAID'
     RETURNING *`,
    [orderId]
  )

  if (!rows.length) {
    throw new Error("Order must be PAID before closing")
  }

  return rows[0]
}
const db = require("../../config/db")

exports.expandPackageItems = async (order_id) => {
  // ambil item paket
  const packages = await db.query(
    `SELECT oi.product_id, oi.qty
     FROM order_items oi
     JOIN products p ON p.id=oi.product_id
     WHERE oi.order_id=$1 AND p.type='PACKAGE'`,
    [order_id]
  )

  for (const pkg of packages.rows) {
    // isi paket (contoh relasi)
    const items = await db.query(
      `SELECT product_id, qty
       FROM package_items
       WHERE package_id=$1`,
      [pkg.product_id]
    )

    for (const i of items.rows) {
      await db.query(
        `INSERT INTO order_items (order_id, product_id, qty, price)
         SELECT $1, p.id, $2, p.price
         FROM products p WHERE p.id=$3`,
        [order_id, i.qty * pkg.qty, i.product_id]
      )
    }
  }
}
