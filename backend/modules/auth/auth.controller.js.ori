const service = require("./auth.service")

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      return res.status(400).json({ message: "Phone & password required" })
    }

    const result = await service.login(
      req.app.get("db"),
      phone,
      password
    )

    res.json(result)
  } catch (err) {
    res.status(401).json({ message: err.message })
  }
}
