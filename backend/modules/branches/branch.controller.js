const service = require("./branch.service")

exports.list = async (req, res) => {
  try {
    const data = await service.list(req.user, req.query)
    res.json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Failed load branches" })
  }
}

exports.stats = async (req, res) => {
  const stats = await service.stats()
  res.json(stats)
}

exports.create = async (req, res) => {
  await service.create(req.body)
  res.json({ success: true })
}

exports.update = async (req, res) => {
  await service.update(req.params.id, req.body)
  res.json({ success: true })
}

exports.toggle = async (req, res) => {
  await service.toggle(req.params.id)
  res.json({ success: true })
}
