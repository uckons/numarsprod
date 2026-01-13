const db = require("../../config/db")   // ?? WAJIB ADA (INI YANG HILANG)

exports.list = async () => {
  const { rows } = await db.query(`
    SELECT
      b.id,
      b.name,
      b.address,
      b.open_time,
      b.close_time,
      b.is_active,
      COUNT(u.id) AS user_count
    FROM branches b
    LEFT JOIN users u ON u.branch_id = b.id AND u.deleted_at IS NULL
    WHERE b.deleted_at IS NULL
    GROUP BY b.id
    ORDER BY b.id DESC
  `)

  return {
    data: rows,
    total: rows.length
  }
}

exports.create = async (data) => {
  const { name, address, open_time, close_time } = data

  const { rows } = await db.query(`
    INSERT INTO branches (name, address, open_time, close_time, is_active)
    VALUES ($1,$2,$3,$4,false)
    RETURNING *
  `, [name, address, open_time, close_time])

  return rows[0]
}

exports.toggle = async (id) => {
  await db.query(`
    UPDATE branches
    SET is_active = NOT is_active
    WHERE id = $1
  `, [id])

  return { success: true }
}

exports.remove = async (id) => {
  await db.query(`
    UPDATE branches
    SET deleted_at = NOW()
    WHERE id = $1
  `, [id])

  return { success: true }
}
