// ============================================
// 驗證端 JavaScript
// ============================================

let verificationSession = null; // 當前驗證會話 ID
let pollingInterval = null; // 輪詢計時器
let verificationLogs = []; // 驗證紀錄
let whitelistData = []; // 白名單資料

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('驗證端頁面已載入');
    loadWhitelist(); // 載入白名單
    loadVerificationLogs(); // 載入驗證紀錄
});

/**
 * 產生驗證 QR Code
 */
async function generateVerificationQR() {
    const generateBtn = document.getElementById('generateBtn');
    setButtonLoading('generateBtn', true, '產生驗證 QR Code');

    try {
        const response = await apiCall('POST', '/api/generate-verification-qr', {});

        console.log('【API 回應】:', response);  // ← 偵錯點 1
        console.log('【qrCode 內容長度】:', response.qrCode?.length);  // ← 偵錯點 2

        if (!response.success) {
            throw new Error(response.message || '產生驗證 QR Code 失敗');
        }

        verificationSession = response.transactionId;
        console.log('【交易序號】:', verificationSession);  // ← 偵錯點 3

        // 顯示 QR Code 容器和等待提示
        document.getElementById('qrcodeContainer').style.display = 'flex';
        document.getElementById('waitingBox').style.display = 'block';
        document.getElementById('resultBox').style.display = 'none';
        document.getElementById('retryButtonBox').style.display = 'none';
        document.getElementById('generateBtn').style.display = 'none';

        // 直接使用 API 回傳的 base64 QR Code 圖片
        const qrcodeDiv = document.getElementById('qrcode');
        console.log('【qrcodeDiv 元素】:', qrcodeDiv);  // ← 偵錯點 4

        if (!qrcodeDiv) {
            throw new Error('QR Code 容器不存在');
        }

        qrcodeDiv.innerHTML = '';
        console.log('【已清空 qrcodeDiv】');  // ← 偵錯點 5

        const img = document.createElement('img');
        img.src = response.qrCode;
        img.width = 256;
        img.height = 256;
        img.alt = '驗證 QR Code';
        img.style.borderRadius = '8px';
        img.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
        
        console.log('【img 物件】:', img);  // ← 偵錯點 6
        console.log('【img.src 內容】:', img.src.substring(0, 50) + '...');  // ← 偵錯點 7
        
        qrcodeDiv.appendChild(img);
        console.log('【已新增 img 到 qrcodeDiv】');  // ← 偵錯點 8

        startPolling();

    } catch (error) {
        console.error('產生驗證 QR Code 失敗:', error);
        showError('產生驗證 QR Code 失敗：' + error.message);
        document.getElementById('qrcodeContainer').style.display = 'none';
        document.getElementById('generateBtn').style.display = 'block';
    } finally {
        setButtonLoading('generateBtn', false, '產生驗證 QR Code');
    }
}



/**
 * 開始輪詢驗證結果
 */
function startPolling() {
    let attemptCount = 0;
    const maxAttempts = 30; // 最多輪詢 30 次（約 60 秒）

    pollingInterval = setInterval(async () => {
        attemptCount++;
        console.log(`輪詢驗證結果 (第 ${attemptCount} 次)...`);

        try {
            const response = await apiCall('GET', `/api/verification-result/${verificationSession}`);

            console.log('【輪詢回應】:', response);

            // ✓ 驗證完成（成功）
            if (response.status === 'completed' && response.data) {
                console.log('✓ 驗證已完成');
                stopPolling();
                handleVerificationResult(response);
                return;  // ← 重要：停止進一步的處理
            }

            // ✗ 驗證失敗
            if (response.status === 'failed') {
                console.log('✗ 驗證失敗');
                stopPolling();
                handleVerificationResult(response);
                return;  // ← 重要：停止進一步的處理
            }

            // ⏳ 仍在等待
            if (response.status === 'pending') {
                console.log('⏳ 仍在等待...');
                return;  // ← 繼續輪詢
            }

        } catch (error) {
            console.warn(`輪詢第 ${attemptCount} 次失敗:`, error);
            // 繼續輪詢，除非超時
        }

        // ⏱️ 超時處理
        if (attemptCount >= maxAttempts) {
            console.log('⏱️ 驗證逾時');
            stopPolling();
            showTimeoutMessage();
        }
    }, 2000); // 每 2 秒查詢一次
}

/**
 * 停止輪詢
 */
function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
        console.log('✓ 已停止輪詢');
    }
}


/**
 * 處理驗證結果
 */
