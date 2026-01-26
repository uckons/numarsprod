const { addMinutes } = require("date-fns")

exports.startTimers = async (db, orderId, therapistIds, durationMinutes) => {
  // Pastikan order PAID
  const orderRes = await db.query(
    `SELECT status FROM orders WHERE id=$1`,
    [orderId]
  )

  if (!orderRes.rows.length || orderRes.rows[0].status !== "PAID") {
    throw new Error("Order harus PAID untuk start timer")
  }

  const start = new Date()
  const duration = durationMinutes || 60
  const end = addMinutes(start, duration)

  const timers = []

  for (const therapistId of therapistIds) {
    const { rows } = await db.query(
      `INSERT INTO timers
       (order_id, therapist_id, start_time, end_time, paused)
       VALUES ($1,$2,$3,$4,false)
       RETURNING *`,
      [orderId, therapistId, start, end]
    )
    timers.push(rows[0])
  }

  return timers
}

exports.pauseTimer = async (db, timerId) => {
  const { rows } = await db.query(
    `UPDATE timers SET paused=true
     WHERE id=$1 RETURNING *`,
    [timerId]
  )
  return rows[0]
}

exports.resumeTimer = async (db, timerId) => {
  const { rows } = await db.query(
    `UPDATE timers SET paused=false
     WHERE id=$1 RETURNING *`,
    [timerId]
  )
  return rows[0]
}

exports.extendTimer = async (db, timerId, minutes) => {
  const { rows } = await db.query(
    `UPDATE timers
     SET end_time = end_time + interval '${minutes} minutes'
     WHERE id=$1 RETURNING *`,
    [timerId]
  )
  return rows[0]
}

exports.getActiveTimers = async (db, user) => {
  // Owner / Supervisor lihat semua per cabang
  if (["Owner", "Supervisor"].includes(user.role)) {
    const { rows } = await db.query(
      `SELECT t.*, th.name AS therapist_name
       FROM timers t
       JOIN therapists th ON th.id=t.therapist_id
       JOIN orders o ON o.id=t.order_id
       WHERE o.branch_id=$1 AND t.end_time > NOW()`,
      [user.branch_id]
    )
    return rows
  }

  // Terapis hanya lihat dirinya
  const { rows } = await db.query(
    `SELECT t.*, th.name AS therapist_name
     FROM timers t
     JOIN therapists th ON th.id=t.therapist_id
     WHERE t.therapist_id=$1 AND t.end_time > NOW()`,
    [user.id]
  )
  return rows
}
