import { randomUUID } from "node:crypto";
import express from "express";
import { services } from "./data/services.js";
import { slots } from "./data/slots.js";
import {
  findAppointmentBySlot,
  getBookedSlots,
  saveAppointment,
} from "./repositories/appointmentRepository.js";

const app = express();

// 讓伺服器能解析 JSON 格式的請求內容
app.use(express.json());

// 健康檢查 API
app.get("/api/health", (request, response) => {
  response.status(200).json({
    status: "ok",
    message: "Appointment API is running",
  });
});

// 取得所有服務項目
app.get("/api/services", (request, response) => {
  response.status(200).json({
    data: services,
    meta: {
      total: services.length,
    },
  });
});

// 取得所有時段及其可用狀態
app.get("/api/slots", (request, response) => {
  const bookedSlots = new Set(getBookedSlots());

  const slotAvailability = slots.map((slot) => ({
    value: slot,
    isAvailable: !bookedSlots.has(slot),
  }));

  response.status(200).json({
    data: slotAvailability,
    meta: {
      total: slotAvailability.length,
      available: slotAvailability.filter((slot) => slot.isAvailable).length,
    },
  });
});

// 建立預約
app.post("/api/appointments", (request, response) => {
  const { serviceId, slot } = request.body ?? {};

  if (!Number.isInteger(serviceId) || typeof slot !== "string") {
    return response.status(400).json({
      error: {
        code: "INVALID_APPOINTMENT",
        message: "預約資料格式不正確。",
      },
    });
  }

  const normalizedSlot = slot.trim();

  if (!slots.includes(normalizedSlot)) {
    return response.status(400).json({
      error: {
        code: "INVALID_SLOT",
        message: "請選擇有效的預約時段。",
      },
    });
  }

  const service = services.find((item) => item.id === serviceId);

  if (!service) {
    return response.status(404).json({
      error: {
        code: "SERVICE_NOT_FOUND",
        message: "找不到指定的服務項目。",
      },
    });
  }

  const conflictingAppointment =
    findAppointmentBySlot(normalizedSlot);

  if (conflictingAppointment) {
    return response.status(409).json({
      error: {
        code: "SLOT_CONFLICT",
        message: "此時段已被預約，請選擇其他時段。",
      },
    });
  }

  const appointment = {
    id: randomUUID(),
    serviceId: service.id,
    serviceName: service.name,
    durationMinutes: service.durationMinutes,
    slot: normalizedSlot,
    createdAt: new Date().toISOString(),
  };

  try {
    saveAppointment(appointment);
  } catch (error) {
    if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      return response.status(409).json({
        error: {
          code: "SLOT_CONFLICT",
          message: "此時段已被預約，請選擇其他時段。",
        },
      });
    }

    console.error("Failed to save appointment:", error);

    return response.status(500).json({
      error: {
        code: "DATABASE_ERROR",
        message: "建立預約時發生錯誤，請稍後再試。",
      },
    });
  }

  return response.status(201).json({
    data: appointment,
  });
});

export default app;