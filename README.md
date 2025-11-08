# 短期通行許可虛擬憑證系統

## 📋 專案概述

**短期通行許可虛擬憑證系統** 是一個完整的數位憑證發行和驗證平台，用於管理短期訪客、臨時人員和承包商的通行權限。系統採用 QR Code 技術，提供安全、便捷的通行許可管理方案。

### 🎯 核心功能

- **虛擬憑證發行** - 快速生成短期通行許可
- **QR Code 驗證** - 掃碼驗證身份和權限
- **白名單管理** - 即時管理有效和過期憑證
- **個資保護** - 敏感信息打碼顯示
- **多端適配** - 桌面和移動設備完全支持

---

## ✨ 主要特性

### 發行端 (Issuer)

#### 三步驟簡潔流程
1. **步驟 1：虛擬身分證資料**
   - 輸入姓名、身分證字號、民國出生年月日
   - 格式驗證
   - 清晰的提示說明

2. **步驟 2：通行資訊設定**
   - 選擇通行身份（訪客/臨時人員/承包商）
   - 設定有效期限（1-30天）
   - 自動計算小時數
   - 一鍵產生通行編號

3. **步驟 3：產生憑證**
   - 確認摘要資訊（已打碼保護）
   - 生成 QR Code
   - 自動添加白名單
   - 發行成功確認

#### 個資保護
- 姓名：王小明 → 王**
- 身分證：F123456789 → F1*****789
- 出生年月日：民國90年1月1日 → 民國90年\*\*月\*\*日
- 只影響顯示，實際數據保持完整

#### 白名單管理
- 自動記錄所有發行的憑證
- 顯示發行時間、到期日期
- 過期憑證自動標記
- 支持即時刪除特定人員權限

### 驗證端 (Verifier)

#### 掃碼驗證
- 掃描 QR Code 驗證身份
- 實時白名單比對
- 清晰的驗證結果反饋

#### 驗證紀錄
- 完整的驗證日誌
- 包含時間戳、人員、結果
- 支持歷史查詢

---

## 🛠️ 技術棧

### 前端
- **框架：** HTML5、CSS3、Bootstrap 5
- **JavaScript：** 純 JavaScript（無外部框架依賴）
- **QR Code：** QRCode.js 庫
- **儲存：** LocalStorage 本地存儲

### 後端
- **Runtime：** Node.js
- **框架：** Express.js
- **API：** RESTful 架構
- **數據存儲：** JSON 文件（便於部署）

### 工具
- **版本控制：** Git/GitHub
- **開發工具：** VS Code
- **測試：** 瀏覽器 DevTools

---

## 📁 專案結構

```
短期通行許可虛擬憑證系統/
├── public/
│   ├── css/
│   │   └── style.css          # 統一樣式表
│   ├── js/
│   │   ├── common.js          # 公共函數庫（包括打碼函數）
│   │   ├── issuer.js          # 發行端主邏輯
│   │   └── verifier.js        # 驗證端主邏輯
│   └── qrcode.min.js          # QR Code 庫
├── public/
│   ├── issuer.html            # 發行端頁面
│   ├── verifier.html          # 驗證端頁面
│   └── index.html             # 首頁
├── data/
│   ├── whitelist.json         # 白名單數據
│   └── verification-logs.json # 驗證紀錄
├── server.js                  # Express 伺服器
├── package.json               # 依賴配置
└── README.md                  # 本文檔
```

---

## 🚀 快速開始

### 安裝環境

#### 前置要求
- Node.js 12.0+ 
- npm 6.0+
- 現代瀏覽器（Chrome、Firefox、Safari、Edge）

#### 安裝步驟

1. **克隆專案**
```bash
git clone https://github.com/你的用户名/short-term-vc-system.git
cd short-term-vc-system
```

2. **安裝依賴**
```bash
npm install
```

3. **啟動伺服器**
```bash
npm run dev
```

4. **存取應用**
- 首頁：http://localhost:3000
- 發行端：http://localhost:3000/issuer.html
- 驗證端：http://localhost:3000/verifier.html

---

## 📖 使用說明

### 發行流程

#### 1. 進入發行端
```
http://localhost:3000/issuer.html
```

