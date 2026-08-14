// ==========================================
// 1. تهيئة Firebase & Firestore & Auth
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyCtGr3r2MS8a7KdVuBh8gJVL0eNve7twSU",
    authDomain: "zaincashdeliveryhelper.firebaseapp.com",
    projectId: "zaincashdeliveryhelper",
    storageBucket: "zaincashdeliveryhelper.firebasestorage.app",
    messagingSenderId: "108290396776",
    appId: "1:108290396776:web:ae3a55b268aaaf84c1e1dd"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.firestore();
const auth = firebase.auth();

let drivers = [];
let activeCompanyFilter = 'all';
let fullScreenDriverId = null;

// ==========================================
// 2. إدارة تسجيل الدخول (Google / Anonymous Guest)
// ==========================================
const authScreen = document.getElementById('authScreen');
const appContainer = document.getElementById('appContainer');
const googleLoginBtn = document.getElementById('googleLoginBtn');
const guestLoginBtn = document.getElementById('guestLoginBtn');
const userEmailDisplay = document.getElementById('userEmailDisplay');

// مراقبة حالة المستخدم
auth.onAuthStateChanged((user) => {
    if (user) {
        authScreen.classList.add('hidden');
        appContainer.classList.remove('hidden');
        if (userEmailDisplay) {
            userEmailDisplay.textContent = user.isAnonymous 
                ? `الحساب الحالي: زائر (مجهول)` 
                : `الحساب الحالي: ${user.email}`;
        }
        // جلب وقراءة كافة البيانات المخزنة من قاعدة البيانات للجميع
        loadDriversFromCloud();
    } else {
        authScreen.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// 1. تسجيل الدخول كزائر بضغطة زر واحدة (بدون حساب)
if (guestLoginBtn) {
    guestLoginBtn.onclick = async () => {
        try {
            await auth.signInAnonymously();
        } catch (error) {
            alert("فشل الدخول كزائر: " + error.message);
        }
    };
}

// 2. تسجيل الدخول عبر حساب Google
googleLoginBtn.onclick = async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        await auth.signInWithRedirect(provider);
    } catch (error) {
        alert("فشل تسجيل الدخول بـ Google: " + error.message);
    }
};

// استقبال نتيجة إعادة التوجيه بعد تسجيل الدخول بـ Google
auth.getRedirectResult().catch((error) => {
    if (error.code) {
        alert("خطأ في تسجيل الدخول: " + error.message);
    }
});

document.getElementById('logoutBtn').onclick = () => auth.signOut();

// ==========================================
// 3. جلب البيانات لحظياً من Cloud Firestore
// ==========================================
function loadDriversFromCloud() {
    db.collection("drivers").orderBy("createdAt", "desc").onSnapshot((snapshot) => {
        drivers = [];
        snapshot.forEach((doc) => {
            drivers.push({ id: doc.id, ...doc.data() });
        });
        filterAndRenderDrivers();
    }, (error) => {
        console.error("خطأ في جلب البيانات: ", error);
    });
}

// ==========================================
// 4. رسم بطاقات السائقين (دعم الشاشة الكاملة)
// ==========================================
const driversList = document.getElementById('driversList');
const backToListBtn = document.getElementById('backToListBtn');

function renderDrivers(data) {
    driversList.innerHTML = '';

    if (data.length === 0) {
        driversList.innerHTML = `<p style="text-align:center; color: var(--text-secondary); margin-top:30px; font-weight: bold;">لا يوجد سائقين مطابقين.</p>`;
        return;
    }

    // إذا كان هناك كرت مفتوح بشاشة كاملة
    let displayData = data;
    if (fullScreenDriverId) {
        displayData = data.filter(d => d.id === fullScreenDriverId);
        backToListBtn.classList.remove('hidden');
    } else {
        backToListBtn.classList.add('hidden');
    }

    displayData.forEach(driver => {
        const card = document.createElement('div');
        const isTalabat = driver.company === 'talabat';
        const isBalee = driver.company === 'baleefood';
        const isFullscreen = driver.id === fullScreenDriverId;

        card.className = `driver-card ${isTalabat ? 'talabat-card' : ''} ${isBalee ? 'balee-card' : ''} ${isFullscreen ? 'fullscreen' : ''}`;

        let fieldsHTML = isTalabat ? `
            ${driver.branch ? `<div class="info-row"><span class="info-label">اسم الفرع:</span><span class="info-value">${driver.branch}</span></div>` : ''}
            ${driver.companyCode ? `<div class="info-row"><span class="info-label">رمز الشركة:</span><div class="info-value-group"><span class="info-value">${driver.companyCode}</span><button class="copy-btn" onclick="copyToClipboard('${driver.companyCode}', this)"><i class="fa-regular fa-copy"></i> نسخ</button></div></div>` : ''}
            <div class="info-row"><span class="info-label">اسم السائق:</span><div class="info-value-group"><span class="info-value">${driver.name}</span><button class="copy-btn" onclick="copyToClipboard('${driver.name}', this)"><i class="fa-regular fa-copy"></i> نسخ الاسم</button></div></div>
            <div class="info-row"><span class="info-label">ID السائق:</span><div class="info-value-group"><span class="info-value">${driver.driverId}</span><button class="copy-btn" onclick="copyToClipboard('${driver.driverId}', this)"><i class="fa-regular fa-copy"></i> نسخ ID</button></div></div>
            <div class="info-row"><span class="info-label">رقم الهاتف:</span><div class="info-value-group"><span class="info-value">${driver.phone}</span><button class="copy-btn" onclick="copyToClipboard('${driver.phone}', this)"><i class="fa-regular fa-copy"></i> نسخ الهاتف</button></div></div>
        ` : `
            <div class="info-row"><span class="info-label">اسم السائق:</span><div class="info-value-group"><span class="info-value">${driver.name}</span><button class="copy-btn" onclick="copyToClipboard('${driver.name}', this)"><i class="fa-regular fa-copy"></i> نسخ الاسم</button></div></div>
            <div class="info-row"><span class="info-label">رقم الهاتف:</span><div class="info-value-group"><span class="info-value">${driver.phone}</span><button class="copy-btn" onclick="copyToClipboard('${driver.phone}', this)"><i class="fa-regular fa-copy"></i> نسخ الهاتف</button></div></div>
        `;

        card.innerHTML = `
            <div class="driver-card-header">
                <strong>${driver.name}</strong>
                <span class="company-badge">${isTalabat ? 'طلبات' : (isBalee ? 'بلي فود' : driver.company.toUpperCase())}</span>
            </div>
            ${fieldsHTML}
            <div class="card-actions">
                <button class="card-action-btn btn-edit" onclick="openEditModal('${driver.id}', event)"><i class="fa-solid fa-pen-to-square"></i> تعديل</button>
                <button class="card-action-btn btn-delete" onclick="deleteDriver('${driver.id}', event)"><i class="fa-solid fa-trash"></i> حذف</button>
            </div>
        `;

        // عند الضغط على الكرت للدخول بالشاشة الكاملة
        card.onclick = (e) => {
            if (e.target.closest('button')) return; // تجاهل زر النسخ والتعديل
            fullScreenDriverId = driver.id;
            filterAndRenderDrivers();
        };

        driversList.appendChild(card);
    });
}

backToListBtn.onclick = () => {
    fullScreenDriverId = null;
    filterAndRenderDrivers();
};

// ==========================================
// 5. البحث والاقتراحات اللحظية
// ==========================================
const searchInput = document.getElementById('searchInput');
const searchSuggestions = document.getElementById('searchSuggestions');

searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    if (query.length === 0) {
        searchSuggestions.classList.add('hidden');
        filterAndRenderDrivers();
        return;
    }

    const matches = drivers.filter(d => 
        d.name.toLowerCase().includes(query) || (d.driverId && d.driverId.toLowerCase().includes(query))
    );

    if (matches.length > 0) {
        searchSuggestions.innerHTML = '';
        matches.forEach(m => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `<span><strong>${m.name}</strong> (${m.driverId || m.phone})</span> <small style="color:var(--primary-color)">${m.company.toUpperCase()}</small>`;
            item.onclick = () => {
                fullScreenDriverId = m.id;
                searchSuggestions.classList.add('hidden');
                searchInput.value = m.name;
                filterAndRenderDrivers();
            };
            searchSuggestions.appendChild(item);
        });
        searchSuggestions.classList.remove('hidden');
    } else {
        searchSuggestions.classList.add('hidden');
    }
    filterAndRenderDrivers();
});

