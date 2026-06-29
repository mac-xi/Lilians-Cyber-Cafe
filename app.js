/* ============================================
   LILIAN'S CYBER CAFÉ — FIREBASE EDITION
   Real persistent database via Google Firestore
   ============================================ */

// ===== FIREBASE DB OBJECT =====
const DB = {
    transactionsRef: db.collection('transactions'),
    expensesRef: db.collection('expenses'),

    transactions: [],
    expenses: [],

    async load() {
        try {
            // Load transactions from Firebase
            const txSnapshot = await this.transactionsRef.orderBy('createdAt', 'desc').get();
            this.transactions = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Load expenses from Firebase
            const exSnapshot = await this.expensesRef.orderBy('createdAt', 'desc').get();
            this.expenses = exSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            console.log('Firebase loaded:', this.transactions.length, 'transactions,', this.expenses.length, 'expenses');
        } catch (err) {
            console.error('Firebase load error:', err);
            showToast('Error loading data from cloud', 'error');
        }
    },

    async addTransaction(t) {
        try {
            t.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await this.transactionsRef.add(t);
            t.id = docRef.id;
            this.transactions.unshift(t);
            return t;
        } catch (err) {
            console.error('Firebase add transaction error:', err);
            showToast('Failed to save transaction', 'error');
            throw err;
        }
    },

    async addExpense(e) {
        try {
            e.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            const docRef = await this.expensesRef.add(e);
            e.id = docRef.id;
            this.expenses.unshift(e);
            return e;
        } catch (err) {
            console.error('Firebase add expense error:', err);
            showToast('Failed to save expense', 'error');
            throw err;
        }
    },

    async deleteTransaction(id) {
        try {
            await this.transactionsRef.doc(id).delete();
            this.transactions = this.transactions.filter(t => t.id !== id);
        } catch (err) {
            console.error('Firebase delete transaction error:', err);
            showToast('Failed to delete transaction', 'error');
            throw err;
        }
    },

    async deleteExpense(id) {
        try {
            await this.expensesRef.doc(id).delete();
            this.expenses = this.expenses.filter(e => e.id !== id);
        } catch (err) {
            console.error('Firebase delete expense error:', err);
            showToast('Failed to delete expense', 'error');
            throw err;
        }
    },

    getTransactionsByDate(dateStr) {
        return this.transactions.filter(t => t.date === dateStr);
    },

    getTransactionsByMonth(year, month) {
        return this.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    },

    getExpensesByMonth(year, month) {
        return this.expenses.filter(e => {
            const d = new Date(e.date);
            return d.getFullYear() === year && d.getMonth() === month;
        });
    }
};

// ===== DEMO DATA (Only runs if Firebase is empty) =====
async function seedDemoData() {
    if (DB.transactions.length > 0 || DB.expenses.length > 0) return;

    const services = ['E-Citizen', 'KRA', 'SHA', 'NTSA', 'Cyber Services', 'Photocopy', 'Printing', 'HELB', 'Arhisasa'];
    const customers = ['John Mwangi', 'Alice Wanjiku', 'Peter Ochieng', 'Grace Akinyi', 'James Kimani', 'Mary Njeri', 'David Otieno', 'Sarah Muthoni'];
    const categories = ['Rent', 'Electricity', 'Internet', 'Stationery', 'Printer Ink', 'Computer Maintenance', 'Transport', 'Food'];

    const today = new Date();

    // Seed transactions
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 25));
        const dateStr = date.toISOString().split('T')[0];

        await DB.transactionsRef.add({
            date: dateStr,
            time: String(Math.floor(Math.random() * 12) + 8).padStart(2,'0') + ':' + String(Math.floor(Math.random() * 60)).padStart(2,'0'),
            service: services[Math.floor(Math.random() * services.length)],
            customer: customers[Math.floor(Math.random() * customers.length)],
            amount: Math.floor(Math.random() * 2500) + 50,
            payment: ['Cash', 'M-Pesa', 'Bank Transfer'][Math.floor(Math.random() * 3)],
            notes: '',
            createdAt: firebase.firestore.Timestamp.fromDate(date)
        });
    }

    // Seed expenses
    for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - Math.floor(Math.random() * 25));

        await DB.expensesRef.add({
            date: date.toISOString().split('T')[0],
            category: categories[Math.floor(Math.random() * categories.length)],
            description: 'Monthly expense payment',
            amount: Math.floor(Math.random() * 15000) + 500,
            payment: ['Cash', 'M-Pesa', 'Bank'][Math.floor(Math.random() * 3)],
            reference: 'REF-' + Math.floor(Math.random() * 99999),
            createdAt: firebase.firestore.Timestamp.fromDate(date)
        });
    }

    // Reload after seeding
    await DB.load();
    showToast('Demo data loaded to Firebase!', 'success');
}

