const service = require("./timer.service")

exports.start = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { order_id, therapist_ids, duration_minutes } = req.body

    if (!order_id || !therapist_ids?.length) {
      throw new Error("order_id & therapist_ids wajib")
    }

    const timers = await service.startTimers(
      db,
      order_id,
      therapist_ids,
      duration_minutes
    )

    res.json(timers)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.pause = async (req, res) => {
  try {
    const db = req.app.get("db")
    const timerId = req.params.id

    const result = await service.pauseTimer(db, timerId)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.resume = async (req, res) => {
  try {
    const db = req.app.get("db")
    const timerId = req.params.id

    const result = await service.resumeTimer(db, timerId)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.extend = async (req, res) => {
  try {
    const db = req.app.get("db")
    const timerId = req.params.id
    const { minutes } = req.body

    const result = await service.extendTimer(db, timerId, minutes)
    res.json(result)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getActive = async (req, res) => {
  const db = req.app.get("db")
  const timers = await service.getActiveTimers(db, req.user)
  res.json(timers)
}