function filterAndRenderDrivers() {
    const query = searchInput.value.toLowerCase().trim();
    const filtered = drivers.filter(d => {
        const matchesCompany = (activeCompanyFilter === 'all') || (d.company === activeCompanyFilter);
        const matchesQuery = d.name.toLowerCase().includes(query) || 
                             (d.driverId && d.driverId.toLowerCase().includes(query)) ||
                             d.phone.includes(query);
        return matchesCompany && matchesQuery;
    });
    renderDrivers(filtered);
}

// ==========================================
// 6. ميزة النسخ السريع للـ Clipboard
// ==========================================
function copyToClipboard(text, buttonElement) {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
        const originalText = buttonElement.innerHTML;
        buttonElement.innerHTML = `<i class="fa-solid fa-check"></i> تم!`;
        buttonElement.style.color = 'var(--success-color)';
        setTimeout(() => {
            buttonElement.innerHTML = originalText;
            buttonElement.style.color = 'var(--primary-color)';
        }, 1500);
    });
}

// ==========================================
// 7. إضافة وتعديل وحذف السائقين
// ==========================================
const driverModal = document.getElementById('driverModal');
const driverForm = document.getElementById('driverForm');
const modalTitle = document.getElementById('modalTitle');
const editDriverDocId = document.getElementById('editDriverDocId');
const companySelect = document.getElementById('companySelect');