// ===== PARTICLES =====
function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 60;

    class Particle {
        constructor() { this.reset(); }
        reset() {
            this.x = Math.random() * canvas.width;
            this.y = Math.random() * canvas.height;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = (Math.random() - 0.5) * 0.5;
            this.speedY = (Math.random() - 0.5) * 0.5;
            this.opacity = Math.random() * 0.5 + 0.1;
            this.color = Math.random() > 0.5 ? '0, 240, 255' : '255, 0, 160';
        }
        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
        }
        draw() {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(' + this.color + ', ' + this.opacity + ')';
            ctx.fill();
        }
    }

    for (let i = 0; i < particleCount; i++) particles.push(new Particle());

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => { p.update(); p.draw(); });
        particles.forEach((p1, i) => {
            particles.slice(i + 1).forEach(p2 => {
                const dx = p1.x - p2.x, dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 150) {
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = 'rgba(0, 240, 255, ' + (0.1 * (1 - dist / 150)) + ')';
                    ctx.lineWidth = 0.5;
                    ctx.stroke();
                }
            });
        });
        requestAnimationFrame(animate);
    }
    animate();
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
}

// ===== CLOCK =====
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('en-GB');
    document.getElementById('date').textContent = now.toLocaleDateString('en-GB', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
    });
}

// ===== NAVIGATION =====
function navigateTo(sectionId) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const target = document.getElementById(sectionId);
    if (target) target.classList.add('active');

    const navBtn = document.querySelector('[data-section="' + sectionId + '"]');
    if (navBtn) navBtn.classList.add('active');

    const pageNames = {
        'dashboard': 'Dashboard', 'daily-cash': 'Daily Cash Log',
        'expenditures': 'Expenditure Tracker', 'monthly': 'Monthly Archives',
        'services': 'Service Matrix', 'analytics': 'Neural Analytics'
    };
    document.querySelector('.current-page').textContent = pageNames[sectionId] || 'Dashboard';

    if (sectionId === 'dashboard') refreshDashboard();
    if (sectionId === 'daily-cash') refreshDailyCash();
    if (sectionId === 'expenditures') refreshExpenditures();
    if (sectionId === 'monthly') refreshMonthly();
    if (sectionId === 'analytics') refreshAnalytics();
}

// ===== TOAST =====
function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast ' + type;
    const icons = { success: 'fa-check-circle', error: 'fa-exclamation-circle', info: 'fa-info-circle' };
    toast.innerHTML = '<i class="fas ' + icons[type] + '"></i><span class="toast-message">' + message + '</span>';
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
}

// ===== MODAL =====
let modalCallback = null;

function showModal(title, body, confirmCallback) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-overlay').classList.add('active');
    modalCallback = confirmCallback;
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
    modalCallback = null;
}

// ===== DASHBOARD =====
let revenueChart = null;

function refreshDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayTx = DB.getTransactionsByDate(today);
    const todayRevenue = todayTx.reduce(function(sum, t) { return sum + t.amount; }, 0);

    document.getElementById('today-revenue').textContent = formatKES(todayRevenue);
    document.getElementById('today-transactions').textContent = todayTx.length;

    const now = new Date();
    const monthTx = DB.getTransactionsByMonth(now.getFullYear(), now.getMonth());
    const monthRevenue = monthTx.reduce(function(sum, t) { return sum + t.amount; }, 0);
    document.getElementById('monthly-revenue').textContent = formatKES(monthRevenue);
    document.getElementById('month-name').textContent = now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

    const monthExp = DB.getExpensesByMonth(now.getFullYear(), now.getMonth());
    const totalExp = monthExp.reduce(function(sum, e) { return sum + e.amount; }, 0);
    document.getElementById('total-expenditures').textContent = formatKES(totalExp);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yestStr = yesterday.toISOString().split('T')[0];
    const yestRevenue = DB.getTransactionsByDate(yestStr).reduce(function(sum, t) { return sum + t.amount; }, 0);
    const change = yestRevenue > 0 ? ((todayRevenue - yestRevenue) / yestRevenue * 100).toFixed(1) : 0;
    document.getElementById('revenue-change').textContent = (change >= 0 ? '+' : '') + change + '%';

    const recentList = document.getElementById('recent-transactions');
    const recent = DB.transactions.slice().sort(function(a, b) {
        return new Date(b.createdAt?.seconds ? b.createdAt.seconds * 1000 : b.createdAt) - 
               new Date(a.createdAt?.seconds ? a.createdAt.seconds * 1000 : a.createdAt);
    }).slice(0, 8);

    if (recent.length === 0) {
        recentList.innerHTML = '<div class="empty-state"><i class="fas fa-ghost"></i><p>No transactions yet. Start logging!</p></div>';
    } else {
        recentList.innerHTML = recent.map(function(t) {
            return '<div class="recent-item"><div class="recent-icon income"><i class="fas fa-arrow-up"></i></div><div class="recent-info"><div class="recent-title">' + t.service + '</div><div class="recent-meta">' + (t.customer || 'Walk-in') + ' &bull; ' + t.date + '</div></div><div class="recent-amount positive">+' + formatKES(t.amount) + '</div></div>';
        }).join('');
    }

    const serviceCounts = {};
    DB.transactions.forEach(function(t) { serviceCounts[t.service] = (serviceCounts[t.service] || 0) + 1; });
    const topServices = Object.entries(serviceCounts).sort(function(a, b) { return b[1] - a[1]; }).slice(0, 6);

    const serviceIcons = {
        'E-Citizen': 'fa-id-card', 'KRA': 'fa-file-invoice-dollar', 'SHA': 'fa-heartbeat',
        'NTSA': 'fa-car', 'HELB': 'fa-graduation-cap', 'Arhisasa': 'fa-building',
        'Cyber Services': 'fa-desktop', 'Photocopy': 'fa-copy', 'Printing': 'fa-print',
        'Scanning': 'fa-scanner', 'Lamination': 'fa-layer-group', 'Passport Photos': 'fa-camera',
        'Other': 'fa-ellipsis-h'
    };

    document.getElementById('top-services').innerHTML = topServices.map(function(item) {
        return '<div class="service-preview-item"><i class="fas ' + (serviceIcons[item[0]] || 'fa-circle') + '"></i><h4>' + item[0] + '</h4><span>' + item[1] + ' transactions</span></div>';
    }).join('');

    renderRevenueChart();
}

function renderRevenueChart() {
    const ctx = document.getElementById('revenue-chart');
    if (!ctx) return;

    const days = [], revenues = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        days.push(d.toLocaleDateString('en-GB', { weekday: 'short' }));
        revenues.push(DB.getTransactionsByDate(dateStr).reduce(function(sum, t) { return sum + t.amount; }, 0));
    }

    if (revenueChart) revenueChart.destroy();

    revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Revenue',
                data: revenues,
                borderColor: '#00f0ff',
                backgroundColor: 'rgba(0, 240, 255, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#00f0ff',
                pointBorderColor: '#0a0a0f',
                pointBorderWidth: 2,
                pointRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: {
                    grid: { color: 'rgba(0, 240, 255, 0.05)' },
                    ticks: { color: '#8a8ab5', font: { family: 'Share Tech Mono' } }
                },
                y: {
                    grid: { color: 'rgba(0, 240, 255, 0.05)' },
                    ticks: {
                        color: '#8a8ab5',
                        font: { family: 'Share Tech Mono' },
                        callback: function(v) { return 'KES ' + v.toLocaleString(); }
                    }
                }
            }
        }
    });
}

