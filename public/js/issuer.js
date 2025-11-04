// ============================================
// 發行端 JavaScript
// ============================================

let formData = {}; // 儲存表單資料
let whitelistData = []; // 儲存白名單資料

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('發行端頁面已載入');
    loadWhitelist();
    
    // 初始化有效期限日期輸入提示
    const expiryDateInput = document.getElementById('expiryDate');
    if (expiryDateInput) {
        const today = new Date();
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
    
        // 在 placeholder 中顯示有效範圍
        const todayStr = formatDate(today);
        const maxDateStr = formatDate(maxDate);
        expiryDateInput.placeholder = `請輸入日期 (${todayStr} 至 ${maxDateStr})`;
}

});


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
        formData.expiryDate = document.getElementById('expiryDate').value;
    
        // 驗證日期不超過 30 天
        if (!validateExpiryDate(formData.expiryDate)) {
         showError('有效期限不能超過 30 天');
            return;
        }
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
    const expiryDate = document.getElementById('expiryDate').value.trim();

    if (!passStatus) {
        showError('請選擇通行身份');
        return false;
    }

    if (!passId) {
        showError('請先生成通行編號');
        return false;
    }

    if (!expiryDate) {
        showError('請填寫有效期限截止日期');
        return false;
    }

    if (!validateExpiryDate(expiryDate)) {
        return false;
    }

    return true;
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
    document.getElementById('summary_validity').textContent = formData.expiryDate;

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
    
    if (whitelistData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">目前尚無發行紀錄</td></tr>';
        return;
    }

    tbody.innerHTML = whitelistData.map(entry => `
        <tr>
            <td class="text-monospace">${entry.pass_id}</td>
            <td>${entry.name}</td>
            <td>${entry.pass_status}</td>
            <td>${entry.issue_time}</td>
            <td><span class="badge bg-success">${entry.status}</span></td>
        </tr>
    `).join('');
}

/**
 * 載入白名單資料
 */
function loadWhitelist() {
    // 嘗試從 localStorage 載入
    const savedWhitelist = getFromStorage('whitelist');
    if (savedWhitelist) {
        whitelistData = savedWhitelist;
        updateWhitelistTable();
    }

    // 非同步從後端載入
    apiCall('GET', '/api/whitelist')
        .then(response => {
            if (response.success && response.data.length > 0) {
                whitelistData = response.data;
                updateWhitelistTable();
            }
        })
        .catch(error => {
            console.warn('載入白名單失敗:', error);
            // 使用 localStorage 的資料作為備份
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