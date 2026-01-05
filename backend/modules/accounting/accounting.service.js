const db = require("../../config/db")

exports.recordIncome = async (order) => {
  await db.query(
    `INSERT INTO account_transactions
     (branch_id, type, source, ref_id, amount)
     VALUES ($1,'INCOME','ORDER',$2,$3)`,
    [order.branch_id, order.id, order.total_amount]
  )
}

exports.recordCommission = async (order_id, amount, branch_id) => {
  await db.query(
    `INSERT INTO account_transactions
     (branch_id, type, source, ref_id, amount)
     VALUES ($1,'EXPENSE','COMMISSION',$2,$3)`,
    [branch_id, order_id, amount]
  )
}

exports.recordRevert = async (order) => {
  await db.query(
    `INSERT INTO account_transactions
     (branch_id, type, source, ref_id, amount)
     VALUES ($1,'EXPENSE','REVERT',$2,$3)`,
    [order.branch_id, order.id, order.total_amount]
  )
}