// ===== DAILY CASH =====
function refreshDailyCash() {
    const filterDate = document.getElementById('filter-date').value || new Date().toISOString().split('T')[0];
    const txs = DB.getTransactionsByDate(filterDate).sort(function(a, b) { return a.time.localeCompare(b.time); });

    const tbody = document.getElementById('transactions-body');
    const total = txs.reduce(function(sum, t) { return sum + t.amount; }, 0);

    if (txs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:#4a4a6a;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i>No transactions for ' + filterDate + '</td></tr>';
    } else {
        tbody.innerHTML = txs.map(function(t) {
            return '<tr><td>' + t.time + '</td><td><span style="color:#00f0ff;">' + t.service + '</span></td><td>' + (t.customer || '-') + '</td><td class="amount-cell">' + formatKES(t.amount) + '</td><td>' + t.payment + '</td><td><div class="action-btns"><button onclick="deleteTransaction(\'' + t.id + '\')" title="Delete"><i class="fas fa-trash"></i></button></div></td></tr>';
        }).join('');
    }

    document.getElementById('daily-total').textContent = formatKES(total);
}

function deleteTransaction(id) {
    showModal('Delete Transaction', 'Are you sure you want to delete this transaction? This action cannot be undone.', function() {
        DB.deleteTransaction(id).then(() => {
            refreshDailyCash();
            refreshDashboard();
            showToast('Transaction deleted', 'success');
        });
    });
}

function exportDailyCash() {
    const date = document.getElementById('filter-date').value || new Date().toISOString().split('T')[0];
    const txs = DB.getTransactionsByDate(date);

    let csv = 'Time,Service,Customer,Amount,Payment Method,Notes\n';
    txs.forEach(function(t) {
        csv += t.time + ',' + t.service + ',' + (t.customer || '') + ',' + t.amount + ',' + t.payment + ',' + (t.notes || '') + '\n';
    });
    csv += '\nTOTAL,,,' + txs.reduce(function(s, t) { return s + t.amount; }, 0) + ',,\n';

    downloadCSV(csv, 'daily-cash-' + date + '.csv');
    showToast('Daily cash exported!', 'success');
}

// ===== EXPENDITURES =====
let expenseChart = null;

function refreshExpenditures() {
    const filterMonth = document.getElementById('exp-filter-month').value;
    let exps = DB.expenses;

    if (filterMonth !== 'all') {
        const parts = filterMonth.split('-').map(Number);
        exps = DB.getExpensesByMonth(parts[0], parts[1]);
    }

    exps = exps.sort(function(a, b) { return new Date(b.date) - new Date(a.date); });

    const tbody = document.getElementById('expenses-body');
    const total = exps.reduce(function(sum, e) { return sum + e.amount; }, 0);

    if (exps.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:30px;color:#4a4a6a;"><i class="fas fa-inbox" style="font-size:2rem;display:block;margin-bottom:10px;"></i>No expenses recorded</td></tr>';
    } else {
        tbody.innerHTML = exps.map(function(e) {
            return '<tr><td>' + e.date + '</td><td><span style="color:#ff3366;">' + e.category + '</span></td><td>' + e.description + '</td><td class="amount-cell negative">' + formatKES(e.amount) + '</td><td><div class="action-btns"><button onclick="deleteExpense(\'' + e.id + '\')" title="Delete"><i class="fas fa-trash"></i></button></div></td></tr>';
        }).join('');
    }

    document.getElementById('exp-total').textContent = formatKES(total);
    renderExpenseChart(exps);
}

function renderExpenseChart(exps) {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return;

    const catTotals = {};
    exps.forEach(function(e) { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });

    if (expenseChart) expenseChart.destroy();

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(catTotals),
            datasets: [{
                data: Object.values(catTotals),
                backgroundColor: ['#ff3366', '#ff8800', '#00f0ff', '#ff00a0', '#ffd700', '#00ff88', '#8a8ab5', '#4a4a6a'],
                borderColor: '#16162a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: { color: '#8a8ab5', font: { family: 'Share Tech Mono', size: 11 } }
                }
            }
        }
    });
}

function deleteExpense(id) {
    showModal('Delete Expense', 'Are you sure you want to delete this expense record?', function() {
        DB.deleteExpense(id).then(() => {
            refreshExpenditures();
            refreshDashboard();
            showToast('Expense deleted', 'success');
        });
    });
}

