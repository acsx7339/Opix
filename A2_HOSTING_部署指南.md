# A2 Hosting 部署指南 - TruthCircle

## 📋 部署流程

### 1️⃣ 上傳專案檔案到 A2 Hosting

**上傳整個專案到 A2 Hosting：**

使用 FTP/SFTP 或 cPanel File Manager 上傳以下資料夾：
```
你的應用程式目錄/
├── client/            (整個 client 資料夾)
├── server/            (整個 server 資料夾)
├── build.js           (建置腳本)
├── package.json       (根目錄 package.json)
└── .gitignore         (可選)
```

**⚠️ 不要上傳：**
- `node_modules` 資料夾
- `.env` 或 `.env.local` 檔案
- `dist` 或 `build` 資料夾（會在遠端建置）

---

### 2️⃣ 設定 PostgreSQL 資料庫

#### 在 A2 cPanel 中：

1. **建立資料庫**
   - 進入 `PostgreSQL Databases`
   - 建立新資料庫，例如：`truthcircle`
   - 建立資料庫使用者並設定密碼
   - 將使用者加入資料庫（給予所有權限）

2. **設定遠端存取**
   - 在 `Remote PostgreSQL` 區域
   - 加入 `127.0.0.1` 到白名單
   - 儲存設定

3. **記錄連線資訊**
   ```
   主機: 127.0.0.1
   資料庫名稱: 你的資料庫名稱
   使用者名稱: 你的使用者名稱
   密碼: 你設定的密碼
   連接埠: 5432 (預設)
   ```

---

### 3️⃣ 在 A2 Hosting 建置專案

#### 方法 1: 使用 SSH（建議）

1. **登入 SSH**
   ```bash
   ssh 你的使用者名稱@你的網域.com
   ```

2. **進入專案目錄**
   ```bash
   cd ~/你的應用程式目錄
   ```

3. **執行建置**
   ```bash
   # 安裝根目錄依賴（build.js 需要）
   npm install
   
   # 執行建置（會自動安裝 client 依賴並建置）
   npm run build
   ```

4. **驗證建置成功**
   ```bash
   # 檢查 server/dist 是否存在
   ls server/dist
   # 應該看到 index.html 和 assets 資料夾
   ```

#### 方法 2: 使用 cPanel Terminal（如果沒有 SSH）

1. 在 cPanel 開啟 `Terminal`
2. 執行上述相同的命令

---

### 4️⃣ 設定 Node.js 應用程式

#### 在 A2 cPanel 的 `Setup Node.js App` 中：

1. **建立新應用程式**
   - Node.js version: `18.x` 或更新版本
   - Application mode: `Production`
   - Application root: 選擇 **server 子目錄**（例如 `/home/你的使用者名稱/truthcircle/server`）
   - Application URL: 選擇你的網域或子網域
   - Application startup file: `index.js`
   
   **⚠️ 重要：Application root 必須指向 `server` 資料夾，不是專案根目錄！**

2. **設定環境變數**（非常重要！）
   
   點擊你的應用程式旁邊的 "Edit" > 滾動到 "Environment variables"
   
   加入以下環境變數：

   | 變數名稱 | 值 | 說明 |
   |---------|-----|------|
   | `DATABASE_URL` | `postgresql://使用者名稱:密碼@127.0.0.1:5432/資料庫名稱` | PostgreSQL 連線字串 |
   | `JWT_SECRET` | `your-super-secret-key-here-change-this` | JWT 加密密鑰（請改成隨機字串） |
   | `NODE_ENV` | `production` | 執行環境 |
   | `PORT` | (通常自動設定) | 伺服器連接埠 |

   **DATABASE_URL 範例：**
   ```
   postgresql://truthcircle_user:MyPassword123@127.0.0.1:5432/truthcircle
   ```

3. **安裝依賴套件**
   - 點擊 "Run NPM Install" 按鈕
   - 等待安裝完成（這會在 server 目錄安裝 express, pg 等套件）
   - 或使用 SSH/Terminal：
     ```bash
     cd ~/你的應用程式目錄/server
     npm install
     ```

4. **啟動應用程式**
   - 點擊 "Start App"（或 "Restart" 如果已在執行）

---

### 5️⃣ 驗證部署

1. **檢查應用程式狀態**
   - 在 `Setup Node.js App` 中確認狀態為「Running」
   - 檢查是否有錯誤訊息

2. **檢查日誌**
   - 點擊應用程式旁的日誌圖示
   - 查看是否有以下訊息：
     ```
     🚀 Server running on port 3001
     ⏳ Connecting to database...
     ✅ Database initialization successful
     ```

3. **測試網站**
   - 開啟你的網域：`https://你的網域.com`
   - 確認首頁正常顯示
   - 測試登入功能（預設帳號：admin / admin）

---

## 🔧 常見問題排除

### ❌ 問題 1: 資料庫連線失敗 (`no pg_hba.conf entry`)

**解決方法：**
1. 確認 `127.0.0.1` 已加入 Remote PostgreSQL 白名單
2. 在 `Setup Node.js App` 中點擊 **Restart**
3. 等待 30 秒後重新檢查

---

### ❌ 問題 2: 應用程式無法啟動

**檢查事項：**
- ✅ `package.json` 中的 `"type": "module"` 是否存在
- ✅ `index.js` 檔案路徑是否正確
- ✅ `dist` 資料夾是否存在
- ✅ Node.js 版本是否 >= 18.0.0

---

### ❌ 問題 3: 前端頁面空白

**可能原因：**
- `dist` 資料夾未正確上傳
- 重新執行 `npm run build` 並重新上傳 `dist` 資料夾

---

### ❌ 問題 4: API 請求失敗

**檢查事項：**
- 在瀏覽器 Console 中查看錯誤訊息
- 確認 API 請求路徑是相對路徑（如 `/api/topics`）
- 確認伺服器正在運行

---

## 🔐 安全性建議

1. **修改預設管理員密碼**
   - 登入後立即修改 admin 帳號密碼

2. **保護環境變數**
   - 不要將 `.env` 檔案或敏感資訊上傳到 Git
   - `JWT_SECRET` 應該是長且隨機的字串

3. **啟用 HTTPS**
   - A2 Hosting 通常提供免費的 Let's Encrypt SSL
   - 在 cPanel 的 SSL/TLS 區域設定

---

## 📞 如果還有問題

1. 檢查 `Setup Node.js App` 中的應用程式日誌
2. 查看伺服器錯誤日誌（在 cPanel 的 Error Logs）
3. 確認所有環境變數都已正確設定
4. 確認資料庫連線字串格式正確

---

## 🎉 部署成功後

你的 TruthCircle 應用程式應該已經在線上運行！

**預設帳號：**
- 使用者名稱：`admin`
- 密碼：`admin`

**★ 請記得立即修改預設密碼！**
