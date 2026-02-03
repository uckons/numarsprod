const service = require("./order.service")

exports.create = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user

    const order = await service.createOrder(db, user)
    res.json(order)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.addItem = async (req, res) => {
  try {
    const db = req.app.get("db")
    const orderId = req.params.id
    const { service_id, qty } = req.body

    const item = await service.addItem(db, orderId, service_id, qty || 1)
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.getAll = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user

    const orders = await service.getOrdersByBranch(db, user)
    res.json(orders)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}

exports.close = async (req, res) => {
  try {
    const db = req.app.get("db")
    const orderId = req.params.id

    const closed = await service.closeOrder(db, orderId)
    res.json(closed)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
}
//exports.createFromPos = async (req, res) => {
//  try {
//  const db = req.app.get("db")  //  🔴 INI YANG HILANG
//  const { items, payment_method, total } = req.body
//  const user_id = req.user.id

//  const order = await db.one(
//    `INSERT INTO orders (user_id, total, payment_method)
//     VALUES ($1,$2,$3) RETURNING id`,
//    [user_id, total, payment_method]
//  )

//  for (const i of items) {
//    await db.none(
//      `INSERT INTO order_items
//       (order_id, service_id, qty, price)
//       VALUES ($1,$2,$3,$4)`,
//      [order.id, i.id, i.qty, i.base_price]
//    )
//  }

//  res.json({ success: true, order_id: order.id })
//  } catch (err) {
//    res.status(400).json({ message: err.message })
//  }
//}
//exports.createFromPos = async (req, res) => {
//  try {
//    const db = req.app.get("db")   // ✅ WAJIB
//    const user = req.user
//    const { items, payment_method, total } = req.body
//    const user_id = req.user.id

//    const orderRes = await db.query(
//      `INSERT INTO orders (branch_id, cashier_id, total, payment_method, status)
//       VALUES ($1,$2,$3,$4,'PAID')
//       RETURNING *`,
//      [user.branch_id, user.id, total, payment_method]
//    )

//    const order = orderRes.rows[0]

//    for (const i of items) {
//      await db.query(
//        `INSERT INTO order_items
//         (order_id, service_id, qty, price)
//         VALUES ($1,$2,$3,$4)`,
//        [order.id, i.id, i.qty, i.base_price]
//      )
//    }

//    res.json({ success: true, order })
//  } catch (err) {
//    console.error(err)
//    res.status(400).json({ message: err.message })
//  }
//}
//exports.createFromPos = async (req, res) => {
//  try {
//    const db = req.app.get("db")
//    const user = req.user

//    if (!user.branch_id) {
//      return res.status(400).json({ message: "User belum terikat ke branch" })
//    }

//    const { items, payment_method, total } = req.body

//    const { rows } = await db.query(
//      `INSERT INTO orders
//        (branch_id, user_id, total, payment_method, status)
//       VALUES ($1, $2, $3, $4, 'PAID')
//       RETURNING id`,
//      [
//        user.branch_id,
//        user.id,
//        total || 0,
//        payment_method || "CASH"
 //     ]
   // )

//    const orderId = rows[0].id

//    for (const i of items) {
//      await db.query(
//        `INSERT INTO order_items
//         (order_id, service_id, qty, price)
//         VALUES ($1, $2, $3, $4)`,
//        [orderId, i.id, i.qty, i.base_price]
//      )
//    }

//    res.json({ success: true, order_id: orderId })
 // } catch (err) {
   // console.error(err)
   // res.status(500).json({ message: err.message })
//  }
//}
//exports.cancel = async (req, res) => {
//  try {
//    const db = req.app.get("db")
//    const orderId = req.params.id

//    await db.query(
//      `DELETE FROM order_items WHERE order_id=$1`,
//      [orderId]
//    )

//    await db.query(
//      `DELETE FROM orders WHERE id=$1`,
//      [orderId]
//    )

//    res.json({ success: true })
//  } catch (err) {
//    res.status(400).json({ message: err.message })
//  }
//}
exports.cancel = async (req, res) => {
  const db = req.app.get("db")
  const { id } = req.params

  await db.query(
    "UPDATE orders SET status='CANCELLED' WHERE id=$1",
    [id]
  )

  res.json({ success: true })
}


exports.createFromPos = async (req, res) => {
  try {
    const db = req.app.get("db")
    const user = req.user
    const { items, payment_method } = req.body

    // 1️⃣ ambil branch
    const userRes = await db.query(
      "SELECT branch_id FROM users WHERE id=$1",
      [user.id]
    )

    if (!userRes.rows[0]?.branch_id) {
      return res.status(400).json({ message: "User belum terikat ke branch" })
    }

    const branchId = userRes.rows[0].branch_id

    // 2️⃣ validasi
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Item kosong" })
    }

    // 3️⃣ create order (DRAFT)
    const orderRes = await db.query(
      `
      INSERT INTO orders
        (branch_id, user_id, status, payment_method, total)
      VALUES
        ($1,$2,'DRAFT',$3,0)
      RETURNING id
      `,
      [branchId, user.id, payment_method || "CASH"]
    )

    const orderId = orderRes.rows[0].id
    let total = 0

    // 4️⃣ loop item (SATU KALI SAJA)
    for (const i of items) {
      // ambil service dari DB (WAJIB)
      const svcRes = await db.query(
        `
        SELECT id, name, base_price, duration_minutes
        FROM services
        WHERE id=$1
        `,
        [i.id]
      )

      if (!svcRes.rows.length) {
        throw new Error("Service tidak ditemukan")
      }

      const svc = svcRes.rows[0]
      const qty = Number(i.qty || 1)
      const unitPrice = Number(svc.base_price)
      const subtotal = unitPrice * qty

      total += subtotal

      // insert order_items
      await db.query(
        `
        INSERT INTO order_items
          (order_id, service_id, service_name, qty, price, subtotal)
        VALUES
          ($1,$2,$3,$4,$5,$6)
        `,
        [orderId, svc.id, svc.name, qty, unitPrice, subtotal]
      )

      // ⏱️ AUTO TIMER (SPA / LC / SERVICE BERDURASI)
      if (svc.duration_minutes && svc.duration_minutes > 0) {
        await db.query(
          `
          INSERT INTO timers
            (order_id, service_id, branch_id, start_time, planned_end_time)
          VALUES
            ($1,$2,$3, now(),
             now() + ($4 || ' minutes')::interval)
          `,
          [
            orderId,
            svc.id,
            branchId,
            `${svc.duration_minutes} minutes`
          ]
        )
      }
    }

    // 5️⃣ update total
    await db.query(
      "UPDATE orders SET total=$1 WHERE id=$2",
      [total, orderId]
    )

    res.json({
      success: true,
      order_id: orderId,
      total
    })
  } catch (err) {
    console.error("CREATE POS ORDER ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}
exports.getKasirOrders = async (req, res) => {
  try {
    const db = req.app.get("db")
    const branchId = req.user.branch_id

    const { rows } = await db.query(`
      SELECT
        o.id,
        o.status,
        o.created_at,
        o.total,

        json_agg(
          DISTINCT jsonb_build_object(
            'service_id', oi.service_id,
            'service_name', oi.service_name,
            'qty', oi.qty,
            'subtotal', oi.subtotal,
            'therapist_name', oi.therapist_name,
            'room_name', oi.room_name
          )
        ) FILTER (WHERE oi.id IS NOT NULL) AS items

      FROM orders o
      LEFT JOIN order_items oi ON oi.order_id = o.id

      WHERE o.branch_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `, [branchId])

    res.json(rows)
  } catch (err) {
    console.error("GET KASIR ORDERS ERROR:", err)
    res.status(500).json({ message: err.message })
  }
}


