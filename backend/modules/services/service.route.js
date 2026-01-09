const router = require("express").Router()
const auth = require("../../middlewares/auth.middleware")
const svc = require("./service.service")

router.use(auth)

router.get("/", async (req,res) => {
  const data = await svc.list(req.user.branch_id)
  res.json(data)
})

router.post("/", async (req,res) => {
  res.json(await svc.create(req.body, req.user))
})

router.put("/:id", async (req,res) => {
  res.json(await svc.update(req.params.id, req.body))
})

router.put("/:id/toggle", async (req,res) => {
  res.json(await svc.toggle(req.params.id))
})

router.delete("/:id", async (req,res) => {
  res.json(await svc.remove(req.params.id))
})

module.exports = router
