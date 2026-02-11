const roleRoom = (branchId, role = "") => `branch:${branchId}:role:${String(role).toLowerCase().replace(/\s+/g, "-")}`

module.exports = (io) => {
  io.on("connection", socket => {
    socket.on("join-branch", payload => {
      const branchId = Number(payload?.branch_id)
      if (!branchId) return

      socket.join(`branch:${branchId}`)

      if (payload?.role) {
        socket.join(roleRoom(branchId, payload.role))
      }

      if (payload?.user_id) {
        socket.join(`user:${payload.user_id}`)
      }
    })

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
