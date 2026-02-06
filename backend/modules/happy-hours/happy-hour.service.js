const db = require("../../config/db")

exports.listByBranch = async (branchId) => {
  const { rows } = await db.query(
    `
    SELECT id, service_type, start_time, end_time, is_active
    FROM happy_hours
    WHERE branch_id = $1
    ORDER BY service_type
    `,
    [branchId]
  )
  return rows
}

exports.upsert = async (branchId, serviceType, payload) => {
  const { start_time, end_time, is_active } = payload

  const { rows } = await db.query(
    `
    UPDATE happy_hours
    SET start_time = $1,
        end_time = $2,
        is_active = $3
    WHERE branch_id = $4 AND service_type = $5
    RETURNING id
    `,
    [start_time, end_time, Boolean(is_active), branchId, serviceType]
  )

  if (rows.length) {
    return rows[0]
  }

  const insert = await db.query(
    `
    INSERT INTO happy_hours (branch_id, service_type, start_time, end_time, is_active)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [branchId, serviceType, start_time, end_time, Boolean(is_active)]
  )

  return insert.rows[0]
}