async function handleVerificationResult(result) {
    console.log('處理驗證結果:', result);
    
    // 隱藏等待提示
    document.getElementById('waitingBox').style.display = 'none';
    document.getElementById('resultBox').style.display = 'block';

    if (result.status === 'completed' && result.data) {
        // 驗證成功
        displaySuccessResult(result.data);
    } else if (result.status === 'failed') {
        // 驗證失敗
        displayFailedResult(result.message || '驗證失敗');
    } else {
        // 其他情況
        console.warn('未知的驗證結果:', result);
    }

    // 顯示重新開始按鈕
    document.getElementById('retryButtonBox').style.display = 'block';
}

/**
 * 顯示驗證成功結果
 */
function displaySuccessResult(data) {
    console.log('顯示成功結果:', data);
    
    // 隱藏其他結果框
    document.getElementById('failedResult').style.display = 'none';
    document.getElementById('timeoutResult').style.display = 'none';
    document.getElementById('successResult').style.display = 'block';

    // 填入驗證資訊
    document.getElementById('resultName').textContent = data.name || 'N/A';
    document.getElementById('resultPassStatus').textContent = data.pass_status || 'N/A';
    document.getElementById('resultPassId').textContent = data.pass_id || 'N/A';
    document.getElementById('resultTime').textContent = formatDateTime();

    // 新增驗證紀錄
    const log = {
        timestamp: formatDateTime(),
        name: data.name,
        pass_id: data.pass_id,
        pass_status: data.pass_status,
        result: 'SUCCESS'
    };

    verificationLogs.unshift(log);
    if (verificationLogs.length > 10) {
        verificationLogs.pop();
    }

    saveToStorage('verificationLogs', verificationLogs);
    updateVerificationLogsDisplay();

    showSuccess('✓ 驗證通過 - 允許通行');
}

/**
 * 顯示驗證失敗結果
 */
function displayFailedResult(message) {
    console.log('顯示失敗結果:', message);
    
    // 隱藏其他結果框
    document.getElementById('successResult').style.display = 'none';
    document.getElementById('timeoutResult').style.display = 'none';
    document.getElementById('failedResult').style.display = 'block';

    document.getElementById('failedMessage').textContent = message;

    // 新增驗證紀錄
    const log = {
        timestamp: formatDateTime(),
        result: 'FAILED',
        message: message
    };

    verificationLogs.unshift(log);
    if (verificationLogs.length > 10) {
        verificationLogs.pop();
    }

    saveToStorage('verificationLogs', verificationLogs);
    updateVerificationLogsDisplay();

    showError('✗ 驗證失敗 - 拒絕通行');
}


/**
 * 比對白名單
 */
async function verifyAgainstWhitelist(credentialData) {
    try {
        // 呼叫後端 API 驗證白名單
        const response = await apiCall('POST', '/api/verify-whitelist', {
            pass_id: credentialData.pass_id,
            name: credentialData.name,
            pass_status: credentialData.pass_status
        });

        if (!response.success) {
            return {
                success: false,
                message: response.message || '白名單驗證失敗'
            };
        }

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('白名單驗證失敗:', error);
        return {
            success: false,
            message: '白名單查詢失敗：' + error.message
        };
    }
}

/**
 * 顯示驗證成功結果
 */
function displaySuccessResult(data) {
    // 隱藏其他結果框
    document.getElementById('failedResult').style.display = 'none';
    document.getElementById('timeoutResult').style.display = 'none';
    document.getElementById('successResult').style.display = 'block';

    // 填入驗證資訊
    document.getElementById('resultName').textContent = data.name || 'N/A';
    document.getElementById('resultPassStatus').textContent = data.pass_status || 'N/A';
    document.getElementById('resultPassId').textContent = data.pass_id || 'N/A';
    document.getElementById('resultTime').textContent = formatDateTime();

    // 新增驗證紀錄
    const log = {
        timestamp: formatDateTime(),
        name: data.name,
        pass_id: data.pass_id,
        pass_status: data.pass_status,
        result: 'SUCCESS'
    };

    verificationLogs.unshift(log); // 新紀錄加到最前面
    if (verificationLogs.length > 10) {
        verificationLogs.pop(); // 保持最多 10 筆紀錄
    }

    saveToStorage('verificationLogs', verificationLogs);
    updateVerificationLogsDisplay();

    showSuccess('✓ 驗證通過 - 允許通行');
}

/**
 * 顯示驗證失敗結果
 */
function displayFailedResult(message) {
    // 隱藏其他結果框
    document.getElementById('successResult').style.display = 'none';
    document.getElementById('timeoutResult').style.display = 'none';
    document.getElementById('failedResult').style.display = 'block';

    document.getElementById('failedMessage').textContent = message;

    // 新增驗證紀錄
    const log = {
        timestamp: formatDateTime(),
        pass_id: 'N/A',
        result: 'FAILED',
        message: message
    };

    verificationLogs.unshift(log);
    if (verificationLogs.length > 10) {
        verificationLogs.pop();
    }

    saveToStorage('verificationLogs', verificationLogs);
    updateVerificationLogsDisplay();

    showError('✗ 驗證失敗 - 拒絕通行');
}

