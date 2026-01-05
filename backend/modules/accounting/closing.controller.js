exports.closeShift = async (req, res) => {
  const { opening_cash, closing_cash } = req.body
  const user = req.user

  const system = await db.query(
    `SELECT SUM(amount) total FROM account_transactions
     WHERE branch_id=$1 AND type='INCOME'
     AND DATE(created_at)=CURRENT_DATE`,
    [user.branch_id]
  )

  const system_cash = system.rows[0].total || 0

  await db.query(
    `INSERT INTO cashier_closings
     (cashier_id, branch_id, shift_date,
      opening_cash, closing_cash,
      system_cash, difference)
     VALUES ($1,$2,CURRENT_DATE,$3,$4,$5,$6)`,
    [
      user.id,
      user.branch_id,
      opening_cash,
      closing_cash,
      system_cash,
      closing_cash - system_cash
    ]
  )

  res.json({ message: "Shift closed" })
}
