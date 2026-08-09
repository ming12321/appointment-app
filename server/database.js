import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const databasePath = path.join(
  currentDirectory,
  "data",
  "appointments.sqlite",
);

const database = new Database(databasePath);

database.pragma("journal_mode = WAL");
database.pragma("foreign_keys = ON");

database.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT NOT NULL PRIMARY KEY,
    service_id INTEGER NOT NULL CHECK (service_id > 0),
    service_name TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    slot TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );
`);

export default database;