function exportExpenses() {
    let csv = 'Date,Category,Description,Amount,Payment Method,Reference\n';
    DB.expenses.forEach(function(e) {
        csv += e.date + ',' + e.category + ',' + e.description + ',' + e.amount + ',' + e.payment + ',' + (e.reference || '') + '\n';
    });
    downloadCSV(csv, 'expenses-export.csv');
    showToast('Expenses exported!', 'success');
}

// ===== MONTHLY =====
let currentMonth = new Date();
let monthlyPieChart = null;

function refreshMonthly() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    document.getElementById('display-month').textContent = currentMonth.toLocaleDateString('en-GB', {
        month: 'long', year: 'numeric'
    });

    const monthTx = DB.getTransactionsByMonth(year, month);
    const monthExp = DB.getExpensesByMonth(year, month);

    const income = monthTx.reduce(function(s, t) { return s + t.amount; }, 0);
    const expenses = monthExp.reduce(function(s, e) { return s + e.amount; }, 0);
    const profit = income - expenses;

    document.getElementById('month-income').textContent = formatKES(income);
    document.getElementById('month-expenses').textContent = formatKES(expenses);
    document.getElementById('month-profit').textContent = formatKES(profit);
    document.getElementById('month-profit').className = 'm-value ' + (profit >= 0 ? 'positive' : 'negative');
    document.getElementById('month-transactions').textContent = monthTx.length;

    const ctx = document.getElementById('monthly-pie-chart');
    if (ctx) {
        const serviceTotals = {};
        monthTx.forEach(function(t) { serviceTotals[t.service] = (serviceTotals[t.service] || 0) + t.amount; });

        if (monthlyPieChart) monthlyPieChart.destroy();
        monthlyPieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(serviceTotals),
                datasets: [{
                    data: Object.values(serviceTotals),
                    backgroundColor: ['#00f0ff', '#ff00a0', '#ffd700', '#00ff88', '#ff3366', '#ff8800', '#8a8ab5', '#4a4a6a'],
                    borderColor: '#16162a', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#8a8ab5', font: { family: 'Share Tech Mono', size: 11 } } }
                }
            }
        });
    }

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const tbody = document.getElementById('monthly-body');

    let rows = '';
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(day).padStart(2, '0');
        const dayTx = DB.getTransactionsByDate(dateStr);
        const dayExp = DB.expenses.filter(function(e) { return e.date === dateStr; });
        const dayIncome = dayTx.reduce(function(s, t) { return s + t.amount; }, 0);
        const dayExpense = dayExp.reduce(function(s, e) { return s + e.amount; }, 0);

        if (dayIncome > 0 || dayExpense > 0) {
            const dateObj = new Date(dateStr);
            rows += '<tr><td>' + dateStr + '</td><td>' + dateObj.toLocaleDateString('en-GB', { weekday: 'short' }) + '</td><td style="color:#00ff88;">' + formatKES(dayIncome) + '</td><td style="color:#ff3366;">' + formatKES(dayExpense) + '</td><td style="color:' + (dayIncome - dayExpense >= 0 ? '#00ff88' : '#ff3366') + ';">' + formatKES(dayIncome - dayExpense) + '</td><td>' + dayTx.length + '</td></tr>';
        }
    }

    tbody.innerHTML = rows || '<tr><td colspan="6" style="text-align:center;padding:30px;color:#4a4a6a;">No data for this month</td></tr>';
}

