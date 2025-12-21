# TruthCircle 開發與部署指南 (Cheat Sheet)

這份文件總結了專案的開發與部署規則，讓您不用記那麼多指令。

## 核心規則

| 分支 | 用途 | Docker 狀態 | 部署目標 |
| :--- | :--- | :--- | :--- |
| **develop** | 本地開發、功能驗證 | **保留** (用於本地測試) | 本地 Docker 環境 |
| **main** | 正式上線版本 | **移除** (A2 用不到) | A2 Hosting |

---

## 🚀 1. 怎麼把新功能發布出去？（一鍵更新）

當您在 `develop` 分支測試完畢，想要上傳到正式站時，**不需要**手動切換分支或刪除檔案。
請直接在終端機執行我們準備好的腳本：

```bash
./release.sh
```

**這個腳本會自動幫您：**
1.  切換到 `main` 分支
2.  合併 `develop` 的最新進度
3.  **自動刪除** `main` 分支上的 Docker 檔案（保持 A2 環境乾淨）
4.  推送到 GitHub
5.  自動切換回 `develop` 讓您繼續開發

---

## ☁️ 2. A2 Hosting 怎麼更新？

當上面的腳本跑完後，請登入 A2 Hosting (SSH)，然後執行：

```bash
./deploy_a2.sh
```

**這個腳本會自動幫您：**
1.  從 GitHub 下載最新程式碼 (到 `Depoly_Source`)
2.  編譯前端 (Build)
3.  複製 `dist`、`index.js` 等必要檔案到正式目錄
4.  安裝後端依賴

> **最後一步**：去 cPanel -> "Setup Node.js App" -> **點擊 "Restart"**

---

## 🗄️ 3. 資料庫怎麼更新？

如果在 `develop` 開發過程中改了資料庫（例如新增了 Table 或欄位）：

1.  目前需要**手動**同步。
2.  請使用 Adminer 或 SSH 連進 A2 的資料庫。
3.  執行對應的 SQL 指令（例如 `CREATE TABLE...` 或 `ALTER TABLE...`）。
    *   *提示：可以在 `server/migrations` 資料夾裡找您寫過的 SQL。*

---

## 🛠️ 常用指令速查

| 想要做什麼 | 指令 |
| :--- | :--- |
| **開始開發新功能** | `git checkout develop` |
| **測試本地 Docker** | `docker-compose up --build` |
| **發布到 GitHub (Main)** | `./release.sh` |
| **部署到 A2 Server** | `./deploy_a2.sh` (在 A2 Server 上執行) |
