const axios = require("axios")

exports.sendStockAlert = async ({ product, qty }) => {
  await axios.post(
    "https://graph.facebook.com/v19.0/YOUR_PHONE_ID/messages",
    {
      messaging_product: "whatsapp",
      to: process.env.WA_OWNER_NUMBER,
      type: "text",
      text: {
        body:
`⚠️ STOCK ALERT

Produk: ${product}
Sisa: ${qty}

Segera restock!`
      }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.WA_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  )
}
