import { io } from "socket.io-client"

//const socket = io(import.meta.env.VITE_API_URL || "http://localhost:4000")
//export default socket
//export default socket
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin

export const socket = io(SOCKET_URL, {
  transports: ["websocket"],
})
export default socket
