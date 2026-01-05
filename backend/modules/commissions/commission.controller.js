const service = require("./commission.service")

exports.calculate = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { order_id } = req.body

    if (!order_id) {
      throw new Error("order_id wajib")
    }

    const result = await service.calculateCommission(db, order_id)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.override = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { commission_id, amount } = req.body

    if (!commission_id || amount === undefined) {
      throw new Error("commission_id & amount wajib")
    }

    const result = await service.overrideCommission(db, commission_id, amount)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getAll = async (req, res) => {
  const db = req.app.get("db")
  const { rows } = await db.query(
    `SELECT c.*, t.name AS therapist_name
     FROM commissions c
     JOIN therapists t ON t.id=c.therapist_id
     ORDER BY c.created_at DESC`
  )
  res.json(rows)
}
exports.byTherapist = async (req, res) => {
  const { from, to } = req.query

  const { rows } = await db.query(
    `SELECT t.name, SUM(c.amount) total
     FROM commissions c
     JOIN therapists t ON t.id=c.therapist_id
     WHERE c.created_at BETWEEN $1 AND $2
     GROUP BY t.name`,
    [from, to]
  )

  res.json(rows)
}
