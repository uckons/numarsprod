const normalizeRole = (role) =>
  String(role || "")
    .toLowerCase()
    .replace(/\s+/g, "")

module.exports = (allowedRoles = []) => {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]
  const normalizedAllowed = roles.map(normalizeRole)

  return (req, res, next) => {
  //  if (!req.user || !allowedRoles.includes(req.user.role)) {
      const userRole = normalizeRole(req.user?.role)
      if (!req.user || !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ message: "Forbidden" })
    }
    next()
  }
}
