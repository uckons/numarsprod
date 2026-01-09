const db = require("../../config/db")

exports.list = async (_, query) => {
  const { q = "", page = 1, limit = 10 } = query
  const offset = (page - 1) * limit

  const params = []
  let where = "b.deleted_at IS NULL"

  if (q) {
    params.push(`%${q}%`)
    where += ` AND b.name ILIKE $${params.length}`
  }

  const data = await db.query(`
    SELECT
      b.id,
      b.name,
      b.address,
      b.open_time,
      b.close_time,
      b.is_active,
      COUNT(u.id)::int AS user_count
    FROM branches b
    LEFT JOIN users u ON u.branch_id = b.id AND u.deleted_at IS NULL
    WHERE ${where}
    GROUP BY b.id
    ORDER BY b.id DESC
    LIMIT ${limit} OFFSET ${offset}
  `, params)

  const total = await db.query(`
    SELECT COUNT(*) FROM branches b WHERE ${where}
  `, params)

  return {
    data: data.rows,
    total: Number(total.rows[0].count)
  }
}

exports.stats = async () => {
  const { rows } = await db.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE is_active=true) AS active,
      COUNT(*) FILTER (WHERE is_active=false) AS disabled
    FROM branches
    WHERE deleted_at IS NULL
  `)
  return rows[0]
}

exports.create = async (data) => {
  await db.query(`
    INSERT INTO branches (name, address, open_time, close_time)
    VALUES ($1,$2,$3,$4)
  `, [data.name, data.address, data.open_time, data.close_time])
}

exports.update = async (id, data) => {
  await db.query(`
    UPDATE branches
    SET name=$1, address=$2, open_time=$3, close_time=$4
    WHERE id=$5
  `, [data.name, data.address, data.open_time, data.close_time, id])
}

exports.toggle = async (id) => {
  await db.query(`
    UPDATE branches SET is_active = NOT is_active WHERE id=$1
  `, [id])
}
