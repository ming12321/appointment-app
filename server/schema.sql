PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL
    CHECK (length(trim(name)) BETWEEN 2 AND 100),
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'admin')),
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS services (
  id INTEGER NOT NULL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL
    CHECK (duration_minutes > 0),
  is_active INTEGER NOT NULL DEFAULT 1
    CHECK (is_active IN (0, 1)),
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL,
  service_id INTEGER NOT NULL,
  slot TEXT NOT NULL
    CHECK (length(trim(slot)) > 0),
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (
      status IN (
        'pending',
        'confirmed',
        'completed',
        'cancelled'
      )
    ),
  created_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (service_id)
    REFERENCES services(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_appointments_user_id
  ON appointments(user_id);

CREATE INDEX IF NOT EXISTS idx_appointments_service_id
  ON appointments(service_id);

CREATE INDEX IF NOT EXISTS idx_appointments_status
  ON appointments(status);

CREATE UNIQUE INDEX IF NOT EXISTS idx_appointments_active_slot
  ON appointments(slot)
  WHERE status IN ('pending', 'confirmed');