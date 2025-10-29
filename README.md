# 短期通行許可虛擬憑證發行與驗證系統

基於台灣數位發展部數位憑證皮夾（TW DIW）沙盒系統的競賽專案。

## 📋 專案簡介

本系統實現了短期通行許可虛擬憑證的完整發行與驗證流程，適用於訪客證管理、活動出入場等場景。使用者可以透過掃描 QR Code 取得虛擬憑證，門禁人員透過驗證系統快速驗證訪客身份。

## ✨ 核心功能

### 發行端
- 虛擬身分證資料輸入（模擬掃描）
- 通行資訊設定（通行身份、編號、有效期限）
- 自動產生短期通行許可虛擬憑證 QR Code
- 白名單自動建立與管理

### 驗證端
- 產生驗證 QR Code
- 即時驗證訪客憑證
- 白名單自動比對
- 驗證紀錄完整保存

## 🛠 技術棧

**前端：**
- HTML5 / CSS3 / Vanilla JavaScript
- Bootstrap 5.3 (UI 框架)
- QRCode.js (QR Code 生成)

**後端：**
- Node.js + Express.js
- 簡易記憶體資料存儲（可替換為資料庫）

**外部服務：**
- 台灣數位憑證皮夾 (TW DIW) 沙盒系統

## 📦 安裝指南

### 前置條件
- Node.js 14.0 以上
- npm 6.0 以上
- Git

### 安裝步驟

1. **複製此 Repository**
```bash
git clone https://github.com/你的帳號/short-term-access-permit.git
cd short-term-access-permit
```

2. **安裝依賴套件**
```bash
npm install
```

3. **設定環境變數**
```bash
cp .env.example .env
```

編輯 `.env` 檔案，填入你的沙盒系統 API Token：
```
ISSUER_API_URL=https://issuer-sandbox.wallet.gov.tw/issuer
ISSUER_ACCESS_TOKEN=你的發行端AccessToken
VERIFIER_API_URL=https://verifier-sandbox.wallet.gov.tw/verifier
VERIFIER_ACCESS_TOKEN=你的驗證端AccessToken
VC_TEMPLATE_CODE=stp1
VP_CODE=stpvp1
VP_REF=00000000_stpvp1
PORT=3000
```

4. **啟動開發伺服器**
```bash
npm run dev
```

5. **開啟瀏覽器**
訪問 `http://localhost:3000`

## 📊 系統架構

```
Frontend (HTML/CSS/JS)
    ↓
Express.js Backend
    ↓
API 路由層
    ↓
TW DIW 沙盒系統
```

## 🎯 使用流程

### 發行端使用流程

1. **步驟 1：輸入虛擬身分證資料**
   - 姓名
   - 民國出生年月日（7碼）
   - 身分證字號

2. **步驟 2：設定通行資訊**
   - 選擇通行身份（訪客/廠商/臨時人員等）
   - 輸入或自動產生通行編號
   - 選擇有效期限

3. **步驟 3：產生憑證**
   - 確認資訊無誤
   - 按下「產生訪客證 QR Code」
   - 系統產生 QR Code 供訪客掃描
   - 資料自動加入白名單

### 驗證端使用流程

1. **產生驗證 QR Code**
   - 按下「產生驗證 QR Code」按鈕
   - 系統產生驗證用 QR Code

2. **訪客掃描**
   - 訪客使用數位憑證皮夾 APP 掃描驗證 QR Code

3. **自動驗證**
   - 系統驗證憑證真偽
   - 自動與白名單比對
   - 顯示驗證結果（通過/失敗）

## 📁 專案結構

