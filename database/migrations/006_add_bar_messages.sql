CREATE TABLE IF NOT EXISTS bar_messages (
  id SERIAL PRIMARY KEY,
  branch_id INT NOT NULL,
  order_id INT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  bar_order_id INT REFERENCES bar_orders(id) ON DELETE SET NULL,
  type VARCHAR(30) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  payload JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);
