exports.getAll = async (db, user) => {
  const { rows } = await db.query(
    `SELECT * FROM fnb_items WHERE branch_id=$1 ORDER BY name`,
    [user.branch_id]
  )
  return rows
}

exports.create = async (db, user, data) => {
  const { name, price, stock, alert_stock } = data

  const { rows } = await db.query(
    `INSERT INTO fnb_items
     (branch_id, name, price, stock, alert_stock)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [user.branch_id, name, price, stock, alert_stock]
  )

  return rows[0]
}

exports.update = async (db, id, data) => {
  const { name, price, stock, alert_stock } = data

  const { rows } = await db.query(
    `UPDATE fnb_items
     SET name=$1, price=$2, stock=$3, alert_stock=$4
     WHERE id=$5
     RETURNING *`,
    [name, price, stock, alert_stock, id]
  )

  return rows[0]
}
