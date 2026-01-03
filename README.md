# Opix

Opix - 一個基於事實驗證的社群討論平台，讓使用者能夠針對各種議題進行理性討論、事實查核與觀點分享。

## 📋 專案簡介

Opix 是一個現代化的討論平台，特色包括：

- 🎯 **多類別主題討論**：科學、歷史、科技、健康、環境、經濟、政治等分類
- 💬 **互動式留言系統**：支持立場標記（支持/反對/中立）和投票功能
- 📊 **投票功能**：支持主題投票和留言投票
- 🔐 **用戶認證系統**：註冊、登入、個人檔案管理
- 📱 **響應式設計**：支援各種裝置瀏覽
- 🎨 **現代化 UI**：使用 Tailwind CSS 打造美觀介面

## 🛠️ 技術棧

### 前端
- **React 18** - UI 框架
- **TypeScript** - 類型安全
- **Vite 4** - 建置工具
- **Tailwind CSS** - 樣式框架
- **Lucide React** - 圖標庫
- **Google Gemini AI** - AI 分析功能

### 後端
- **Node.js** - 執行環境
- **Express** - Web 框架
- **PostgreSQL** - 資料庫
- **JWT** - 身份驗證
- **bcryptjs** - 密碼加密

## 📦 專案結構

```
truthcircle_web/
├── client/                 # 前端應用
│   ├── src/
│   │   ├── App.tsx        # 主應用組件
│   │   ├── components/    # React 組件
│   │   ├── services/      # API 服務
│   │   └── types.ts       # TypeScript 類型定義
│   ├── package.json
│   └── vite.config.ts
├── server/                 # 後端應用
│   ├── index.js           # 主伺服器檔案
│   └── package.json
├── build.js               # 建置腳本
└── package.json           # 根配置
```

## 🚀 快速開始

### 本地開發

#### 1. 安裝依賴

```bash
# 安裝所有依賴（根目錄、client、server）
npm run install:all
```

#### 2. 設定環境變數

在 `server` 目錄建立 `.env` 檔案：

```env
DATABASE_URL=postgresql://username:password@localhost:5432/opix
JWT_SECRET=your-secret-key
NODE_ENV=development
PORT=3001
```

#### 3. 啟動開發伺服器

開啟兩個終端機視窗：

**終端機 1 - 前端：**
```bash
cd client
npm run dev
```

**終端機 2 - 後端：**
```bash
cd server
npm run dev
```

前端將在 `http://localhost:5173` 運行
後端 API 在 `http://localhost:3001` 運行

### 生產環境建置

```bash
# 執行建置腳本
npm run build

# 建置完成後，server/dist 將包含前端靜態檔案
```

## 🌐 部署到 A2 Hosting

完整的部署指南請參考 [DEPLOYMENT.md](./DEPLOYMENT.md)

快速步驟：

1. 上傳整個專案到 A2 Hosting
2. 在伺服器上執行 `npm run build`
3. 在 cPanel 設定 Node.js App
4. 設定環境變數
5. 啟動應用

## 🔐 預設帳號

首次啟動應用程式時，系統會自動創建預設管理員帳號：

- **使用者名稱：** `admin`
- **密碼：** `admin`

⚠️ **請在首次登入後立即修改密碼！**

## 📚 API 端點

### 認證
- `POST /api/auth/register` - 註冊新用戶
- `POST /api/auth/login` - 用戶登入
- `GET /api/auth/me` - 取得當前用戶資訊

### 主題
- `GET /api/topics` - 取得所有主題
- `POST /api/topics` - 建立新主題
- `POST /api/topics/:id/analysis` - 更新 AI 分析

### 留言
- `POST /api/comments` - 建立新留言
- `POST /api/vote` - 對留言投票

### 投票
- `POST /api/topics/poll/vote` - 投票選項投票
- `POST /api/favorite` - 收藏/取消收藏主題

## 🗄️ 資料庫架構

應用程式使用 PostgreSQL，包含以下主要資料表：

- `users` - 用戶資料
- `topics` - 主題資料
- `comments` - 留言資料
- `votes` - 留言投票記錄
- `topic_votes` - 主題投票記錄
- `poll_options` - 投票選項
- `poll_votes` - 投票記錄
- `favorites` - 收藏記錄

資料庫會在應用程式首次啟動時自動初始化。

## 🤝 貢獻

歡迎提交 Pull Request 或開 Issue！

## 📄 授權

MIT License

## 📧 聯絡

如有問題或建議，歡迎聯繫專案維護者。

---

**Built with ❤️ using React, Node.js, and PostgreSQL**
