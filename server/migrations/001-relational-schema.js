import { services } from "../data/services.js";

const TARGET_SCHEMA_VERSION = 1;

const LEGACY_USER = {
  id: "legacy-user",
  name: "舊資料使用者",
  email: "legacy@appointment.local",
  passwordHash: "disabled",
  role: "customer",
};

const GUEST_USER = {
  id: "guest-user",
  name: "訪客使用者",
  email: "guest@appointment.local",
  passwordHash: "disabled",
  role: "customer",
};

function tableExists(database, tableName) {
  const result = database
    .prepare(
      `
      SELECT 1
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
    `,
    )
    .get(tableName);

  return Boolean(result);
}

function columnExists(database, tableName, columnName) {
  return database
    .pragma(`table_info(${tableName})`)
    .some((column) => column.name === columnName);
}

export function migrateToRelationalSchema(database, schemaSql) {
  const currentVersion = database.pragma("user_version", { simple: true });

  if (currentVersion >= TARGET_SCHEMA_VERSION) {
    return {
      migrated: false,
      previousVersion: currentVersion,
      currentVersion,
      migratedAppointments: 0,
    };
  }

  const appointmentsTableExists = tableExists(database, "appointments");

  const isLegacySchema =
    appointmentsTableExists &&
    columnExists(database, "appointments", "service_name") &&
    columnExists(database, "appointments", "duration_minutes");

  const legacyAppointmentCount = isLegacySchema
    ? database
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM appointments
        `,
        )
        .get().count
    : 0;

  const runMigration = database.transaction(() => {
    if (isLegacySchema) {
      database.exec(`
        ALTER TABLE appointments
        RENAME TO appointments_legacy;
      `);
    }

    database.exec(schemaSql);

    const insertService = database.prepare(`
      INSERT INTO services (
        id,
        name,
        description,
        duration_minutes
      )
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO NOTHING
    `);

    for (const service of services) {
      insertService.run(
        service.id,
        service.name,
        service.description,
        service.durationMinutes,
      );
    }
    database
      .prepare(
        `
    INSERT INTO users (
      id,
      name,
      email,
      password_hash,
      role,
      is_active
    )
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(id) DO NOTHING
  `,
      )
      .run(
        GUEST_USER.id,
        GUEST_USER.name,
        GUEST_USER.email,
        GUEST_USER.passwordHash,
        GUEST_USER.role,
      );

    if (isLegacySchema && legacyAppointmentCount > 0) {
      database
        .prepare(
          `
          INSERT INTO users (
            id,
            name,
            email,
            password_hash,
            role,
            is_active
          )
          VALUES (?, ?, ?, ?, ?, 0)
          ON CONFLICT(id) DO NOTHING
        `,
        )
        .run(
          LEGACY_USER.id,
          LEGACY_USER.name,
          LEGACY_USER.email,
          LEGACY_USER.passwordHash,
          LEGACY_USER.role,
        );

      database
        .prepare(
          `
          INSERT INTO appointments (
            id,
            user_id,
            service_id,
            slot,
            status,
            created_at,
            updated_at
          )
          SELECT
            id,
            ?,
            service_id,
            slot,
            'confirmed',
            created_at,
            created_at
          FROM appointments_legacy
        `,
        )
        .run(LEGACY_USER.id);
    }

    if (isLegacySchema) {
      database.exec(`
        DROP TABLE appointments_legacy;
      `);
    }

    database.pragma(`user_version = ${TARGET_SCHEMA_VERSION}`);
  });

  runMigration();

  return {
    migrated: true,
    previousVersion: currentVersion,
    currentVersion: TARGET_SCHEMA_VERSION,
    migratedAppointments: legacyAppointmentCount,
  };
}
