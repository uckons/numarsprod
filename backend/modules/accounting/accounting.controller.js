const service = require("./accounting.service")

exports.closeShift = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user
    const { total_cash } = req.body

    if (total_cash === undefined) {
      throw new Error("total_cash wajib")
    }

    const result = await service.closeShift(db, user, total_cash)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getEntries = async (req, res) => {
  const db = req.app.get("db")
  const entries = await service.getEntries(db, req.user)
  res.json(entries)
}
