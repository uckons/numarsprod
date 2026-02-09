const service = require("./timer.service")

exports.start = async (req, res) => {
  try {
    const db = req.app.get("db")

    const {
      order_id,
      service_id,
      therapist_id,
      room_id
    } = req.body

    if (!order_id || !service_id || !therapist_id || !room_id) {
      return res.status(400).json({ message: "Incomplete data" })
    }

    const timer = await service.startTimer(
      db,
      order_id,
      service_id,
      therapist_id,
      room_id
    )

    res.json(timer)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}

exports.getActive = async (req, res) => {
  const db = req.app.get("db")
  const timers = await service.getActiveTimers(db, req.user.branch_id)
  res.json(timers)
}

exports.startTimer = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user

    let branchId = user.branch_id
    if (!branchId && user?.id) {
      const userRes = await db.query(
        "SELECT branch_id FROM users WHERE id=$1",
        [user.id]
      )
      branchId = userRes.rows[0]?.branch_id || null
    }

    if (!branchId) {
      return res.status(400).json({ message: "User belum terikat ke branch" })
    }

    const {
      order_id,
      service_id,
      therapist_id,
      room_id,
      duration_minutes,
      slot
    } = req.body

        // 🔒 VALIDASI MINIMAL
   // if (!service_id || !therapist_id || !room_id || !duration_minutes) {
      if (!service_id || !room_id || !duration_minutes) {
      return res.status(400).json({ message: "Data timer tidak lengkap" })
    }

    // =========================
    // 🆕 1. AMBIL DATA SERVICE     
    // =========================
    const { rows: serviceRows } = await db.query(
      `SELECT
         s.id,
         s.name,
         s.type,
         s.duration_minutes,
         CASE
           WHEN s.type = 'FNB'
             AND fi.is_beverage = true
             AND COALESCE(fi.is_package, false) = false
             AND fi.happy_hour_enabled = true
             AND fi.happy_hour_price IS NOT NULL
             AND hh_active.active = true
           THEN fi.happy_hour_price
           WHEN s.type IN ('SPA', 'LC', 'LOUNGE')
             AND s.happy_hour_enabled = true
             AND s.happy_hour_price IS NOT NULL
             AND hh_active.active = true
           THEN s.happy_hour_price
           ELSE COALESCE(fi.price, s.base_price)
         END AS base_price
       FROM services s
       LEFT JOIN fnb_items fi ON fi.service_id = s.id
       LEFT JOIN LATERAL (
         SELECT true AS active
         FROM happy_hours hh
         WHERE hh.branch_id = s.branch_id
           AND hh.is_active = true
           AND (
             (
               hh.start_time <= hh.end_time
               AND (timezone('Asia/Jakarta', now()))::time BETWEEN hh.start_time AND hh.end_time
             )
             OR (
               hh.start_time > hh.end_time
               AND (
                 (timezone('Asia/Jakarta', now()))::time >= hh.start_time
                 OR (timezone('Asia/Jakarta', now()))::time <= hh.end_time
               )
             )
           )
           AND (
             hh.service_type IS NULL
             OR hh.service_type = s.type::text
             OR hh.service_type = 'ALL'
             OR (hh.service_type = 'LC' AND s.type = 'LOUNGE')
             OR (hh.service_type = 'LOUNGE' AND s.type = 'LC')
           )
         LIMIT 1
       ) hh_active ON true
       WHERE s.id = $1`,
      [service_id]
    )

    if (!serviceRows.length) {
      return res.status(400).json({ message: "Service tidak ditemukan" })
    }

    const service = serviceRows[0]
    const requiresTherapist = service.type !== "LOUNGE"

    if (requiresTherapist && !therapist_id) {
      return res.status(400).json({ message: "Data timer tidak lengkap" })
    }

    // =========================
    // 🔑 2. PASTIKAN ORDER ADA
    // =========================
    let finalOrderId = order_id

    if (!finalOrderId) {
      const { rows } = await db.query(
        `
        INSERT INTO orders
          (branch_id, user_id, status, total)
        VALUES
          ($1, $2, 'DRAFT', 0)
        RETURNING id
        `,
        [branchId, user.id]
      )
      finalOrderId = rows[0].id
    }
    // 🆕 UPDATE ORDER dengan therapist_id & room_id
    await db.query(
      `UPDATE orders 
       SET therapist_id = $1, room_id = $2 
       WHERE id = $3`,
       [therapist_id || null, room_id, finalOrderId] 
    )

    // Check if order_items already exists for this service
    const { rows: existingItems } = await db.query(
      `SELECT id, qty, subtotal 
       FROM order_items 
       WHERE order_id = $1 AND service_id = $2`,
      [finalOrderId, service_id]
    )

    if (existingItems.length === 0) {
      // Create new order_item
      await db.query(
        `
        INSERT INTO order_items
          (order_id, service_id, service_name, qty, price, subtotal)
        VALUES
          ($1, $2, $3, 1, $4, $4)
        `,
        [finalOrderId, service.id, service.name, service.base_price]
      )

      // Update order total
      await db.query(
        `UPDATE orders 
         SET total = total + $1 
         WHERE id = $2`,
        [service.base_price, finalOrderId]
      )
    } else {
      // Item already exists, increment qty (for extend case)
      const newQty = existingItems[0].qty + 1
      const newSubtotal = service.base_price * newQty

      await db.query(
        `UPDATE order_items 
         SET qty = $1, subtotal = $2 
         WHERE id = $3`,
        [newQty, newSubtotal, existingItems[0].id]
      )

      // Update order total
      await db.query(
        `UPDATE orders 
         SET total = total + $1 
         WHERE id = $2`,
        [service.base_price, finalOrderId]
      )
    }

    // =========================
    // 🔒 3. VALIDASI SLOT (JIKA ADA)
    // =========================
    let slot_number = slot ?? null
    if (slot_number !== null) {
      if (slot_number < 1 || slot_number > 30) {
        return res.status(400).json({ message: "Nomor slot harus 1–30" })
      }

      const { rows: used } = await db.query(
        `
        SELECT 1 FROM timers
        WHERE branch_id = $1
          AND slot_number = $2
          AND end_time IS NULL
        `,
        [branchId, slot_number]
      )

      if (used.length) {
        return res.status(400).json({ message: `Slot ${slot_number} sudah terisi` })
      }
    }

    // =========================
    // ⏱️ 4. HITUNG WAKTU
    // =========================
    const start = new Date()
    const plannedEnd = new Date(start.getTime() + duration_minutes * 60000)

    // =========================
    // 🧠 5. INSERT TIMER (LENGKAP)
    // =========================
    const { rows } = await db.query(
      `
      INSERT INTO timers
        (
          order_id,
          therapist_id,
          service_id,
          room_id,
          start_time,
          planned_end_time,
          paused,
          branch_id,
          slot_number,
          status
        )
      VALUES
        ($1,$2,$3,$4,$5,$6,false,$7,$8,'RUNNING')
      RETURNING *
      `,
      [
        finalOrderId,
        therapist_id,
        service_id,
        room_id,
        start,
        plannedEnd,
        branchId,
        slot_number
      ]
    )

    res.json(rows[0])
  } catch (err) {
    console.error("START TIMER ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}

exports.stop = async (req, res) => {
  try {
    const db = req.app.get("db")
    const id = req.params.id

    const timer = await service.stopTimer(db, id)
    res.json(timer)
  } catch (err) {
    console.error(err)
    res.status(400).json({ message: err.message })
  }
}
exports.create = async (req, res) => {
  const db = req.app.get("db")
  const { order_id, service_id, duration_minutes } = req.body
  const branch_id = req.user.branch_id || null

  const start = new Date()
  const end = new Date(start.getTime() + duration_minutes * 60000)

  await db.query(
    `
    INSERT INTO timers
      (order_id, service_id, branch_id, start_time, planned_end_time)
    VALUES
      ($1,$2,$3,$4,$5)
    `,
    [order_id, service_id, branch_id, start, end]
  )

  res.json({ success: true })
}

exports.startManual = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user
    const { order_id, service_id } = req.body

    const { rows } = await db.query(
      `SELECT duration_minutes FROM services WHERE id=$1`,
      [service_id]
    )

    if (!rows.length || !rows[0].duration_minutes) {
      return res.status(400).json({ message: "Service tidak punya durasi" })
    }

    await db.query(
      `
      INSERT INTO timers
        (order_id, service_id, branch_id, start_time, planned_end_time)
      VALUES
        ($1,$2,$3, now(),
         now() + ($4 || ' minutes')::interval)
      `,
      [
        order_id,
        service_id,
        branchId,
        `${rows[0].duration_minutes} minutes`
      ]
    )

    res.json({ success: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err.message })
  }
}