#### 2. 填寫個人資訊（步驟 1）
- 輸入姓名（中英文、數字和底線）
- 輸入身分證字號（1 字母 + 9 數字）
- 輸入民國出生年月日（YYYYMMDD 格式）
- 點擊「下一步」

#### 3. 設定通行資訊（步驟 2）
- 選擇通行身份
- 設定有效期限（1-30 天）
- 點擊「產生編號」生成通行編號
- 點擊「下一步」

#### 4. 確認並發行（步驟 3）
- 檢查摘要資訊（自動打碼）
- 點擊「產生訪客證 QR Code」
- QR Code 自動生成並添加白名單
- 完成發行

### 驗證流程

#### 1. 進入驗證端
```
http://localhost:3000/verifier.html
```

#### 2. 掃描 QR Code
- 使用相機或掃描工具
- 掃描發行的 QR Code

#### 3. 查看驗證結果
- ✓ 通過：允許通行
- ✗ 失敗：拒絕通行

#### 4. 查看驗證紀錄
- 完整的驗證日誌列表
- 包含時間、人員、結果

---

## 🔐 安全性考慮

### 個資保護
- 敏感信息在前端打碼顯示
- 實際數據在後端保持完整，用於驗證
- 支持根據需求調整打碼規則

### 白名單驗證
- 到期自動禁用
- 支持手動刪除權限
- 驗證時實時比對

### 數據存儲
- JSON 文件儲存於服務器本地
- 建議定期備份數據文件
- 支持遷移到數據庫

---

## 🔧 API 端點

### 白名單管理

**GET** `/api/whitelist` - 獲取所有白名單
```bash
curl http://localhost:3000/api/whitelist
```

**POST** `/api/whitelist` - 添加白名單
```bash
curl -X POST http://localhost:3000/api/whitelist \
  -H "Content-Type: application/json" \
  -d '{"name": "王小明", "pass_id": "ACC..."}'
```

**DELETE** `/api/whitelist/:id` - 刪除白名單項目
```bash
curl -X DELETE http://localhost:3000/api/whitelist/123
```

### 發行憑證

**POST** `/api/issue-credential` - 發行憑證
```bash
curl -X POST http://localhost:3000/api/issue-credential \
  -H "Content-Type: application/json" \
  -d '{
    "name": "王小明",
    "id_number": "F123456789",
    "pass_status": "訪客"
  }'
```

### 驗證紀錄

**GET** `/api/verification-logs` - 獲取驗證紀錄
```bash
curl http://localhost:3000/api/verification-logs
```

---

## 🎨 UI/UX 特性

### 設計原則
- **簡潔清晰** - 減少用戶認知負擔
- **一致性** - 所有頁面設計風格統一
- **響應式** - 自動適配各種屏幕
- **無障礙** - 支持鍵盤導航

### 視覺設計
- 優雅的漸變背景
- 卡片式佈局
- 清晰的步驟指示
- 友善的錯誤提示

### 交互反饋
- 操作成功/失敗提示
- 加載狀態顯示
- 實時計算結果
- 清晰的導航流程

---

## 🧪 測試

### 測試用例

#### 驗證端測試數據
```
姓名：王小明
身分證：F123456789
出生年月日：0900101
通行身份：訪客
有效期限：3天
```

#### 快速測試
1. 發行一個新憑證
2. 掃描 QR Code
3. 驗證應該通過
4. 檢查白名單
5. 刪除白名單項目
6. 再次驗證應該失敗

---

## 📋 已知限制

- 當前版本使用 JSON 文件存儲，不適合大規模部署
- QR Code 掃描需要支持相機的設備
- 白名單未加密（建議在生產環境添加安全層）

---

## 📝 更新日誌

### v1.0 (2025-11-09) - 正式發佈
- ✅ 完整的發行和驗證流程
- ✅ 個資打碼保護功能
- ✅ 白名單管理系統
- ✅ QR Code 生成和掃描
- ✅ 統一的 UI/UX 設計
- ✅ 響應式佈局支持
- ✅ 完整的 API 接口

---

## 📄 授權

本專案採用 MIT License - 詳見 [LICENSE](LICENSE) 文件

---

## 📞 聯繫方式

- **郵件** - d1124181023@gm.lhu.edu.tw