const service = require("./happy-hour.service")

exports.list = async (req, res) => {
  try {
    const branchId = req.user.branch_id
    if (!branchId) {
      return res.status(400).json({ message: "User belum terikat ke branch" })
    }
    const rows = await service.listByBranch(branchId)
    res.json(rows)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.upsert = async (req, res) => {
  try {
    const branchId = req.user.branch_id
    const serviceType = req.params.service_type
    if (!branchId) {
      return res.status(400).json({ message: "User belum terikat ke branch" })
    }
    if (!serviceType) {
      return res.status(400).json({ message: "Service type is required" })
    }
    const result = await service.upsert(branchId, serviceType, req.body)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}