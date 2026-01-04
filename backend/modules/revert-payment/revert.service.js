exports.revertPayment = async (db, orderId, reason) => {
  // Pastikan order PAID
  const orderRes = await db.query(
    `SELECT status FROM orders WHERE id=$1`,
    [orderId]
  )

  if (!orderRes.rows.length) {
    throw new Error("Order tidak ditemukan")
  }

  if (orderRes.rows[0].status !== "PAID") {
    throw new Error("Hanya order PAID yang bisa direvert")
  }

  // Simpan log revert
  await db.query(
    `INSERT INTO payment_reverts (order_id, reason)
     VALUES ($1,$2)`,
    [orderId, reason]
  )

  // Update status order
  await db.query(
    `UPDATE orders SET status='REVERTED' WHERE id=$1`,
    [orderId]
  )

  return { order_id: orderId, status: "REVERTED" }
}
