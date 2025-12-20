# TruthCircle - A2 Hosting 部署快速指南

## 🚀 快速部署步驟

### 步驟 1: 上傳檔案
上傳整個專案到 A2 Hosting（排除 `node_modules` 和 `.env` 檔案）

### 步驟 2: 設定資料庫
在 cPanel 建立 PostgreSQL 資料庫並加入 `127.0.0.1` 到白名單

### 步驟 3: 在 A2 上建置
```bash
# SSH 登入後執行
cd ~/你的專案目錄
npm install
npm run build
```

### 步驟 4: 設定 Node.js App
- Application root: `/home/你的使用者名稱/專案名稱/server`
- Startup file: `index.js`
- 設定環境變數（參考 `.env.example`）

### 步驟 5: 啟動應用程式
點擊 "Run NPM Install" → "Start App"

---

## 📖 詳細說明
請參閱 [A2_HOSTING_部署指南.md](./A2_HOSTING_部署指南.md)

## 🔐 預設帳號
- 使用者名稱: `admin`
- 密碼: `admin`

**⚠️ 請在首次登入後立即修改密碼！**
