// ============================================
// 發行端 JavaScript
// ============================================

let formData = {}; // 儲存表單資料
let whitelistData = []; // 儲存白名單資料

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('發行端頁面已載入');
    loadWhitelist();
    
    // 初始化有效期限天數輸入監聽
    const validityDaysInput = document.getElementById('validityDays');
    const validityHoursInput = document.getElementById('validityHours');
    
    if (validityDaysInput) {
        // 頁面載入時顯示一次計算結果
        updateCalculatedExpiryDate();
        
        // 當使用者改變輸入時，實時更新顯示的到期日期
        validityDaysInput.addEventListener('change', updateCalculatedExpiryDate);
        validityDaysInput.addEventListener('input', updateCalculatedExpiryDate);
    }
    
    // 【新增】同步小時欄位的顯示（唯讀，自動計算）
    if (validityHoursInput) {
        validityDaysInput?.addEventListener('input', () => {
            const days = parseInt(validityDaysInput.value) || 0;
            const hours = days * 24;
            validityHoursInput.value = hours;
        });
    }
});

/**
 * 即時更新計算後的到期日期顯示
 */
function updateCalculatedExpiryDate() {
    const validityDaysInput = document.getElementById('validityDays');
    const validityHoursInput = document.getElementById('validityHours');
    const calculatedDateDisplay = document.getElementById('calculatedExpiryDate');
    
    const days = parseInt(validityDaysInput.value) || 0;
    
    if (days < 1 || days > 30) {
        calculatedDateDisplay.textContent = '（請輸入 1 到 30 之間的天數）';
        calculatedDateDisplay.className = 'text-danger';
        validityHoursInput.value = 0;
        return;
    }
    
    const expiryDate = calculateExpiryDate(days);
    const displayDate = new Date(expiryDate);
    const formattedDate = displayDate.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    // 【新增】同步小時欄位顯示
    const hours = days * 24;
    validityHoursInput.value = hours;
    
    calculatedDateDisplay.textContent = `（截止日期：${formattedDate}，共 ${hours} 小時）`;
    calculatedDateDisplay.className = 'text-success';
}




// ===== 步驟導航 =====
function goToStep(step) {
    console.log('準備進到步驟', step);
    
    // 驗證當前步驟的資料
    if (step > 1 && !validateStep1()) {
        showError('步驟 1 資料不完整');
        return;
    }

    if (step > 2 && !validateStep2()) {
        showError('步驟 2 資料不完整');
        return;
    }

    // 保存資料（步驟 1）
    if (step > 1) {
        formData.name = document.getElementById('name').value;
        formData.roc_brithday = document.getElementById('roc_birthday').value;
        formData.id_number = document.getElementById('id_number').value;
    }

    // 保存資料（步驟 2）
    if (step > 2) {
        formData.pass_status = document.getElementById('pass_status').value;
        formData.pass_id = document.getElementById('pass_id').value;
        formData.validityDays = parseInt(document.getElementById('validityDays').value);
        formData.validityHours = parseInt(document.getElementById('validityHours').value);

        if (!validateValidityDays(formData.validityDays)) {
            showError('請輸入 1 到 30 之間的天數');
            return;
        }

        formData.expiryDate = calculateExpiryDate(formData.validityDays);
    }

    // 移除所有指示器的 active 類
    for (let i = 1; i <= 3; i++) {
        const indicator = document.querySelector(`.step-indicator .step:nth-child(${i})`);
        if (indicator) {
            indicator.classList.remove('active');
        }
    }
    
    // 為當前步驟的指示器添加 active 類
    const currentIndicator = document.querySelector(`.step-indicator .step:nth-child(${step})`);
    if (currentIndicator) {
        currentIndicator.classList.add('active');
        console.log(`✓ 步驟指示器已更新到步驟 ${step}`);
    }    

    // 隱藏所有步驟內容容器
    for (let i = 1; i <= 3; i++) {
        const stepElement = document.getElementById(`step${i}`);
        if (stepElement) {
            stepElement.classList.remove('active');
            stepElement.style.display = 'none';
        }
    }

    // 顯示指定步驟內容容器
    const targetStep = document.getElementById(`step${step}`);
    if (targetStep) {
        targetStep.classList.add('active');
        targetStep.style.display = 'block';
        console.log(`✓ 已切換到步驟 ${step}`);
    } else {
        console.error(`❌ 找不到步驟容器: step${step}`);
        return;
    }

    // 如果進入步驟 3，更新摘要
    if (step === 3) {
        displaySummary();
    }

    // 滾動到頂部
    window.scrollTo(0, 0);
}


