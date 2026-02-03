const express = require("express")
const router = express.Router()
const controller = require("./therapist.controller")
const auth = require("../../middlewares/auth.middleware")

// 📋 GET ALL GRADES
router.get("/", auth, controller.getGrades)

// ✅ CREATE GRADE
router.post("/", auth, controller.createGrade)

// ✏️ UPDATE GRADE
router.put("/:id", auth, controller.updateGrade)

// ❌ DELETE GRADE
router.delete("/:id", auth, controller.deleteGrade)

module.exports = router