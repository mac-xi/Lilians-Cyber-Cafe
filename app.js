// ============================================
// LILIAN'S CYBER CAFÉ - SHADOW TERMINAL v3.0
// Firebase Auth + Firestore Edition
// ============================================

// Firebase Config (YOUR KEYS - ALREADY FILLED IN)
const firebaseConfig = {
    apiKey: "AIzaSyBs0nVjpwtMjtzbSuGDYG4MoctcVPjiP10",
    authDomain: "lilian-s-cyber-cafe.firebaseapp.com",
    projectId: "lilian-s-cyber-cafe",
    storageBucket: "lilian-s-cyber-cafe.firebasestorage.app",
    messagingSenderId: "139202749363",
    appId: "1:139202749363:web:a3614c292bcff6b486a1c6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Global State
let currentUser = null;
let transactions = [];
let expenses = [];
let notifications = [];
let currentMonth = new Date();
let expenseChart = null;
let revenueChart = null, serviceChart = null, hoursChart = null, paymentChart = null;

// ============================================
// LOADING SCREEN
// ============================================
function showLoading() {
    document.getElementById('loading-screen').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loading-screen').style.display = 'none';
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle';
    toast.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => { toast.remove(); }, 4000);
}

// ============================================
// AUTH SYSTEM
// ============================================
const authScreen = document.getElementById('auth-screen');
const appContainer = document.getElementById('app-container');

// Tab switching
document.querySelectorAll('.auth-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`${tab.dataset.tab}-form`).classList.add('active');
        // Hide forgot form if switching
        document.getElementById('forgot-form').classList.remove('active');
    });
});

// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('input');
        input.type = input.type === 'password' ? 'text' : 'password';
        btn.querySelector('i').className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });
});

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorEl = document.getElementById('login-error');

    try {
        showLoading();
        await auth.signInWithEmailAndPassword(email, password);
        errorEl.textContent = '';
    } catch (err) {
        hideLoading();
        errorEl.textContent = getAuthError(err.code);
    }
});

// Register
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirm = document.getElementById('register-confirm').value;
    const errorEl = document.getElementById('register-error');

    if (password !== confirm) {
        errorEl.textContent = 'Passwords do not match!';
        return;
    }
    if (password.length < 6) {
        errorEl.textContent = 'Password must be at least 6 characters!';
        return;
    }

    try {
        showLoading();
        const cred = await auth.createUserWithEmailAndPassword(email, password);
        await cred.user.updateProfile({ displayName: name });
        // Save user to Firestore
        await db.collection('users').doc(cred.user.uid).set({
            name: name,
            email: email,
            role: 'Manager',
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        errorEl.textContent = '';
        showToast('Account created! Welcome to the Shadow Terminal.', 'success');
    } catch (err) {
        hideLoading();
        errorEl.textContent = getAuthError(err.code);
    }
});

// Forgot Password
document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('forgot-form').classList.add('active');
});

document.getElementById('back-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('login-form').classList.add('active');
});

document.getElementById('forgot-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    const errorEl = document.getElementById('forgot-error');
    const successEl = document.getElementById('forgot-success');

    try {
        await auth.sendPasswordResetEmail(email);
        successEl.textContent = 'Password reset link sent! Check your email.';
        errorEl.textContent = '';
    } catch (err) {
        errorEl.textContent = getAuthError(err.code);
        successEl.textContent = '';
    }
});

function getAuthError(code) {
    const errors = {
        'auth/invalid-email': 'Invalid email address.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/email-already-in-use': 'An account already exists with this email.',
        'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Check your connection.'
    };
    return errors[code] || 'An error occurred. Please try again.';
}

