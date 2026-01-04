exports.cashflow = async (db, user) => {
  const { rows } = await db.query(
    `
    SELECT
      type,
      SUM(amount) AS total
    FROM accounting_entries
    WHERE branch_id=$1
    GROUP BY type
    `,
    [user.branch_id]
  )

  return rows
}

exports.profitLoss = async (db, user) => {
  const incomeRes = await db.query(
    `SELECT COALESCE(SUM(amount),0) AS income
     FROM accounting_entries
     WHERE branch_id=$1 AND type='income'`,
    [user.branch_id]
  )

  const expenseRes = await db.query(
    `SELECT COALESCE(SUM(amount),0) AS expense
     FROM accounting_entries
     WHERE branch_id=$1 AND type='expense'`,
    [user.branch_id]
  )

  return {
    income: incomeRes.rows[0].income,
    expense: expenseRes.rows[0].expense,
    profit:
      incomeRes.rows[0].income - expenseRes.rows[0].expense
  }
}
