const db = require("../../config/db")

exports.kasir = async (user) => {
  const branchId = user.branch_id

  const activeOrders = await db.query(
    `SELECT COUNT(*) FROM orders WHERE status='OPEN' AND branch_id=$1`,
    [branchId]
  )

  const todayRevenue = await db.query(
    `WITH branch_schedule AS (
       SELECT open_time, close_time
       FROM branches
       WHERE id = $1
     ),
     outlet_window AS (
       SELECT
         CASE
           WHEN close_time <= open_time AND CURRENT_TIME < close_time
             THEN (CURRENT_DATE - INTERVAL '1 day') + open_time
           WHEN close_time <= open_time
             THEN CURRENT_DATE + open_time
           WHEN CURRENT_TIME >= open_time
             THEN CURRENT_DATE + open_time
           ELSE (CURRENT_DATE - INTERVAL '1 day') + open_time
         END AS start_at,
         CASE
           WHEN close_time <= open_time AND CURRENT_TIME < close_time
             THEN CURRENT_DATE + close_time
           WHEN close_time <= open_time
             THEN (CURRENT_DATE + INTERVAL '1 day') + close_time
           WHEN CURRENT_TIME >= open_time
             THEN CURRENT_DATE + close_time
           ELSE CURRENT_DATE + close_time
         END AS end_at
       FROM branch_schedule
     )
     SELECT COALESCE(SUM(o.total), 0)
     FROM orders o
     CROSS JOIN outlet_window w
     WHERE o.status = 'PAID'
       AND o.branch_id = $1
       AND o.created_at >= w.start_at
       AND o.created_at < w.end_at`,
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