// Auth State Listener
auth.onAuthStateChanged(async (user) => {
    if (user) {
        currentUser = user;
        authScreen.style.display = 'none';
        appContainer.style.display = 'block';

        // Update UI with user info
        document.getElementById('profile-name').textContent = user.displayName || user.email.split('@')[0];
        document.getElementById('dropdown-name').textContent = user.displayName || user.email.split('@')[0];
        document.getElementById('dropdown-email').textContent = user.email;
        document.getElementById('profile-img').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;
        document.querySelector('.profile-header img').src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`;

        // Load data
        await loadAllData();
        initApp();
        hideLoading();
        showToast(`Welcome back, ${user.displayName || 'Agent'}!`, 'success');
    } else {
        currentUser = null;
        authScreen.style.display = 'flex';
        appContainer.style.display = 'none';
        hideLoading();
    }
});

// Logout
document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
        await auth.signOut();
        showToast('Logged out successfully.', 'info');
    } catch (err) {
        showToast('Logout failed: ' + err.message, 'error');
    }
});

// ============================================
// DATA OPERATIONS
// ============================================
async function loadAllData() {
    try {
        // Load transactions
        const txSnap = await db.collection('transactions').orderBy('createdAt', 'desc').get();
        transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load expenses
        const exSnap = await db.collection('expenses').orderBy('createdAt', 'desc').get();
        expenses = exSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Load notifications
        const notifSnap = await db.collection('notifications').orderBy('createdAt', 'desc').limit(20).get();
        notifications = notifSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error loading data:', err);
        showToast('Error loading data. Please refresh.', 'error');
    }
}

async function addTransaction(tx) {
    tx.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    tx.createdBy = currentUser.uid;
    const docRef = await db.collection('transactions').add(tx);
    tx.id = docRef.id;
    await addNotification('New transaction logged', `${tx.service} - KES ${tx.amount} (${tx.payment})`, 'transaction');
    // Reload from Firestore to ensure no duplicates
    await reloadTransactions();
    return tx;
}

async function addExpense(ex) {
    ex.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    ex.createdBy = currentUser.uid;
    const docRef = await db.collection('expenses').add(ex);
    ex.id = docRef.id;
    await addNotification('Expense recorded', `${ex.category} - KES ${ex.amount}`, 'expense');
    // Reload from Firestore to ensure no duplicates
    await reloadExpenses();
    return ex;
}

async function deleteTransaction(id) {
    await db.collection('transactions').doc(id).delete();
    transactions = transactions.filter(t => t.id !== id);
}

async function deleteExpense(id) {
    await db.collection('expenses').doc(id).delete();
    expenses = expenses.filter(e => e.id !== id);
}

async function addNotification(title, message, type) {
    const notif = {
        title, message, type,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        read: false
    };
    await db.collection('notifications').add(notif);
    notifications.unshift({ ...notif, id: Date.now().toString() });
    updateNotificationBadge();
}

// ============================================
// APP INITIALIZATION
// ============================================
function initApp() {
    // Set default date
    document.getElementById('daily-date').value = formatDate(new Date());
    document.getElementById('tx-date').value = formatDate(new Date());
    document.getElementById('expense-date').value = formatDate(new Date());


    // System Clock
    function updateClock() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-KE', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        });
        const clockEl = document.getElementById('clock-time');
        if (clockEl) clockEl.textContent = timeStr;
    }
    updateClock();
    setInterval(updateClock, 1000);

    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            item.classList.add('active');
            document.getElementById(item.dataset.section).classList.add('active');

            if (item.dataset.section === 'analytics') setTimeout(renderAnalytics, 100);
            if (item.dataset.section === 'expenditures') setTimeout(renderExpenses, 100);
            if (item.dataset.section === 'monthly') setTimeout(renderMonthly, 100);
        });
    });

    // Dashboard
    renderDashboard();

    // Daily Cash
    document.getElementById('daily-date').addEventListener('change', renderDailyCash);
    document.getElementById('add-transaction-btn').addEventListener('click', () => {
        document.getElementById('transaction-modal').classList.add('active');
    });

    // Transaction Form
    document.getElementById('transaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const tx = {
            date: document.getElementById('tx-date').value,
            service: document.getElementById('tx-service').value,
            customer: document.getElementById('tx-customer').value,
            amount: parseFloat(document.getElementById('tx-amount').value),
            payment: document.getElementById('tx-payment').value,
            notes: document.getElementById('tx-notes').value
        };
        showLoading();
        await addTransaction(tx);
        hideLoading();
        document.getElementById('transaction-modal').classList.remove('active');
        document.getElementById('transaction-form').reset();
        document.getElementById('tx-date').value = formatDate(new Date());
        renderDailyCash();
        renderDashboard();
        showToast('Transaction saved!', 'success');
    });

    // Expense Form
    document.getElementById('expense-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const ex = {
            date: document.getElementById('expense-date').value,
            category: document.getElementById('expense-category').value,
            description: document.getElementById('expense-desc').value,
            amount: parseFloat(document.getElementById('expense-amount').value)
        };
        showLoading();
        await addExpense(ex);
        hideLoading();
        document.getElementById('expense-form').reset();
        document.getElementById('expense-date').value = formatDate(new Date());
        renderExpenses();
        renderDashboard();
        showToast('Expense recorded!', 'success');
    });

    // Monthly navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        renderMonthly();
    });
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        renderMonthly();
    });
    document.getElementById('export-monthly').addEventListener('click', exportMonthlyCSV);

    // Search
    document.getElementById('global-search').addEventListener('input', handleSearch);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-container')) {
            document.getElementById('search-results').classList.remove('active');
        }
    });

    // Notifications
    document.getElementById('notification-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('notification-dropdown').classList.toggle('active');
        document.getElementById('profile-dropdown').classList.remove('active');
    });
    document.getElementById('clear-notifications').addEventListener('click', async () => {
        notifications = [];
        // Delete all notifications from Firestore
        const batch = db.batch();
        const notifSnap = await db.collection('notifications').get();
        notifSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        updateNotificationBadge();
        renderNotifications();
    });

    // Profile dropdown
    document.getElementById('profile-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('profile-dropdown').classList.toggle('active');
        document.getElementById('notification-dropdown').classList.remove('active');
    });

    // Close dropdowns on outside click
    document.addEventListener('click', () => {
        document.getElementById('notification-dropdown').classList.remove('active');
        document.getElementById('profile-dropdown').classList.remove('active');
    });

    // Change Password Modal
    document.getElementById('change-password-btn').addEventListener('click', () => {
        document.getElementById('change-password-modal').classList.add('active');
        document.getElementById('profile-dropdown').classList.remove('active');
    });
    document.getElementById('change-password-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPwd = document.getElementById('current-pwd').value;
        const newPwd = document.getElementById('new-pwd').value;
        const confirmPwd = document.getElementById('confirm-pwd').value;
        const errorEl = document.getElementById('pwd-error');

        if (newPwd !== confirmPwd) {
            errorEl.textContent = 'New passwords do not match!';
            return;
        }
        if (newPwd.length < 6) {
            errorEl.textContent = 'Password must be at least 6 characters!';
            return;
        }

        try {
            const credential = firebase.auth.EmailAuthProvider.credential(currentUser.email, currentPwd);
            await currentUser.reauthenticateWithCredential(credential);
            await currentUser.updatePassword(newPwd);
            errorEl.textContent = '';
            document.getElementById('change-password-modal').classList.remove('active');
            document.getElementById('change-password-form').reset();
            showToast('Password updated successfully!', 'success');
        } catch (err) {
            errorEl.textContent = err.code === 'auth/wrong-password' ? 'Current password is incorrect.' : 'Error: ' + err.message;
        }
    });

    // Manage Users
    document.getElementById('manage-users-btn').addEventListener('click', async () => {
        document.getElementById('manage-users-modal').classList.add('active');
        document.getElementById('profile-dropdown').classList.remove('active');
        await renderUsersList();
    });

    // Business Settings
    document.getElementById('business-settings-btn').addEventListener('click', () => {
        showToast('Business settings coming in next update!', 'info');
        document.getElementById('profile-dropdown').classList.remove('active');
    });

    // Backup
    document.getElementById('backup-btn').addEventListener('click', () => {
        exportAllData();
        document.getElementById('profile-dropdown').classList.remove('active');
    });

    // Modal close buttons
    document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.remove('active');
        });
    });
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // Initial renders
    renderDailyCash();
    renderNotifications();
    renderServices();
    updateNotificationBadge();
}


// Reload just transactions (no duplicates)
async function reloadTransactions() {
    try {
        const txSnap = await db.collection('transactions').orderBy('createdAt', 'desc').get();
        transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error reloading transactions:', err);
    }
}

// Reload just expenses (no duplicates)
async function reloadExpenses() {
    try {
        const exSnap = await db.collection('expenses').orderBy('createdAt', 'desc').get();
        expenses = exSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error reloading expenses:', err);
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================
function renderDashboard() {
    const cashTotal = transactions.filter(t => t.payment === 'Cash').reduce((s, t) => s + (t.amount || 0), 0);
    const mpesaTotal = transactions.filter(t => t.payment === 'M-Pesa').reduce((s, t) => s + (t.amount || 0), 0);
    const bankTotal = transactions.filter(t => t.payment === 'Bank').reduce((s, t) => s + (t.amount || 0), 0);
    const grandTotal = cashTotal + mpesaTotal + bankTotal;

    document.getElementById('total-cash').textContent = `KES ${formatNumber(cashTotal)}`;
    document.getElementById('total-mpesa').textContent = `KES ${formatNumber(mpesaTotal)}`;
    document.getElementById('total-bank').textContent = `KES ${formatNumber(bankTotal)}`;
    document.getElementById('total-grand').textContent = `KES ${formatNumber(grandTotal)}`;

    // Today's activity
    const today = formatDate(new Date());
    const todayTx = transactions.filter(t => t.date === today).slice(0, 5);
    const activityList = document.getElementById('today-activity');
    if (todayTx.length === 0) {
        activityList.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><p>No transactions today yet.</p></div>';
    } else {
        activityList.innerHTML = todayTx.map(t => `
            <div class="activity-item">
                <div class="activity-info">
                    <span class="activity-title">${t.service} - ${t.customer}</span>
                    <span class="activity-meta">${t.payment} • ${formatTime(t.createdAt)}</span>
                </div>
                <span class="activity-amount">+KES ${formatNumber(t.amount)}</span>
            </div>
        `).join('');
    }

    // Top services
    const serviceCounts = {};
    transactions.forEach(t => { serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1; });
    const topServices = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const maxCount = topServices.length > 0 ? topServices[0][1] : 1;

    document.getElementById('top-services').innerHTML = topServices.map(([name, count]) => `
        <div class="top-service-item">
            <span class="top-service-label">${name}</span>
            <div class="top-service-bar">
                <div class="top-service-fill" style="width: ${(count / maxCount) * 100}%"></div>
            </div>
            <span class="top-service-count">${count}</span>
        </div>
    `).join('') || '<div class="empty-state"><i class="fas fa-chart-bar"></i><p>No data yet.</p></div>';
}

function renderDailyCash() {
    const dateStr = document.getElementById('daily-date').value;
    const dayTx = transactions.filter(t => t.date === dateStr);

    // Payment breakdown
    const cash = dayTx.filter(t => t.payment === 'Cash').reduce((s, t) => s + (t.amount || 0), 0);
    const mpesa = dayTx.filter(t => t.payment === 'M-Pesa').reduce((s, t) => s + (t.amount || 0), 0);
    const bank = dayTx.filter(t => t.payment === 'Bank').reduce((s, t) => s + (t.amount || 0), 0);
    const mixed = dayTx.filter(t => t.payment === 'Mixed').reduce((s, t) => s + (t.amount || 0), 0);
    const total = cash + mpesa + bank + mixed;

    document.getElementById('daily-cash-total').textContent = `KES ${formatNumber(cash)}`;
    document.getElementById('daily-mpesa-total').textContent = `KES ${formatNumber(mpesa)}`;
    document.getElementById('daily-bank-total').textContent = `KES ${formatNumber(bank)}`;
    document.getElementById('daily-mixed-total').textContent = `KES ${formatNumber(mixed)}`;
    document.getElementById('daily-total').textContent = `KES ${formatNumber(total)}`;

    // Table
    const tbody = document.getElementById('daily-transactions');
    if (dayTx.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state"><i class="fas fa-inbox"></i><p>No transactions for ${dateStr}</p></td></tr>`;
    } else {
        tbody.innerHTML = dayTx.map(t => `
            <tr>
                <td>${formatTime(t.createdAt) || '--:--'}</td>
                <td><span style="color:var(--neon-cyan)">${t.service}</span></td>
                <td>${t.customer}</td>
                <td style="font-family:var(--font-mono);color:var(--neon-green)">KES ${formatNumber(t.amount)}</td>
                <td><span class="badge-payment ${t.payment.toLowerCase()}">${t.payment}</span></td>
                <td>
                    <button class="action-btn" onclick="deleteTx('${t.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>
        `).join('');
    }
}

async function deleteTx(id) {
    if (!confirm('Delete this transaction?')) return;
    showLoading();
    await deleteTransaction(id);
    hideLoading();
    renderDailyCash();
    renderDashboard();
    showToast('Transaction deleted.', 'info');
}

function renderExpenses() {
    // Expense chart
    const categoryTotals = {};
    expenses.forEach(e => { categoryTotals[e.category] = (categoryTotals[e.category] || 0) + (e.amount || 0); });

    const ctx = document.getElementById('expense-chart');
    if (expenseChart) expenseChart.destroy();

    if (Object.keys(categoryTotals).length === 0) {
        ctx.style.display = 'none';
    } else {
        ctx.style.display = 'block';
        expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#00f0ff', '#ff00a0', '#ffd700', '#00ff88', '#ff3366', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#8888a0', font: { family: 'Rajdhani', size: 11 }, padding: 15 } }
                }
            }
        });
    }

    // Expenses table
    const tbody = document.getElementById('expenses-list');
    if (expenses.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-wallet"></i><p>No expenses recorded yet.</p></td></tr>`;
    } else {
        tbody.innerHTML = expenses.slice(0, 50).map(e => `
            <tr>
                <td>${e.date}</td>
                <td><span style="color:var(--neon-magenta)">${e.category}</span></td>
                <td>${e.description}</td>
                <td style="font-family:var(--font-mono);color:var(--neon-red)">KES ${formatNumber(e.amount)}</td>
                <td><button class="action-btn" onclick="deleteEx('${e.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    }
}

async function deleteEx(id) {
    if (!confirm('Delete this expense?')) return;
    showLoading();
    await deleteExpense(id);
    hideLoading();
    renderExpenses();
    renderDashboard();
    showToast('Expense deleted.', 'info');
}

function renderMonthly() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('current-month-label').textContent = `${monthNames[month]} ${year}`;

    const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });
    const monthEx = expenses.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    const income = monthTx.reduce((s, t) => s + (t.amount || 0), 0);
    const expenseTotal = monthEx.reduce((s, e) => s + (e.amount || 0), 0);
    const net = income - expenseTotal;

    document.getElementById('month-income').textContent = `KES ${formatNumber(income)}`;
    document.getElementById('month-expense').textContent = `KES ${formatNumber(expenseTotal)}`;
    document.getElementById('month-net').textContent = `KES ${formatNumber(net)}`;
    document.getElementById('month-net-card').style.borderColor = net >= 0 ? 'var(--neon-green)' : 'var(--neon-red)';

    // Daily breakdown
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const breakdown = [];
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayTx = monthTx.filter(t => t.date === dateStr);
        const dayEx = monthEx.filter(e => e.date === dateStr);
        const dayIncome = dayTx.reduce((s, t) => s + (t.amount || 0), 0);
        const dayExpense = dayEx.reduce((s, e) => s + (e.amount || 0), 0);
        if (dayTx.length > 0 || dayEx.length > 0) {
            breakdown.push({ date: dateStr, count: dayTx.length, income: dayIncome, expense: dayExpense, net: dayIncome - dayExpense });
        }
    }

    const tbody = document.getElementById('monthly-breakdown');
    if (breakdown.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-state"><i class="fas fa-calendar"></i><p>No data for this month.</p></td></tr>`;
    } else {
        tbody.innerHTML = breakdown.map(b => `
            <tr>
                <td>${b.date}</td>
                <td>${b.count}</td>
                <td style="color:var(--neon-green);font-family:var(--font-mono)">KES ${formatNumber(b.income)}</td>
                <td style="color:var(--neon-red);font-family:var(--font-mono)">KES ${formatNumber(b.expense)}</td>
                <td style="color:${b.net >= 0 ? 'var(--neon-green)' : 'var(--neon-red)'};font-family:var(--font-mono)">KES ${formatNumber(b.net)}</td>
            </tr>
        `).join('');
    }
}

