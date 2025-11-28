// 載入必要套件
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const https = require('https'); 
const crypto = require('crypto');

// 建立 Express 應用程式
const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體設定
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============================================
// 白名單持久化配置
// ============================================

const WHITELIST_FILE = path.join(__dirname, 'whitelist.json');

/**
 * 從檔案載入白名單
 */
function loadWhitelistFromFile() {
    try {
        if (fs.existsSync(WHITELIST_FILE)) {
            const data = fs.readFileSync(WHITELIST_FILE, 'utf8');
            const parsed = JSON.parse(data);
            console.log('✓ 從檔案載入白名單，共', parsed.length, '筆');
            return parsed;
        }
    } catch (error) {
        console.error('❌ 讀取白名單檔案失敗:', error);
    }
    return [];
}

/**
 * 儲存白名單到檔案
 */
function saveWhitelistToFile(data) {
    try {
        fs.writeFileSync(WHITELIST_FILE, JSON.stringify(data, null, 2));
        console.log('✓ 白名單已儲存到檔案，共', data.length, '筆');
    } catch (error) {
        console.error('❌ 儲存白名單失敗:', error);
    }
}

// 白名單管理（內存版本 + 檔案備份）
let whitelist = loadWhitelistFromFile();

// ============================================
// 清理過期的白名單項目
// ============================================

function cleanupExpiredWhitelist() {
    const now = new Date();
    const initialCount = whitelist.length;
    
    whitelist = whitelist.filter(entry => {
        if (!entry.expiry_date) return true;
        const expiryDate = new Date(entry.expiry_date);
        return expiryDate > now;
    });
    
    const removedCount = initialCount - whitelist.length;
    if (removedCount > 0) {
        saveWhitelistToFile(whitelist);
        console.log(`✓ 已清理 ${removedCount} 筆過期白名單項目`);
    }
}

// 在伺服器啟動時立即執行一次
cleanupExpiredWhitelist();

// 每 1 小時執行一次清理
setInterval(cleanupExpiredWhitelist, 60 * 60 * 1000);

// ============================================
// 工具函數：生成交易序號 (UUID v4)
// ============================================

