const service = require("./report.service")

exports.cashflow = async (req, res) => {
  const db = req.app.get("db")
  const result = await service.cashflow(db, req.user)
  res.json(result)
}

exports.profitLoss = async (req, res) => {
  const db = req.app.get("db")
  const result = await service.profitLoss(db, req.user)
  res.json(result)
}
