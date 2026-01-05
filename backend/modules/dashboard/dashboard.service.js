const db = require("../../config/db")

exports.getOwnerSummary = async (branch_id) => {
  const monthly = await db.query(
    `
    SELECT
      COALESCE(SUM(total),0) AS total,
      COALESCE(SUM(CASE WHEN category='SPA' THEN total END),0) AS spa,
      COALESCE(SUM(CASE WHEN category='KARAOKE' THEN total END),0) AS karaoke,
      COALESCE(SUM(CASE WHEN category='FNB' THEN total END),0) AS fnb
    FROM orders
    WHERE status='PAID'
      AND branch_id=$1
      AND DATE_TRUNC('month', created_at)=DATE_TRUNC('month', NOW())
    `,
    [branch_id]
  )

  const yearly = await db.query(
    `
    SELECT COALESCE(SUM(total),0) AS total
    FROM orders
    WHERE status='PAID'
      AND branch_id=$1
      AND DATE_TRUNC('year', created_at)=DATE_TRUNC('year', NOW())
    `,
    [branch_id]
  )

  return {
    monthlyTotal: monthly.rows[0].total,
    yearlyTotal: yearly.rows[0].total,
    spa: monthly.rows[0].spa,
    karaoke: monthly.rows[0].karaoke,
    fnb: monthly.rows[0].fnb
  }
}
exports.getOwnerDaily = async (branch_id) => {
  const q = await db.query(
    `
    SELECT
      DATE(created_at) AS date,
      SUM(total) AS total
    FROM orders
    WHERE status='PAID'
      AND branch_id=$1
      AND created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
    `,
    [branch_id]
  )

  return q.rows
}
