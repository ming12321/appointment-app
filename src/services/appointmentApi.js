const API_DELAY_MS = 800;

let shouldFailNextRequest =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get("simulateError") === "1";

function wait(milliseconds) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export async function createAppointment(bookingData) {
  if (!bookingData?.serviceId || !bookingData?.slot) {
    throw new Error("預約資料不完整。");
  }

  // 暫時模擬後端 API 回應時間
  await wait(API_DELAY_MS);

  // 使用測試網址時，第一次請求故意失敗
  if (shouldFailNextRequest) {
    shouldFailNextRequest = false;
    throw new Error("網路連線不穩定，請稍後再試。");
  }

  // 模擬後端建立資料後回傳的結果
  return {
    id: crypto.randomUUID(),
    ...bookingData,
    createdAt: new Date().toISOString(),
  };
}