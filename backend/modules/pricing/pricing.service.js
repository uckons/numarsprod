const db = require("../../config/db")

exports.getDrinkPrice = async (product_id, branch_id) => {
  // harga normal
  const p = await db.query(
    "SELECT price FROM products WHERE id=$1",
    [product_id]
  )

  let price = p.rows[0].price

  // cek happy hour
  const hh = await db.query(
    `SELECT discount_percent FROM happy_hour_drinks
     WHERE branch_id=$1
     AND CURRENT_TIME BETWEEN start_time AND end_time`,
    [branch_id]
  )

  if (hh.rows.length > 0) {
    price = price * (1 - hh.rows[0].discount_percent)
  }

  return price
}
