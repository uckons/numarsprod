module.exports = (io) => {
  io.on("connection", socket => {

    socket.on("timer:start", data => {
      io.emit("timer:update", data)
    })

    socket.on("timer:pause", data => {
      io.emit("timer:paused", data)
    })

    socket.on("timer:resume", data => {
      io.emit("timer:resumed", data)
    })

    socket.on("timer:extend", data => {
      io.emit("timer:extended", data)
    })

  })
}