function generateMonthlyReport() {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const monthTx = DB.getTransactionsByMonth(year, month);
    const monthExp = DB.getExpensesByMonth(year, month);

    const income = monthTx.reduce(function(s, t) { return s + t.amount; }, 0);
    const expenses = monthExp.reduce(function(s, e) { return s + e.amount; }, 0);
    const profit = income - expenses;

    let csv = 'MONTHLY REPORT - ' + currentMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) + '\n';
    csv += 'Generated: ' + new Date().toLocaleString() + '\n\n';
    csv += 'SUMMARY\n';
    csv += 'Total Income,' + income + '\n';
    csv += 'Total Expenses,' + expenses + '\n';
    csv += 'Net Profit,' + profit + '\n';
    csv += 'Total Transactions,' + monthTx.length + '\n\n';
    csv += 'INCOME BY SERVICE\n';
    const svcTotals = {};
    monthTx.forEach(function(t) { svcTotals[t.service] = (svcTotals[t.service] || 0) + t.amount; });
    Object.entries(svcTotals).forEach(function(item) { csv += item[0] + ',' + item[1] + '\n'; });
    csv += '\nEXPENSES BY CATEGORY\n';
    const catTotals = {};
    monthExp.forEach(function(e) { catTotals[e.category] = (catTotals[e.category] || 0) + e.amount; });
    Object.entries(catTotals).forEach(function(item) { csv += item[0] + ',' + item[1] + '\n'; });

    downloadCSV(csv, 'monthly-report-' + year + '-' + String(month+1).padStart(2,'0') + '.csv');
    showToast('Monthly report generated!', 'success');
}

// ===== ANALYTICS =====
let serviceBarChart, peakHoursChart, paymentChart, expenseCatChart;

function refreshAnalytics() {
    const svcCtx = document.getElementById('service-bar-chart');
    if (svcCtx) {
        const svcCounts = {};
        DB.transactions.forEach(function(t) { svcCounts[t.service] = (svcCounts[t.service] || 0) + 1; });

        if (serviceBarChart) serviceBarChart.destroy();
        serviceBarChart = new Chart(svcCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(svcCounts),
                datasets: [{
                    label: 'Transactions',
                    data: Object.values(svcCounts),
                    backgroundColor: 'rgba(0, 240, 255, 0.6)',
                    borderColor: '#00f0ff',
                    borderWidth: 1,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#8a8ab5', font: { family: 'Share Tech Mono', size: 10 } }, grid: { display: false } },
                    y: { ticks: { color: '#8a8ab5', font: { family: 'Share Tech Mono' } }, grid: { color: 'rgba(0,240,255,0.05)' } }
                }
            }
        });
    }

    const peakCtx = document.getElementById('peak-hours-chart');
    if (peakCtx) {
        const hourCounts = new Array(24).fill(0);
        DB.transactions.forEach(function(t) {
            const h = parseInt(t.time.split(':')[0]);
            hourCounts[h]++;
        });

        if (peakHoursChart) peakHoursChart.destroy();
        peakHoursChart = new Chart(peakCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 24}, function(_, i) { return String(i).padStart(2,'0') + ':00'; }),
                datasets: [{
                    label: 'Transactions',
                    data: hourCounts,
                    backgroundColor: 'rgba(255, 0, 160, 0.6)',
                    borderColor: '#ff00a0',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#8a8ab5', font: { family: 'Share Tech Mono', size: 9 } }, grid: { display: false } },
                    y: { ticks: { color: '#8a8ab5', font: { family: 'Share Tech Mono' } }, grid: { color: 'rgba(255,0,160,0.05)' } }
                }
            }
        });
    }

    const payCtx = document.getElementById('payment-chart');
    if (payCtx) {
        const payCounts = {};
        DB.transactions.forEach(function(t) { payCounts[t.payment] = (payCounts[t.payment] || 0) + 1; });

        if (paymentChart) paymentChart.destroy();
        paymentChart = new Chart(payCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(payCounts),
                datasets: [{
                    data: Object.values(payCounts),
                    backgroundColor: ['#00f0ff', '#ff00a0', '#ffd700', '#00ff88'],
                    borderColor: '#16162a', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { color: '#8a8ab5', font: { family: 'Share Tech Mono' } } } }
            }
        });
    }

    const expCatCtx = document.getElementById('expense-cat-chart');
    if (expCatCtx) {
        const catCounts = {};
        DB.expenses.forEach(function(e) { catCounts[e.category] = (catCounts[e.category] || 0) + e.amount; });

        if (expenseCatChart) expenseCatChart.destroy();
        expenseCatChart = new Chart(expCatCtx, {
            type: 'polarArea',
            data: {
                labels: Object.keys(catCounts),
                datasets: [{
                    data: Object.values(catCounts),
                    backgroundColor: ['#ff3366', '#ff8800', '#00f0ff', '#ff00a0', '#ffd700', '#00ff88', '#8a8ab5', '#4a4a6a'],
                    borderColor: '#16162a', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'right', labels: { color: '#8a8ab5', font: { family: 'Share Tech Mono', size: 10 } } } }
            }
        });
    }
}

