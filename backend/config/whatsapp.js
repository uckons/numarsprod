module.exports = {
  apiUrl: process.env.WHATSAPP_API_URL,
  token: process.env.WHATSAPP_TOKEN,
  phoneId: process.env.WHATSAPP_PHONE_ID,

  sendMessage: async (to, message) => {
    // stub resmi – akan dipakai modul stock & laporan
    console.log(`📲 WhatsApp to ${to}: ${message}`)
  }
}
