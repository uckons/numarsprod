const accounting = require("../accounting/accounting.service")
const stockService = require("../stock/stock.service")

exports.payOrder = async (db, orderId, method, amount) => {

  // 1️⃣ Ambil order
  const orderRes = await db.query(
    `SELECT id, status, total, branch_id
     FROM orders WHERE id=$1`,
    [orderId]
  )

  if (!orderRes.rows.length) {
    throw new Error("Order tidak ditemukan")
  }

  const order = orderRes.rows[0]

  if (order.status === "PAID") {
    throw new Error("Order sudah PAID")
  }

  if (Number(amount) !== Number(order.total)) {
    throw new Error("Nominal tidak sesuai total order")
  }

  // 2️⃣ Simpan payment
  await db.query(
    `INSERT INTO payments (order_id, method, amount)
     VALUES ($1,$2,$3)`,
    [orderId, method, amount]
  )

  // 3️⃣ Update order
  await db.query(
    `UPDATE orders SET status='PAID' WHERE id=$1`,
    [orderId]
  )

  // 4️⃣ ACCOUNTING (AMAN)
  await accounting.recordIncome(
    db,
    order.branch_id,
    `Payment Order #${orderId} (${method})`,
    amount
  )

  // 5️⃣ F&B — KURANGI STOK (PINDAH KE DALAM ASYNC)
  const itemsRes = await db.query(
    `SELECT oi.service_id, oi.qty
     FROM order_items oi
     JOIN services s ON s.id = oi.service_id
     WHERE oi.order_id=$1 AND s.category='fnb'`,
    [orderId]
  )

  for (const item of itemsRes.rows) {
    await stockService.reduceStock(
      db,
      item.service_id,
      item.qty
    )
  }

  return {
    order_id: orderId,
    status: "PAID"
  }
}
