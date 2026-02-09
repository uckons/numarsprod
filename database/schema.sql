-- =========================
-- MASTER DATA
-- =========================

CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  address TEXT,
  open_time TIME DEFAULT '10:00',
  close_time TIME DEFAULT '03:00',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  role_id INT REFERENCES roles(id),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- SERVICES & THERAPISTS
-- =========================

CREATE TABLE services (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  name VARCHAR(100),
  category VARCHAR(50), -- spa / karaoke / lounge
  price NUMERIC(12,2),
  duration_minutes INT, -- 0 = no limit
  active BOOLEAN DEFAULT true
);

CREATE TABLE therapist_grades (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50),
  commission_percent NUMERIC(5,2)
);

CREATE TABLE therapists (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  grade_id INT REFERENCES therapist_grades(id),
  name VARCHAR(100),
  active BOOLEAN DEFAULT true
);

-- =========================
-- ORDERS & ITEMS
-- =========================

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  cashier_id INT REFERENCES users(id),
  status VARCHAR(30), -- OPEN, PAID, REVERTED, CLOSED
  total NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id) ON DELETE CASCADE,
  service_id INT REFERENCES services(id),
  qty INT DEFAULT 1,
  price NUMERIC(12,2),
  duration_minutes INT
);

-- =========================
-- PAYMENTS
-- =========================

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  method VARCHAR(20), -- CASH / QRIS / TRANSFER
  amount NUMERIC(12,2),
  paid_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payment_reverts (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  reason TEXT,
  reverted_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- TIMER TERAPIS
-- =========================

CREATE TABLE timers (
  id SERIAL PRIMARY KEY,
  order_id INT REFERENCES orders(id),
  therapist_id INT REFERENCES therapists(id),
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  paused BOOLEAN DEFAULT false
);

-- =========================
-- COMMISSIONS
-- =========================

CREATE TABLE commissions (
  id SERIAL PRIMARY KEY,
  therapist_id INT REFERENCES therapists(id),
  order_id INT REFERENCES orders(id),
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- FNB & STOCK
-- =========================

CREATE TABLE fnb_items (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  name VARCHAR(100),
  price NUMERIC(12,2),
  stock INT,
  alert_stock INT,
  package_price NUMERIC(12,2),
  package_name VARCHAR(120)
);

CREATE TABLE stock_logs (
  id SERIAL PRIMARY KEY,
  fnb_item_id INT REFERENCES fnb_items(id),
  qty_change INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- ACCOUNTING
-- =========================

CREATE TABLE accounting_entries (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  type VARCHAR(50), -- income / expense
  description TEXT,
  amount NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE cashier_closings (
  id SERIAL PRIMARY KEY,
  cashier_id INT REFERENCES users(id),
  branch_id INT REFERENCES branches(id),
  total_cash NUMERIC(12,2),
  closed_at TIMESTAMP DEFAULT NOW()
);
