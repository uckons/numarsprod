const db = require("../../config/db")

exports.calculateTherapistCommission = async (order, therapist_id) => {
  // ambil terapis
  const t = await db.query(
    "SELECT grade FROM therapists WHERE id=$1",
    [therapist_id]
  )

  const grade = t.rows[0].grade

  // persentase grade
  const g = await db.query(
    "SELECT percent FROM commission_settings WHERE grade=$1 AND branch_id=$2",
    [grade, order.branch_id]
  )

  let percent = g.rows[0].percent

  // cek happy hour
  const hh = await db.query(
    `SELECT bonus_percent FROM happy_hours
     WHERE branch_id=$1
     AND CURRENT_TIME BETWEEN start_time AND end_time`,
    [order.branch_id]
  )

  if (hh.rows.length > 0) {
    percent += hh.rows[0].bonus_percent
  }

  return order.total_amount * percent
}
