# TruthCircle Docker 開發環境

這個資料夾包含了 TruthCircle 專案的 Docker 開發環境設定，讓您無需在本機安裝 Node.js、npm 或 PostgreSQL 即可運行整個應用。

## 📦 包含的服務

- **client** - React + Vite 前端應用 (Port: 8081)
- **server** - Node.js + Express 後端 API (Port: 3001)
- **postgres** - PostgreSQL 15 資料庫 (Port: 5432)

## 🚀 快速開始

### 前置需求

只需要安裝 Docker 和 Docker Compose：
- [Docker Desktop](https://www.docker.com/products/docker-desktop) (Mac/Windows)
- 或 Docker Engine + Docker Compose (Linux)

### 啟動應用

在專案根目錄執行：

```bash
cd docker
docker-compose up -d
```

首次啟動會需要一些時間來下載映像和安裝依賴。

### 訪問應用

- **前端網站**: http://localhost:8081
- **後端 API**: http://localhost:3001
- **資料庫**: localhost:5432

### 查看日誌

```bash
# 查看所有服務的日誌
docker-compose logs -f

# 查看特定服務的日誌
docker-compose logs -f client
docker-compose logs -f server
docker-compose logs -f postgres
```

### 停止應用

```bash
# 停止但保留容器
docker-compose stop

# 停止並刪除容器（保留資料）
docker-compose down

# 停止並刪除容器和資料卷（清除所有資料）
docker-compose down -v
```

## 🔧 開發工作流程

### 程式碼變更

由於使用了 volume mount，您在本機編輯的程式碼會即時同步到容器中：

- **前端**: Vite 會自動偵測變更並熱重載
- **後端**: 修改後需要重啟容器才能生效（或可以加入 nodemon）

### 重啟服務

```bash
# 重啟特定服務
docker-compose restart server
docker-compose restart client

# 重建並重啟（當修改了 Dockerfile 或 package.json）
docker-compose up -d --build
```

### 在容器中執行指令

```bash
# 在後端容器中執行指令
docker-compose exec server npm install <package-name>

# 在前端容器中執行指令
docker-compose exec client npm install <package-name>

# 進入容器的 shell
docker-compose exec server sh
docker-compose exec client sh
```

### 資料庫操作

```bash
# 連接到 PostgreSQL
docker-compose exec postgres psql -U truthcircle -d truthcircle

# 備份資料庫
docker-compose exec postgres pg_dump -U truthcircle truthcircle > backup.sql

# 還原資料庫
docker-compose exec -T postgres psql -U truthcircle truthcircle < backup.sql
```

## 📁 檔案結構

```
docker/
├── Dockerfile.client       # 前端容器配置
├── Dockerfile.server       # 後端容器配置
├── docker-compose.yml      # 服務編排配置
├── .env.example           # 環境變數範例
└── README.md              # 本說明文件
```

## 🔐 預設設定

### 資料庫

- **使用者**: truthcircle
- **密碼**: truthcircle_password
- **資料庫名稱**: truthcircle

### JWT

- **Secret**: your-development-jwt-secret-key-change-in-production

⚠️ **注意**: 這些是開發環境的預設值，請勿在生產環境使用！

## 🛠️ 自訂設定

如需修改設定，可以：

1. 複製 `.env.example` 為 `.env`
2. 修改 `.env` 中的值
3. 在 `docker-compose.yml` 中使用 `env_file` 載入

## 📝 常見問題

### Q: 容器啟動後無法訪問？

A: 確認容器狀態：
```bash
docker-compose ps
```

### Q: 前端顯示 API 連線錯誤？

A: 檢查後端是否正常運行：
```bash
curl http://localhost:3001/api/health
docker-compose logs server
```

### Q: 資料庫連線失敗？

A: 確認 PostgreSQL 容器已啟動並就緒：
```bash
docker-compose logs postgres
```

### Q: 想要清除所有資料重新開始？

A: 執行以下指令：
```bash
docker-compose down -v
docker-compose up -d
```

## 🎯 Git 管理建議

這個 `docker/` 資料夾的設計讓您可以：

1. **提交到版本控制**: 將整個 `docker/` 資料夾加入 git，讓團隊成員都能使用相同的開發環境
2. **或者忽略**: 如果不想加入版本控制，在 `.gitignore` 加入 `/docker/`

建議提交以下檔案：
- ✅ `Dockerfile.client`
- ✅ `Dockerfile.server`
- ✅ `docker-compose.yml`
- ✅ `.env.example`
- ✅ `README.md`
- ❌ `.env` (包含敏感資訊，應該忽略)

## 🚀 進階使用

### 啟用後端熱重載

如果想要後端也能熱重載，可以修改 `Dockerfile.server`：

1. 在 server 的 dependencies 加入 nodemon
2. 修改 CMD 為：`["npx", "nodemon", "index.js"]`

### 設定不同環境

可以建立不同的 compose 檔案：
- `docker-compose.yml` - 開發環境
- `docker-compose.prod.yml` - 生產環境
- `docker-compose.test.yml` - 測試環境

使用時：
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

**有任何問題歡迎提出！** 🙌