function generateTransactionId() {  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = crypto.randomBytes(1)[0] % 16;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ============================================
// API 路由：發行憑證
// ============================================

app.post('/api/issue-credential', async (req, res) => {
    try {
        const credentialData = req.body;
        console.log('收到發行憑證請求:', credentialData);

        // 準備呼叫發行端 API 的資料
        const issuerPayload = {
            vcUid: process.env.VC_TEMPLATE_CODE,
            issuanceDate: credentialData.issueDate.replace(/-/g, ''),
            expiredDate: credentialData.expiryDate.replace(/-/g, ''),
            fields: [
                { ename: 'name', content: credentialData.name },
                { ename: 'roc_birthday', content: credentialData.roc_brithday },
                { ename: 'id_number', content: credentialData.id_number },
                { ename: 'pass_status', content: credentialData.pass_status },
                { ename: 'pass_id', content: credentialData.pass_id },
                { ename: 'issueDate', content: credentialData.issueDate },
                { ename: 'expiryDate', content: credentialData.expiryDate }
            ]
        };

        console.log('準備送出的 payload:', JSON.stringify(issuerPayload, null, 2));

        // 呼叫發行端 API
        const apiUrl = `${process.env.ISSUER_API_URL}/api/qrcode/data`;
        console.log('API 呼叫 URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Access-Token': process.env.ISSUER_ACCESS_TOKEN,
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(issuerPayload)
        });

        console.log('沙盒系統回應狀態碼:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('沙盒系統錯誤回應:', errorText);
            throw new Error(`發行端 API 錯誤: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('發行端回應:', result);

        // 重要：需要將沙盒 API 回傳的所有必要字段透傳給前端
        // 包括：transactionId（用於顯示）、qrCode、deeplink 等

        res.json({
            success: true,
            qrCode: result.qrCode,
            transactionId: result.transactionId,
            message: '憑證發行成功'
        });

    } catch (error) {
        console.error('發行憑證錯誤:', error);
        res.status(500).json({
            success: false,
            message: '憑證發行失敗: ' + error.message
        });
    }
});

// ============================================
// API 路由：產生驗證 QR Code
// ============================================

app.post('/api/generate-verification-qr', async (req, res) => {
    try {
        console.log('產生驗證 QR Code');

        const transactionId = generateTransactionId();
        const ref = process.env.VP_REF;

        console.log('交易序號:', transactionId);
        console.log('VP_REF:', ref);

        const apiUrl = `${process.env.VERIFIER_API_URL}/api/oidvp/qrcode?ref=${ref}&transactionId=${transactionId}`;
        console.log('驗證端 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Access-Token': process.env.VERIFIER_ACCESS_TOKEN,
                'accept': 'application/json'
            }
        });

        console.log('驗證端回應狀態碼:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('驗證端錯誤回應:', errorText);
            throw new Error(`驗證端 API 錯誤: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('【沙盒系統完整回應】:', JSON.stringify(result, null, 2));
        console.log('【回應中所有 key】:', Object.keys(result));

        // 根據實際回應決定要傳回什麼
        let qrCodeValue = result.qrCode;
        if (!qrCodeValue && result.qrcode) qrCodeValue = result.qrcode;
        if (!qrCodeValue && result.qrcodeImage) qrCodeValue = result.qrcodeImage;
        if (!qrCodeValue && result.imageData) qrCodeValue = result.imageData;

        console.log('【最終使用的 QR Code 值】:', qrCodeValue ? '存在' : '不存在');

        res.json({
            success: true,
            qrCode: qrCodeValue,
            transactionId: transactionId,
            ref: ref,
            message: '驗證 QR Code 產生成功'
        });

    } catch (error) {
        console.error('產生驗證 QR Code 錯誤:', error);
        res.status(500).json({
            success: false,
            message: '產生驗證 QR Code 失敗: ' + error.message
        });
    }
});

// ============================================
// API 路由：查詢驗證結果
// ============================================

app.get('/api/verification-result/:transactionId', async (req, res) => {
    try {
        const { transactionId } = req.params;
        console.log('查詢驗證結果:', transactionId);

        const apiUrl = `${process.env.VERIFIER_API_URL}/api/oidvp/result?transactionId=${transactionId}`;
        console.log('查詢 API URL:', apiUrl);

        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Access-Token': process.env.VERIFIER_ACCESS_TOKEN,
                'accept': 'application/json'
            }
        });

        console.log('驗證端回應狀態碼:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('驗證端錯誤回應:', errorText);

            if (response.status === 204) {
                return res.json({
                    success: false,
                    status: 'pending',
                    message: '等待使用者掃描'
                });
            }

            throw new Error(`驗證端 API 錯誤: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('【驗證端回應結果】:', JSON.stringify(result, null, 2));

        // 檢查驗證是否成功
        if (result.verifyResult === true || result.resultDescription === 'success') {
            console.log('✓ 驗證成功！');

            if (result.data && result.data.length > 0) {
                const credentialData = result.data[0];
                const claims = credentialData.claims || [];

                console.log('【提取的 claims】:', claims);

                // 將 claims 陣列轉換為物件
                const claimsObj = {};
                claims.forEach(claim => {
                    claimsObj[claim.ename] = claim.value;
                });

                console.log('【轉換後的 claims 物件】:', claimsObj);

                // === 【關鍵】與白名單比對 ===
                console.log('【準備與白名單比對】');
                console.log('【目前白名單】:', whitelist);

                const pass_id = claimsObj.pass_id;
                const name = claimsObj.name;
                const pass_status = claimsObj.pass_status;

                // 檢查白名單中是否存在此通行編號
                const whitelistEntry = whitelist.find(item =>
                    item.pass_id === pass_id &&
                    item.status === 'active'
                );

                if (!whitelistEntry) {
                    console.log('❌ 通行編號不在白名單中:', pass_id);
                    return res.json({
                        success: true,
                        status: 'failed',
                        verifyResult: false,
                        message: '通行編號不在白名單中'
                    });
                }

                // 檢查是否已過期
                const expiryDate = new Date(whitelistEntry.expiry_date);
                if (expiryDate < new Date()) {
                    console.log('❌ 憑證已過期');
                    return res.json({
                        success: true,
                        status: 'failed',
                        verifyResult: false,
                        message: '憑證已過期'
                    });
                }

                // 檢查姓名是否相符
                if (whitelistEntry.name !== name) {
                    console.log('❌ 姓名不符:', '白名單=', whitelistEntry.name, '掃描=', name);
                    return res.json({
                        success: true,
                        status: 'failed',
                        verifyResult: false,
                        message: '姓名不符'
                    });
                }

                // 檢查通行身份是否相符
                if (whitelistEntry.pass_status !== pass_status) {
                    console.log('❌ 通行身份不符:', '白名單=', whitelistEntry.pass_status, '掃描=', pass_status);
                    return res.json({
                        success: true,
                        status: 'failed',
                        verifyResult: false,
                        message: '通行身份不符'
                    });
                }

                // ✅ 所有檢查都通過
                console.log('✅ 白名單比對成功！');
                return res.json({
                    success: true,
                    status: 'completed',
                    verifyResult: result.verifyResult,
                    data: {
                        name: name,
                        roc_birthday: claimsObj.roc_birthday,
                        id_number: claimsObj.id_number,
                        pass_status: pass_status,
                        pass_id: pass_id,
                        issueDate: claimsObj.issueDate,
                        expiryDate: claimsObj.expiryDate
                    },
                    message: '驗證通過'
                });
            }
        }

        // 驗證失敗
        if (result.verifyResult === false) {
            console.log('✗ 驗證失敗');
            return res.json({
                success: true,
                status: 'failed',
                message: result.resultDescription || '驗證失敗'
            });
        }

        // 仍在等待
        console.log('⏳ 等待驗證結果...');
        res.json({
            success: true,
            status: 'pending',
            message: '等待驗證結果'
        });

    } catch (error) {
        console.error('查詢驗證結果錯誤:', error);
        res.status(500).json({
            success: false,
            message: '查詢驗證結果失敗: ' + error.message
        });
    }
});

// ============================================
// API 路由：新增白名單
// ============================================

app.post('/api/whitelist', (req, res) => {
    const entry = {
        id: req.body.id,  // 【關鍵】使用前端傳來的 ID
        pass_id: req.body.pass_id,
        name: req.body.name,
        pass_status: req.body.pass_status,
        created_at: new Date().toISOString(),
        issue_time: req.body.issue_time || new Date().toLocaleString('zh-TW'),
        expiry_date: req.body.expiry_date,
        status: 'active'
    };

    console.log('【新增白名單】', { id: entry.id, name: entry.name });

    whitelist.push(entry);
    saveWhitelistToFile(whitelist);
    console.log('✓ 新增成功，現在共', whitelist.length, '筆');

    res.json({ success: true, data: entry });
});

// ============================================
// API 路由：查詢白名單
// ============================================

app.get('/api/whitelist', (req, res) => {
    cleanupExpiredWhitelist();

    console.log('【查詢白名單】共', whitelist.length, '筆');
    console.log('【ID 列表】:', whitelist.map(w => ({ id: w.id, name: w.name })));

    res.json({ success: true, data: whitelist });
});

// ============================================
// API 路由：刪除白名單項目
// ============================================

app.delete('/api/whitelist/:id', (req, res) => {
    const { id } = req.params;

    console.log('【刪除請求】ID:', id, '(類型:', typeof id + ')');
    console.log('【目前白名單 ID】:', whitelist.map(w => w.id));

    // 轉換 ID 為數字（因為 URL 參數是字串）
    const numId = parseInt(id);

    const index = whitelist.findIndex(item => {
        const match = item.id == numId;
        console.log(`  比對: item.id=${item.id} vs numId=${numId} = ${match}`);
        return match;
    });

    console.log('【搜尋結果】index:', index);

    if (index === -1) {
        console.error('❌ 找不到該項目');
        return res.json({
            success: false,
            message: '找不到該白名單項目'
        });
    }

    const removedEntry = whitelist[index];
    whitelist.splice(index, 1);
    saveWhitelistToFile(whitelist);

    console.log(`✓ 已刪除: ${removedEntry.name} (ID: ${removedEntry.id})`);

    res.json({
        success: true,
        message: `已取消 ${removedEntry.name} 的通行權限`,
        data: removedEntry
    });
});

// ============================================
// API 路由：驗證白名單（可選的舊 API，保持相容）
// ============================================

app.post('/api/verify-whitelist', (req, res) => {
    const { pass_id, name, pass_status } = req.body;

    cleanupExpiredWhitelist();

    const entry = whitelist.find(item =>
        item.pass_id === pass_id &&
        item.status === 'active'
    );

    if (!entry) {
        return res.json({
            success: false,
            message: '通行編號不存在於白名單或已過期'
        });
    }

    // 檢查是否已過期
    const expiryDate = new Date(entry.expiry_date);
    if (expiryDate < new Date()) {
        return res.json({
            success: false,
            message: '通行許可已過期'
        });
    }

    if (entry.name !== name) {
        return res.json({
            success: false,
            message: '姓名不符'
        });
    }

    if (entry.pass_status !== pass_status) {
        return res.json({
            success: false,
            message: '通行身份不符'
        });
    }

    res.json({
        success: true,
        message: '驗證通過',
        data: entry
    });
});

// ============================================
// 啟動伺服器（支持 HTTP 和 HTTPS）
// ============================================

const isProduction = process.env.NODE_ENV === 'production';

if (fs.existsSync('certs/cert.pem') && fs.existsSync('certs/key.pem')) {
  try {
    const cert = fs.readFileSync('certs/cert.pem', 'utf8');
    const key = fs.readFileSync('certs/key.pem', 'utf8');
    
    // 指定明確的 TLS 版本
    https.createServer(
      {
        key: key,
        cert: cert,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.3'
      },
      app
    ).listen(443, () => {
      console.log('=================================');
      console.log('🔒 HTTPS 伺服器已啟動！');
      console.log('網址: https://localhost:443');
      console.log('或者: https://localhost');
      console.log('=================================');
    });
    
    // 在生產環境下不啟動 HTTP，防止不安全的流量
    if (!isProduction) {
      // 開發環境：同時啟動 HTTP 用於測試，但顯示警告
      app.listen(PORT, () => {
        console.log('=================================');
        console.log(`⚠️  HTTP 伺服器已啟動（開發模式）`);
        console.log(`網址: http://localhost:${PORT}`);
        console.log('注意：這是開發環境，生產環境必須使用 HTTPS');
        console.log('=================================');
      });
    }
    
  } catch (error) {
    console.error('❌ SSL 憑證載入失敗:', error.message);
    
    // 憑證載入失敗的處理邏輯
    if (isProduction) {
      // 生產環境：憑證載入失敗應該直接退出
      console.error('🚨 生產環境必須使用有效的 SSL 憑證！');
      console.error('請確保以下文件存在且有效：');
      console.error('  - certs/cert.pem');
      console.error('  - certs/key.pem');
      process.exit(1);
    } else {
      // 開發環境：允許降級到 HTTP，但顯示警告
      console.warn('ℹ️  開發環境：降級為 HTTP（生產環境必須使用 HTTPS）');
      app.listen(PORT, () => {
        console.log('=================================');
        console.log(`伺服器已啟動（HTTP - 開發模式）`);
        console.log(`網址: http://localhost:${PORT}`);
        console.log('⚠️  警告：生產環境應使用 HTTPS');
        console.log('=================================');
      });
    }
  }
} else {
  // SSL 憑證不存在的處理
  if (isProduction) {
    console.error('🚨 生產環境必須使用 SSL 憑證！');
    console.error('請先生成 SSL 憑證：');
    console.error('  node generate-cert.js');
    process.exit(1);
  } else {
    // 開發環境：允許使用 HTTP
    app.listen(PORT, () => {
      console.log('=================================');
      console.log(`伺服器已啟動（HTTP - 開發模式）`);
      console.log(`網址: http://localhost:${PORT}`);
      console.log('⚠️  警告：生產環境應使用 HTTPS');
      console.log('提示：生成 SSL 憑證請執行: node generate-cert.js');
      console.log('=================================');
    });
  }
}