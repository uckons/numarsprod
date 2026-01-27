# Timer Modal Flow - Before and After

## BEFORE (Hardcoded Values)

```
┌─────────────────────────────────────┐
│     StartTimerModal.vue             │
│  ┌───────────────────────────────┐  │
│  │ Service Type: [SPA ▼]         │  │  ← Hardcoded: SPA or LC
│  ├───────────────────────────────┤  │
│  │ Therapist: [________]         │  │  ← Manual text input
│  ├───────────────────────────────┤  │
│  │ Room: [________]              │  │  ← Manual text input
│  ├───────────────────────────────┤  │
│  │ Duration: 60 minutes          │  │  ← Hardcoded based on type
│  └───────────────────────────────┘  │
│                                     │
│  [Batal]           [Mulai]         │
└─────────────────────────────────────┘
         │
         ▼
   Emits data with TEXT values:
   {
     service_type: "SPA",
     therapist_name: "John",
     room_no: "101",
     duration: 60
   }
```

**Problems:**
- No validation of therapist names (typos possible)
- No validation of room numbers
- No occupancy checking (could assign occupied rooms)
- Hardcoded durations (inflexible)
- No database consistency


## AFTER (Database-Driven)

```
┌─────────────────────────────────────────────────────────────┐
│                   StartTimerModal.vue                       │
│                                                             │
│  On Mount: GET /api/services ────────────────────┐          │
│                                                  │          │
│  ┌───────────────────────────────────────────┐  │          │
│  │ Service: [Spa Relax 60min ▼]             │◄─┘          │
│  │          - Spa Relax 60min (60min)       │              │
│  │          - LC Premium 180min (180min)    │              │
│  └───────────────────────────────────────────┘              │
│              │ On change                                    │
│              ├───────────────────────────────┐              │
│              ▼                               ▼              │
│  GET /api/timers/therapists    GET /api/timers/rooms       │
│  ?service_type=SPA              ?service_type=SPA          │
│              │                               │              │
│              ▼                               ▼              │
│  ┌───────────────────────────────────────────┐              │
│  │ Therapist: [Ayu (Gold) ▼]                │              │
│  │           - Ayu (Gold)                   │              │
│  │           - Nina (Platinum)              │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
│  ┌───────────────────────────────────────────┐              │
│  │ Room: [Room 1 ✅ Free ▼]                 │              │
│  │      - Room 1 ✅ Free                    │              │
│  │      - Room 2 ❌ Occupied (disabled)    │              │
│  │      - Room 3 ✅ Free                    │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
│  ┌───────────────────────────────────────────┐              │
│  │ ⏱ Duration: 60 minutes (auto-filled)     │              │
│  └───────────────────────────────────────────┘              │
│                                                             │
│  [Batal]                          [Mulai]                  │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
   Emits data with DATABASE IDs:
   {
     service_id: 1,
     service_type: "SPA",
     therapist_id: 2,
     room_id: 1,
     duration_minutes: 60
   }
         │
         ▼
   POST /api/timers/start
   {
     service_id: 1,
     therapist_id: 2,
     room_id: 1,
     duration_minutes: 60,
     ...
   }
         │
         ▼
   Timer created in database with:
   - Foreign key references (data integrity)
   - Real-time occupancy tracking
   - Consistent data format
```

## API Endpoints

### 1. GET /api/timers/therapists?service_type=SPA

```javascript
Request: GET /api/timers/therapists?service_type=SPA
Auth: Bearer token required

Response: 200 OK
[
  {
    "id": 1,
    "name": "Ayu",
    "grade_id": 2,
    "grade_name": "Gold"
  },
  {
    "id": 2,
    "name": "Nina",
    "grade_id": 3,
    "grade_name": "Platinum"
  }
]
```

### 2. GET /api/timers/rooms?service_type=SPA

```javascript
Request: GET /api/timers/rooms?service_type=SPA
Auth: Bearer token required

Response: 200 OK
[
  {
    "id": 1,
    "name": "Room 1",
    "type": "SPA",
    "is_active": true,
    "is_occupied": false,      // ← Real-time check
    "status": "available"
  },
  {
    "id": 2,
    "name": "Room 2",
    "type": "SPA",
    "is_active": true,
    "is_occupied": true,       // ← Room in use
    "status": "occupied"
  }
]

Occupancy Query:
SELECT ... FROM rooms r
WHERE EXISTS (
  SELECT 1 FROM timers t
  WHERE t.room_id = r.id
    AND t.end_time IS NULL  -- Active timer
)
```

### 3. GET /api/services/by-type?type=SPA

```javascript
Request: GET /api/services/by-type?type=SPA
Auth: Bearer token required

Response: 200 OK
[
  {
    "id": 1,
    "name": "Spa Relax 60 Menit",
    "type": "SPA",
    "base_price": 300000,
    "duration_minutes": 60,    // ← Auto-fill duration
    "is_active": true,
    "branch": "Numars Pondok Indah"
  }
]
```

## Database Schema Changes

### New Table: rooms

```sql
CREATE TABLE rooms (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20),              -- SPA, LC, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sample data
INSERT INTO rooms (branch_id, name, type) VALUES
  (1, 'Room 1', 'SPA'),
  (1, 'Room 2', 'SPA'),
  (1, 'Sofa 1', 'LC'),
  (1, 'Sofa 2', 'LC');
```

### Updated Table: timers

```sql
ALTER TABLE timers ADD COLUMN service_id INT REFERENCES services(id);
ALTER TABLE timers ADD COLUMN room_id INT REFERENCES rooms(id);
ALTER TABLE timers ADD COLUMN branch_id INT REFERENCES branches(id);
ALTER TABLE timers ADD COLUMN planned_end_time TIMESTAMP;

-- Index for fast occupancy lookup
CREATE INDEX idx_timers_room_active 
  ON timers(room_id, end_time) 
  WHERE end_time IS NULL;
```

## Benefits

✅ **Data Integrity** - Foreign key relationships ensure valid data
✅ **Real-time Occupancy** - Prevents double-booking of rooms
✅ **Flexibility** - Easy to add/modify services, therapists, rooms via admin panel
✅ **Validation** - Dropdown selections prevent typos and invalid data
✅ **User Experience** - Clear visual indicators (Free/Occupied)
✅ **Scalability** - Database-driven approach scales with business growth
✅ **Reporting** - Consistent data enables accurate reporting and analytics
