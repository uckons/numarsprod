const jwt = require("jsonwebtoken")

module.exports = (req, res, next) => {
  const header = req.headers.authorization
  if (!header) {
    return res.status(401).json({ message: "Authorization header missing" })
  }

  const token = header.replace("Bearer ", "")
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "NUMARS_SUPER_SECRET"
    )
    req.user = decoded
    next()
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" })
  }
}
