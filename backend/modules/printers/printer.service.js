const escpos = require("escpos")
escpos.USB = require("escpos-usb")

exports.printOrder = async (order) => {
  const device = new escpos.USB()
  const printer = new escpos.Printer(device)

  return new Promise((resolve, reject) => {
    device.open(err => {
      if (err) return reject(err)

      printer
        .align("CT")
        .style("B")
        .size(1,1)
        .text("NUMARS POS")
        .text("------------------------")
        .align("LT")

      order.items.forEach(i => {
        printer.text(`${i.service_name} x${i.qty}`)
        if (i.therapist_name) {
          printer.text(`  Terapis: ${i.therapist_name}`)
        }
        printer.text(`Rp ${Number(i.subtotal).toLocaleString("id-ID")}`)
      })

      printer
        .text("------------------------")
        .style("B")
        .text(`TOTAL : Rp ${Number(order.total).toLocaleString("id-ID")}`)
        .text("")
        .text(new Date().toLocaleString("id-ID"))
        .cut()
        .close()

      resolve(true)
    })
  })
}
