const printerService = require("./printer.service")

exports.printOrder = async (req, res) => {
  try {
    const db = req.app.get("db")
    const { order_id, printer } = req.body

    if (!order_id) {
      return res.status(400).json({ message: "order_id required" })
    }

    // 🔹 ambil order (detail lengkap untuk layout receipt enterprise)
    const orderRes = await db.query(
      `
      SELECT
        o.id,
        o.total,
        o.payment_method,
        o.created_at,
        b.name AS branch_name,
        b.address AS branch_address,
        b.phone AS branch_phone,
        b.logo_url AS branch_logo_url,
        u.name AS cashier_name,
        r.name AS room_name,
        ot.therapist_name
      FROM orders o
      LEFT JOIN branches b ON b.id = o.branch_id
      LEFT JOIN users u ON u.id = o.user_id
      LEFT JOIN rooms r ON r.id = o.room_id
      LEFT JOIN LATERAL (
        SELECT string_agg(DISTINCT oi2.therapist_name, ', ' ORDER BY oi2.therapist_name) AS therapist_name
        FROM order_items oi2
        WHERE oi2.order_id = o.id
          AND oi2.therapist_name IS NOT NULL
          AND oi2.therapist_name <> ''
      ) ot ON true
      WHERE o.id = $1
      `,
      [order_id]
    )

    if (!orderRes.rows.length) {
      return res.status(404).json({ message: "Order not found" })
    }

    const order = orderRes.rows[0]

    // 🔹 ambil items
    const itemsRes = await db.query(
      `
      SELECT service_name, qty, subtotal, therapist_name
      FROM order_items
      WHERE order_id = $1
      `,
      [order_id]
    )

    order.items = itemsRes.rows
    order.payment_amount = Number(order.total || 0)
    order.change_amount = 0

    // 🔹 PRINT
    await printerService.printOrder({ order, printer })

    res.json({ success: true })
  } catch (err) {
    console.error("PRINT ERROR:", err)
    res.status(500).json({
      message: err.message,
      hint: "Cek koneksi VPS -> print agent. Gunakan endpoint /api/printers/test-agent untuk diagnosa cepat."
    })
  }
}


exports.testAgent = async (req, res) => {
  try {
    const printer = req.body?.printer || {}
    const agentUrl = printer.agent_url || process.env.PRINT_AGENT_URL
    const token = printer.agent_token || process.env.PRINT_AGENT_TOKEN

    const result = await printerService.testAgentConnection({
      agentUrl,
      token
    })

    res.json(result)
  } catch (err) {
    console.error("AGENT TEST ERROR:", err)
    res.status(500).json({
      message: err.message,
      hint: "Pastikan PRINT_AGENT_URL mengarah ke IP WireGuard kasir dan endpoint /health bisa diakses dari VPS."
    })
  }
}


exports.testAgentPrint = async (req, res) => {
  try {
    const printer = req.body?.printer || {}
    const agentUrl = printer.agent_url || process.env.PRINT_AGENT_URL
    const token = printer.agent_token || process.env.PRINT_AGENT_TOKEN
    const printerName = printer.agent_printer_name || process.env.PRINT_AGENT_PRINTER

    const result = await printerService.testAgentPrint({
      agentUrl,
      token,
      printerName
    })

    res.json(result)
  } catch (err) {
    console.error("AGENT TEST PRINT ERROR:", err)
    res.status(500).json({
      message: err.message,
      hint: "Gunakan /api/printers/test-agent untuk cek konektivitas dan /printers endpoint di agent untuk cek nama printer."
    })
  }
}

exports.agentDiagnostics = async (req, res) => {
  try {
    const printer = req.body?.printer || {}
    const agentUrl = printer.agent_url || process.env.PRINT_AGENT_URL
    const token = printer.agent_token || process.env.PRINT_AGENT_TOKEN

    const result = await printerService.getAgentDiagnostics({
      agentUrl,
      token
    })

    res.json(result)
  } catch (err) {
    console.error("AGENT DIAGNOSTICS ERROR:", err)
    res.status(500).json({
      message: err.message,
      hint: "Pastikan endpoint /health dan /printers di print agent bisa diakses dari VPS."
    })
  }
}
