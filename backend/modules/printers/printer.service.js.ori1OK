const escpos = require("escpos")
escpos.Network = require("escpos-network")
escpos.USB = require("escpos-usb")

const db = require("../../config/db")

exports.printReceipt = async ({ order_id, printer }) => {
  // ambil data order
  const orderRes = await db.query(
    `SELECT o.id, o.total_amount, o.created_at,
            b.name AS branch
     FROM orders o
     JOIN branches b ON b.id=o.branch_id
     WHERE o.id=$1`,
    [order_id]
  )
  const order = orderRes.rows[0]

  const items = await db.query(
    `SELECT name, qty, price
     FROM order_items WHERE order_id=$1`,
    [order_id]
  )

  // setup printer
  let device
  if (printer.type === "LAN") {
    device = new escpos.Network(printer.ip)
  } else {
    device = new escpos.USB()
  }

  const p = new escpos.Printer(device)

  device.open(() => {
    p
      .align("ct")
      .style("b")
      .size(1, 1)
      .text("NUMARS SPA & LOUNGE")
      .size(0, 0)
      .text(order.branch)
      .drawLine()

      .align("lt")
      .text(`Order #${order.id}`)
      .text(`Tanggal: ${order.created_at}`)
      .drawLine()

    items.rows.forEach(i => {
      p.text(`${i.name} x${i.qty}`)
      p.text(`  Rp ${i.price * i.qty}`)
    })

    p
      .drawLine()
      .style("b")
      .text(`TOTAL: Rp ${order.total_amount}`)
      .drawLine()

      .align("ct")
      .text("Terima kasih 🙏")
      .text("NUMARS PONDOK INDAH")
      .cut()
      .close()
  })
}

