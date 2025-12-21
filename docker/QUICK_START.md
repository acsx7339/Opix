# Docker 快速指令參考

## 🚀 啟動所有服務
```bash
cd docker
docker compose up -d
```

## 🛑 停止所有服務
```bash
cd docker
docker compose down
```

## 🔄 重啟服務
```bash
cd docker
docker compose restart
```

## 📊 查看服務狀態
```bash
cd docker
docker compose ps
```

## 📝 查看日誌
```bash
# 查看所有服務日誌
cd docker
docker compose logs -f

# 只看前端日誌
docker compose logs -f client

# 只看後端日誌
docker compose logs -f server

# 只看資料庫日誌
docker compose logs -f postgres
```

## 🔧 進入容器執行指令
```bash
# 進入後端容器
cd docker
docker compose exec server sh

# 進入前端容器
docker compose exec client sh

# 進入資料庫容器
docker compose exec postgres sh
```

## 🗑️ 完全清除並重建
```bash
cd docker
docker compose down -v  # -v 會刪除所有 volumes（包含資料庫資料）
docker compose up -d
```

## 📍 訪問網址
- **前端**: http://localhost:8081
- **後端 API**: http://localhost:3001
- **資料庫**: localhost:5432
  - 使用者: truthcircle
  - 密碼: truthcircle_password
  - 資料庫名稱: truthcircle

## ✨ 特性
- ✅ 使用 Node.js 20
- ✅ 自動 volume mount，程式碼變更即時生效
- ✅ 前端支援 HMR (Hot Module Replacement)
- ✅ PostgreSQL 資料持久化
- ✅ 獨立的 node_modules volumes 避免衝突

## 預設帳號
- 使用者名稱: `admin`
- 密碼: `admin`
