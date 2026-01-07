const s = require("./role.service")

exports.list = async (req, res) => {
  const roles = await s.list()
  res.json(roles)
}
