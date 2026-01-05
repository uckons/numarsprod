const escpos = require("escpos")
escpos.USB = require("escpos-usb")
escpos.Network = require("escpos-network")
//require("escpos-qrcode")(escpos)

const qrisConfig = require("../../config/qris")

// =====================
// Konfigurasi Printer
// =====================
const getPrinter = () => {
  // PILIH SALAH SATU:
  // LAN (disarankan)
  return {
    device: new escpos.Network("192.168.1.50", 9100),
    type: "LAN"
  }

  // USB (alternatif)
  // return { device: new escpos.USB(), type: "USB" }
}

exports.printOrderReceipt = async (db, orderId) => {
  // Ambil order
  const orderRes = await db.query(
    `SELECT o.*, b.name AS branch_name
     FROM orders o
     JOIN branches b ON b.id=o.branch_id
     WHERE o.id=$1`,
    [orderId]
  )

  if (!orderRes.rows.length) {
    throw new Error("Order tidak ditemukan")
  }

  const order = orderRes.rows[0]
  if (order.status !== "PAID") {
    throw new Error("Hanya order PAID yang boleh dicetak")
  }

  // Ambil item
  const itemsRes = await db.query(
    `SELECT s.name, oi.qty, oi.price
     FROM order_items oi
     JOIN services s ON s.id=oi.service_id
     WHERE oi.order_id=$1`,
    [orderId]
  )

  const { device } = getPrinter()
  const printer = new escpos.Printer(device)

  device.open(() => {
    printer
      .align("CT")
      .style("B")
      .size(2, 2)
      .text(order.branch_name)
      .size(1, 1)
      .text("NUMARS POS")
      .text("------------------------------")

      .align("LT")
      .text(`Order ID : ${order.id}`)
      .text(`Tanggal  : ${new Date(order.created_at).toLocaleString()}`)
      .text("------------------------------")

    itemsRes.rows.forEach(item => {
      printer.text(
        `${item.name} x${item.qty}  ${item.price.toLocaleString()}`
      )
    })

    printer
      .text("------------------------------")
      .style("B")
      .text(`TOTAL : ${order.total.toLocaleString()}`)
      .style("NORMAL")
      .text("------------------------------")

      // QRIS QR (opsional)
      .align("CT")
      .qrcode(qrisConfig.staticQrisPath, 6, 1)

      .text("Terima kasih")
      .text("Happy Relaxing ✨")
      .feed(2)
      .cut()
      .close()
  })
}