// ===== UTILITIES =====
function formatKES(amount) {
    return 'KES ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

// ===== EVENT LISTENERS =====
document.addEventListener('DOMContentLoaded', async function() {
    // Show loading
    document.getElementById('loading-screen').classList.remove('hidden');
    document.getElementById('app').style.display = 'none';

    // Load from Firebase FIRST
    try {
        await DB.load();

        // If empty, seed demo data
        if (DB.transactions.length === 0 && DB.expenses.length === 0) {
            await seedDemoData();
        }

        showToast('Connected to Firebase!', 'success');
    } catch (err) {
        console.error('Failed to load from Firebase:', err);
        showToast('Firebase connection failed. Check console.', 'error');
    }

    // Hide loading, show app
    setTimeout(function() {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('app').style.display = 'flex';
    }, 1500);

    initParticles();
    updateClock();
    setInterval(updateClock, 1000);

    document.querySelectorAll('.nav-item').forEach(function(btn) {
        btn.addEventListener('click', function() { navigateTo(btn.dataset.section); });
    });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    document.getElementById('trans-date').value = dateStr;
    document.getElementById('trans-time').value = timeStr;
    document.getElementById('exp-date').value = dateStr;
    document.getElementById('filter-date').value = dateStr;

    // Transaction form - async for Firebase
    document.getElementById('transaction-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const t = {
            date: document.getElementById('trans-date').value,
            time: document.getElementById('trans-time').value,
            service: document.getElementById('trans-service').value,
            customer: document.getElementById('trans-customer').value,
            amount: parseFloat(document.getElementById('trans-amount').value),
            payment: document.getElementById('trans-payment').value,
            notes: document.getElementById('trans-notes').value
        };

        try {
            await DB.addTransaction(t);
            e.target.reset();
            document.getElementById('trans-date').value = dateStr;
            document.getElementById('trans-time').value = new Date().toTimeString().slice(0, 5);
            refreshDailyCash();
            refreshDashboard();
            showToast('Transaction saved to Firebase!', 'success');
        } catch (err) {
            showToast('Failed to save transaction', 'error');
        }
    });

    // Expense form - async for Firebase
    document.getElementById('expense-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const ex = {
            date: document.getElementById('exp-date').value,
            category: document.getElementById('exp-category').value,
            description: document.getElementById('exp-description').value,
            amount: parseFloat(document.getElementById('exp-amount').value),
            payment: document.getElementById('exp-payment').value,
            reference: document.getElementById('exp-reference').value
        };

        try {
            await DB.addExpense(ex);
            e.target.reset();
            document.getElementById('exp-date').value = dateStr;
            refreshExpenditures();
            refreshDashboard();
            showToast('Expense saved to Firebase!', 'success');
        } catch (err) {
            showToast('Failed to save expense', 'error');
        }
    });

    document.getElementById('filter-date').addEventListener('change', refreshDailyCash);

    const monthFilter = document.getElementById('exp-filter-month');
    for (let i = 0; i < 12; i++) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const val = d.getFullYear() + '-' + String(d.getMonth()).padStart(2, '0');
        const label = d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
        const opt = document.createElement('option');
        opt.value = val;
        opt.textContent = label;
        monthFilter.appendChild(opt);
    }
    monthFilter.addEventListener('change', refreshExpenditures);

    document.getElementById('prev-month').addEventListener('click', function() {
        currentMonth.setMonth(currentMonth.getMonth() - 1);
        refreshMonthly();
    });
    document.getElementById('next-month').addEventListener('click', function() {
        currentMonth.setMonth(currentMonth.getMonth() + 1);
        refreshMonthly();
    });

    // Modal confirm
    const confirmBtn = document.getElementById('modal-confirm');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
            if (modalCallback) modalCallback();
            closeModal();
        });
    }

    // Initial render
    refreshDashboard();
    refreshDailyCash();
    refreshExpenditures();
    refreshMonthly();
});
