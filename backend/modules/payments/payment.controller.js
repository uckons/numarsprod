const db = require("../../config/db")
const { getIO } = require("../../sockets/io")

exports.payOrder = async (req, res) => {
  const { order_id, therapist_ids = [], duration = 60, method } = req.body
  const user = req.user

  const io = getIO()

  try {
    await db.query("BEGIN")

    /* ======================
       1. UPDATE ORDER
    ====================== */
    const orderRes = await db.query(
      `UPDATE orders
       SET status='PAID'
       WHERE id=$1
       RETURNING *`,
      [order_id]
    )

    const order = orderRes.rows[0]
const accounting = require("../accounting/accounting.service")
await accounting.recordIncome(order)
const stockService = require("../stock/stock.service")
await stockService.deductStockByOrder(order.id)
const orderService = require("../orders/order.service")

// sebelum PAID
await orderService.expandPackageItems(order.id)
price = await pricingService.getDrinkPrice(
  product_id,
  order.branch_id
)

    /* ======================
       2. INSERT PAYMENT
    ====================== */
    await db.query(
      `INSERT INTO payments (order_id, method, amount, cashier_id)
       VALUES ($1,$2,$3,$4)`,
      [order.id, method, order.total_amount, user.id]
    )

    /* ======================
       3. AUTO CREATE TIMERS
    ====================== */
    const start = new Date()
    const end = new Date(start.getTime() + duration * 60000)

    for (const therapist_id of therapist_ids) {
      const { rows } = await db.query(
        `INSERT INTO timers
         (order_id, therapist_id, start_time, end_time)
         VALUES ($1,$2,$3,$4)
         RETURNING *`,
        [order.id, therapist_id, start, end]
      )

      // 🔥 REALTIME EMIT
      io.to(`branch-${order.branch_id}`).emit("timer:start", rows[0])
    }

    await db.query("COMMIT")

    res.json({
      message: "Payment success & timer started",
      order_id: order.id
    })

  } catch (err) {
    await db.query("ROLLBACK")
    console.error(err)
    res.status(500).json({ message: "Payment failed" })
  }
}
const commissionService =
  require("../commissions/commission.service")

for (const therapist_id of therapist_ids) {
  const amount =
    await commissionService.calculateTherapistCommission(
      order,
      therapist_id
    )

  await db.query(
    `INSERT INTO commissions (order_id, therapist_id, amount)
     VALUES ($1,$2,$3)`,
    [order.id, therapist_id, amount]
  )
await accounting.recordCommission(
  order.id,
  totalCommission,
  order.branch_id
)

}
