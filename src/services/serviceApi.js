export async function getServices() {
  const response = await fetch("/api/services");

  if (!response.ok) {
    throw new Error("服務載入失敗。");
  }

  const result = await response.json();

  if (!Array.isArray(result.data)) {
    throw new Error("服務資料格式不正確。");
  }

  // 將後端資料轉換成 ServiceCard 使用的格式
  return result.data.map((service) => ({
    ...service,
    duration: `${service.durationMinutes} 分鐘`,
  }));
}