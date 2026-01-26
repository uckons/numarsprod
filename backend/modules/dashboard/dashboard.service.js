const db = require("../../config/db")

exports.kasir = async (user) => {
  const branchId = user.branch_id

  const activeOrders = await db.query(
    `SELECT COUNT(*) FROM orders WHERE status='OPEN' AND branch_id=$1`,
    [branchId]
  )

  const todayRevenue = await db.query(
    `SELECT COALESCE(SUM(total),0) 
     FROM orders 
     WHERE status='PAID' 
     AND branch_id=$1
     AND DATE(created_at)=CURRENT_DATE`,
    [branchId]
  )

  const activeTherapists = await db.query(
    `SELECT COUNT(DISTINCT therapist_id)
     FROM timers
     WHERE end_time IS NULL
     AND branch_id=$1`,
    [branchId]
  )

  return {
    activeOrders: Number(activeOrders.rows[0].count),
    todayRevenue: Number(todayRevenue.rows[0].coalesce),
    activeTherapists: Number(activeTherapists.rows[0].count)
  }
}