/**
 * 驗證步驟 1 的資料
 */
function validateStep1() {
    const name = document.getElementById('name').value.trim();
    const rocBirthday = document.getElementById('roc_birthday').value.trim();
    const idNumber = document.getElementById('id_number').value.trim();

    if (!name || !rocBirthday || !idNumber) {
        return false;
    }

    if (!validateIdNumber(idNumber)) {
        showError('身分證字號格式不正確');
        return false;
    }

    if (!validateRocBirthday(rocBirthday)) {
        showError('民國出生年月日格式不正確或日期無效');
        return false;
    }

    return true;
}

/**
 * 驗證步驟 2 的資料
 */
function validateStep2() {
    const passStatus = document.getElementById('pass_status').value.trim();
    const passId = document.getElementById('pass_id').value.trim();
    const validityDays = parseInt(document.getElementById('validityDays').value);

    if (!passStatus) {
        showError('請選擇通行身份');
        return false;
    }

    if (!passId) {
        showError('請先生成通行編號');
        return false;
    }

    if (!validateValidityDays(validityDays)) {
        showError('請輸入 1 到 30 之間的天數');
        return false;
    }

    return true;
}

/**
 * 驗證有效期限天數
 * @param {number} days - 天數
 * @returns {boolean}
 */
function validateValidityDays(days) {
    return !isNaN(days) && days >= 1 && days <= 30;
}

/**
 * 自動產生通行編號
 */
function generatePassId() {
    const passId = generateUniquePassId();
    const passIdInput = document.getElementById('pass_id');
    
    // 設定新的通行編號
    passIdInput.value = passId;
    
    // 視覺反饋：高亮顯示
    passIdInput.style.backgroundColor = '#d1e7dd';
    passIdInput.style.borderColor = '#0f5132';
    
    // 3 秒後恢復正常
    setTimeout(() => {
        passIdInput.style.backgroundColor = '';
        passIdInput.style.borderColor = '';
    }, 3000);
    
    // 複製到剪貼簿的選項提示
    showSuccess(`✓ 通行編號已產生：${passId}`);
    console.log('通行編號:', passId);
}


/**
 * 顯示步驟 3 的摘要（使用打碼）
 */
