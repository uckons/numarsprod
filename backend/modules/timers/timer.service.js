exports.startTimer = async (db, order_id, therapist_id, room_id) => {
  const dur = await db.query(`
    SELECT COALESCE(SUM(duration_minutes), 60) AS duration
    FROM order_items
    WHERE order_id = $1
  `, [order_id])

  const duration = dur.rows[0].duration

  const { rows } = await db.query(`
    INSERT INTO timers
    (therapist_id, room_id, start_time, end_time)
    VALUES
    ($1, $2, $3, NOW(), NOW() + INTERVAL '1 minute' * $4)
    RETURNING *
  `, [order_id, therapist_id, room_id, duration])

  return rows[0]
}

//exports.getActiveTimers = async (db, branch_id) => {
//  const { rows } = await db.query(`
//    SELECT
//      t.id,
//      t.start_time,
//      t.planned_end_time,
//      th.name AS therapist,
//      r.name AS room,
//      s.name AS service
      //EXTRACT(EPOCH FROM (t.planned_end_time - NOW())) AS remaining_seconds
//    FROM timers t
//    LEFT JOIN therapists th ON th.id = t.therapist_id
//    LEFT JOIN rooms r ON r.id = t.room_id
//    WHERE t.branch_id = $1
//      AND t.planned_end_time > NOW()
//    ORDER BY t.start_time ASC
//  `, [branch_id])

//  return rows
//}

//exports.getActiveTimers = async (db, branch_id) => {
//  const { rows } = await db.query(`
//    SELECT
//      t.id,
//      t.start_time,
//     t.planned_end_time,
//      t.paused,
//      u.name AS therapist,
//      r.name AS room,
//      s.name AS service
//    FROM timers t
//    JOIN therapists u ON u.id = t.therapist_id
//    JOIN services s ON s.id = t.service_id
 //   LEFT JOIN rooms r ON r.id = t.room_id
//    WHERE t.end_time IS NULL
//      AND t.branch_id = $1
//    ORDER BY t.start_time ASC
//  `, [branch_id])

//  return rows
//}
exports.getActiveTimers = async (db, branchId) => {
  const { rows } = await db.query(
    `
    SELECT
      t.id,
      t.order_id,
      t.service_id,
      s.name AS service_name,
      th.name AS therapist_name,
      r.name AS room_name,
      t.start_time,
      t.planned_end_time,
      EXTRACT(EPOCH FROM (t.planned_end_time - NOW()))::INTEGER AS remaining_seconds
    FROM timers t
    JOIN services s ON s.id = t.service_id
    LEFT JOIN therapists th ON th.id = t.therapist_id
    LEFT JOIN rooms r ON r.id = t.room_id
    WHERE
        t.end_time IS NULL 
     AND t.branch_id = $1
    ORDER BY t.start_time ASC
    `,
    [branchId]
  )

  return rows
}


exports.stopTimer = async (db, id) => {
  const { rows } = await db.query(
    `
    UPDATE timers
    SET status = 'FINISHED', end_time = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id]
  )

  if (!rows.length) {
    throw new Error("Timer not found")
  }

  return rows[0]
}
