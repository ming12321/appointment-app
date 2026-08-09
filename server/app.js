import express from "express";

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

export default app;