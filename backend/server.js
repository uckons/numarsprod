const http = require("http")
const app = require("./app")
const { Server } = require("socket.io")

const server = http.createServer(app)

const io = new Server(server, {
  cors: { origin: "*" }
})

require("./sockets")(io)
require("./sockets/timer.socket")(io)

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log(`🚀 NUMARS POS Backend running on port ${PORT}`)
})
