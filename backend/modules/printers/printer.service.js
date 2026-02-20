const escpos = require("escpos")
escpos.USB = require("escpos-usb")

const THERMAL_PROFILE = {
  lineFeedMode: "LF",
  maxDots: 128,
  font: "A_12x24",
  codePage: 0, // CP437
  heatTimeUs: 550,
  heatIntervalUs: 20
}

const toHeatTimeUnit = (microseconds) => {
  const units = Math.round(Number(microseconds || 0) / 10)
  return Math.max(3, Math.min(255, units))
}

const toHeatIntervalUnit = (microseconds) => {
  const units = Math.round(Number(microseconds || 0) / 10)
  return Math.max(0, Math.min(255, units))
}

exports.printOrder = async (order) => {
  const device = new escpos.USB()
  const printer = new escpos.Printer(device)

  return new Promise((resolve, reject) => {
    device.open(err => {
      if (err) return reject(err)

      printer
        .raw(Buffer.from([0x1b, 0x40])) // ESC @ Initialize
        // ESC 7 n1 n2 n3: heating control (max dots, heat time, interval)
        .raw(Buffer.from([
          0x1b,
          0x37,
          Math.max(0, Math.min(255, THERMAL_PROFILE.maxDots - 1)),
          toHeatTimeUnit(THERMAL_PROFILE.heatTimeUs),
          toHeatIntervalUnit(THERMAL_PROFILE.heatIntervalUs)
        ]))
        .raw(Buffer.from([0x1b, 0x74, THERMAL_PROFILE.codePage])) // ESC t n : CP437
        .raw(Buffer.from([0x1b, 0x21, 0x00])) // ESC ! n : Font A 12x24, normal
        .raw(Buffer.from([0x1b, 0x20, 0x00])) // ESC SP n : right spacing 0
        .raw(Buffer.from([0x1b, 0x33, 30])) // ESC 3 n : line spacing default 30
        .align("CT")
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
        .raw(Buffer.from([0x0a])) // LF
        .close()

      resolve(true)
    })
  })
}
