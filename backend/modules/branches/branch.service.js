const db = require("../../config/db")

exports.list = async (user) => {
  // SuperAdmin lihat semua cabang
  if (user.role === "SuperAdmin") {
    const { rows } = await db.query(
      "SELECT id, name FROM branches ORDER BY id"
    )
    return rows
  }

  // Role lain hanya cabangnya
  const { rows } = await db.query(
    "SELECT id, name FROM branches WHERE id = $1",
    [user.branch_id]
  )
  return rows
}
