const db = require("../../config/db")

exports.list = async () => {
  const { rows } = await db.query(`
    SELECT id, name
    FROM roles
    ORDER BY id
  `)
  return rows
}
