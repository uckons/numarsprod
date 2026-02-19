const service = require("./service.service")

const canAccessAllBranches = (role = "") => ["SuperAdmin", "Manager", "Owner"].includes(String(role))

exports.list = async (req, res) => {
  try {
    const role = req.user?.role
    const branch_id = canAccessAllBranches(role) ? req.query.branch_id : req.user?.branch_id
    const data = await service.list({
      ...req.query,
      branch_id
    })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed load services" })
  }
}
//tambahan
exports.create = async (req, res) => {
  try {
    await service.create(req.body, req.user)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}

exports.update = async (req, res) => {
  try {
    await service.update(req.params.id, req.body)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ message: "Update failed" })
  }
}

exports.toggle = async (req, res) => {
  try {
    await service.toggle(req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(400).json({ message: "Toggle failed" })
  }
}
//Tambahan
exports.remove = async (req, res) => {
  try {
    await service.remove(req.params.id)
    res.json({ success: true })
  } catch (e) {
    res.status(400).json({ message: e.message })
  }
}
//tambahan
exports.cloneFromPondokIndah = async (req, res) => {
  try {
    const { target_branch_id } = req.body

    if (!target_branch_id) {
      return res.status(400).json({ message: "target_branch_id required" })
    }

    const result = await service.cloneFromBranch(
      1, // Pondok Indah
      target_branch_id,
      req.user
    )

    res.json({
      message: "Services cloned successfully",
      ...result
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}
//TAMBAHAN
exports.toggleStatus = async (req, res) => {
  try {
    const { id } = req.params
    const result = await service.toggleStatus(id)
    res.json({ success: true, data: result })
  } catch (e) {
    console.error(e)
    res.status(500).json({ message: "Toggle failed" })
  }
}

/**
 * GET /api/services/by-type?type=SPA&branch_id=X
 * Fetch services by type to get duration_minutes
 */
exports.getByType = async (req, res) => {
  try {
    const role = req.user?.role
    const branch_id = canAccessAllBranches(role)
      ? (req.query.branch_id || req.user.branch_id)
      : req.user.branch_id
    const type = req.query.type

    if (!type) {
      return res.status(400).json({ message: "type parameter is required" })
    }

    const data = await service.list({ branch_id, type })
    res.json(data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed to load services" })
  }
}
