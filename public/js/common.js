// ============================================
// 公共函數和工具類
// ============================================

/**
 * 發送 API 請求的通用函數
 * @param {string} method - HTTP 方法 (GET, POST, DELETE, etc.)
 * @param {string} endpoint - API 端點
 * @param {object} data - 請求資料（可選）
 * @returns {Promise} API 回應
 */
async function apiCall(method, endpoint, data = null) {
    try {
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(endpoint, options);
        
        if (!response.ok) {
            throw new Error(`API 錯誤: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API 呼叫失敗:', error);
        throw error;
    }
}

/**
 * 驗證身分證字號格式
 * @param {string} idNumber - 身分證字號
 * @returns {boolean}
 */
function validateIdNumber(idNumber) {
    const pattern = /^[A-Z]\d{9}$/;
    return pattern.test(idNumber);
}

/**
 * 驗證民國日期格式
 * @param {string} rocBirthday - 民國出生年月日（7碼）
 * @returns {boolean}
 */
function validateRocBirthday(rocBirthday) {
    // 檢查是否為7碼數字
    if (!/^\d{7}$/.test(rocBirthday)) {
        return false;
    }
    
    // 解析年月日
    const year = parseInt(rocBirthday.substring(0, 3));
    const month = parseInt(rocBirthday.substring(3, 5));
    const day = parseInt(rocBirthday.substring(5, 7));
    
    // 驗證月份和日期範圍
    if (month < 1 || month > 12 || day < 1 || day > 31) {
        return false;
    }
    
    return true;
}

/**
 * 驗證有效期限是否符合規定
 * @param {string} expiryDate - 輸入的日期字串 (YYYY-MM-DD)
 * @returns {boolean}
 */
function validateExpiryDate(expiryDate) {
    if (!expiryDate) {
        showError('請填寫有效期限截止日期');
        return false;
    }
    
    // 驗證日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(expiryDate)) {
        showError('日期格式不正確，請使用 YYYY-MM-DD 格式（例：2025-11-15）');
        return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    
    // 檢查日期是否有效
    if (isNaN(expiry.getTime())) {
        showError('輸入的日期無效');
        return false;
    }
    
    // 計算天數差
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 檢查是否在允許的範圍內
    if (diffDays < 0) {
        showError('有效期限不能早於今天');
        return false;
    }
    
    if (diffDays > 30) {
        showError('有效期限最長為 30 天');
        return false;
    }
    
    return true;
}



/**
 * 將民國日期轉換為西元日期字符串
 * @param {string} rocBirthday - 民國出生年月日（7碼）
 * @returns {string} 西元日期（YYYY-MM-DD）
 */
function rocToWestern(rocBirthday) {
    const year = parseInt(rocBirthday.substring(0, 3));
    const month = rocBirthday.substring(3, 5);
    const day = rocBirthday.substring(5, 7);
    
    const westernYear = year + 1911;
    return `${westernYear}-${month}-${day}`;
}

/**
 * 產生唯一的通行編號（並記錄以防重複）
 * @returns {string} 格式：ACC20251104000001
 */
function generateUniquePassId() {
    const prefix = 'ACC';
    const date = new Date().toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD
    
    // 產生更長的亂數（6碼，範圍 000000-999999）
    const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const passId = `${prefix}${date}${randomNum}`;
    
    // 儲存到 localStorage 的已生成編號清單，用來檢查重複
    let generatedIds = getFromStorage('generatedPassIds') || [];
    
    // 如果產生重複，遞迴重新產生
    if (generatedIds.includes(passId)) {
        console.warn('通行編號重複，重新生成...');
        return generateUniquePassId();
    }
    
    // 加入已生成清單
    generatedIds.push(passId);
    saveToStorage('generatedPassIds', generatedIds);
    
    console.log('✓ 通行編號已產生並記錄:', passId);
    return passId;
}

/**
 * 清除過期的通行編號記錄（可定期呼叫）
 */
function cleanupExpiredPassIds() {
    let generatedIds = getFromStorage('generatedPassIds') || [];
    
    // 保留最近 1000 個編號（防止 localStorage 過滿）
    if (generatedIds.length > 1000) {
        generatedIds = generatedIds.slice(-1000);
        saveToStorage('generatedPassIds', generatedIds);
        console.log('✓ 已清理過期編號記錄');
    }
}


/**
 * 格式化日期時間
 * @param {Date} date - 日期物件
 * @returns {string} 格式化的日期時間字符串
 */
function formatDateTime(date = new Date()) {
    return date.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * 格式化日期（不含時間）
 * @param {Date} date - 日期物件
 * @returns {string} 格式化的日期字符串（YYYY-MM-DD）
 */
function formatDate(date = new Date()) {
    return date.toISOString().split('T')[0];
}

/**
 * 格式化民國日期顯示（去掉民國年的前導 0）
 * @param {string} rocBirthday - 民國出生年月日（7碼，例如 0900101）
 * @returns {string} 格式化顯示（例如 民國93年1月1日）
 */
function formatRocBirthday(rocBirthday) {
    if (!rocBirthday || rocBirthday.length !== 7) {
        return rocBirthday;
    }
    
    const year = parseInt(rocBirthday.substring(0, 3));    // 民國年
    const month = parseInt(rocBirthday.substring(3, 5));   // 月
    const day = parseInt(rocBirthday.substring(5, 7));     // 日
    
    // 去掉民國年的前導 0
    return `民國${year}年${month}月${day}日`;
}

/**
 * 計算到期日期
 * @param {number} days - 天數
 * @returns {string} 到期日期（YYYY-MM-DD）
 */
function calculateExpiryDate(days = 1) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return formatDate(date);
}

/**
 * 顯示成功通知
 * @param {string} message - 訊息內容
 */
function showSuccess(message) {
    // 使用 Bootstrap 的 alert
    const alertHtml = `
        <div class="alert alert-success alert-dismissible fade show" role="alert">
            <strong>✓ 成功！</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    // 在頁面頂部顯示
    document.body.insertAdjacentHTML('afterbegin', alertHtml);
    
    // 3秒後自動關閉
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 3000);
}

/**
 * 顯示錯誤通知
 * @param {string} message - 訊息內容
 */
function showError(message) {
    const alertHtml = `
        <div class="alert alert-danger alert-dismissible fade show" role="alert">
            <strong>✗ 錯誤！</strong> ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', alertHtml);
    
    setTimeout(() => {
        const alert = document.querySelector('.alert');
        if (alert) {
            alert.remove();
        }
    }, 5000);
}

/**
 * 產生 UUID v4 格式的交易序號
 * @returns {string} UUID v4 格式（36 字元）
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * 驗證交易序號格式
 * @param {string} transactionId - 交易序號
 * @returns {boolean}
 */
function validateTransactionId(transactionId) {
    // UUID v4 正規表達式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(transactionId);
}

/**
 * 設定按鈕的載入狀態
 * @param {string} buttonId - 按鈕的 ID
 * @param {boolean} isLoading - 是否正在載入
 * @param {string} originalText - 原始按鈕文字
 */
function setButtonLoading(buttonId, isLoading, originalText = '') {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        button.disabled = true;
        button.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span>處理中...`;
    } else {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

/**
 * 複製文字到剪貼簿
 * @param {string} text - 要複製的文字
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showSuccess('已複製到剪貼簿');
    } catch (error) {
        console.error('複製失敗:', error);
        showError('複製失敗，請手動複製');
    }
}

/**
 * 從 localStorage 讀取數據
 * @param {string} key - 鍵名
 * @returns {*} 儲存的數據
 */
function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

/**
 * 存儲數據到 localStorage
 * @param {string} key - 鍵名
 * @param {*} value - 要儲存的數據
 */
function saveToStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 清除 localStorage 中的數據
 * @param {string} key - 鍵名
 */
function removeFromStorage(key) {
    localStorage.removeItem(key);
}

console.log('公共函數庫已載入');

/**
 * 對姓名進行打碼
 * @param {string} name - 原始姓名
 * @returns {string} 打碼後的姓名
 * 
 * 規則：只保留第一個字，其餘替換為 "*"
 * 例：王小明 → 王**
 */
function maskName(name) {
    if (!name || name.length === 0) return '';
    if (name.length === 1) return name;
    return name.charAt(0) + '*'.repeat(name.length - 1);
}

/**
 * 對身分證字號進行打碼
 * @param {string} idNumber - 身分證字號
 * @returns {string} 打碼後的身分證字號
 * 
 * 規則：保留首位字母與數字，中間全部替換為 "*"，保留結尾3碼
 * 例：F123456789 → F1*****789
 */
function maskIdNumber(idNumber) {
    if (!idNumber || idNumber.length < 4) return idNumber;
    const first = idNumber.charAt(0);
    const second = idNumber.charAt(1);
    const last3 = idNumber.slice(-3);
    const middleLength = idNumber.length - 5;
    return first + second + '*'.repeat(middleLength) + last3;
}

/**
 * 對民國出生年月日進行打碼
 * @param {string} rocBirthday - 民國出生年月日
 * @returns {string} 打碼後的日期
 * 
 * 例：
 * - 民國90年1月1日 → 民國90年**月**日
 * - 0900101 → 民國90年**月**日
 */
function maskRocBirthday(rocBirthday) {
    if (!rocBirthday) return '';
    
    // 先嘗試匹配「民國YY年M月D日」格式（已格式化）
    const rocPattern = /民國(\d+)年(\d+)月(\d+)日/;
    const match = rocBirthday.match(rocPattern);
    
    if (match) {
        // 已是中文格式，直接打碼
        return `民國${match[1]}年**月**日`;
    }
    
    // 嘗試匹配純數字格式（7碼 YYYYMMDD）
    const numberPattern = /^(\d{3})(\d{2})(\d{2})$/;
    const numberMatch = rocBirthday.match(numberPattern);
    
    if (numberMatch) {
        // 純數字格式：轉換為中文格式後再打碼
        // 移除前面的 "0"：090 → 90
        const year = numberMatch[1].replace(/^0+/, '');  // ← 用 replace 移除前面的 0
        return `民國${year}年**月**日`;
    }
    
    // 如果是其他格式，嘗試取前 3 碼作為年份
    if (rocBirthday.length >= 7) {
        // 移除前面的 "0"
        const year = rocBirthday.substring(0, 3).replace(/^0+/, '');  // ← 用 replace 移除前面的 0
        return `民國${year}年**月**日`;
    }
    
    // 都不符合，直接返回原值
    return rocBirthday;
}


/**
 * 完整的個資打碼對象
 * @param {object} data - 原始數據對象
 * @returns {object} 打碼後的數據對象
 */
function maskPersonalData(data) {
    return {
        name: data.name ? maskName(data.name) : '',
        id_number: data.id_number ? maskIdNumber(data.id_number) : '',
        roc_birthday: data.roc_birthday ? maskRocBirthday(data.roc_birthday) : '',
    };
}

// ============================================
// issuer.js 中的應用
// ============================================

/**
 * 修改 displaySummary() 函數
 * 在步驟 3 中顯示打碼後的資訊
 */
function displaySummary() {
    console.log('顯示摘要（步驟 3）:', formData);
    
    // 將原始數據打碼
    const maskedData = maskPersonalData({
        name: formData.name,
        id_number: formData.id_number,
        roc_birthday: formData.roc_brithday,  // 注意：formData 中是 roc_brithday
        pass_id: formData.pass_id
    });
    
    // 顯示打碼後的資訊
    document.getElementById('summary_name').textContent = maskedData.name || '未輸入';
    document.getElementById('summary_id_number').textContent = maskedData.id_number || '未輸入';
    document.getElementById('summary_birthday').textContent = maskedData.roc_birthday || '未輸入';
    document.getElementById('summary_pass_status').textContent = formData.pass_status || '未選擇';
    document.getElementById('summary_pass_id').textContent = maskedData.pass_id || '未產生';
    
    // 有效期限顯示（不需打碼）
    const expiryDateObj = new Date(formData.expiryDate);
    const formattedExpiryDate = expiryDateObj.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    document.getElementById('summary_validity').textContent = 
        `${formData.validityDays} 天（截止日期：${formattedExpiryDate}）`;
}


/**
 * 在驗證結果中顯示打碼後的資訊
 */
function displaySuccessResult(data) {
    console.log('顯示驗證成功結果（打碼版）:', data);
    
    // 將驗證結果中的個資打碼
    const maskedData = maskPersonalData({
        name: data.name,
        id_number: data.id_number,
        roc_birthday: data.roc_birthday,
        pass_id: data.pass_id
    });
    
    // 隱藏錯誤和等待信息
    document.getElementById('waitingMessage').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'none';
    
    // 顯示成功結果區域
    const resultBox = document.getElementById('resultBox');
    resultBox.style.display = 'block';
    resultBox.className = 'result-box result-success';
    
    // 填入打碼後的資訊
    resultBox.innerHTML = `
        <h5 class="mb-3">✓ 驗證通過</h5>
        <div class="verification-details">
            <p><strong>姓名：</strong> ${maskedData.name}</p>
            <p><strong>身分證字號：</strong> ${maskedData.id_number}</p>
            <p><strong>出生年月日：</strong> ${maskedData.roc_birthday}</p>
            <p><strong>通行身份：</strong> ${data.pass_status}</p>
            <p><strong>通行編號：</strong> ${maskedData.pass_id}</p>
            <p class="text-success"><strong>✓ 允許通行</strong></p>
        </div>
    `;
    
    // 記錄驗証紀錄時使用原始數據（不打碼）
    recordVerificationLog({
        timestamp: new Date().toLocaleString('zh-TW'),
        name: data.name,
        pass_id: data.pass_id,
        result: 'success'
    });
}

/**
 * 修改 updateVerificationLogsTable() 函數
 * 在驗証紀錄表中顯示打碼後的資訊
 */
function updateVerificationLogsTable() {
    const tbody = document.getElementById('verificationLogsTableBody');
    
    if (!tbody || !verificationLogs || verificationLogs.length === 0) {
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">目前尚無驗証紀錄</td></tr>';
        }
        return;
    }
    
    tbody.innerHTML = verificationLogs.map(log => {
        // 對表格中顯示的資訊進行打碼
        const maskedName = maskName(log.name);
        const maskedPassId = maskPassId(log.pass_id);
        
        const statusBadge = log.result === 'success' 
            ? '<span class="badge bg-success">通過</span>'
            : '<span class="badge bg-danger">失敗</span>';
        
        return `
            <tr>
                <td>${log.timestamp}</td>
                <td>${maskedName}</td>
                <td>${maskedPassId}</td>
                <td>${statusBadge}</td>
            </tr>
        `;
    }).join('');
}