# Docker 環境設置完成 ✅

## 🎉 成功啟動！

您的 TruthCircle 應用程式已經在 Docker 環境中成功運行！

![成功運行截圖](/Users/fachu/.gemini/antigravity/brain/d7af7b18-871d-43a9-8ebe-c1c5d6cfda46/screenshot_success.png)

## 📍 訪問資訊

- **前端網站**: http://localhost:8081
- **後端 API**: http://localhost:3001  
- **資料庫**: localhost:5432

## 🔐 預設登入帳號

- **使用者名稱**: `admin`
- **密碼**: `admin`

## 🐳 容器狀態

所有三個服務都正常運行：

```
✅ truthcircle_db       - PostgreSQL 15 資料庫
✅ truthcircle_server   - Node.js 20 後端 API
✅ truthcircle_client   - Node.js 20 + Vite 前端
```

## 🔧 解決的問題

### 問題：前端無法連接到後端

**原因**: Docker 容器內部無法使用 `localhost` 來訪問其他容器

**解決方案**: 
1. 修改 `client/vite.config.ts` 的 proxy 設定，使用 Docker Compose 服務名稱 `server` 而不是 `localhost`
2. 移除 `docker-compose.yml` 中的 `VITE_API_URL` 環境變數
3. 重建前端容器以應用新配置

### 修改的檔案

#### 1. `client/vite.config.ts`
```typescript
server: {
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://server:3001',
      changeOrigin: true,
    },
  },
},
```

#### 2. `docker/docker-compose.yml`
移除了前端服務的 `VITE_API_URL` 環境變數，讓它使用預設的 `http://server:3001`

## 📁 專案結構

```
truthcircle_測試環境/
├── client/                    # 前端程式碼
├── server/                    # 後端程式碼
└── docker/                    # Docker 設定 (獨立資料夾)
    ├── Dockerfile.client      # 前端容器配置
    ├── Dockerfile.server      # 後端容器配置
    ├── docker-compose.yml     # 服務編排
    ├── .env.example          # 環境變數範例
    ├── .dockerignore         # Docker 忽略檔案
    ├── README.md             # 完整說明
    └── QUICK_START.md        # 快速指令參考
```

## 🚀 常用指令

### 啟動所有服務
```bash
cd docker
docker compose up -d
```

### 停止所有服務
```bash
cd docker
docker compose down
```

### 查看日誌
```bash
cd docker
docker compose logs -f           # 所有服務
docker compose logs -f client    # 只看前端
docker compose logs -f server    # 只看後端
docker compose logs -f postgres  # 只看資料庫
```

### 重啟特定服務
```bash
cd docker
docker compose restart client
docker compose restart server
```

### 完全清除並重建
```bash
cd docker
docker compose down -v    # -v 會刪除所有 volumes
docker compose up -d
```

## ✨ 特性

- ✅ **使用 Node.js 20** - 匹配您的本機版本
- ✅ **Volume Mount** - 程式碼變更即時生效（HMR）
- ✅ **本機 Port 8081** - 透過 http://localhost:8081 訪問
- ✅ **獨立資料夾** - 所有 Docker 檔案集中在 `docker/` 目錄
- ✅ **資料持久化** - PostgreSQL 資料保存在 Docker volume
- ✅ **網路隔離** - 所有容器在同一個網路中互相通訊
- ✅ **環境隔離** - 不需在本機安裝任何套件

## 🎯 Git 管理建議

建議將以下檔案加入版本控制：
- ✅ `docker/Dockerfile.client`
- ✅ `docker/Dockerfile.server`
- ✅ `docker/docker-compose.yml`
- ✅ `docker/.dockerignore`
- ✅ `docker/.env.example`
- ✅ `docker/README.md`
- ✅ `docker/QUICK_START.md`
- ❌ `docker/.env` (如果有的話，這個包含敏感資訊)

您可以選擇：
1. **提交到 Git** - 讓團隊成員都能使用相同環境
2. **忽略** - 在 `.gitignore` 加入 `/docker/` (不建議)

## 💡 下一步

現在您可以：

1. **開始開發** - 在 `client/` 或 `server/` 修改程式碼，變更會即時生效
2. **登入測試** - 使用 admin/admin 登入並測試功能
3. **查看資料庫** - 使用資料庫工具連接 localhost:5432
4. **Push & Merge** - Docker 設定檔案整齊地放在 `docker/` 資料夾中

## 🔍 驗證清單

- ✅ PostgreSQL 資料庫正常運行
- ✅ 後端 API 成功連接資料庫
- ✅ 前端成功連接後端 API
- ✅ 網站顯示主題列表
- ✅ 使用 port 8081 訪問

---

**環境設置完成！享受開發吧！** 🎊
