const service = require("./dashboard.service")

exports.ownerSummary = async (req, res) => {
  try {
    const data = await service.getOwnerSummary(req.user.branch_id)
    res.json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Dashboard summary error" })
  }
}

exports.ownerDaily = async (req, res) => {
  try {
    const data = await service.getOwnerDaily(req.user.branch_id)
    res.json(data)
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Dashboard daily error" })
  }
}
