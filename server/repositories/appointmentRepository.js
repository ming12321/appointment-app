import database from "../database.js";

const bookedSlotsStatement = database.prepare(`
  SELECT slot
  FROM appointments
  ORDER BY created_at ASC
`);

const findBySlotStatement = database.prepare(`
  SELECT
    id,
    service_id AS serviceId,
    service_name AS serviceName,
    duration_minutes AS durationMinutes,
    slot,
    created_at AS createdAt
  FROM appointments
  WHERE slot = ?
`);

const insertAppointmentStatement = database.prepare(`
  INSERT INTO appointments (
    id,
    service_id,
    service_name,
    duration_minutes,
    slot,
    created_at
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

export function getBookedSlots() {
  return bookedSlotsStatement.all().map((appointment) => appointment.slot);
}

export function findAppointmentBySlot(slot) {
  return findBySlotStatement.get(slot) ?? null;
}

export function saveAppointment(appointment) {
  insertAppointmentStatement.run(
    appointment.id,
    appointment.serviceId,
    appointment.serviceName,
    appointment.durationMinutes,
    appointment.slot,
    appointment.createdAt,
  );

  return appointment;
}