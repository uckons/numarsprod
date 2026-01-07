const s = require("./branch.service")

exports.list = async (req, res) => {
  const branches = await s.list(req.user)
  res.json(branches)
}
