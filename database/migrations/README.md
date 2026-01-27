# Database Migrations

## How to Apply Migrations

To apply the database migration for the timer modal feature, run the following SQL script against your PostgreSQL database:

```bash
psql -U your_username -d your_database -f 001_add_rooms_and_update_timers.sql
```

Or connect to your database and execute the SQL file:

```sql
\i database/migrations/001_add_rooms_and_update_timers.sql
```

## Migration 001: Timer Modal Enhancement

**File:** `001_add_rooms_and_update_timers.sql`

**Purpose:** Add rooms table and update timers table to support the new timer modal functionality with dropdown selections.

**Changes:**
- Creates `rooms` table with columns: id, branch_id, name, type, is_active, created_at
- Adds columns to `timers` table: service_id, room_id, branch_id, planned_end_time
- Creates index for faster room occupancy lookups
- Seeds sample room data for branches 1 and 2

**Note:** This migration uses `IF NOT EXISTS` clauses to ensure it's safe to run multiple times.
