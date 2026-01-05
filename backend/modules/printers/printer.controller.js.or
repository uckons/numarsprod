const service = require("./printer.service")

exports.printReceipt = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { order_id } = req.body

    if (!order_id) {
      throw new Error("order_id wajib")
    }

    await service.printOrderReceipt(db, order_id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
