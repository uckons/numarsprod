const service = require("./payment.service")

exports.pay = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { order_id, method, amount } = req.body

    if (!order_id || !method || !amount) {
      throw new Error("order_id, method, amount wajib")
    }

    const result = await service.payOrder(db, order_id, method, amount)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getAll = async (req, res) => {
  const db = req.app.get("db")
  const { rows } = await db.query(
    `SELECT * FROM payments ORDER BY paid_at DESC`
  )
  res.json(rows)
}
