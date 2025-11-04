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
    if (validityDaysInput) {
        // 頁面載入時顯示一次計算結果
        updateCalculatedExpiryDate();
        
        // 當使用者改變輸入時，實時更新顯示的到期日期
        validityDaysInput.addEventListener('change', updateCalculatedExpiryDate);
        validityDaysInput.addEventListener('input', updateCalculatedExpiryDate);
    }
});

/**
 * 即時更新計算後的到期日期顯示
 */
function updateCalculatedExpiryDate() {
    const validityDaysInput = document.getElementById('validityDays');
    const calculatedDateDisplay = document.getElementById('calculatedExpiryDate');
    
    const days = parseInt(validityDaysInput.value) || 0;
    
    if (days < 1 || days > 30) {
        calculatedDateDisplay.textContent = '（請輸入 1 到 30 之間的天數）';
        calculatedDateDisplay.className = 'text-danger';
        return;
    }
    
    const expiryDate = calculateExpiryDate(days);
    const displayDate = new Date(expiryDate);
    const formattedDate = displayDate.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    
    calculatedDateDisplay.textContent = `（截止日期：${formattedDate}）`;
    calculatedDateDisplay.className = 'text-success';
}



// ===== 步驟導航 =====
function goToStep(step) {
    // 驗證當前步驟
    if (step === 2 && !validateStep1()) {
        showError('請填寫完整的身分證資料');
        return;
    }
    
    if (step === 3 && !validateStep2()) {
        showError('請填寫完整的通行資訊');
        return;
    }

    // 保存當前步驟資料
    if (step > 1) {
        formData.name = document.getElementById('name').value;
        formData.roc_brithday = document.getElementById('roc_birthday').value;
        formData.id_number = document.getElementById('id_number').value;
    }

    if (step > 2) {
        formData.pass_status = document.getElementById('pass_status').value;
        formData.pass_id = document.getElementById('pass_id').value;
        formData.validityDays = parseInt(document.getElementById('validityDays').value);
    
        // 驗證天數
        if (!validateValidityDays(formData.validityDays)) {
            showError('請輸入 1 到 30 之間的天數');
            return;
        }
    
        // 根據天數計算到期日期
        formData.expiryDate = calculateExpiryDate(formData.validityDays);
    }


    /**
     * 驗證有效期限是否符合規定
    * @param {string} expiryDate - 選擇的到期日期 (YYYY-MM-DD)
    * @returns {boolean}
    */
    function validateExpiryDate(expiryDate) {
        if (!expiryDate) return false;
    
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        const expiry = new Date(expiryDate);
        expiry.setHours(0, 0, 0, 0);
    
        // 計算天數差
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
        // 必須至少是今天或明天，最多 30 天後
        return diffDays >= 0 && diffDays <= 30;
    }



    // 隱藏所有 section
    document.getElementById('section1').style.display = 'none';
    document.getElementById('section2').style.display = 'none';
    document.getElementById('section3').style.display = 'none';

    // 顯示目標 section
    document.getElementById('section' + step).style.display = 'block';

    // 更新步驟指示器
    updateStepIndicator(step);

    // 如果進入步驟 3，顯示摘要
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
 * 更新步驟指示器的視覺狀態
 */
function updateStepIndicator(activeStep) {
    for (let i = 1; i <= 3; i++) {
        const step = document.getElementById('step' + i);
        if (i <= activeStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    }
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
 * 顯示摘要資訊
 */
function displaySummary() {
    document.getElementById('summary_name').textContent = formData.name;
    document.getElementById('summary_id_number').textContent = formData.id_number;
    
    // 將民國日期轉換為易讀格式
    // 使用新的格式化函數
    document.getElementById('summary_birthday').textContent = formatRocBirthday(formData.roc_brithday);
    
    document.getElementById('summary_pass_status').textContent = formData.pass_status;
    document.getElementById('summary_pass_id').textContent = formData.pass_id;
    // 計算並顯示到期日期
    const expiryDateObj = new Date(formData.expiryDate);
    const formattedExpiryDate = expiryDateObj.toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    document.getElementById('summary_validity').textContent = `${formData.validityDays} 天（截止日期：${formattedExpiryDate}）`;
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
         qrcodeDiv.innerHTML = ''; // 清空

        // 直接顯示 API 回傳的 base64 QR Code
        const img = document.createElement('img');
        img.src = response.qrCode;
        img.width = 256;
        img.height = 256;
        img.alt = "訪客證 QR Code";
        qrcodeDiv.appendChild(img);
}

        /**new QRCode(qrcodeDiv, {
            text: response.qrCodeUrl || JSON.stringify(credentialData),
            width: 256,
            height: 256,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        })**/

        // 更新成功訊息
        document.getElementById('displayPassId').textContent = formData.pass_id;
        document.getElementById('displayIssueTime').textContent = formatDateTime();
        document.getElementById('displayVcUid').textContent = response.vcUid || '無 UID';

        // 新增至白名單
        const whitelistEntry = {
            pass_id: formData.pass_id,
            name: formData.name,
            pass_status: formData.pass_status,
            issue_time: formatDateTime(),
            expiry_date: formData.expiryDate,  // ← 新增：記錄到期日期
            status: 'active'
        };

        whitelistData.push(whitelistEntry);
        updateWhitelistTable();
        saveToStorage('whitelist', whitelistData);

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
    
    // 過濾掉已過期的項目
    const activeEntries = whitelistData.filter(entry => {
        if (!entry.expiry_date) return true; // 如果沒有過期日期，保留
        
        const expiryDate = new Date(entry.expiry_date);
        const now = new Date();
        return expiryDate > now; // 只保留未過期的
    });
    
    // 如果有項目被過濾出去，更新 whitelistData
    if (activeEntries.length < whitelistData.length) {
        const removedCount = whitelistData.length - activeEntries.length;
        whitelistData = activeEntries;
        saveToStorage('whitelist', whitelistData);
        console.log(`✓ 自動清理 ${removedCount} 筆過期白名單項目`);
    }
    
    if (activeEntries.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">目前尚無發行紀錄或全部已過期</td></tr>';
        return;
    }

    tbody.innerHTML = activeEntries.map(entry => {
        // 計算到期狀態
        const expiryDate = entry.expiry_date ? new Date(entry.expiry_date) : null;
        const now = new Date();
        const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : -1;
        
        // 根據剩餘天數決定徽章顏色
        let badgeClass = 'bg-success';
        let statusText = entry.status;
        
        if (daysUntilExpiry >= 0 && daysUntilExpiry <= 1) {
            badgeClass = 'bg-warning'; // 即將過期
            statusText = `${entry.status} (${daysUntilExpiry}天)`;
        } else if (daysUntilExpiry <= 0) {
            badgeClass = 'bg-danger'; // 已過期
            statusText = '已過期';
        }
        
        return `
            <tr>
                <td class="text-monospace">${entry.pass_id}</td>
                <td>${entry.name}</td>
                <td>${entry.pass_status}</td>
                <td>${entry.issue_time}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}


/**
 * 載入白名單資料
 */
function loadWhitelist() {
    const savedWhitelist = getFromStorage('whitelist');
    if (savedWhitelist) {
        // 載入時自動清理過期項目
        whitelistData = savedWhitelist.filter(entry => {
            if (!entry.expiry_date) return true;
            const expiryDate = new Date(entry.expiry_date);
            return expiryDate > new Date();
        });
        saveToStorage('whitelist', whitelistData);
        updateWhitelistTable();
    }

    // 同時從後端同步
    apiCall('GET', '/api/whitelist')
        .then(response => {
            if (response.success && response.data.length > 0) {
                // 後端已清理過期項目
                whitelistData = response.data;
                updateWhitelistTable();
                saveToStorage('whitelist', whitelistData);
            }
        })
        .catch(error => {
            console.warn('載入白名單失敗:', error);
        });
}


/**
 * 重新開始
 */
function resetForm() {
    formData = {};
    
    // 重置表單
    document.getElementById('idForm').reset();
    document.getElementById('accessForm').reset();
    
    // 隱藏所有 section，顯示第一個
    document.getElementById('section1').style.display = 'block';
    document.getElementById('section2').style.display = 'none';
    document.getElementById('section3').style.display = 'none';
    
    // 隱藏 QR Code 和錯誤訊息
    document.getElementById('qrcodeContainer').style.display = 'none';
    document.getElementById('errorContainer').style.display = 'none';
    document.getElementById('prevBtn').style.display = 'inline-block';
    
    // 重置步驟指示器
    updateStepIndicator(1);
    
    window.scrollTo(0, 0);
}

console.log('發行端 JavaScript 已載入');