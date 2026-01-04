const service = require("./fnb.service")

exports.getAll = async (req, res) => {
  const db = req.app.get("db")
  const items = await service.getAll(db, req.user)
  res.json(items)
}

exports.create = async (req, res) => {
  try {
    const db = req.app.get("db")
    const item = await service.create(db, req.user, req.body)
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const db = req.app.get("db")
    const item = await service.update(db, req.params.id, req.body)
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