```
short-term-access-permit/
├── README.md                      # 專案說明文件
├── .env.example                   # 環境變數範本
├── .env                          # 環境變數（不上傳到 Git）
├── .gitignore                    # Git 忽略檔案清單
├── LICENSE                       # MIT 授權
├── package.json                  # 專案配置
├── package-lock.json             # 依賴版本鎖定
├── server.js                     # Express 伺服器主檔案
├── public/                       # 靜態檔案
│   ├── index.html               # 首頁
│   ├── issuer.html              # 發行端頁面
│   ├── verifier.html            # 驗證端頁面
│   ├── css/
│   │   └── style.css            # 通用樣式
│   └── js/
│       ├── common.js            # 公共函數
│       ├── issuer.js            # 發行端邏輯
│       └── verifier.js          # 驗證端邏輯
└── docs/                         # 文檔資料夾
    └── setup.md                 # 設定指南
```

## 🔐 API 規格

### 發行 API

#### POST /api/issue-credential
發行虛擬憑證

**請求格式：**
```json
{
  "name": "王小明",
  "roc_brithday": "0900101",
  "id_number": "A123456789",
  "pass_status": "訪客",
  "pass_id": "ACC202410300001",
  "issueDate": "2024-10-30",
  "expiryDate": "2024-11-02"
}
```

**回應格式：**
```json
{
  "success": true,
  "qrCodeUrl": "data:image/...",
  "vcUid": "vc_uid_123456",
  "message": "憑證發行成功"
}
```

### 驗證 API

#### POST /api/generate-verification-qr
產生驗證 QR Code

**回應格式：**
```json
{
  "success": true,
  "qrCodeUrl": "data:image/...",
  "sessionId": "session_123456",
  "message": "驗證 QR Code 產生成功"
}
```

#### GET /api/verification-result/:sessionId
查詢驗證結果

**回應格式：**
```json
{
  "success": true,
  "status": "completed",
  "data": {
    "name": "王小明",
    "pass_status": "訪客",
    "pass_id": "ACC202410300001"
  }
}
```

## 🧪 測試指南

### 開發測試

1. 啟動開發伺服器
```bash
npm run dev
```

2. 開啟瀏覽器 DevTools (F12)，查看 Console 輸出

3. **發行端測試：**
   - 前往 http://localhost:3000/issuer.html
   - 填寫測試資料
   - 點擊「產生訪客證 QR Code」
   - 檢查 Console 查看 API 呼叫狀況

4. **驗證端測試：**
   - 前往 http://localhost:3000/verifier.html
   - 點擊「產生驗證 QR Code」
   - 查看是否成功產生驗證 QR Code

### 沙盒系統測試

1. **安裝數位憑證皮夾 APP**
   - iOS: TestFlight
   - Android: 官方渠道

2. **掃描發行 QR Code**
   - 使用 APP 掃描網站產生的憑證 QR Code
   - 確認憑證成功新增至 APP

3. **驗證流程測試**
   - 產生驗證 QR Code
   - 使用 APP 掃描驗證 QR Code
   - 確認驗證結果正確返回

## 📝 白名單管理

### 自動管理
- 每次發行新憑證時，系統自動新增到白名單
- 白名單資料儲存在記憶體中（開發環境）

### 白名單資料結構
```javascript
{
  pass_id: "ACC202410300001",      // 通行編號
  name: "王小明",                   // 姓名
  pass_status: "訪客",              // 通行身份
  issue_time: "2024-10-30 10:30:45", // 發行時間
  status: "active"                  // 狀態
}
```

## 🔗 有用的連結

- [數位憑證皮夾官方網站](https://wallet.gov.tw)
- [TW DIW 沙盒系統 - 發行端](https://issuer-sandbox.wallet.gov.tw)
- [TW DIW 沙盒系統 - 驗證端](https://verifier-sandbox.wallet.gov.tw)
- [數位發展部官網](https://moda.gov.tw)

## 📄 授權條款

本專案採用 MIT 授權，詳見 [LICENSE](./LICENSE) 檔案

## 👥 貢獻

歡迎提交 Issue 或 Pull Request！

## 📧 聯絡方式

如有任何問題，請透過以下方式聯絡：
- GitHub Issues: [提交 Issue](https://github.com/yourusername/short-term-access-permit/issues)
- Email: your.email@example.com

---

**最後更新時間：** 2024-10-30  
**版本：** 1.0.0  
**狀態：** 開發中 🚧