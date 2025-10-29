// ============================================
// 公共函數和工具類
// ============================================

/**
 * 發送 API 請求的通用函數
 * @param {string} method - HTTP 方法 (GET, POST, etc.)
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
 * 產生唯一的通行編號
 * @returns {string} 格式：ACC20241030001
 */
function generateUniquePassId() {
    const prefix = 'ACC';
    const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${date}${random}`;
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