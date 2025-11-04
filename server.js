// 載入必要套件
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// 不需要引入 fetch，Node.js 18+ 已內建

// 建立 Express 應用程式
const app = express();
const PORT = process.env.PORT || 3000;

// 中介軟體設定
app.use(cors()); // 允許跨域請求
app.use(express.json()); // 解析 JSON 格式的請求
app.use(express.static('public')); // 提供靜態檔案（HTML/CSS/JS）

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
            issuanceDate: credentialData.issueDate.replace(/-/g, ''), // 轉換為 YYYYMMDD
            expiredDate: credentialData.expiryDate.replace(/-/g, ''),   // 轉換為 YYYYMMDD
            fields: [
                {
                    ename: 'name',
                    content: credentialData.name
                },
                {
                    ename: 'roc_birthday',
                    content: credentialData.roc_brithday
                },
                {
                    ename: 'id_number',
                    content: credentialData.id_number
                },
                {
                    ename: 'pass_status',
                    content: credentialData.pass_status
                },
                {
                    ename: 'pass_id',
                    content: credentialData.pass_id
                },
                {
                    ename: 'issueDate',
                    content: credentialData.issueDate
                },
                {
                    ename: 'expiryDate',
                    content: credentialData.expiryDate
                }
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

        // 沙盒系統會在 location header 中返回 QR Code 的資訊
        const qrcodeId = response.headers.get('location')?.split('/').pop() || result.qrcodeId;

        // 回傳結果給前端
        res.json({
            success: true,
            qrCodeUrl: `${process.env.ISSUER_API_URL}/api/qrcode/${qrcodeId}`,
            qrCode: result.qrCode,
            vcUid: issuerPayload.vcUid,
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

        // 準備驗證資料
        const verifierPayload = {
            vpUid: process.env.VP_CODE + '_' + Date.now(),
            ref: process.env.VP_REF
        };

        // 呼叫驗證端 API
        const apiUrl = `${process.env.VERIFIER_API_URL}/api/qrcode/data`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Access-Token': process.env.VERIFIER_ACCESS_TOKEN,  // 使用 Access-Token header
                'Content-Type': 'application/json',
                'accept': 'application/json'
            },
            body: JSON.stringify(verifierPayload)
        });

        console.log('驗證端回應狀態碼:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('驗證端錯誤回應:', errorText);
            throw new Error(`驗證端 API 錯誤: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        console.log('驗證端回應:', result);

        // 取得 QR Code ID
        const qrcodeId = response.headers.get('location')?.split('/').pop() || result.qrcodeId;

        res.json({
            success: true,
            qrCodeUrl: `${process.env.VERIFIER_API_URL}/api/qrcode/${qrcodeId}`,
            sessionId: qrcodeId,
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
app.get('/api/verification-result/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        console.log('查詢驗證結果:', sessionId);

        // 呼叫驗證端 API 查詢結果
        const response = await fetch(
            `${process.env.VERIFIER_API_URL}/api/vp/result/${sessionId}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${process.env.VERIFIER_ACCESS_TOKEN}`
                }
            }
        );

        if (!response.ok) {
            throw new Error(`驗證端 API 錯誤: ${response.status}`);
        }

        const result = await response.json();
        console.log('驗證結果:', result);

        res.json({
            success: true,
            status: result.status, // pending, completed, failed
            data: result.data, // 驗證通過時的憑證資料
            message: result.message
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
// 白名單管理（內存版本）
// ============================================
let whitelist = [];

/**
 * 清理過期的白名單項目
 * 在伺服器啟動時執行，之後每 1 小時執行一次
 */
function cleanupExpiredWhitelist() {
    const now = new Date();
    const initialCount = whitelist.length;
    
    whitelist = whitelist.filter(entry => {
        const expiryDate = new Date(entry.expiry_date);
        return expiryDate > now;
    });
    
    const removedCount = initialCount - whitelist.length;
    if (removedCount > 0) {
        console.log(`✓ 已清理 ${removedCount} 筆過期白名單項目`);
    }
}

// 在伺服器啟動時立即執行一次
cleanupExpiredWhitelist();

// 每 1 小時執行一次清理
setInterval(cleanupExpiredWhitelist, 60 * 60 * 1000);

// ============================================
// 新增白名單 API
// ============================================
app.post('/api/whitelist', (req, res) => {
    const entry = {
        id: Date.now(),
        pass_id: req.body.pass_id,
        name: req.body.name,
        pass_status: req.body.pass_status,
        created_at: new Date().toISOString(),
        expiry_date: req.body.expiry_date,  // ← 新增：記錄到期日期
        status: 'active'
    };
    
    whitelist.push(entry);
    console.log('新增白名單:', entry);
    
    res.json({ success: true, data: entry });
});

// ============================================
// 查詢白名單 API
// ============================================
app.get('/api/whitelist', (req, res) => {
    // 查詢前先清理過期項目
    cleanupExpiredWhitelist();
    res.json({ success: true, data: whitelist });
});

// ============================================
// 驗證白名單 API
// ============================================
app.post('/api/verify-whitelist', (req, res) => {
    const { pass_id, name, pass_status } = req.body;
    
    // 查詢前先清理過期項目
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

// 查詢白名單
app.get('/api/whitelist', (req, res) => {
    res.json({ success: true, data: whitelist });
});

// 驗證白名單
app.post('/api/verify-whitelist', (req, res) => {
    const { pass_id, name, pass_status } = req.body;
    
    const entry = whitelist.find(item => 
        item.pass_id === pass_id && 
        item.status === 'active'
    );
    
    if (!entry) {
        return res.json({
            success: false,
            message: '通行編號不存在於白名單'
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
// 啟動伺服器
// ============================================
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`伺服器已啟動！`);
    console.log(`網址: http://localhost:${PORT}`);
    console.log(`=================================`);
});
