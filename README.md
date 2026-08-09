# 線上預約系統 Appointment App

[![CI](https://github.com/ming12321/appointment-app/actions/workflows/ci.yml/badge.svg)](https://github.com/ming12321/appointment-app/actions/workflows/ci.yml)

以 Vue 3、Express 與 SQLite 開發的響應式線上預約系統。使用者可以選擇服務與可用時段、建立預約，並查看已建立的預約紀錄。

## 專案畫面

![線上預約系統桌面版畫面](docs/images/appointment-app-desktop.png)

## 主要功能

- 響應式網頁設計，支援手機、平板與桌面裝置
- 從後端 API 取得服務項目與可用時段
- 建立預約並將資料持久化至 SQLite
- 防止同一時段被重複預約
- 顯示預約紀錄
- 處理載入中、空資料、成功與錯誤狀態
- API 自動化測試
- GitHub Actions 自動執行測試與正式建置

## 使用技術

### 前端

- Vue 3
- Composition API
- Vite
- HTML5
- CSS3
- Responsive Web Design

### 後端

- Node.js
- Express 5
- RESTful API

### 資料庫與測試

- SQLite
- better-sqlite3
- Node.js Test Runner
- GitHub Actions

## 系統架構

```text
Vue 前端
   ↓ HTTP / JSON
Vite 開發代理
   ↓
Express REST API
   ↓
Repository 資料存取層
   ↓
SQLite 資料庫
```

## 本機執行方式

### 1. 取得專案

```bash
git clone https://github.com/ming12321/appointment-app.git
cd appointment-app
```

### 2. 安裝套件

本專案使用 Node.js `22.23.2`。

```bash
npm ci
```

### 3. 啟動後端

開啟第一個終端機：

```bash
npm run dev:api
```

後端 API 位於：

```text
http://localhost:3000
```

### 4. 啟動前端

開啟第二個終端機：

```bash
npm run dev
```

前端頁面位於：

```text
http://localhost:5173
```

## 測試與建置

執行 API 自動化測試：

```bash
npm test
```

建立正式版本：

```bash
npm run build
```

目前的自動化測試包含：

- 取得空的預約列表
- 建立預約並確認資料已寫入 SQLite
- 拒絕重複預約相同時段
- 拒絕格式不完整的預約資料

## API 說明

| 方法 | 路徑 | 功能 |
| --- | --- | --- |
| `GET` | `/api/health` | 檢查 API 狀態 |
| `GET` | `/api/services` | 取得服務項目 |
| `GET` | `/api/slots` | 取得時段與可用狀態 |
| `GET` | `/api/appointments` | 取得預約紀錄 |
| `POST` | `/api/appointments` | 建立預約 |

建立預約的請求範例：

```json
{
  "serviceId": 1,
  "slot": "上午 10:30"
}
```

## 專案結構

```text
appointment-app/
├── .github/workflows/ci.yml
├── server/
│   ├── data/
│   ├── repositories/
│   ├── app.js
│   ├── database.js
│   └── index.js
├── src/
│   ├── components/
│   ├── services/
│   ├── App.vue
│   ├── main.js
│   └── style.css
├── test/
│   └── appointments.test.js
├── package.json
└── vite.config.js
```

## 後續規劃

- 加入使用者登入與身分驗證
- 保護預約紀錄 API 的存取權限
- 加入預約修改與取消功能
- 增加表單欄位與更完整的資料驗證
- 加入端對端測試
- 部署前端、後端與正式資料庫
