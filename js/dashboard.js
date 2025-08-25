// إدارة لوحة التحكم
const DASHBOARD = {
    charts: {},
    stats: {},
    
    init: function() {
        this.setupEventHandlers();
        this.loadData();
        this.startAutoRefresh();
    },
    
    setupEventHandlers: function() {
        // تحديث البيانات يدوياً
        const refreshBtn = document.getElementById('refresh-dashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadData();
                UTILS.showNotification('تم تحديث بيانات لوحة التحكم', 'success');
            });
        }
        
        // معالجة أزرار التنقل السريع
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.currentTarget.getAttribute('data-target');
                if (target) {
                    this.navigateToSection(target);
                }
            });
        });
        
        // معالجة أزرار الإجراءات السريعة
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                this.handleQuickAction(action);
            });
        });
    },
    
    loadData: function() {
        this.showLoading();
        
        // تحميل البيانات من قاعدة البيانات
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const expenses = DB.get(CONSTANTS.STORAGE_KEYS.EXPENSES);
        
        // تحديث الإحصائيات
        this.updateStats(products, sales, creditSales, expenses);
        
        // تحديث الجداول والقوائم
        this.updateTopProductsTable(sales);
        this.updateRecentSalesTable(sales);
        this.updateLowStockTable(products);
        this.updateExpiringProducts(products);
        
        // إنشاء الرسوم البيانية
        this.createCharts(sales, products, expenses);
        
        // تحديث الإشعارات والتنبيهات
        this.updateNotifications(products);
        
        this.hideLoading();
    },
    
    showLoading: function() {
        const loadingElement = document.getElementById('dashboard-loading') || this.createLoadingElement();
        UTILS.toggleElement(loadingElement, true);
        
        const contentElement = document.getElementById('dashboard-content');
        if (contentElement) {
            contentElement.style.opacity = '0.5';
        }
    },
    
    hideLoading: function() {
        const loadingElement = document.getElementById('dashboard-loading');
        if (loadingElement) {
            UTILS.toggleElement(loadingElement, false);
        }
        
        const contentElement = document.getElementById('dashboard-content');
        if (contentElement) {
            contentElement.style.opacity = '1';
        }
    },
    
    createLoadingElement: function() {
        const loadingDiv = document.createElement('div');
        loadingDiv.id = 'dashboard-loading';
        loadingDiv.className = 'text-center py-5';
        loadingDiv.innerHTML = `
            <div class="spinner-border text-primary" style="width: 3rem; height: 3rem;" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
            <p class="mt-3 text-muted">جاري تحميل بيانات لوحة التحكم...</p>
        `;
        
        const dashboardSection = document.getElementById('dashboard-section');
        if (dashboardSection) {
            dashboardSection.appendChild(loadingDiv);
        }
        
        return loadingDiv;
    },
    
    updateStats: function(products, sales, creditSales, expenses) {
        // حساب الإحصائيات الأساسية
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const today = new Date().toLocaleDateString('en-CA');
        const todaySales = sales
            .filter(sale => sale.date === today)
            .reduce((sum, sale) => sum + sale.total, 0);
        
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.quantity > 0 && p.isActive !== false).length;
        
        const lowStockCount = products.filter(product => {
            const minQuantity = product.minQuantity || 10;
            return product.quantity <= minQuantity && product.quantity > 0;
        }).length;
        
        const outOfStockCount = products.filter(product => product.quantity === 0).length;
        
        const totalCredit = creditSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // حساب الأرباح
        const totalProfit = sales.reduce((sum, sale) => {
            const saleProfit = sale.items.reduce((itemSum, item) => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const cost = product.cost || 0;
                    return itemSum + ((item.price - cost) * item.quantity);
                }
                return itemSum;
            }, 0);
            return sum + saleProfit;
        }, 0) - totalExpenses;
        
        // تحديث واجهة المستخدم
        this.updateStatCard('total-sales', totalSales, 'إجمالي المبيعات');
        this.updateStatCard('today-sales', todaySales, 'مبيعات اليوم');
        this.updateStatCard('total-products', totalProducts, 'إجمالي المنتجات');
        this.updateStatCard('active-products', activeProducts, 'المنتجات النشطة');
        this.updateStatCard('low-stock-count', lowStockCount, 'منخفضة المخزون');
        this.updateStatCard('out-of-stock-count', outOfStockCount, 'منتهية المخزون');
        this.updateStatCard('credit-sales', totalCredit, 'المبيعات الآجلة');
        this.updateStatCard('total-expenses', totalExpenses, 'إجمالي المصروفات');
        this.updateStatCard('total-profit', totalProfit, 'صافي الأرباح');
        
        // حفظ الإحصائيات للاستخدام لاحقاً
        this.stats = {
            totalSales,
            todaySales,
            totalProducts,
            activeProducts,
            lowStockCount,
            outOfStockCount,
            totalCredit,
            totalExpenses,
            totalProfit
        };
    },
    
    updateStatCard: function(elementId, value, title) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // إذا كان العنصر يحتوي على ريال، نستخدم تنسيق العملة
        if (elementId.includes('sales') || elementId.includes('credit') || 
            elementId.includes('expenses') || elementId.includes('profit')) {
            element.textContent = UTILS.formatCurrency(value);
        } else {
            element.textContent = value.toLocaleString('ar-YE');
        }
        
        // تحديث العنوان إذا كان موجوداً
        const titleElement = element.previousElementSibling;
        if (titleElement && titleElement.classList.contains('stat-title')) {
            titleElement.textContent = title;
        }
    },
    
    updateTopProductsTable: function(sales) {
        // تجميع بيانات المبيعات حسب المنتج
        const productSales = {};
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        name: item.name,
                        quantity: 0,
                        revenue: 0,
                        transactions: 0
                    };
                }
                
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.price * item.quantity;
                productSales[item.productId].transactions += 1;
            });
        });
        
        // تحويل إلى مصفوفة وترتيب حسب الإيرادات
        const topProducts = Object.entries(productSales)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
        
        // تحديث الجدول
        const tableBody = document.querySelector('#top-products-table tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (topProducts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        <i class="bi bi-graph-up display-4 d-block mb-2"></i>
                        لا توجد بيانات مبيعات
                    </td>
                </tr>
            `;
            return;
        }
        
        topProducts.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="product-rank bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2" 
                             style="width: 30px; height: 30px; font-size: 14px;">
                            ${index + 1}
                        </div>
                        <span>${product.name}</span>
                    </div>
                </td>
                <td>${product.quantity.toLocaleString('ar-YE')}</td>
                <td class="fw-bold text-success">${UTILS.formatCurrency(product.revenue)}</td>
            `;
            tableBody.appendChild(row);
        });
    },
    
    updateRecentSalesTable: function(sales) {
        // أخذ آخر 5 مبيعات
        const recentSales = sales.slice(-5).reverse();
        
        // تحديث الجدول
        const tableBody = document.querySelector('#recent-sales-table tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (recentSales.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        <i class="bi bi-receipt display-4 d-block mb-2"></i>
                        لا توجد مبيعات حديثة
                    </td>
                </tr>
            `;
            return;
        }
        
        recentSales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="fw-bold">${sale.invoiceNumber}</span>
                    ${sale.customerName ? `<br><small class="text-muted">${sale.customerName}</small>` : ''}
                </td>
                <td>${UTILS.formatDate(sale.date, 'short')}</td>
                <td class="fw-bold">${UTILS.formatCurrency(sale.total)}</td>
                <td>
                    <span class="badge bg-${this.getPaymentMethodBadge(sale.paymentMethod)}">
                        ${sale.paymentMethod}
                    </span>
                </td>
            `;
            tableBody.appendChild(row);
        });
    },
    
    getPaymentMethodBadge: function(method) {
        const badges = {
            'نقدي': 'success',
            'بطاقة': 'primary',
            'تحويل': 'info',
            'آجل': 'warning'
        };
        return badges[method] || 'secondary';
    },
    
    updateLowStockTable: function(products) {
        const lowStockProducts = products.filter(product => {
            const minQuantity = product.minQuantity || 10;
            return product.quantity > 0 && product.quantity <= minQuantity;
        }).slice(0, 5);
        
        // تحديث الجدول
        const tableBody = document.querySelector('#low-stock-table tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        if (lowStockProducts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        <i class="bi bi-check-circle display-4 d-block mb-2"></i>
                        جميع المنتجات بمستوى جيد
                    </td>
                </tr>
            `;
            return;
        }
        
        lowStockProducts.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <div class="d-flex align-items-center">
                        ${product.image ? `
                            <img src="${product.image}" class="product-image me-2" alt="${product.name}" 
                                 style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                        ` : `
                            <div class="bg-secondary rounded me-2 d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px;">
                                <i class="bi bi-box text-white"></i>
                            </div>
                        `}
                        <div>
                            <div class="fw-bold">${product.name}</div>
                            <small class="text-muted">${product.category}</small>
                        </div>
                    </div>
                </td>
                <td>${product.category}</td>
                <td class="fw-bold text-danger">${product.quantity}</td>
                <td>
                    <button class="btn btn-sm btn-primary btn-action edit-product-btn" data-id="${product.id}" title="تعديل المنتج">
                        <i class="bi bi-pencil"></i>
                    </button>
                    <button class="btn btn-sm btn-success btn-action add-stock-btn" data-id="${product.id}" title="إضافة مخزون">
                        <i class="bi bi-plus-circle"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // إضافة معالجات الأحداث للأزرار
        this.addLowStockTableHandlers();
    },
    
    addLowStockTableHandlers: function() {
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                if (typeof PRODUCTS !== 'undefined' && typeof PRODUCTS.editProduct === 'function') {
                    PRODUCTS.editProduct(productId);
                }
            });
        });
        
        document.querySelectorAll('.add-stock-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const productId = this.getAttribute('data-id');
                DASHBOARD.openAddStockModal(productId);
            });
        });
    },
    
    openAddStockModal: function(productId) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            UTILS.showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        // إنشاء modal لإضافة المخزون
        const modalId = 'add-stock-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">إضافة مخزون</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="add-stock-form">
                                <input type="hidden" id="stock-product-id">
                                <div class="mb-3">
                                    <label class="form-label">المنتج</label>
                                    <input type="text" class="form-control" id="stock-product-name" readonly>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">المخزون الحالي</label>
                                    <input type="text" class="form-control" id="stock-current-quantity" readonly>
                                </div>
                                <div class="mb-3">
                                    <label for="stock-add-quantity" class="form-label">الكمية المضافة</label>
                                    <input type="number" class="form-control" id="stock-add-quantity" 
                                           min="1" required value="1">
                                </div>
                                <div class="mb-3">
                                    <label for="stock-cost" class="form-label">تكلفة الوحدة (اختياري)</label>
                                    <input type="number" class="form-control" id="stock-cost" 
                                           min="0" step="0.01" value="${product.cost || ''}">
                                </div>
                                <div class="mb-3">
                                    <label for="stock-supplier" class="form-label">المورد (اختياري)</label>
                                    <select class="form-select" id="stock-supplier">
                                        <option value="">اختر المورد</option>
                                    </select>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-success" id="confirm-add-stock">إضافة</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // إضافة معالج حدث للتأكيد
            modal.addEventListener('shown.bs.modal', function() {
                document.getElementById('confirm-add-stock').addEventListener('click', () => {
                    DASHBOARD.confirmAddStock();
                });
            });
        }
        
        // تعبئة البيانات
        document.getElementById('stock-product-id').value = product.id;
        document.getElementById('stock-product-name').value = product.name;
        document.getElementById('stock-current-quantity').value = product.quantity;
        
        // تحميل الموردين
        this.loadSuppliersDropdown();
        
        // عرض الـ modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    },
    
    loadSuppliersDropdown: function() {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const dropdown = document.getElementById('stock-supplier');
        
        if (dropdown) {
            dropdown.innerHTML = '<option value="">اختر المورد</option>';
            suppliers.forEach(supplier => {
                const option = document.createElement('option');
                option.value = supplier.id;
                option.textContent = supplier.name;
                dropdown.appendChild(option);
            });
        }
    },
    
    confirmAddStock: function() {
        const productId = document.getElementById('stock-product-id').value;
        const addQuantity = parseInt(document.getElementById('stock-add-quantity').value);
        const cost = parseFloat(document.getElementById('stock-cost').value) || 0;
        const supplierId = document.getElementById('stock-supplier').value;
        
        if (isNaN(addQuantity) || addQuantity <= 0) {
            UTILS.showNotification('يرجى إدخال كمية صحيحة', 'error');
            return;
        }
        
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            UTILS.showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        // تحديث المخزون
        products[productIndex].quantity += addQuantity;
        
        // تحديث التكلفة إذا تم إدخالها
        if (cost > 0) {
            products[productIndex].cost = cost;
        }
        
        // تحديث المورد إذا تم اختياره
        if (supplierId) {
            products[productIndex].supplierId = supplierId;
        }
        
        // حفظ البيانات
        DB.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
        
        // إغلاق الـ modal
        bootstrap.Modal.getInstance(document.getElementById('add-stock-modal')).hide();
        
        UTILS.showNotification(`تم إضافة ${addQuantity} إلى مخزون المنتج`, 'success');
        
        // إعادة تحميل البيانات
        this.loadData();
    },
    
    updateExpiringProducts: function(products) {
        const expiringProducts = products.filter(product => 
            product.expiryDate && UTILS.isExpiringSoon(product.expiryDate, 30)
        ).slice(0, 5);
        
        // تحديث القائمة
        const expiringList = document.getElementById('expiring-products-list');
        if (!expiringList) return;
        
        expiringList.innerHTML = '';
        
        if (expiringProducts.length === 0) {
            expiringList.innerHTML = `
                <div class="text-center py-4 text-muted">
                    <i class="bi bi-check-circle display-4 d-block mb-2"></i>
                    لا توجد منتجات قاربت صلاحيتها على الانتهاء
                </div>
            `;
            return;
        }
        
        expiringProducts.forEach(product => {
            const daysLeft = UTILS.dateDifference(new Date(), product.expiryDate, 'days');
            const severity = daysLeft <= 7 ? 'danger' : daysLeft <= 15 ? 'warning' : 'info';
            
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center">
                        ${product.image ? `
                            <img src="${product.image}" class="product-image me-2" alt="${product.name}" 
                                 style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;">
                        ` : `
                            <div class="bg-secondary rounded me-2 d-flex align-items-center justify-content-center" 
                                 style="width: 40px; height: 40px;">
                                <i class="bi bi-box text-white"></i>
                            </div>
                        `}
                        <div>
                            <div class="fw-bold">${product.name}</div>
                            <small class="text-muted">${product.category}</small>
                        </div>
                    </div>
                    <div class="text-end">
                        <div class="badge bg-${severity} mb-1">${daysLeft} يوم</div>
                        <div class="text-muted small">${UTILS.formatDate(product.expiryDate)}</div>
                    </div>
                </div>
            `;
            expiringList.appendChild(productItem);
        });
    },
    
    createCharts: function(sales, products, expenses) {
        this.createSalesChart(sales);
        this.createInventoryChart(products);
        this.createProfitChart(sales, expenses, products);
        this.createCategoryChart(sales, products);
    },
    
    createSalesChart: function(sales) {
        const ctx = document.getElementById('sales-trend-chart');
        if (!ctx) return;
        
        // تجميع المبيعات حسب الأسبوع
        const weeklySales = this.groupSalesByWeek(sales);
        
        if (this.charts.salesTrend) {
            this.charts.salesTrend.destroy();
        }
        
        this.charts.salesTrend = new Chart(ctx, {
            type: 'line',
            data: {
                labels: weeklySales.labels,
                datasets: [{
                    label: 'المبيعات الأسبوعية',
                    data: weeklySales.values,
                    backgroundColor: 'rgba(78, 115, 223, 0.1)',
                    borderColor: 'rgba(78, 115, 223, 1)',
                    borderWidth: 2,
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'اتجاه المبيعات الأسبوعي'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return UTILS.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    groupSalesByWeek: function(sales) {
        const weeklyData = {};
        
        sales.forEach(sale => {
            const date = new Date(sale.date);
            const weekStart = this.getWeekStartDate(date);
            const weekKey = weekStart.toLocaleDateString('ar-YE', { month: 'short', day: 'numeric' });
            
            if (!weeklyData[weekKey]) {
                weeklyData[weekKey] = 0;
            }
            weeklyData[weekKey] += sale.total;
        });
        
        // تحويل إلى مصفوفة وترتيب حسب التاريخ
        const labels = Object.keys(weeklyData);
        const values = Object.values(weeklyData);
        
        return { labels, values };
    },
    
    getWeekStartDate: function(date) {
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff));
    },
    
    createInventoryChart: function(products) {
        const ctx = document.getElementById('inventory-chart');
        if (!ctx) return;
        
        const inventoryStatus = {
            normal: products.filter(p => p.quantity > (p.minQuantity || 10)).length,
            low: products.filter(p => p.quantity > 0 && p.quantity <= (p.minQuantity || 10)).length,
            out: products.filter(p => p.quantity === 0).length
        };
        
        if (this.charts.inventory) {
            this.charts.inventory.destroy();
        }
        
        this.charts.inventory = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['طبيعي', 'منخفض', 'منتهي'],
                datasets: [{
                    data: [inventoryStatus.normal, inventoryStatus.low, inventoryStatus.out],
                    backgroundColor: [
                        'rgba(40, 167, 69, 0.8)',
                        'rgba(255, 193, 7, 0.8)',
                        'rgba(220, 53, 69, 0.8)'
                    ],
                    borderColor: [
                        'rgba(40, 167, 69, 1)',
                        'rgba(255, 193, 7, 1)',
                        'rgba(220, 53, 69, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true
                    },
                    title: {
                        display: true,
                        text: 'حالة المخزون'
                    }
                }
            }
        });
    },
    
    createProfitChart: function(sales, expenses, products) {
        const ctx = document.getElementById('profit-chart');
        if (!ctx) return;
        
        const monthlyProfit = this.calculateMonthlyProfit(sales, expenses, products);
        
        if (this.charts.profit) {
            this.charts.profit.destroy();
        }
        
        this.charts.profit = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyProfit.labels,
                datasets: [
                    {
                        label: 'الإيرادات',
                        data: monthlyProfit.revenue,
                        backgroundColor: 'rgba(40, 167, 69, 0.6)',
                        borderColor: 'rgba(40, 167, 69, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'المصروفات',
                        data: monthlyProfit.expenses,
                        backgroundColor: 'rgba(220, 53, 69, 0.6)',
                        borderColor: 'rgba(220, 53, 69, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'الأرباح',
                        data: monthlyProfit.profit,
                        backgroundColor: 'rgba(23, 162, 184, 0.6)',
                        borderColor: 'rgba(23, 162, 184, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true
                    },
                    title: {
                        display: true,
                        text: 'الإيرادات والمصروفات والأرباح'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return UTILS.formatCurrency(value);
                            }
                        }
                    }
                }
            }
        });
    },
    
    calculateMonthlyProfit: function(sales, expenses, products) {
        const monthlyData = {};
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                       'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        
        // تهيئة البيانات الشهرية
        months.forEach(month => {
            monthlyData[month] = { revenue: 0, expenses: 0, profit: 0 };
        });
        
        // حساب الإيرادات الشهرية
        sales.forEach(sale => {
            const saleDate = new Date(sale.date);
            const month = months[saleDate.getMonth()];
            
            monthlyData[month].revenue += sale.total;
            
            // حساب ربح هذه البيع
            const saleProfit = sale.items.reduce((profit, item) => {
                const product = products.find(p => p.id === item.productId);
                if (product && product.cost) {
                    return profit + ((item.price - product.cost) * item.quantity);
                }
                return profit;
            }, 0);
            
            monthlyData[month].profit += saleProfit;
        });
        
        // حساب المصروفات الشهرية
        expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const month = months[expenseDate.getMonth()];
            
            monthlyData[month].expenses += expense.amount;
            monthlyData[month].profit -= expense.amount;
        });
        
        return {
            labels: months,
            revenue: months.map(month => monthlyData[month].revenue),
            expenses: months.map(month => monthlyData[month].expenses),
            profit: months.map(month => monthlyData[month].profit)
        };
    },
    
    createCategoryChart: function(sales, products) {
        const ctx = document.getElementById('category-chart');
        if (!ctx) return;
        
        const categorySales = {};
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    const category = product.category || 'غير مصنف';
                    if (!categorySales[category]) {
                        categorySales[category] = 0;
                    }
                    categorySales[category] += item.price * item.quantity;
                }
            });
        });
        
        if (this.charts.category) {
            this.charts.category.destroy();
        }
        
        this.charts.category = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categorySales),
                datasets: [{
                    data: Object.values(categorySales),
                    backgroundColor: [
                        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
                        '#858796', '#f8f9fc', '#5a5c69', '#2e59d9', '#17a673'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        rtl: true
                    },
                    title: {
                        display: true,
                        text: 'المبيعات حسب الفئة'
                    }
                }
            }
        });
    },
    
    updateNotifications: function(products) {
        const notificationsContainer = document.getElementById('dashboard-notifications');
        if (!notificationsContainer) return;
        
        const lowStockProducts = products.filter(p => p.quantity > 0 && p.quantity <= (p.minQuantity || 10));
        const expiringProducts = products.filter(p => p.expiryDate && UTILS.isExpiringSoon(p.expiryDate, 7));
        const outOfStockProducts = products.filter(p => p.quantity === 0);
        
        let notifications = [];
        
        if (lowStockProducts.length > 0) {
            notifications.push({
                type: 'warning',
                message: `هناك ${lowStockProducts.length} منتج منخفض المخزون`,
                icon: 'bi-exclamation-triangle',
                action: 'عرض المنتجات'
            });
        }
        
        if (expiringProducts.length > 0) {
            notifications.push({
                type: 'danger',
                message: `هناك ${expiringProducts.length} منتج قريب من انتهاء الصلاحية`,
                icon: 'bi-clock',
                action: 'عرض المنتجات'
            });
        }
        
        if (outOfStockProducts.length > 0) {
            notifications.push({
                type: 'info',
                message: `هناك ${outOfStockProducts.length} منتج منتهي المخزون`,
                icon: 'bi-box',
                action: 'عرض المنتجات'
            });
        }
        
        if (notifications.length === 0) {
            notifications.push({
                type: 'success',
                message: 'كل شيء على ما يرام',
                icon: 'bi-check-circle',
                action: null
            });
        }
        
        notificationsContainer.innerHTML = notifications.map(notif => `
            <div class="alert alert-${notif.type} alert-dismissible fade show">
                <i class="bi ${notif.icon} me-2"></i>
                ${notif.message}
                ${notif.action ? `
                    <button class="btn btn-sm btn-${notif.type} ms-2" onclick="DASHBOARD.handleNotificationAction('${notif.type}')">
                        ${notif.action}
                    </button>
                ` : ''}
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `).join('');
    },
    
    handleNotificationAction: function(type) {
        switch(type) {
            case 'warning':
                this.navigateToSection('products-section');
                break;
            case 'danger':
                this.navigateToSection('products-section');
                break;
            case 'info':
                this.navigateToSection('products-section');
                break;
        }
    },
    
    navigateToSection: function(sectionId) {
        // البحث عن عنصر التنقل المناسب ونقره
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) {
            navItem.click();
        }
    },
    
    handleQuickAction: function(action) {
        switch(action) {
            case 'new-sale':
                this.navigateToSection('pos-section');
                break;
            case 'new-product':
                if (typeof PRODUCTS !== 'undefined') {
                    document.getElementById('save-product-btn').click();
                }
                break;
            case 'new-supplier':
                if (typeof SUPPLIERS !== 'undefined') {
                    document.getElementById('save-supplier-btn').click();
                }
                break;
            case 'generate-report':
                if (typeof REPORTS !== 'undefined') {
                    REPORTS.generateReport();
                }
                break;
        }
    },
    
    startAutoRefresh: function() {
        // تحديث البيانات تلقائياً كل 5 دقائق
        setInterval(() => {
            if (document.getElementById('dashboard-section').classList.contains('active')) {
                this.loadData();
            }
        }, 5 * 60 * 1000);
    },
    
    // دالة للتصدير السريع لتقرير لوحة التحكم
    exportDashboardReport: function() {
        const reportData = {
            generatedAt: new Date().toISOString(),
            stats: this.stats,
            charts: {
                salesTrend: this.charts.salesTrend ? this.charts.salesTrend.data : {},
                inventory: this.charts.inventory ? this.charts.inventory.data : {},
                profit: this.charts.profit ? this.charts.profit.data : {},
                category: this.charts.category ? this.charts.category.data : {}
            }
        };
        
        const reportStr = JSON.stringify(reportData, null, 2);
        UTILS.downloadFile(reportStr, `تقرير-لوحة-التحكم-${new Date().toISOString().split('T')[0]}.json`, 'application/json');
        
        UTILS.showNotification('تم تصدير تقرير لوحة التحكم', 'success');
    },
    
    // دالة للطباعة السريعة
    printDashboard: function() {
        window.print();
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.DASHBOARD = DASHBOARD;
