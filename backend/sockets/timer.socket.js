module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⏱️ Client connected:", socket.id)

    socket.on("join-branch", (branchId) => {
      socket.join(`branch-${branchId}`)
      console.log("Joined branch:", branchId)
    })

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id)
    })
  })
}
