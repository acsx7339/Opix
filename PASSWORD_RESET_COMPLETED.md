# 密碼重置功能完成說明

## ✅ 已完成的功能

###  1. **資料庫結構**
- 創建了 migration 檔案：`server/migrations/004_add_password_reset.sql`
- 新增欄位：
  - `reset_token` (VARCHAR(255)): 存儲重置 token
  - `reset_token_expires` (BIGINT): token 過期時間

### 2. **後端 API**
已在 `server/index.js` 中新增兩個端點：

- **`POST /api/auth/forgot-password`**
  - 接收：`{ email }`
  - 功能：生成重置 token，發送郵件
  - Token 有效期：1小時

- **`POST /api/auth/reset-password/:token`**
  - 接收：`{ password }`
  - 功能：驗證 token，重置密碼

### 3. **前端功能**
- **登入頁面忘記密碼按鈕** (`client/src/components/AuthModal.tsx`)
  - 點擊後彈出 email 輸入框
  - 調用 API 發送重置郵件

- **密碼重置頁面** (`client/src/components/ResetPasswordPage.tsx`)
  - 路由：`/reset-password/:token`
  - 用戶在 App.tsx 中自動路由

## 🔧 需要手動執行的步驟

### 1. 執行資料庫 Migration

連接到 PostgreSQL 資料庫執行：

```bash
# 方法1: 使用 docker exec
docker exec -i opix_db psql -U opix -d opix < server/migrations/004_add_password_reset.sql

# 方法2: 使用 psql 客戶端（如果已安裝）
psql -h localhost -p 5433 -U opix -d opix -f server/migrations/004_add_password_reset.sql
```

### 2. 配置 SMTP 環境變數

確保 `server/.env` 檔案包含以下 SMTP 設定：

```env
# SMTP 郵件設定
SMTP_HOST=open.pc-baby.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=admin@open.pc-baby.com
SMTP_PASS=your_smtp_password_here
SMTP_FROM=admin@open.pc-baby.com

# 網站網域（用於生成重置連結）
DOMAIN=http://localhost:8081
```

## 📧 郵件模板

系統會發送 HTML 格式的郵件，包含：
- 用戶名稱
- 重置連結按鈕
- 1小時有效期提示
- 純文字連結備份

## 🎯 使用流程

1. 用戶在登入頁點擊「忘記密碼？」
2. 輸入註冊的 Email
3. 系統發送重置郵件
4. 用戶點擊郵件中的連結
5. 在重置頁面輸入新密碼
6. 成功後自動跳轉回首頁

##  安全性特點

- Token 為 32 字節隨機生成
- Token 1小時後自動失效
- 密碼使用 bcrypt 加密存儲
- 防止 Email 列舉攻擊（即使 Email 不存在也返回成功消息）

## 🐛 如果遇到問題

1. **郵件發不出去**
   - 檢查 SMTP 設定是否正確
   - 查看 server 日誌：`docker logs opix_server`

2. **Token  無效**
   - 確認資料庫 migration 已執行
   - 檢查 token 是否過期（1小時）

3. **頁面顯示錯誤**
   - 清除瀏覽器快取
   - 重啟 Docker：`docker compose restart`
