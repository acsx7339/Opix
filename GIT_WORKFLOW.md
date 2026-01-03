# Git 開發工作流程

Opix 專案使用 Git 進行版本控制。本指南說明分支策略和開發流程。

## 🌳 分支策略

### 主要分支

- **`main`** - 生產環境分支
  - 隨時可部署到 A2 Hosting
  - 只包含穩定、測試過的程式碼
  - 受保護，只能透過 PR 合併

- **`develop`** - 開發分支
  - 用於整合新功能
  - 測試新功能的環境
  - 所有新功能先合併到這裡

### 功能分支

為每個新功能或修復創建獨立分支：

```bash
feature/用戶登入改進
feature/主題搜尋功能
bugfix/留言排序錯誤
hotfix/緊急安全修復
```

---

## 🚀 開發流程

### 1. 開始新功能

```bash
# 確保在最新的 develop 分支
git checkout develop
git pull origin develop

# 創建新功能分支
git checkout -b feature/新功能名稱

# 例如：
git checkout -b feature/comment-reply
```

### 2. 開發與提交

```bash
# 進行開發...

# 查看修改
git status

# 加入修改的檔案
git add .

# 提交
git commit -m "feat: 新增留言回覆功能"

# 推送到遠端
git push origin feature/新功能名稱
```

### 3. 測試功能

```bash
# 在本地測試
npm run build
npm start

# 確認功能正常運作
```

### 4. 合併到 develop

```bash
# 切換到 develop
git checkout develop

# 拉取最新更新
git pull origin develop

# 合併功能分支
git merge feature/新功能名稱

# 解決衝突（如果有）

# 推送到遠端
git push origin develop
```

### 5. 部署到測試環境（可選）

如果您有測試環境，可以將 `develop` 部署到測試伺服器：

```bash
# 在測試伺服器上
git checkout develop
git pull origin develop
npm run build
# 重啟應用
```

### 6. 合併到 main（準備上線）

功能測試完成後：

```bash
# 切換到 main
git checkout main

# 拉取最新更新
git pull origin main

# 合併 develop
git merge develop

# 推送到遠端
git push origin main
```

### 7. 部署到生產環境

```bash
# 在 A2 Hosting 上
git checkout main
git pull origin main
npm run build
# 在 cPanel 重啟應用
```

---

## 📝 提交訊息規範

使用語義化提交訊息：

```bash
feat: 新增功能
fix: 修復錯誤
docs: 文檔更新
style: 格式調整（不影響功能）
refactor: 重構程式碼
test: 新增或修改測試
chore: 維護性任務
```

**範例：**
```bash
git commit -m "feat: 新增主題搜尋功能"
git commit -m "fix: 修正留言排序錯誤"
git commit -m "docs: 更新部署指南"
```

---

## 🔄 常用指令

### 查看分支

```bash
# 查看本地分支
git branch

# 查看所有分支（包含遠端）
git branch -a

# 查看當前分支
git branch --show-current
```

### 切換分支

```bash
# 切換到現有分支
git checkout develop

# 創建並切換到新分支
git checkout -b feature/新功能
```

### 更新分支

```bash
# 拉取最新程式碼
git pull origin develop

# 拉取所有分支
git fetch --all
```

### 刪除分支

```bash
# 刪除本地分支（已合併）
git branch -d feature/舊功能

# 強制刪除本地分支
git branch -D feature/舊功能

# 刪除遠端分支
git push origin --delete feature/舊功能
```

---

## 🔧 處理衝突

當合併時出現衝突：

```bash
# 1. Git 會標記衝突檔案
git status

# 2. 手動編輯衝突檔案
# 尋找 <<<<<<< HEAD 和 >>>>>>> 標記
# 選擇要保留的程式碼

# 3. 標記衝突已解決
git add 衝突檔案

# 4. 完成合併
git commit
```

---

## 🎯 最佳實踐

### 1. 經常提交
- 小幅度、頻繁的提交
- 每個提交只做一件事
- 寫清楚的提交訊息

### 2. 保持分支更新
```bash
# 在功能分支上定期合併 develop
git checkout feature/你的功能
git merge develop
```

### 3. 推送前先拉取
```bash
git pull origin develop
git push origin develop
```

### 4. 使用 .gitignore
已設定忽略：
- `node_modules/`
- `dist/` 和 `build/`
- `.env` 和 `.env.local`

### 5. 定期清理分支
刪除已合併的功能分支保持倉庫整潔

---

## 🚨 緊急修復流程（Hotfix）

生產環境發現嚴重問題時：

```bash
# 從 main 創建 hotfix 分支
git checkout main
git checkout -b hotfix/緊急修復描述

# 修復問題
# ...

# 測試確認

# 合併到 main
git checkout main
git merge hotfix/緊急修復描述
git push origin main

# 也要合併到 develop
git checkout develop
git merge hotfix/緊急修復描述
git push origin develop

# 立即部署到 A2
# 在 A2 上執行 git pull 和重啟
```

---

## 📊 目前分支狀態

✅ **已創建的分支：**
- `main` - 生產環境分支
- `develop` - 開發分支（目前在此分支）

---

## 💡 快速參考

**開始新功能：**
```bash
git checkout develop
git pull
git checkout -b feature/功能名稱
```

**完成功能：**
```bash
git add .
git commit -m "feat: 功能描述"
git push origin feature/功能名稱
git checkout develop
git merge feature/功能名稱
git push origin develop
```

**部署到生產：**
```bash
git checkout main
git merge develop
git push origin main
# 在 A2 上 git pull 並重啟
```

---

**祝開發順利！** 🎉
