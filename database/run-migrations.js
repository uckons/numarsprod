const path = require("path")
const fs = require("fs")
const { Pool } = require("pg")

const envPath = path.join(__dirname, "../backend/.env")
if (!process.env.DATABASE_URL && fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8")
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith("#")) continue
    const eqIndex = line.indexOf("=")
    if (eqIndex <= 0) continue
    const key = line.slice(0, eqIndex).trim()
    if (process.env[key] !== undefined) continue
    let value = line.slice(eqIndex + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is missing. Set env var or define it in backend/.env")
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function runMigrations() {
  const client = await pool.connect()

  try {
    console.log("🔄 Starting migrations...")

    const migrationsDir = path.join(__dirname, "migrations")
    const files = fs.readdirSync(migrationsDir).sort()

    for (const file of files) {
      if (file.endsWith(".sql")) {
        console.log(`  Running: ${file}`)

        await client.query("BEGIN")
        try {
          const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
          await client.query(sql)
          await client.query("COMMIT")
          console.log(`  ✅ ${file} completed`)
        } catch (err) {
          await client.query("ROLLBACK")
          throw new Error(`Migration ${file} failed: ${err.message}`)
        }
      }
    }

    console.log("✅ All migrations completed successfully")
    process.exit(0)
  } catch (err) {
    console.error("❌ Migration failed:", err)
    process.exit(1)
  } finally {
    client.release()
  }
}

runMigrations()
