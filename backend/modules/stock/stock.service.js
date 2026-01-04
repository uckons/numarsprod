const whatsapp = require("../../config/whatsapp")

exports.reduceStock = async (db, fnbItemId, qty) => {

  // Kurangi stok
  const { rows } = await db.query(
    `UPDATE fnb_items
     SET stock = stock - $1
     WHERE id=$2
     RETURNING *`,
    [qty, fnbItemId]
  )

  const item = rows[0]

  // Log stok
  await db.query(
    `INSERT INTO stock_logs (fnb_item_id, qty_change)
     VALUES ($1,$2)`,
    [fnbItemId, -qty]
  )

  // Alert WhatsApp jika stok menipis
  if (item.stock <= item.alert_stock) {
    await whatsapp.sendMessage(
      "628111111111",
      `⚠️ STOCK ALERT\n${item.name}\nSisa stok: ${item.stock}`
    )
  }

  return item
}