// دالة التبديل الديناميكي لإخفاء حقول طلبات عند اختيار بلي فود
function toggleFormFieldsByCompany(company) {
    const talabatFields = document.querySelectorAll('.talabat-only');
    talabatFields.forEach(el => {
        if (company === 'baleefood') {
            el.classList.add('hidden');
        } else {
            el.classList.remove('hidden');
        }
    });
}

// مراقبة تغيير الاختيار من القائمة المنسدلة
companySelect.addEventListener('change', (e) => {
    toggleFormFieldsByCompany(e.target.value);
});

document.getElementById('addDriverBtn').onclick = () => {
    editDriverDocId.value = '';
    modalTitle.textContent = 'إضافة سائق جديد';
    driverForm.reset();
    toggleFormFieldsByCompany(companySelect.value);
    driverModal.style.display = 'flex';
};

document.querySelector('.close-btn').onclick = () => driverModal.style.display = 'none';

function openEditModal(docId, e) {
    e.stopPropagation();
    const driver = drivers.find(d => d.id === docId);
    if (!driver) return;

    editDriverDocId.value = driver.id;
    modalTitle.textContent = 'تعديل بيانات السائق';
    companySelect.value = driver.company;
    toggleFormFieldsByCompany(driver.company);

    document.getElementById('driverName').value = driver.name;
    document.getElementById('driverPhone').value = driver.phone;

    if (driver.company === 'talabat') {
        document.getElementById('branchName').value = driver.branch || '';
        document.getElementById('companyCode').value = driver.companyCode || '';
        document.getElementById('driverId').value = driver.driverId || '';
    }

    driverModal.style.display = 'flex';
}

async function deleteDriver(docId, e) {
    e.stopPropagation();
    if (confirm("هل أنت تأكد من رغبتك في حذف هذا السائق؟")) {
        try {
            await db.collection("drivers").doc(docId).delete();
            if (fullScreenDriverId === docId) fullScreenDriverId = null;
        } catch (err) {
            alert("خطأ أثناء الحذف: " + err.message);
        }
    }
}

driverForm.onsubmit = async (e) => {
    e.preventDefault();
    const docId = editDriverDocId.value;
    const company = companySelect.value;

    let payload = {
        company: company,
        name: document.getElementById('driverName').value.trim(),
        phone: document.getElementById('driverPhone').value.trim(),
    };

    if (company === 'talabat') {
        payload.branch = document.getElementById('branchName').value.trim();
        payload.companyCode = document.getElementById('companyCode').value.trim();
        payload.driverId = document.getElementById('driverId').value.trim();
    }

    try {
        if (docId) {
            await db.collection("drivers").doc(docId).update(payload);
        } else {
            payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            await db.collection("drivers").add(payload);
        }
        driverModal.style.display = 'none';
        driverForm.reset();
    } catch (err) {
        alert("خطأ أثناء الحفظ: " + err.message);
    }
};

// ==========================================
// 8. التصفية والنوافذ الفرعية
// ==========================================
document.querySelectorAll('.company-tags .tag').forEach(tag => {
    tag.addEventListener('click', () => {
        document.querySelectorAll('.company-tags .tag').forEach(t => t.classList.remove('active'));
        tag.classList.add('active');
        activeCompanyFilter = tag.getAttribute('data-company');
        filterAndRenderDrivers();
    });
});

const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
settingsBtn.onclick = () => settingsModal.style.display = 'flex';
document.querySelector('.close-settings-btn').onclick = () => settingsModal.style.display = 'none';

// فتح التطبيق في نافذة منبثقة مصغرة مخصصة للعمل بجانب أو فوق تطبيق زين كاش
const floatWindowBtn = document.getElementById('floatWindowBtn');

if (floatWindowBtn) {
    floatWindowBtn.onclick = () => {
        const width = 380;
        const height = 600;
        const left = (screen.width) ? screen.width - width : 0;
        
        window.open(
            window.location.href, 
            'ZainCashHelperFloat', 
            `width=${width},height=${height},top=50,left=${left},resizable=yes,scrollbars=yes,status=no`
        );
    };
}
