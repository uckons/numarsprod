const db = require("../../config/db")

exports.startTimersByOrder = async (req, res) => {
  const { order_id, therapist_ids = [], duration = 60 } = req.body
  const { getIO } = require("../../sockets/io")

  // validasi order
  const order = await db.query(
    "SELECT id, status FROM orders WHERE id=$1",
    [order_id]
  )

  if (order.rows.length === 0) {
    return res.status(404).json({ message: "Order not found" })
  }

  if (order.rows[0].status !== "PAID") {
    return res.status(400).json({ message: "Order not paid" })
  }

  const start = new Date()
  const end = new Date(start.getTime() + duration * 60000)

  const timers = []

  for (const therapist_id of therapist_ids) {
    const { rows } = await db.query(
      `INSERT INTO timers (order_id, therapist_id, start_time, end_time)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [order_id, therapist_id, start, end]
    )
    timers.push(rows[0])
  }

  res.json(timers)
}
exports.pauseTimer = async (req, res) => {
  const { id } = req.params
  await db.query("UPDATE timers SET paused=true WHERE id=$1", [id])
  res.json({ message: "Timer paused" })
}

exports.resumeTimer = async (req, res) => {
  const { id } = req.params
  await db.query("UPDATE timers SET paused=false WHERE id=$1", [id])
  res.json({ message: "Timer resumed" })
}
exports.extendTimer = async (req, res) => {
  const { id } = req.params
  const { minutes } = req.body

  await db.query(
    `UPDATE timers
     SET end_time = end_time + INTERVAL '${minutes} minutes'
     WHERE id=$1`,
    [id]
  )

  res.json({ message: "Timer extended" })
}
