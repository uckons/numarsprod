const path = require("path")
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") })
const { Pool } = require("pg")
const fs = require("fs")

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
        
        await client.query('BEGIN')
        try {
          const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8")
          await client.query(sql)
          await client.query('COMMIT')
          console.log(`  ✅ ${file} completed`)
        } catch (err) {
          await client.query('ROLLBACK')
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
