// ===========================
// CONFIG HAPPY HOUR
// ===========================
const HAPPY_HOUR = {
  start: 10, // jam 10.00
  end: 15,   // jam 15.00
  bonus: 20000
}

const isHappyHour = () => {
  const hour = new Date().getHours()
  return hour >= HAPPY_HOUR.start && hour <= HAPPY_HOUR.end
}

exports.calculateCommission = async (db, orderId) => {

  // Pastikan order PAID
  const orderRes = await db.query(
    `SELECT status FROM orders WHERE id=$1`,
    [orderId]
  )

  if (!orderRes.rows.length || orderRes.rows[0].status !== "PAID") {
    throw new Error("Order harus PAID untuk hitung komisi")
  }

  // Ambil timer (therapist yang bekerja)
  const timersRes = await db.query(
    `SELECT therapist_id FROM timers WHERE order_id=$1`,
    [orderId]
  )

  if (!timersRes.rows.length) {
    throw new Error("Tidak ada therapist pada order ini")
  }

  // Ambil total order
  const totalRes = await db.query(
    `SELECT total FROM orders WHERE id=$1`,
    [orderId]
  )

  const orderTotal = Number(totalRes.rows[0].total)

  const commissions = []

  for (const row of timersRes.rows) {

    // Ambil grade therapist
    const gradeRes = await db.query(
      `SELECT g.commission_percent
       FROM therapists t
       JOIN therapist_grades g ON g.id=t.grade_id
       WHERE t.id=$1`,
      [row.therapist_id]
    )

    const percent = Number(gradeRes.rows[0].commission_percent)
    let amount = orderTotal * (percent / 100)

    // Happy hour bonus
    if (isHappyHour()) {
      amount += HAPPY_HOUR.bonus
    }

    const { rows } = await db.query(
      `INSERT INTO commissions
       (therapist_id, order_id, amount)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [row.therapist_id, orderId, amount]
    )

    commissions.push(rows[0])
  }

  return commissions
}

exports.overrideCommission = async (db, commissionId, amount) => {
  const { rows } = await db.query(
    `UPDATE commissions
     SET amount=$1
     WHERE id=$2
     RETURNING *`,
    [amount, commissionId]
  )

  if (!rows.length) {
    throw new Error("Commission tidak ditemukan")
  }

  return rows[0]
}
