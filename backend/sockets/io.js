let ioInstance = null

exports.initIO = (io) => {
  ioInstance = io
}

exports.getIO = () => {
  if (!ioInstance) {
    throw new Error("Socket.io not initialized")
  }
  return ioInstance
}
