export async function createAppointment(bookingData) {
  if (
    !Number.isInteger(bookingData?.serviceId) ||
    typeof bookingData?.slot !== "string"
  ) {
    throw new Error("預約資料不完整。");
  }

  let response;

  try {
    response = await fetch("/api/appointments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: bookingData.serviceId,
        slot: bookingData.slot,
      }),
    });
  } catch {
    throw new Error("無法連線至伺服器，請稍後再試。");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.error?.message ?? "預約失敗，請稍後再試。");
  }

  if (!result?.data) {
    throw new Error("預約回應格式不正確。");
  }

  return result.data;
}

export async function getAppointments() {
  let response;

  try {
    response = await fetch("/api/appointments");
  } catch {
    throw new Error("無法連線至伺服器，請稍後再試。");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error?.message ?? "無法載入預約紀錄，請稍後再試。",
    );
  }

  if (!Array.isArray(result?.data)) {
    throw new Error("預約紀錄格式不正確。");
  }

  return result.data;
}