exports.createFromOrder = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { orderId } = req.params
    const user = req.user

    // ambil item order yg punya durasi
    const itemsRes = await db.query(
      `
      SELECT oi.service_id, s.duration_minutes
      FROM order_items oi
      JOIN services s ON s.id = oi.service_id
      WHERE oi.order_id = $1
        AND s.duration_minutes IS NOT NULL
      `,
      [orderId]
    )

    if (!itemsRes.rows.length) {
      return res.json({ success: true, created: 0 })
    }

    let created = 0

    for (const i of itemsRes.rows) {
      const start = new Date()
      const end = new Date(start.getTime() + i.duration_minutes * 60000)

      await db.query(
        `
        INSERT INTO timers
          (order_id, service_id, branch_id, start_time, planned_end_time)
        VALUES
          ($1,$2,$3,$4,$5)
        `,
        [
          orderId,
          i.service_id,
          branchId,
          start,
          end
        ]
      )

      created++
    }

    res.json({ success: true, created })
  } catch (err) {
    console.error("CREATE TIMER ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}

// NEW ENDPOINTS FOR TIMER MODAL

/**
 * GET /api/timers/therapists?branch_id=X&service_type=SPA
 * Fetch active therapists from database
 */
exports.getTherapists = async (req, res) => {
  try {
    const db = req.app.get("db")
    const branch_id = req.query.branch_id || req.user.branch_id
    const service_type = req.query.service_type

    let query = `
      SELECT 
        t.id,
        t.name,
        t.grade_id,
        tg.name AS grade_name
      FROM therapists t
      LEFT JOIN therapist_grades tg ON tg.id = t.grade_id
      WHERE t.active = true
        AND t.branch_id = $1
      ORDER BY t.name ASC
    `

    const { rows } = await db.query(query, [branch_id])
    res.json(rows)
  } catch (err) {
    console.error("GET THERAPISTS ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}

/**
 * GET /api/timers/rooms?branch_id=X&service_type=SPA
 * Fetch available rooms by service type with occupancy status
 */
exports.getRooms = async (req, res) => {
  try {
    const db = req.app.get("db")
    const branch_id = req.query.branch_id || req.user.branch_id
    const service_type = req.query.service_type

    let query = `
      SELECT 
        r.id,
        r.name,
        r.type,
        r.is_active,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM timers t 
            WHERE t.room_id = r.id 
              AND t.end_time IS NULL
          ) THEN true
          ELSE false
        END AS is_occupied
      FROM rooms r
      WHERE r.branch_id = $1
        AND r.is_active = true
    `
    
    const params = [branch_id]
    
    if (service_type) {
       if (service_type === "LOUNGE") {
        query += ` AND r.type IN ('LOUNGE','LC')`
      } else {
        query += ` AND r.type = $2`
        params.push(service_type)
      }
    }
    
    query += ` ORDER BY r.name ASC`

    const { rows } = await db.query(query, params)
    
    // Add status field based on occupancy
    const roomsWithStatus = rows.map(room => ({
      ...room,
      status: room.is_occupied ? 'occupied' : 'available'
    }))
    
    res.json(roomsWithStatus)
  } catch (err) {
    console.error("GET ROOMS ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}

/**
 * GET /api/timers/slots?branch_id=X
 * Fetch 30 permanent timer slots with active timer data merged in
 */
exports.getTimerSlots = async (req, res) => {
  try {
    const db = req.app.get("db")
    const branch_id = req.query.branch_id || req.user.branch_id

    const slots = await service.getTimerSlots(db, branch_id)
    res.json(slots)
  } catch (err) {
    console.error("GET TIMER SLOTS ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}
exports.extendTimer = async (req, res) => {
  const db = req.app.get("db")
  const timerId = req.params.id

  try {
    // 🔹 ambil timer + service + order
    const { rows } = await db.query(
      `
      SELECT 
        t.id,
        t.order_id,
        t.service_id,
        s.duration_minutes,
        s.base_price
      FROM timers t
      JOIN services s ON s.id = t.service_id
      WHERE t.id = $1
      `,
      [timerId]
    )

    if (!rows.length) {
      return res.status(404).json({ message: "Timer tidak ditemukan" })
    }

    const timer = rows[0]

    // 🔹 extend timer
    await db.query(
      `
      UPDATE timers
      SET planned_end_time = planned_end_time + ($1 || ' minutes')::interval
      WHERE id = $2
      `,
      [timer.duration_minutes, timerId]
    )

    // 🔹 update order_items (qty + subtotal)
    await db.query(
      `
      UPDATE order_items
      SET
        qty = qty + 1,
        subtotal = subtotal + $1
      WHERE order_id = $2
        AND service_id = $3
      `,
      [
        timer.base_price,
        timer.order_id,
        timer.service_id
      ]
    )

    // 🔹 update orders.total
    await db.query(
      `
      UPDATE orders
      SET total = total + $1
      WHERE id = $2
      `,
      [timer.base_price, timer.order_id]
    )

    res.json({ success: true })
  } catch (err) {
    console.error("EXTEND TIMER ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}