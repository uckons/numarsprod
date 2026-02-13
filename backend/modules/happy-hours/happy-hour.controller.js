const service = require("./happy-hour.service")

const resolveBranchId = (req) => {
  const role = String(req.user?.role || "")
  const privileged = ["SuperAdmin", "Manager", "Owner"].includes(role)

  const queryBranch = Number(req.query?.branch_id)
  const bodyBranch = Number(req.body?.branch_id)

  if (privileged) {
    if (Number.isInteger(queryBranch) && queryBranch > 0) return queryBranch
    if (Number.isInteger(bodyBranch) && bodyBranch > 0) return bodyBranch
  }

  const userBranch = Number(req.user?.branch_id)
  return Number.isInteger(userBranch) && userBranch > 0 ? userBranch : null
}

exports.list = async (req, res) => {
  try {
    const branchId = resolveBranchId(req)
    if (!branchId) {
      return res.status(400).json({ message: "Branch belum dipilih" })
    }
    const rows = await service.listByBranch(branchId)
    res.json(rows)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.upsert = async (req, res) => {
  try {
    const branchId = resolveBranchId(req)
    const serviceType = req.params.service_type
    if (!branchId) {
      return res.status(400).json({ message: "Branch belum dipilih" })
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