function renderServices() {
    const services = [
        { name: 'E-Citizen', desc: 'Government portal services - passport, ID, good conduct, etc.', price: 'From KES 50', icon: 'fa-id-card' },
        { name: 'KRA', desc: 'Tax services - PIN registration, returns filing, compliance.', price: 'From KES 100', icon: 'fa-file-invoice-dollar' },
        { name: 'SHA', desc: 'Social Health Authority registration and services.', price: 'From KES 50', icon: 'fa-heartbeat' },
        { name: 'NTSA', desc: 'Transport services - driving license, vehicle inspection, TIMS.', price: 'From KES 100', icon: 'fa-car' },
        { name: 'HELB', desc: 'Higher Education Loans Board applications and statements.', price: 'From KES 50', icon: 'fa-graduation-cap' },
        { name: 'Arhisasa', desc: 'Land and property registration services.', price: 'From KES 100', icon: 'fa-home' },
        { name: 'Computer Rental', desc: 'High-speed internet, gaming, office work, browsing.', price: 'From KES 30/hr', icon: 'fa-desktop' },
        { name: 'Printing', desc: 'Color & B/W printing, large format, bulk orders.', price: 'From KES 10/page', icon: 'fa-print' },
        { name: 'Scanning', desc: 'Document scanning to PDF, email, or USB.', price: 'From KES 20/page', icon: 'fa-scanner' },
        { name: 'Typing', desc: 'Professional document typing and formatting.', price: 'From KES 50/page', icon: 'fa-keyboard' },
        { name: 'Passport Photo', desc: 'Digital and printed passport photos, all sizes.', price: 'From KES 200', icon: 'fa-camera' },
        { name: 'Lamination', desc: 'Document lamination, ID cards, certificates.', price: 'From KES 100', icon: 'fa-layer-group' }
    ];

    document.getElementById('services-grid').innerHTML = services.map(s => `
        <div class="service-card">
            <div class="service-icon"><i class="fas ${s.icon}"></i></div>
            <div class="service-name">${s.name}</div>
            <div class="service-desc">${s.desc}</div>
            <div class="service-price">${s.price}</div>
        </div>
    `).join('');
}

