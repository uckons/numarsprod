const db = require("../../config/db")

const ensureBranchPrintColumns = async () => {
  await db.query(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS phone VARCHAR(40)`) 
  await db.query(`ALTER TABLE branches ADD COLUMN IF NOT EXISTS logo_url TEXT`)
}

exports.list = async () => {
  await ensureBranchPrintColumns()
  const { rows } = await db.query(`
    SELECT
      b.id,
      b.name,
      b.address,
      b.phone,
      b.logo_url,
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
  await ensureBranchPrintColumns()
  const { name, address, phone, logo_url, open_time, close_time } = data

  const { rows } = await db.query(`
    INSERT INTO branches (name, address, phone, logo_url, open_time, close_time, is_active)
    VALUES ($1,$2,$3,$4,$5,$6,false)
    RETURNING *
  `, [name, address || null, phone || null, logo_url || null, open_time, close_time])

  return rows[0]
}

exports.update = async (id, data) => {
  await ensureBranchPrintColumns()
  const { name, address, phone, logo_url, open_time, close_time } = data
  await db.query(`
    UPDATE branches
    SET name = $1,
        address = $2,
        phone = $3,
        logo_url = $4,
        open_time = $5,
        close_time = $6
    WHERE id = $7
  `, [name, address || null, phone || null, logo_url || null, open_time, close_time, id])
  return { success: true }
}

exports.search = async () => exports.list()
exports.stats = async () => ({ total: (await exports.list()).total })

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
