-- Customers table: maps Telegram users to internal IDs
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Orders table: one order per customer submission
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  display_id TEXT UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled')),
  specs TEXT,
  is_duplicate INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Order items: individual product links within an order
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  link TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Status transitions: audit log of all status changes
CREATE TABLE IF NOT EXISTS status_transitions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system'
    CHECK (changed_by IN ('manager', 'system')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for customer lookups by Telegram ID
CREATE INDEX IF NOT EXISTS idx_customers_telegram_id ON customers(telegram_id);

-- Index for order lookups by display_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_display_id ON orders(display_id);

-- Index for order lookups by customer
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);

-- Index for order items by order
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- Index for status transitions by order
CREATE INDEX IF NOT EXISTS idx_status_transitions_order_id ON status_transitions(order_id);