/**
 * 顯示驗證逾時訊息
 */
function showTimeoutMessage() {
    document.getElementById('successResult').style.display = 'none';
    document.getElementById('failedResult').style.display = 'none';
    document.getElementById('timeoutResult').style.display = 'block';

    // 新增驗證紀錄
    const log = {
        timestamp: formatDateTime(),
        result: 'TIMEOUT',
        message: '驗證逾時 - 訪客未完成掃描'
    };

    verificationLogs.unshift(log);
    if (verificationLogs.length > 10) {
        verificationLogs.pop();
    }

    saveToStorage('verificationLogs', verificationLogs);
    updateVerificationLogsDisplay();

    document.getElementById('retryButtonBox').style.display = 'block';
}

/**
 * 重置驗證器
 */
function resetVerifier() {
    // 清空 session
    verificationSession = null;
    
    // 隱藏所有結果框
    document.getElementById('qrcodeContainer').style.display = 'none';
    document.getElementById('waitingBox').style.display = 'none';
    document.getElementById('resultBox').style.display = 'none';
    document.getElementById('retryButtonBox').style.display = 'none';

    // 顯示產生按鈕
    document.getElementById('generateBtn').style.display = 'block';

    window.scrollTo(0, 0);
}

/**
 * 載入白名單資料
 */
function loadWhitelist() {
    console.log('【載入白名單】');
    
    const savedWhitelist = getFromStorage('whitelist');
    
    if (savedWhitelist && Array.isArray(savedWhitelist) && savedWhitelist.length > 0) {
        console.log('✓ 從 localStorage 載入白名單，共', savedWhitelist.length, '筆');
        
        // 【關鍵】確保每個項目都有 ID
        whitelistData = savedWhitelist.map(entry => {
            if (!entry.id) {
                console.warn('⚠️ 項目缺少 ID，自動生成:', entry);
                entry.id = Date.now() + Math.random();
            }
            return entry;
        });
        
        updateWhitelistTable();
    }

    // 同時從後端載入
    apiCall('GET', '/api/whitelist')
        .then(response => {
            if (response.success && response.data) {
                console.log('✓ 從後端載入白名單，共', response.data.length, '筆');
                
                // 【關鍵】確保每個項目都有 ID
                const remoteData = response.data.map(entry => {
                    if (!entry.id) {
                        console.warn('⚠️ 項目缺少 ID，自動生成:', entry);
                        entry.id = Date.now() + Math.random();
                    }
                    return entry;
                });
                
                const mergedData = mergeWhitelistData(whitelistData, remoteData);
                
                whitelistData = mergedData;
                saveToStorage('whitelist', whitelistData);
                updateWhitelistTable();
                
                console.log('✓ 白名單已合併，共', whitelistData.length, '筆');
            }
        })
        .catch(error => {
            console.warn('⚠️ 從後端載入白名單失敗（使用本地副本）:', error);
        });
}


/**
 * 合併白名單資料
 */
function mergeWhitelistData(localData, remoteData) {
    if (!Array.isArray(localData)) localData = [];
    if (!Array.isArray(remoteData)) remoteData = [];
    
    const merged = [...localData];
    
    remoteData.forEach(remoteEntry => {
        const exists = merged.some(localEntry => 
            localEntry.pass_id === remoteEntry.pass_id &&
            localEntry.name === remoteEntry.name
        );
        
        if (!exists) {
            console.log('【新增項目】', remoteEntry.name, remoteEntry.pass_id);
            merged.push(remoteEntry);
        }
    });
    
    return merged;
}



/**
 * 更新白名單表格顯示
 */
