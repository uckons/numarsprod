require("dotenv").config()

const http = require("http")
const app = require("./app")
const { Server } = require("socket.io")
const { Pool } = require("pg")

/* =========================
   🔥 INIT DATABASE
========================= */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.connect()
  .then(() => console.log("✅ PostgreSQL connected"))
  .catch(err => {
    console.error("❌ PostgreSQL connection failed", err)
    process.exit(1)
  })

// 🔥 INJECT DB KE EXPRESS (INI YANG KEMARIN HILANG)
app.set("db", pool)

/* =========================
   HTTP + SOCKET
========================= */

// 1️⃣ buat http server
const server = http.createServer(app)

// 2️⃣ inisialisasi socket.io
const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

// 3️⃣ LOAD SOCKET MODULE
require("./sockets/timer.socket")(io)

/* =========================
   LISTEN
========================= */
const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`🚀 NUMARS POS Backend running on port ${PORT}`)
})
