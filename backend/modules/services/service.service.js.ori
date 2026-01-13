const db = require("../../config/db")

exports.list = async (branch_id) => {
  const { rows } = await db.query(`
    SELECT *
    FROM services
    WHERE branch_id=$1
      AND deleted_at IS NULL
    ORDER BY category, name
  `, [branch_id])

  return rows
}

exports.create = async (data, actor) => {
  await db.query(`
    INSERT INTO services
    (branch_id, name, category, price, duration)
    VALUES ($1,$2,$3,$4,$5)
  `, [
    actor.branch_id,
    data.name,
    data.category,
    data.price,
    data.duration || 0
  ])

  return { success: true }
}

exports.update = async (id, data) => {
  await db.query(`
    UPDATE services
    SET name=$1, price=$2, duration=$3
    WHERE id=$4
  `, [data.name, data.price, data.duration, id])

  return { success: true }
}

exports.toggle = async (id) => {
  await db.query(`
    UPDATE services SET is_active = NOT is_active WHERE id=$1
  `, [id])

  return { success: true }
}

exports.remove = async (id) => {
  await db.query(`
    UPDATE services SET deleted_at=NOW() WHERE id=$1
  `, [id])

  return { success: true }
}
