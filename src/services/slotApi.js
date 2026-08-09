export async function getAvailableSlots() {
  let response;

  try {
    response = await fetch("/api/slots");
  } catch {
    throw new Error("無法載入可用時段，請稍後再試。");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      result?.error?.message ?? "無法載入可用時段，請稍後再試。",
    );
  }

  if (!Array.isArray(result?.data)) {
    throw new Error("時段資料格式不正確。");
  }

  return result.data
    .filter((slot) => slot?.isAvailable === true)
    .map((slot) => slot.value)
    .filter((slot) => typeof slot === "string");
}