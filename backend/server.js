require("dotenv").config()

const http = require("http")
const app = require("./app")
const { Server } = require("socket.io")

// 1️⃣ buat http server
const server = http.createServer(app)

// 2️⃣ inisialisasi socket.io
const io = new Server(server, {
  cors: {
    origin: "*"
  }
})

// 3️⃣ LOAD SOCKET MODULE SETELAH io ADA
require("./sockets")(io)
require("./sockets/timer.socket")(io)

// 4️⃣ LISTEN
const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`🚀 NUMARS POS Backend running on port ${PORT}`)
})
