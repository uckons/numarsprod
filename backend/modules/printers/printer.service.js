const axios = require("axios")
const escpos = require("escpos")
escpos.USB = require("escpos-usb")

const THERMAL_PROFILE = {
  lineFeedMode: "LF",
  maxDots: 128,
  font: "A_12x24",
  codePage: 0, // CP437
  heatTimeUs: 550,
  heatIntervalUs: 20
}

const toHeatTimeUnit = (microseconds) => {
  const units = Math.round(Number(microseconds || 0) / 10)
  return Math.max(3, Math.min(255, units))
}

const toHeatIntervalUnit = (microseconds) => {
  const units = Math.round(Number(microseconds || 0) / 10)
  return Math.max(0, Math.min(255, units))
}

const buildReceiptPayload = (order) => ({
  profile: THERMAL_PROFILE,
  receipt: {
    title: "NUMARS POS",
    divider: "------------------------",
    items: (order.items || []).map((item) => ({
      service_name: item.service_name,
      qty: Number(item.qty || 0),
      subtotal: Number(item.subtotal || 0),
      therapist_name: item.therapist_name || null
    })),
    total: Number(order.total || 0),
    printed_at: new Date().toLocaleString("id-ID")
  }
})

const printViaUsb = async (order) => {
  const device = new escpos.USB()
  const printer = new escpos.Printer(device)

  return new Promise((resolve, reject) => {
    device.open((err) => {
      if (err) return reject(err)

      printer
        .raw(Buffer.from([0x1b, 0x40])) // ESC @ Initialize
        .raw(Buffer.from([
          0x1b,
          0x37,
          Math.max(0, Math.min(255, THERMAL_PROFILE.maxDots - 1)),
          toHeatTimeUnit(THERMAL_PROFILE.heatTimeUs),
          toHeatIntervalUnit(THERMAL_PROFILE.heatIntervalUs)
        ]))
        .raw(Buffer.from([0x1b, 0x74, THERMAL_PROFILE.codePage]))
        .raw(Buffer.from([0x1b, 0x21, 0x00]))
        .raw(Buffer.from([0x1b, 0x20, 0x00]))
        .raw(Buffer.from([0x1b, 0x33, 30]))
        .align("CT")
        .size(1, 1)
        .text("NUMARS POS")
        .text("------------------------")
        .align("LT")

      ;(order.items || []).forEach((item) => {
        printer.text(`${item.service_name} x${item.qty}`)
        if (item.therapist_name) {
          printer.text(`  Terapis: ${item.therapist_name}`)
        }
        printer.text(`Rp ${Number(item.subtotal).toLocaleString("id-ID")}`)
      })

      printer
        .text("------------------------")
        .style("B")
        .text(`TOTAL : Rp ${Number(order.total).toLocaleString("id-ID")}`)
        .text("")
        .text(new Date().toLocaleString("id-ID"))
        .cut()
        .raw(Buffer.from([0x0a]))
        .close()

      resolve({ mode: "usb" })
    })
  })
}

const printViaAgent = async ({ order, agentUrl, token }) => {
  const payload = buildReceiptPayload(order)
  const headers = token ? { "x-print-agent-token": token } : {}

  await axios.post(`${agentUrl.replace(/\/$/, "")}/print/receipt`, payload, {
    headers,
    timeout: 15000
  })

  return { mode: "agent", agent_url: agentUrl }
}



const buildReceiptPlainText = (order) => {
  const lines = []
  lines.push("NUMARS POS")
  lines.push("------------------------")

  ;(order.items || []).forEach((item) => {
    lines.push(`${item.service_name} x${item.qty}`)
    if (item.therapist_name) {
      lines.push(`  Terapis: ${item.therapist_name}`)
    }
    lines.push(`Rp ${Number(item.subtotal).toLocaleString("id-ID")}`)
  })

  lines.push("------------------------")
  lines.push(`TOTAL : Rp ${Number(order.total || 0).toLocaleString("id-ID")}`)
  lines.push("")
  lines.push(new Date().toLocaleString("id-ID"))

  // GS V 0 (full cut) at the end
  return `${lines.join("\n")}\n\n\x1dV\x00`
}

const printViaPrintNode = async ({ order, apiKey, printerId }) => {
  if (!apiKey) {
    throw new Error("PRINTNODE_API_KEY belum di-set")
  }
  if (!printerId) {
    throw new Error("PRINTNODE_PRINTER_ID belum di-set")
  }

  const raw = buildReceiptPlainText(order)
  const content = Buffer.from(raw, "binary").toString("base64")
  const auth = Buffer.from(`${apiKey}:`).toString("base64")

  await axios.post(
    "https://api.printnode.com/printjobs",
    {
      printerId: Number(printerId),
      title: `NUMARS POS ${order.id || ""}`.trim(),
      contentType: "raw_base64",
      content,
      source: "numars-pos"
    },
    {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json"
      },
      timeout: 15000
    }
  )

  return { mode: "printnode", printer_id: Number(printerId) }
}

exports.printOrder = async ({ order, printer = {} }) => {
  const printMode = printer.mode || process.env.PRINT_PROVIDER || "agent_or_usb"

  if (printMode === "printnode") {
    return printViaPrintNode({
      order,
      apiKey: printer.printnode_api_key || process.env.PRINTNODE_API_KEY,
      printerId: printer.printnode_printer_id || process.env.PRINTNODE_PRINTER_ID
    })
  }

  const envAgentUrl = process.env.PRINT_AGENT_URL
  const agentUrl = printer.agent_url || envAgentUrl

  if (agentUrl) {
    return printViaAgent({
      order,
      agentUrl,
      token: printer.agent_token || process.env.PRINT_AGENT_TOKEN
    })
  }

  return printViaUsb(order)
}