function renderAnalytics() {
    // Revenue trend (last 7 days)
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        last7Days.push(formatDate(d));
    }
    const revenueData = last7Days.map(date => {
        return transactions.filter(t => t.date === date).reduce((s, t) => s + (t.amount || 0), 0);
    });

    if (revenueChart) revenueChart.destroy();
    revenueChart = new Chart(document.getElementById('revenue-chart'), {
        type: 'line',
        data: {
            labels: last7Days.map(d => d.slice(5)),
            datasets: [{
                label: 'Revenue',
                data: revenueData,
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: '#fff',
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8888a0', font: { family: 'Rajdhani' } } },
                x: { grid: { display: false }, ticks: { color: '#8888a0', font: { family: 'Rajdhani' } } }
            }
        }
    });

    // Service performance
    const svcCounts = {};
    transactions.forEach(t => { svcCounts[t.service] = (svcCounts[t.service] || 0) + 1; });
    const topSvc = Object.entries(svcCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);

    if (serviceChart) serviceChart.destroy();
    serviceChart = new Chart(document.getElementById('service-chart'), {
        type: 'bar',
        data: {
            labels: topSvc.map(s => s[0]),
            datasets: [{
                label: 'Count',
                data: topSvc.map(s => s[1]),
                backgroundColor: '#ff00a0',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8888a0' } },
                x: { grid: { display: false }, ticks: { color: '#8888a0', font: { size: 10 } } }
            }
        }
    });

    // Peak hours
    const hourCounts = {};
    transactions.forEach(t => {
        const h = t.createdAt?.toDate ? t.createdAt.toDate().getHours() : new Date().getHours();
        hourCounts[h] = (hourCounts[h] || 0) + 1;
    });
    const hours = Array.from({length: 12}, (_, i) => `${i + 8}:00`);
    const hourData = Array.from({length: 12}, (_, i) => hourCounts[i + 8] || 0);

    if (hoursChart) hoursChart.destroy();
    hoursChart = new Chart(document.getElementById('hours-chart'), {
        type: 'bar',
        data: {
            labels: hours,
            datasets: [{
                label: 'Transactions',
                data: hourData,
                backgroundColor: '#ffd700',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8888a0' } },
                x: { grid: { display: false }, ticks: { color: '#8888a0', font: { size: 10 } } }
            }
        }
    });

    // Payment methods
    const payCounts = {};
    transactions.forEach(t => { payCounts[t.payment] = (payCounts[t.payment] || 0) + 1; });

    if (paymentChart) paymentChart.destroy();
    paymentChart = new Chart(document.getElementById('payment-chart'), {
        type: 'pie',
        data: {
            labels: Object.keys(payCounts),
            datasets: [{
                data: Object.values(payCounts),
                backgroundColor: ['#00ff88', '#00f0ff', '#ffd700', '#ff00a0'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom', labels: { color: '#8888a0', font: { family: 'Rajdhani', size: 11 } } }
            }
        }
    });
}

function renderNotifications() {
    const list = document.getElementById('notif-list');
    if (notifications.length === 0) {
        list.innerHTML = '<div class="notif-item"><div class="notif-content"><div class="notif-text">No notifications</div></div></div>';
    } else {
        list.innerHTML = notifications.slice(0, 10).map(n => `
            <div class="notif-item">
                <i class="fas fa-${n.type === 'transaction' ? 'cash-register' : n.type === 'expense' ? 'wallet' : 'bell'}"></i>
                <div class="notif-content">
                    <div class="notif-text"><strong>${n.title}</strong> - ${n.message}</div>
                    <div class="notif-time">${formatTime(n.createdAt) || 'Just now'}</div>
                </div>
            </div>
        `).join('');
    }
}

async function renderUsersList() {
    const list = document.getElementById('users-list');
    try {
        const snap = await db.collection('users').get();
        const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        list.innerHTML = users.map(u => `
            <div class="user-item">
                <div class="user-info">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${u.id}" alt="">
                    <div>
                        <span class="user-name">${u.name || 'Unknown'}</span>
                        <span class="user-email">${u.email}</span>
                    </div>
                </div>
                <span class="user-role ${u.role?.toLowerCase() || 'manager'}">${u.role || 'Manager'}</span>
            </div>
        `).join('');
    } catch (err) {
        list.innerHTML = '<div class="empty-state"><p>Error loading users.</p></div>';
    }
}

function updateNotificationBadge() {
    const unread = notifications.filter(n => !n.read).length;
    const badge = document.getElementById('notif-badge');
    badge.textContent = unread;
    badge.style.display = unread > 0 ? 'flex' : 'none';
}

// ============================================
// SEARCH
// ============================================
function handleSearch(e) {
    const query = e.target.value.toLowerCase().trim();
    const results = document.getElementById('search-results');

    if (query.length < 2) {
        results.classList.remove('active');
        return;
    }

    const matches = [];

    transactions.forEach(t => {
        if (t.customer?.toLowerCase().includes(query) || t.service?.toLowerCase().includes(query)) {
            matches.push({ type: 'Transaction', title: `${t.service} - ${t.customer}`, meta: `KES ${t.amount} • ${t.date}`, date: t.date });
        }
    });

    expenses.forEach(ex => {
        if (ex.description?.toLowerCase().includes(query) || ex.category?.toLowerCase().includes(query)) {
            matches.push({ type: 'Expense', title: `${ex.category} - ${ex.description}`, meta: `KES ${ex.amount} • ${ex.date}`, date: ex.date });
        }
    });

    if (matches.length === 0) {
        results.innerHTML = '<div class="search-result-item"><div class="search-result-title">No results found</div></div>';
    } else {
        results.innerHTML = matches.slice(0, 8).map(m => `
            <div class="search-result-item" data-date="${m.date}">
                <div class="search-result-type">${m.type}</div>
                <div class="search-result-title">${m.title}</div>
                <div class="search-result-meta">${m.meta}</div>
            </div>
        `).join('');

        results.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const date = item.dataset.date;
                if (date) {
                    document.getElementById('daily-date').value = date;
                    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
                    document.querySelector('[data-section="daily-cash"]').classList.add('active');
                    document.getElementById('daily-cash').classList.add('active');
                    renderDailyCash();
                }
                results.classList.remove('active');
                document.getElementById('global-search').value = '';
            });
        });
    }

    results.classList.add('active');
}

