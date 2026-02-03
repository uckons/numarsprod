const express = require("express")
const router = express.Router()
const auth = require("../../middlewares/auth.middleware")
const therapistController = require("./therapist.controller")

router.get("/", auth, therapistController.getTherapists)

module.exports = router