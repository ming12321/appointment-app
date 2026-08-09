import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after, before, beforeEach, test } from "node:test";

const testDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), "appointment-app-test-"),
);

process.env.DATABASE_PATH = path.join(testDirectory, "appointments.sqlite");

// 設定完測試資料庫路徑後，才能載入應用程式
const { default: app } = await import("../server/app.js");
const { default: database } = await import("../server/database.js");

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const address = server.address();
      baseUrl = `http://127.0.0.1:${address.port}`;
      resolve();
    });
  });
});

beforeEach(() => {
  database.prepare("DELETE FROM appointments").run();
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  database.close();
  fs.rmSync(testDirectory, {
    recursive: true,
    force: true,
  });
});

test("GET /api/appointments 回傳空的預約列表", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`);
  const result = await response.json();

  assert.equal(response.status, 200);

  assert.deepEqual(result, {
    data: [],
    meta: {
      total: 0,
    },
  });
});

test("POST /api/appointments 建立並儲存預約", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId: 1,
      slot: "上午 09:00",
    }),
  });

  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(typeof result.data.id, "string");
  assert.equal(result.data.serviceId, 1);
  assert.equal(result.data.serviceName, "一般諮詢");
  assert.equal(result.data.durationMinutes, 30);
  assert.equal(result.data.slot, "上午 09:00");

  const storedAppointment = database
    .prepare(
      `
      SELECT
        id,
        service_id AS serviceId,
        service_name AS serviceName,
        duration_minutes AS durationMinutes,
        slot,
        created_at AS createdAt
      FROM appointments
      WHERE id = ?
    `,
    )
    .get(result.data.id);

  assert.deepEqual(storedAppointment, result.data);
});

test("POST /api/appointments 拒絕重複時段", async () => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId: 1,
      slot: "上午 09:00",
    }),
  };

  const firstResponse = await fetch(
    `${baseUrl}/api/appointments`,
    requestOptions,
  );

  assert.equal(firstResponse.status, 201);

  const duplicateResponse = await fetch(
    `${baseUrl}/api/appointments`,
    requestOptions,
  );

  const duplicateResult = await duplicateResponse.json();

  assert.equal(duplicateResponse.status, 409);

  assert.deepEqual(duplicateResult, {
    error: {
      code: "SLOT_CONFLICT",
      message: "此時段已被預約，請選擇其他時段。",
    },
  });

  const appointmentCount = database
    .prepare("SELECT COUNT(*) AS total FROM appointments")
    .get();

  assert.equal(appointmentCount.total, 1);
});

test("POST /api/appointments 拒絕不完整的資料", async () => {
  const response = await fetch(`${baseUrl}/api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      serviceId: 1,
    }),
  });

  const result = await response.json();

  assert.equal(response.status, 400);

  assert.deepEqual(result, {
    error: {
      code: "INVALID_APPOINTMENT",
      message: "預約資料格式不正確。",
    },
  });

  const appointmentCount = database
    .prepare("SELECT COUNT(*) AS total FROM appointments")
    .get();

  assert.equal(appointmentCount.total, 0);
});
