//const service = require("./printer.service")

//exports.printOrder = async (req, res) => {
//  const { order_id, printer } = req.body
//
//  try {
 //   await service.printReceipt({ order_id, printer })
 //   res.json({ message: "Print success" })
 // } catch (err) {
 //   console.error(err)
 //   res.status(500).json({ message: "Print failed" })
 // }
//}
const service = require("./printer.service")

exports.reprint = async (req, res) => {
  try {
    const { order_id } = req.params

    await service.printOrder(order_id, {
      reprint: true,
      user: req.user
    })

    res.json({
      success: true,
      message: "Struk berhasil dicetak ulang"
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      message: "Gagal reprint struk"
    })
  }
}
