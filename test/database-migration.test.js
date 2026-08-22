import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import Database from "better-sqlite3";
import { migrateToRelationalSchema } from "../server/migrations/001-relational-schema.js";

const schemaSql = fs.readFileSync(
  new URL("../server/schema.sql", import.meta.url),
  "utf8",
);

test("將舊資料庫遷移成關聯式結構並保留預約", () => {
  const temporaryDirectory = fs.mkdtempSync(
    path.join(os.tmpdir(), "appointment-migration-test-"),
  );

  const databasePath = path.join(
    temporaryDirectory,
    "appointments.sqlite",
  );

  const database = new Database(databasePath);
  database.pragma("foreign_keys = ON");

  try {
    database.exec(`
      CREATE TABLE appointments (
        id TEXT NOT NULL PRIMARY KEY,
        service_id INTEGER NOT NULL,
        service_name TEXT NOT NULL,
        duration_minutes INTEGER NOT NULL,
        slot TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL
      );

      INSERT INTO appointments (
        id,
        service_id,
        service_name,
        duration_minutes,
        slot,
        created_at
      )
      VALUES
        (
          'appointment-1',
          1,
          '一般諮詢',
          30,
          '上午 09:00',
          '2026-08-09T14:03:00.000Z'
        ),
        (
          'appointment-2',
          2,
          '專業諮詢',
          60,
          '下午 02:00',
          '2026-08-09T14:04:00.000Z'
        );
    `);

    const firstRun = migrateToRelationalSchema(
      database,
      schemaSql,
    );

    assert.deepEqual(firstRun, {
      migrated: true,
      previousVersion: 0,
      currentVersion: 1,
      migratedAppointments: 2,
    });

    const secondRun = migrateToRelationalSchema(
      database,
      schemaSql,
    );

    assert.deepEqual(secondRun, {
      migrated: false,
      previousVersion: 1,
      currentVersion: 1,
      migratedAppointments: 0,
    });

    const tables = database
      .prepare(`
        SELECT name
        FROM sqlite_master
        WHERE type = 'table'
        ORDER BY name
      `)
      .all()
      .map((table) => table.name);

    assert.deepEqual(tables, [
      "appointments",
      "services",
      "users",
    ]);

    assert.equal(
      database.pragma("user_version", { simple: true }),
      1,
    );

    assert.equal(
      database.pragma("integrity_check", { simple: true }),
      "ok",
    );

    assert.deepEqual(
      database.pragma("foreign_key_check"),
      [],
    );

    const appointmentColumns = database
      .pragma("table_info(appointments)")
      .map((column) => column.name);

    assert.deepEqual(appointmentColumns, [
      "id",
      "user_id",
      "service_id",
      "slot",
      "status",
      "created_at",
      "updated_at",
    ]);

    assert.equal(
      database
        .prepare(`
          SELECT COUNT(*) AS count
          FROM services
        `)
        .get().count,
      3,
    );

    const legacyUser = database
      .prepare(`
        SELECT
          id,
          is_active AS isActive
        FROM users
        WHERE id = ?
      `)
      .get("legacy-user");

    assert.deepEqual(legacyUser, {
      id: "legacy-user",
      isActive: 0,
    });

    const appointments = database
      .prepare(`
        SELECT
          appointments.id,
          appointments.user_id AS userId,
          services.name AS serviceName,
          services.duration_minutes AS durationMinutes,
          appointments.slot,
          appointments.status
        FROM appointments
        JOIN services
          ON services.id = appointments.service_id
        ORDER BY appointments.id
      `)
      .all();

    assert.deepEqual(appointments, [
      {
        id: "appointment-1",
        userId: "legacy-user",
        serviceName: "一般諮詢",
        durationMinutes: 30,
        slot: "上午 09:00",
        status: "confirmed",
      },
      {
        id: "appointment-2",
        userId: "legacy-user",
        serviceName: "專業諮詢",
        durationMinutes: 60,
        slot: "下午 02:00",
        status: "confirmed",
      },
    ]);
  } finally {
    database.close();

    fs.rmSync(temporaryDirectory, {
      recursive: true,
      force: true,
    });
  }
});