function displaySummary() {
    console.log('顯示摘要（步驟 3）:', formData);
    
    // 將原始數據打碼
    const maskedData = maskPersonalData({
        name: formData.name,
        id_number: formData.id_number,
        roc_birthday: formData.roc_brithday,
        pass_id: formData.pass_id
    });
    
    // 在步驟 3 中顯示打碼後的資訊
    console.log('打碼後的資訊:', maskedData);
    
    document.getElementById('summary_name').textContent = maskedData.name || '未輸入';
    document.getElementById('summary_id_number').textContent = maskedData.id_number || '未輸入';
    document.getElementById('summary_birthday').textContent = maskedData.roc_birthday || '未輸入';
    document.getElementById('summary_pass_status').textContent = formData.pass_status || '未選擇';
    document.getElementById('summary_pass_id').textContent = formData.pass_id || '未產生';
    
    // 有效期限不需打碼，保持原樣
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
 * 發行虛擬憑證
 */
async function issueCredential() {
    const issueBtn = document.getElementById('issueBtn');
    setButtonLoading('issueBtn', true, '產生訪客證 QR Code');

    try {
        // 計算到期日期
        const issueDate = formatDate();
        const expiryDate = formData.expiryDate; // 直接使用使用者選擇的日期


        // 準備憑證資料
        const credentialData = {
            name: formData.name,
            roc_brithday: formData.roc_brithday,
            id_number: formData.id_number,
            pass_status: formData.pass_status,
            pass_id: formData.pass_id,
            issueDate: issueDate,
            expiryDate: expiryDate
        };

        console.log('發行憑證資料:', credentialData);

        // 呼叫後端 API 發行憑證
        const response = await apiCall('POST', '/api/issue-credential', credentialData);

        if (!response.success) {
            throw new Error(response.message || '發行憑證失敗');
        }        

        console.log('發行成功:', response);

        // 隱藏錯誤訊息，顯示 QR Code
        document.getElementById('errorContainer').style.display = 'none';
        document.getElementById('qrcodeContainer').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'none';

        // 顯示 QR Code
        if (response.success && response.qrCode) {
         const qrcodeDiv = document.getElementById('qrcode');

         // 安全地清空舊內容
         while (qrcodeDiv.firstChild) {
             qrcodeDiv.removeChild(qrcodeDiv.firstChild);
         }

        // 直接顯示 API 回傳的 base64 QR Code
        const img = document.createElement('img');
        img.src = response.qrCode;
        img.width = 256;
        img.height = 256;
        img.alt = "訪客證 QR Code";
        qrcodeDiv.appendChild(img);
}

        // 更新成功訊息
        document.getElementById('displayPassId').textContent = formData.pass_id;
        document.getElementById('displayIssueTime').textContent = formatDateTime();
        if (response.transactionId) {
            document.getElementById('displayVcUid').textContent = response.transactionId;
            // 儲存 transactionId 供後續使用
            formData.transactionId = response.transactionId;
        } else {
            document.getElementById('displayVcUid').textContent = '待確認';
        }

        function generateUUIDv4() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = crypto.getRandomValues(new Uint8Array(1)) % 16;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }

        const uuid = generateUUIDv4();
        // 新增至白名單
        const whitelistEntry = {
            id: Date.now().toString() + uuid.replace(/-/g, ''),
            pass_id: formData.pass_id,
            name: formData.name,
            pass_status: formData.pass_status,
            issue_time: formatDateTime(),
            expiry_date: formData.expiryDate,
            status: 'active',
            transactionId: response.transactionId || null
        };

        whitelistData.push(whitelistEntry);
        updateWhitelistTable();
        saveToStorage('whitelist', whitelistData);

        console.log('✓ 已新增到白名單:', whitelistEntry);

        // 呼叫後端 API 新增白名單
        await apiCall('POST', '/api/whitelist', whitelistEntry);



        showSuccess('憑證發行成功！訪客可以掃描 QR Code 取得虛擬憑證');

    } catch (error) {
        console.error('發行憑證錯誤:', error);
        
        // 隱藏 QR Code，顯示錯誤訊息
        document.getElementById('qrcodeContainer').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'block';
        document.getElementById('prevBtn').style.display = 'inline-block';
        
        document.getElementById('errorMessage').textContent = error.message || '發行憑證時發生錯誤';
        showError('發行憑證失敗：' + error.message);
    } finally {
        setButtonLoading('issueBtn', false, '產生訪客證 QR Code');
    }
}

/**
 * 更新白名單表格
 */
