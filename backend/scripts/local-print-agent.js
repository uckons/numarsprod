const express = require('express')
const escpos = require('escpos')
escpos.USB = require('escpos-usb')

const app = express()
app.use(express.json({ limit: '1mb' }))

const PORT = Number(process.env.PRINT_AGENT_PORT || 19000)
const AUTH_TOKEN = process.env.PRINT_AGENT_TOKEN || ''

const ensureAuth = (req, res, next) => {
  if (!AUTH_TOKEN) return next()
  if (req.headers['x-print-agent-token'] !== AUTH_TOKEN) {
    return res.status(401).json({ message: 'invalid print agent token' })
  }
  next()
}

const toHeatTimeUnit = (microseconds) => {
  const units = Math.round(Number(microseconds || 0) / 10)
  return Math.max(3, Math.min(255, units))
}

const toHeatIntervalUnit = (microseconds) => {
  const units = Math.round(Number(microseconds || 0) / 10)
  return Math.max(0, Math.min(255, units))
}

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'local-print-agent' })
})

app.post('/print/receipt', ensureAuth, (req, res) => {
  const profile = req.body?.profile || {}
  const receipt = req.body?.receipt || {}

  const device = new escpos.USB()
  const printer = new escpos.Printer(device)

  device.open((err) => {
    if (err) {
      return res.status(500).json({ message: err.message })
    }

    const maxDots = Number(profile.maxDots || 128)
    const heatTimeUs = Number(profile.heatTimeUs || 550)
    const heatIntervalUs = Number(profile.heatIntervalUs || 20)
    const codePage = Number(profile.codePage || 0)

    printer
      .raw(Buffer.from([0x1b, 0x40]))
      .raw(Buffer.from([
        0x1b,
        0x37,
        Math.max(0, Math.min(255, maxDots - 1)),
        toHeatTimeUnit(heatTimeUs),
        toHeatIntervalUnit(heatIntervalUs)
      ]))
      .raw(Buffer.from([0x1b, 0x74, codePage]))
      .raw(Buffer.from([0x1b, 0x21, 0x00]))
      .raw(Buffer.from([0x1b, 0x20, 0x00]))
      .raw(Buffer.from([0x1b, 0x33, 30]))
      .align('CT')
      .size(1, 1)
      .text(receipt.title || 'NUMARS POS')
      .text(receipt.divider || '------------------------')
      .align('LT')

    ;(receipt.items || []).forEach((item) => {
      printer.text(`${item.service_name} x${item.qty}`)
      if (item.therapist_name) {
        printer.text(`  Terapis: ${item.therapist_name}`)
      }
      printer.text(`Rp ${Number(item.subtotal).toLocaleString('id-ID')}`)
    })

    printer
      .text(receipt.divider || '------------------------')
      .style('B')
      .text(`TOTAL : Rp ${Number(receipt.total || 0).toLocaleString('id-ID')}`)
      .text('')
      .text(receipt.printed_at || new Date().toLocaleString('id-ID'))
      .cut()
      .raw(Buffer.from([0x0a]))
      .close()

    res.json({ success: true })
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[local-print-agent] listening on :${PORT}`)
})
