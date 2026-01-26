const service = require("./order.service")

exports.create = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user

    const order = await service.createOrder(db, user)
    res.json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.addItem = async (req, res) => {
  try {
    const db = req.app.get("db")
    const orderId = req.params.id
    const { service_id, qty } = req.body

    const item = await service.addItem(db, orderId, service_id, qty || 1)
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getAll = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user

    const orders = await service.getOrdersByBranch(db, user)
    res.json(orders)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.close = async (req, res) => {
  try {
    const db = req.app.get("db")
    const orderId = req.params.id

    const closed = await service.closeOrder(db, orderId)
    res.json(closed)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