function updateWhitelistTable() {
    const tbody = document.getElementById('whitelistTableBody');
    
    // 確保白名單資料有效
    if (!whitelistData || !Array.isArray(whitelistData)) {
        console.error('❌ whitelistData 無效');
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
        console.log(`⚠️  已過期的項目 ${removedCount} 筆，已從表格中移除`);
    }
    
    // 清空舊內容（安全方式）
    while (tbody.firstChild) {
        tbody.removeChild(tbody.firstChild);
    }
    
    // 如果沒有有效項目
    if (activeEntries.length === 0) {
        const emptyRow = document.createElement('tr');
        const emptyCell = document.createElement('td');
        emptyCell.colSpan = 7;
        emptyCell.textContent = '暫無有效的白名單項目';
        emptyCell.style.textAlign = 'center';
        emptyCell.style.color = '#999';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
        return;
    }
    
    // 使用文檔片段提高性能
    const fragment = document.createDocumentFragment();
    
    activeEntries.forEach(entry => {
        // 確保每個項目都有 ID
        if (!entry.id) {
            console.warn('項目缺少 ID，自動生成:', entry);
            const randomArray = new Uint8Array(8);
            crypto.getRandomValues(randomArray);
            const randomId = Array.from(randomArray).map(b => b.toString(16).padStart(2, '0')).join('');
            entry.id = parseInt(Date.now().toString() + randomId, 10);
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
        // 建立 <tr> 元素
        const tr = document.createElement('tr');
        
        // 1. pass_id 列
        const passIdTd = document.createElement('td');
        passIdTd.className = 'text-monospace small';
        passIdTd.textContent = entry.pass_id;
        tr.appendChild(passIdTd);
        
        // 2. name 列
        const nameTd = document.createElement('td');
        nameTd.textContent = entry.name;
        tr.appendChild(nameTd);
        
        // 3. pass_status 列
        const statusTd = document.createElement('td');
        statusTd.textContent = entry.pass_status;
        tr.appendChild(statusTd);
        
        // 4. issue_time 列（帶 <small> 標籤）
        const issueTimeTd = document.createElement('td');
        const issueTimeSmall = document.createElement('small');
        issueTimeSmall.textContent = issueTime;
        issueTimeTd.appendChild(issueTimeSmall);
        tr.appendChild(issueTimeTd);
        
        // 5. expiry_date 列（帶 <small> 標籤）
        const expiryTd = document.createElement('td');
        const expirySmall = document.createElement('small');
        expirySmall.textContent = expiryDateStr;
        expiryTd.appendChild(expirySmall);
        tr.appendChild(expiryTd);
        
        // 6. status badge 列
        const statusBadgeTd = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge ${statusBadgeClass}`;
        badge.textContent = statusText;
        statusBadgeTd.appendChild(badge);
        tr.appendChild(statusBadgeTd);
        
        // 7. 刪除按鈕列
        const buttonTd = document.createElement('td');
        const button = document.createElement('button');
        button.className = 'btn btn-sm btn-danger';
        button.title = '取消此人員的通行權限';
        button.setAttribute('data-id', entry.id);
        button.style.padding = '2px 6px';
        button.style.fontSize = '0.8rem';
        button.textContent = '✕';
        
        // 添加點擊事件監聽器（安全且易於維護）
        button.addEventListener('click', () => {
            removeWhitelistEntry(entry.id, entry.name);
        });
        
        buttonTd.appendChild(button);
        tr.appendChild(buttonTd);
        
        // ===== 完成一行的建立 =====
        
        // 添加行到 fragment
        fragment.appendChild(tr);
    });
    
    // 一次性添加所有元素到 DOM（提高性能）
    tbody.appendChild(fragment);
    
    console.log('✓ 白名單表格已更新，共 ' + activeEntries.length + ' 筆有效項目');
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
 * 載入白名單資料
 */
function loadWhitelist() {
    console.log('【載入白名單】');
    
    const savedWhitelist = getFromStorage('whitelist');
    
    if (savedWhitelist && Array.isArray(savedWhitelist) && savedWhitelist.length > 0) {
        console.log('✓ 從 localStorage 載入白名單，共', savedWhitelist.length, '筆');
        whitelistData = savedWhitelist;
        updateWhitelistTable();
    }

    // 同時從後端載入，用於合併新資料
    apiCall('GET', '/api/whitelist')
        .then(response => {
            if (response.success && response.data) {
                console.log('✓ 從後端載入白名單，共', response.data.length, '筆');
                
                // 合併資料而不是覆蓋
                // 保留 localStorage 中的舊資料，加入後端的新資料
                const mergedData = mergeWhitelistData(whitelistData, response.data);
                
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
 * 保留所有唯一的項目（按 pass_id + issue_time 判斷唯一性）
 */
function mergeWhitelistData(localData, remoteData) {
    if (!Array.isArray(localData)) localData = [];
    if (!Array.isArray(remoteData)) remoteData = [];
    
    const merged = [...localData];  // 複製本地資料
    
    // 檢查每個遠端項目是否已存在於本地
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
 * 重新開始
 */
function resetForm() {
    try {
        console.log('重新開始表單');
        
        // 嘗試找表單
        let form = document.getElementById('issuerForm');
        if (!form) {
            form = document.querySelector('form');
        }
        
        // 重置表單
        if (form && typeof form.reset === 'function') {
            form.reset();
            console.log('✓ 表單已重置');
        } else {
            // 手動清空所有欄位
            document.getElementById('name').value = '';
            document.getElementById('roc_birthday').value = '';
            document.getElementById('id_number').value = '';
            document.getElementById('pass_status').value = '';
            document.getElementById('pass_id').value = '';
            document.getElementById('validityDays').value = '3';
            document.getElementById('validityHours').value = '72';
        }
        
        // 清空 formData
        formData = {};
        
        // 隱藏 QR Code 和錯誤
        document.getElementById('qrcodeContainer').style.display = 'none';
        document.getElementById('errorContainer').style.display = 'none';
        document.getElementById('prevBtn').style.display = 'inline-block';
        
        // 返回步驟 1
        goToStep(1);
        
        console.log('✓ 已重新開始');
        showSuccess('已重新開始表單');
        
    } catch (error) {
        console.error('❌ 重新開始表單時出錯:', error);
        showError('重新開始失敗，請刷新頁面');
    }
}


console.log('發行端 JavaScript 已載入');