function updateWhitelistTable() {
    const tbody = document.getElementById('whitelistTableBody');
    
    // 確保白名單資料有效
    if (!whitelistData || !Array.isArray(whitelistData)) {
        console.error('❌ whitelistData 無效');
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">資料載入失敗</td></tr>';
        return;
    }
    
    const activeEntries = whitelistData.filter(entry => {
        if (!entry.expiry_date) return true;
        const expiryDate = new Date(entry.expiry_date);
        const now = new Date();
        return expiryDate > now;
    });
    
    if (activeEntries.length < whitelistData.length) {
        const removedCount = whitelistData.length - activeEntries.length;
        whitelistData = activeEntries;
        saveToStorage('whitelist', whitelistData);
        console.log(`✓ 自動清理 ${removedCount} 筆過期白名單項目`);
    }
    
    if (activeEntries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">目前尚無發行紀錄或全部已過期</td></tr>';
        return;
    }

    tbody.innerHTML = activeEntries.map(entry => {
        // 【關鍵】確保每個項目都有 ID
        if (!entry.id) {
            console.warn('⚠️ 項目缺少 ID，自動生成:', entry);
            entry.id = Date.now() + Math.random();  // 產生唯一 ID
        }
        
        const issueTime = entry.issue_time || formatDateTime();
        const expiryDateStr = entry.expiry_date || '未設定';
        
        const expiryDate = entry.expiry_date ? new Date(entry.expiry_date) : null;
        const now = new Date();
        const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : -1;
        
        let statusBadgeClass = 'bg-success';
        let statusText = entry.status;
        
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 1) {
            statusBadgeClass = 'bg-warning text-dark';
            statusText = `即將到期 (${daysUntilExpiry}天)`;
        } else if (daysUntilExpiry < 0) {
            statusBadgeClass = 'bg-danger';
            statusText = '已過期';
        }
        
        return `
            <tr>
                <td class="text-monospace small">${entry.pass_id}</td>
                <td>${entry.name}</td>
                <td>${entry.pass_status}</td>
                <td><small>${issueTime}</small></td>
                <td><small>${expiryDateStr}</small></td>
                <td><span class="badge ${statusBadgeClass}">${statusText}</span></td>
                <td>
                    <button class="btn btn-sm btn-danger" 
                            onclick="removeWhitelistEntry(${entry.id}, '${entry.name}')"
                            title="取消此人員的通行權限"
                            data-id="${entry.id}"
                            style="padding: 2px 6px; font-size: 0.8rem;">
                        ✕
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    console.log('✓ 白名單表格已更新');
}



/**
 * 移除白名單項目
 * @param {number} id - 白名單項目 ID
 * @param {string} name - 人員姓名（用於確認訊息）
 */
async function removeWhitelistEntry(id, name) {
    console.log('【移除白名單】id:', id, 'name:', name);
    
    // 【關鍵】檢查 ID 是否有效
    if (id === undefined || id === null || id === 'undefined') {
        console.error('❌ ID 無效:', id);
        showError('無法刪除：項目 ID 錯誤');
        return;
    }
    
    // 確認對話框
    const confirmed = confirm(`確定要取消 ${name} 的通行權限嗎？此操作無法復原。`);
    if (!confirmed) {
        console.log('已取消移除操作');
        return;
    }

    try {
        console.log('正在取消權限:', id, name);
        
        // 呼叫後端 API 刪除
        const response = await apiCall('DELETE', `/api/whitelist/${id}`, null);

        if (!response.success) {
            throw new Error(response.message || '取消權限失敗');
        }

        // 更新前端白名單
        whitelistData = whitelistData.filter(entry => entry.id != id);  // ← 使用 != 而非 !==
        saveToStorage('whitelist', whitelistData);
        updateWhitelistTable();

        showSuccess(`✓ 已取消 ${name} 的通行權限`);
        console.log('✓ 已移除:', name);

    } catch (error) {
        console.error('移除白名單失敗:', error);
        showError('取消權限失敗：' + error.message);
    }
}



/**
 * 載入驗證紀錄
 */
function loadVerificationLogs() {
    const savedLogs = getFromStorage('verificationLogs');
    if (savedLogs) {
        verificationLogs = savedLogs;
        updateVerificationLogsDisplay();
    }
}

/**
 * 更新驗證紀錄顯示
 */
function updateVerificationLogsDisplay() {
    const logsDiv = document.getElementById('verificationLogs');

    if (!verificationLogs || verificationLogs.length === 0) {
        logsDiv.innerHTML = '<p class="text-muted text-center mb-0">目前尚無驗證紀錄</p>';
        return;
    }

    logsDiv.innerHTML = verificationLogs.map(log => {
        let badgeClass = 'bg-success';
        let resultText = log.result;

        if (log.result === 'FAILED') {
            badgeClass = 'bg-danger';
            resultText = '失敗';
        } else if (log.result === 'TIMEOUT') {
            badgeClass = 'bg-warning';
            resultText = '逾時';
        } else if (log.result === 'SUCCESS') {
            resultText = '通過';
        }

        return `
            <div class="mb-2 pb-2 border-bottom" style="font-size: 0.9rem;">
                <div>
                    <span class="badge ${badgeClass}">${resultText}</span>
                    <small class="text-muted">${log.timestamp}</small>
                </div>
                <div class="text-truncate">
                    ${log.name ? `<small>${log.name}</small>` : ''}
                    ${log.pass_id && log.pass_id !== 'N/A' ? `<small class="text-monospace">${log.pass_id}</small>` : ''}
                </div>
                ${log.message ? `<small class="text-muted d-block">${log.message}</small>` : ''}
            </div>
        `;
    }).join('');
}

console.log('驗證端 JavaScript 已載入');