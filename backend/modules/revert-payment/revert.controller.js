const db = require("../../config/db")
const { getIO } = require("../../sockets/io")

exports.revertPayment = async (req, res) => {
  const { order_id, reason } = req.body
  const user = req.user
  const io = getIO()

  try {
    await db.query("BEGIN")

    // 1. Update payment
    await db.query(
      "UPDATE payments SET status='REVERTED' WHERE order_id=$1",
      [order_id]
    )

    // 2. Update order
    const orderRes = await db.query(
      "UPDATE orders SET status='UNPAID' WHERE id=$1 RETURNING *",
      [order_id]
    )
    const order = orderRes.rows[0]

    // 3. Stop timers
    const timers = await db.query(
      `UPDATE timers
       SET paused=true, end_time=NOW()
       WHERE order_id=$1
       RETURNING *`,
      [order_id]
    )

    // 4. Remove commissions
    await db.query(
      "DELETE FROM commissions WHERE order_id=$1",
      [order_id]
    )

    // 5. Audit log
    await db.query(
      `INSERT INTO payment_reverts
       (order_id, reason, reverted_by)
       VALUES ($1,$2,$3)`,
      [order_id, reason, user.id]
    )

    await db.query("COMMIT")

    // 6. Realtime emit
    io.to(`branch-${order.branch_id}`).emit("payment:reverted", {
      order_id
    })

    timers.rows.forEach(t => {
      io.to(`branch-${order.branch_id}`).emit("timer:stop", {
        id: t.id
      })
    })

    res.json({ message: "Payment reverted successfully" })

  } catch (err) {
    await db.query("ROLLBACK")
    console.error(err)
    res.status(500).json({ message: "Revert failed" })
  }
const accounting = require("../accounting/accounting.service")
await accounting.recordRevert(order)
}
