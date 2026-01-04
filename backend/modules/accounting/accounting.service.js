exports.recordIncome = async (db, branchId, description, amount) => {
  await db.query(
    `INSERT INTO accounting_entries
     (branch_id, type, description, amount)
     VALUES ($1,'income',$2,$3)`,
    [branchId, description, amount]
  )
}

exports.recordExpense = async (db, branchId, description, amount) => {
  await db.query(
    `INSERT INTO accounting_entries
     (branch_id, type, description, amount)
     VALUES ($1,'expense',$2,$3)`,
    [branchId, description, amount]
  )
}

exports.closeShift = async (db, user, totalCash) => {
  const { rows } = await db.query(
    `INSERT INTO cashier_closings
     (cashier_id, branch_id, total_cash)
     VALUES ($1,$2,$3)
     RETURNING *`,
    [user.id, user.branch_id, totalCash]
  )

  return rows[0]
}

exports.getEntries = async (db, user) => {
  // Owner lihat semua
  if (user.role === "Owner") {
    const { rows } = await db.query(
      `SELECT * FROM accounting_entries ORDER BY created_at DESC`
    )
    return rows
  }

  // Manager lihat per cabang
  const { rows } = await db.query(
    `SELECT * FROM accounting_entries
     WHERE branch_id=$1
     ORDER BY created_at DESC`,
    [user.branch_id]
  )
  return rows
}
