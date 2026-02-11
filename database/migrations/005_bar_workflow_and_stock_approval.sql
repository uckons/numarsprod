CREATE TABLE IF NOT EXISTS bar_orders (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  branch_id INT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  items_snapshot JSONB NOT NULL,
  note TEXT,
  requested_by INT,
  accepted_by INT,
  delivered_by INT,
  cancelled_by INT,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP,
  delivered_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fnb_stock_adjustment_requests (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL,
  fnb_item_id INT NOT NULL REFERENCES fnb_items(id) ON DELETE CASCADE,
  qty_change INT NOT NULL,
  reason TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  requested_by INT,
  reviewed_by INT,
  review_note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
