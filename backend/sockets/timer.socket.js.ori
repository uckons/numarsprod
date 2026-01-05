module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⏱️  Timer socket connected:", socket.id)

    socket.on("timer:update", (data) => {
      io.emit("timer:update", data)
    })

    socket.on("timer:pause", (data) => {
      io.emit("timer:pause", data)
    })

    socket.on("timer:resume", (data) => {
      io.emit("timer:resume", data)
    })

    socket.on("disconnect", () => {
      console.log("❌ Timer socket disconnected:", socket.id)
    })
  })
}
