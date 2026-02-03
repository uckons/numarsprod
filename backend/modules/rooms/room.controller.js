exports.getRooms = async (req, res) => {
  try {
    const db = req.app.get("db")
    const branchId = req.user.branch_id

    const { rows } = await db.query(`
      SELECT id, name
      FROM rooms
      WHERE branch_id = $1
      ORDER BY name ASC
    `, [branchId])

    res.json(rows)
  } catch (err) {
    console.error("GET ROOMS ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}
