const { Pool } = require("pg")

const pool = new Pool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || "numarsbiz",
  password: process.env.DB_PASS || "Rancamaya1212",
  database: process.env.DB_NAME || "numarsbiz",
  max: 10
})

pool.on("connect", () => {
  console.log("✅ PostgreSQL connected")
})

module.exports = pool
