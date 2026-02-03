const express = require("express")
const router = express.Router()
const auth = require("../../middlewares/auth.middleware")
const roomController = require("./room.controller")

router.get("/", auth, roomController.getRooms)

module.exports = router