// ============================================
// EXPORT
// ============================================
function exportMonthlyCSV() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthTx = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
    });

    let csv = 'Date,Service,Customer,Amount,Payment Method,Notes\n';
    monthTx.forEach(t => {
        csv += `${t.date},${t.service},${t.customer},${t.amount},${t.payment},${t.notes || ''}\n`;
    });

    downloadFile(csv, `lilians-cafe-${year}-${month + 1}.csv`, 'text/csv');
    showToast('Monthly report downloaded!', 'success');
}

function exportAllData() {
    const data = { transactions, expenses, exportedAt: new Date().toISOString() };
    downloadFile(JSON.stringify(data, null, 2), 'lilians-cafe-backup.json', 'application/json');
    showToast('Full backup downloaded!', 'success');
}

function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
}

// ============================================
// UTILITIES
// ============================================
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatNumber(num) {
    return (num || 0).toLocaleString('en-KE');
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    let date;
    if (timestamp.toDate) {
        date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
        date = new Date(timestamp);
    } else {
        return '';
    }
    return date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
}

// Payment badge styles (injected)
const style = document.createElement('style');
style.textContent = `
    .badge-payment { padding: 3px 10px; border-radius: 6px; font-size: 11px; font-family: var(--font-mono); font-weight: 600; }
    .badge-payment.cash { background: rgba(0,255,136,0.15); color: var(--neon-green); }
    .badge-payment.m-pesa { background: rgba(0,240,255,0.15); color: var(--neon-cyan); }
    .badge-payment.bank { background: rgba(255,215,0,0.15); color: var(--neon-gold); }
    .badge-payment.mixed { background: rgba(255,0,160,0.15); color: var(--neon-magenta); }
`;
document.head.appendChild(style);
