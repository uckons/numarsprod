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

const formatDateOnly = (date) => {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

const resolveRange = ({ preset, date_from, date_to }) => {
  const now = new Date()
  let from
  let to

  if (preset === "daily") {
    from = new Date(now)
    from.setHours(0, 0, 0, 0)
    to = new Date(from)
    to.setDate(to.getDate() + 1)
  } else if (preset === "weekly") {
    from = new Date(now)
    from.setDate(from.getDate() - 6)
    from.setHours(0, 0, 0, 0)
    to = new Date(now)
    to.setHours(23, 59, 59, 999)
    to = new Date(to.getTime() + 1)
  } else {
    from = new Date(now)
    from.setDate(from.getDate() - 29)
    from.setHours(0, 0, 0, 0)
    to = new Date(now)
    to.setHours(23, 59, 59, 999)
    to = new Date(to.getTime() + 1)
  }

  if (date_from) {
    from = new Date(date_from)
    from.setHours(0, 0, 0, 0)
  }
  if (date_to) {
    to = new Date(date_to)
    to.setHours(23, 59, 59, 999)
    to = new Date(to.getTime() + 1)
  }

  if (!(from instanceof Date) || Number.isNaN(from.getTime())) {
    throw new Error("Invalid date_from")
  }
  if (!(to instanceof Date) || Number.isNaN(to.getTime())) {
    throw new Error("Invalid date_to")
  }
  if (from >= to) {
    throw new Error("date_from must be before date_to")
  }

  return { from, to }
}

exports.kasirAnalytics = async (user, query = {}) => {
  const branchId = user.branch_id
  const preset = String(query.preset || "monthly").toLowerCase()
  const { from, to } = resolveRange({
    preset,
    date_from: query.date_from,
    date_to: query.date_to
  })

  const summaryRes = await db.query(
    `SELECT
       COUNT(DISTINCT o.id) AS paid_orders,
       COALESCE(SUM(o.total), 0) AS revenue,
       COALESCE(SUM(oi.qty), 0) AS items_sold
     FROM orders o
     LEFT JOIN order_items oi ON oi.order_id = o.id
     WHERE o.status = 'PAID'
       AND o.branch_id = $1
       AND o.created_at >= $2
       AND o.created_at < $3`,
    [branchId, from, to]
  )

  const breakdownRes = await db.query(
    `SELECT
       CASE
         WHEN s.type IN ('KARAOKE', 'KTV') THEN 'KTV'
         WHEN s.type = 'LOUNGE' THEN 'LC'
         ELSE s.type
       END AS category,
       COALESCE(SUM(oi.subtotal), 0) AS revenue,
       COALESCE(SUM(oi.qty), 0) AS qty
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN services s ON s.id = oi.service_id
     WHERE o.status = 'PAID'
       AND o.branch_id = $1
       AND o.created_at >= $2
       AND o.created_at < $3
     GROUP BY 1`,
    [branchId, from, to]
  )

  const topFnbRes = await db.query(
    `SELECT
       oi.service_id,
       oi.service_name,
       COALESCE(SUM(oi.qty), 0) AS qty,
       COALESCE(SUM(oi.subtotal), 0) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     JOIN services s ON s.id = oi.service_id
     WHERE o.status = 'PAID'
       AND o.branch_id = $1
       AND o.created_at >= $2
       AND o.created_at < $3
       AND s.type = 'FNB'
     GROUP BY oi.service_id, oi.service_name
     ORDER BY qty DESC, revenue DESC
     LIMIT 5`,
    [branchId, from, to]
  )

  const topTherapistRes = await db.query(
    `SELECT
       oi.therapist_name,
       COUNT(DISTINCT o.id) AS orders,
       COALESCE(SUM(oi.subtotal), 0) AS revenue
     FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.status = 'PAID'
       AND o.branch_id = $1
       AND o.created_at >= $2
       AND o.created_at < $3
       AND oi.therapist_name IS NOT NULL
       AND oi.therapist_name <> ''
     GROUP BY oi.therapist_name
     ORDER BY revenue DESC, orders DESC
     LIMIT 5`,
    [branchId, from, to]
  )

  const trendRes = await db.query(
    `SELECT
       DATE(o.created_at) AS bucket,
       COUNT(*) AS orders,
       COALESCE(SUM(o.total), 0) AS revenue
     FROM orders o
     WHERE o.status = 'PAID'
       AND o.branch_id = $1
       AND o.created_at >= $2
       AND o.created_at < $3
     GROUP BY DATE(o.created_at)
     ORDER BY DATE(o.created_at) ASC`,
    [branchId, from, to]
  )

  return {
    range: {
      from: formatDateOnly(from),
      to: formatDateOnly(new Date(to.getTime() - 1))
    },
    summary: {
      paid_orders: Number(summaryRes.rows[0]?.paid_orders || 0),
      revenue: Number(summaryRes.rows[0]?.revenue || 0),
      items_sold: Number(summaryRes.rows[0]?.items_sold || 0)
    },
    breakdown: breakdownRes.rows.map((row) => ({
      category: row.category,
      revenue: Number(row.revenue || 0),
      qty: Number(row.qty || 0)
    })),
    top_fnb: topFnbRes.rows.map((row) => ({
      service_id: Number(row.service_id),
      service_name: row.service_name,
      qty: Number(row.qty || 0),
      revenue: Number(row.revenue || 0)
    })),
    top_therapists: topTherapistRes.rows.map((row) => ({
      therapist_name: row.therapist_name,
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0)
    })),
    trend: trendRes.rows.map((row) => ({
      label: formatDateOnly(row.bucket),
      orders: Number(row.orders || 0),
      revenue: Number(row.revenue || 0)
    }))
  }
}
