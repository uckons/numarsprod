const { createClient } = require("redis")

const client = createClient({
  url: `redis://${process.env.REDIS_HOST || "127.0.0.1"}:${process.env.REDIS_PORT || 6379}`
})

client.on("connect", () => console.log("✅ Redis connected"))
client.on("error", err => console.error("❌ Redis error", err))

client.connect()

module.exports = client
