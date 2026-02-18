const service = require("./user.service")

exports.list = async (req, res) => {
  try {
    const users = await service.list(req.user)
    res.json(users)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed load users" })
  }
}

exports.create = async (req, res) => {
  try {
    const result = await service.create(req.body, req.user)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}

exports.update = async (req, res) => {
  try {
    const result = await service.update(
      req.params.id,
      req.body,
      req.user
    )
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}

exports.resetPassword = async (req, res) => {
  try {
    const result = await service.resetPassword(
      req.params.id,
      req.user
    )
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}

exports.toggleActive = async (req, res) => {
  try {
    const result = await service.toggleActive(
      req.params.id,
      req.user
    )
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}

exports.remove = async (req, res) => {
  try {
    const result = await service.remove(
      req.params.id,
      req.user
    )
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}
exports.search = async (req, res) => {
  try {
    const result = await service.search(req.user, req.query)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Search failed" })
  }
}
exports.stats = async (req, res) => {
  try {
    const stats = await service.stats(req.user)
    res.json(stats)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Failed load user stats" })
  }
}


exports.changePassword = async (req, res) => {
  try {
    const result = await service.changePassword(req.user, req.body)
    res.json(result)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}
