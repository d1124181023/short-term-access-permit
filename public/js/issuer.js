// ============================================
// 發行端 JavaScript
// ============================================

let formData = {}; // 儲存表單資料
let whitelistData = []; // 儲存白名單資料

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', function() {
    console.log('發行端頁面已載入');
    loadWhitelist(); // 載入白名單
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
        formData.validity = document.getElementById('validity').value;
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
function validateStep2() {
    const passStatus = document.getElementById('pass_status').value.trim();
    const passId = document.getElementById('pass_id').value.trim();

    if (!passStatus || !passId) {
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
    document.getElementById('pass_id').value = passId;
    showSuccess('已自動產生通行編號');
}

/**
 * 顯示摘要資訊
 */
function displaySummary() {
    document.getElementById('summary_name').textContent = formData.name;
    document.getElementById('summary_id_number').textContent = formData.id_number;
    
    // 將民國日期轉換為易讀格式
    const rocBirthday = formData.roc_brithday;
    const year = rocBirthday.substring(0, 3);
    const month = rocBirthday.substring(3, 5);
    const day = rocBirthday.substring(5, 7);
    document.getElementById('summary_birthday').textContent = `民國${year}年${month}月${day}日`;
    
    document.getElementById('summary_pass_status').textContent = formData.pass_status;
    document.getElementById('summary_pass_id').textContent = formData.pass_id;
    document.getElementById('summary_validity').textContent = formData.validity;
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
        const expiryDate = calculateExpiryDate(parseInt(formData.validity));

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
            status: 'active'
        };

        whitelistData.push(whitelistEntry);
        updateWhitelistTable();

        // 儲存至 localStorage（備份）
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