const service = require("./revert.service")

exports.revert = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { order_id, reason } = req.body

    if (!order_id || !reason) {
      throw new Error("order_id & reason wajib")
    }

    const result = await service.revertPayment(db, order_id, reason)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
