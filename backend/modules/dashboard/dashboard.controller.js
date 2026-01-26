const service = require("./dashboard.service")

exports.kasir = async (req, res) => {
  const data = await service.kasir(req.user)
  res.json(data)
}
