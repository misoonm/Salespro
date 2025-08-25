// reports.js
class Reports {
    constructor() {
        this.db = dbInstance;
        this.currentReportType = 'inventory';
        this.currentPeriod = 'month';
        this.charts = {};
        this.init();
    }

    init() {
        this.initEventListeners();
        this.initDateFilters();
    }

    initEventListeners() {
        // تغيير نوع التقرير
        document.getElementById('report-period').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            this.toggleCustomDateRange(e.target.value === 'custom');
            this.generateReports();
        });

        // تطبيق الفلتر
        document.getElementById('apply-filter-btn').addEventListener('click', () => {
            this.generateReports();
        });

        // تبويبات التقارير
        document.getElementById('inventory-tab').addEventListener('click', () => {
            this.currentReportType = 'inventory';
            this.generateReports();
        });

        document.getElementById('sales-tab').addEventListener('click', () => {
            this.currentReportType = 'sales';
            this.generateReports();
        });

        document.getElementById('financial-tab').addEventListener('click', () => {
            this.currentReportType = 'financial';
            this.generateReports();
        });

        // أزرار التصدير
        document.getElementById('generate-report-btn').addEventListener('click', () => {
            this.exportToPDF();
        });

        document.getElementById('export-excel-btn').addEventListener('click', () => {
            this.exportToExcel();
        });
    }

    initDateFilters() {
        // تعيين التواريخ الافتراضية
        const today = new Date();
        const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        
        document.getElementById('report-from').value = this.formatDateForInput(firstDayOfMonth);
        document.getElementById('report-to').value = this.formatDateForInput(today);
    }

    toggleCustomDateRange(show) {
        document.getElementById('custom-from-container').style.display = show ? 'block' : 'none';
        document.getElementById('custom-to-container').style.display = show ? 'block' : 'none';
    }

    async generateReports() {
        try {
            // إظهار مؤشر التحميل
            Utils.showToast('جاري تحميل البيانات...', 'info');

            // الحصول على بيانات التقارير
            const reportData = await this.getReportData();
            
            // تحديث الجداول والرسوم البيانية بناءً على نوع التقرير
            switch (this.currentReportType) {
                case 'inventory':
                    await this.updateInventoryReports(reportData);
                    break;
                case 'sales':
                    await this.updateSalesReports(reportData);
                    break;
                case 'financial':
                    await this.updateFinancialReports(reportData);
                    break;
            }

            Utils.showToast('تم تحميل البيانات بنجاح', 'success');
        } catch (error) {
            console.error('خطأ في توليد التقارير:', error);
            Utils.showToast('حدث خطأ في تحميل البيانات', 'danger');
        }
    }

    async getReportData() {
        const dateRange = this.getDateRange();
        const products = await this.db.getAll(STORES.PRODUCTS);
        const sales = await this.db.getAll(STORES.SALES);
        const creditSales = await this.db.getAll(STORES.CREDIT_SALES);

        // تصفية المبيعات حسب النطاق الزمني
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= dateRange.start && saleDate <= dateRange.end;
        });

        return {
            products,
            sales: filteredSales,
            creditSales,
            dateRange
        };
    }

    getDateRange() {
        const today = new Date();
        let startDate, endDate;

        switch (this.currentPeriod) {
            case 'today':
                startDate = new Date(today);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'week':
                startDate = new Date(today);
                startDate.setDate(today.getDate() - today.getDay());
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(today);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'year':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = new Date(today.getFullYear(), 11, 31);
                endDate.setHours(23, 59, 59, 999);
                break;
            case 'custom':
                const fromDate = new Date(document.getElementById('report-from').value);
                const toDate = new Date(document.getElementById('report-to').value);
                startDate = new Date(fromDate);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(toDate);
                endDate.setHours(23, 59, 59, 999);
                break;
        }

        return { start: startDate, end: endDate };
    }

    formatDateForInput(date) {
        return date.toISOString().split('T')[0];
    }

    async updateInventoryReports(data) {
        const { products } = data;
        
        // تحديث جدول تقارير المخزون
        this.updateInventoryTable(products);
        
        // تحديث جدول المنتجات قاربت صلاحيتها على الانتهاء
        this.updateExpiryTable(products);
    }

    updateInventoryTable(products) {
        const tbody = document.querySelector('#inventory-report-table tbody');
        tbody.innerHTML = '';

        products.forEach(product => {
            const stockValue = product.price * product.quantity;
            let status = 'جيد';
            let statusClass = 'text-success';

            if (product.quantity === 0) {
                status = 'منتهي';
                statusClass = 'text-danger';
            } else if (product.quantity < product.minQuantity) {
                status = 'منخفض';
                statusClass = 'text-warning';
            }

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${Utils.formatCurrency(stockValue)}</td>
                <td class="${statusClass}">${status}</td>
            `;
            tbody.appendChild(row);
        });
    }

    updateExpiryTable(products) {
        const tbody = document.querySelector('#expiry-report-table tbody');
        tbody.innerHTML = '';

        const today = new Date();
        const expiringProducts = products.filter(product => {
            if (!product.expiryDate) return false;
            const expiryDate = new Date(product.expiryDate);
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30 && diffDays >= 0;
        });

        expiringProducts.forEach(product => {
            const expiryDate = new Date(product.expiryDate);
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.quantity}</td>
                <td>${this.formatDate(expiryDate)}</td>
                <td>${diffDays} يوم</td>
            `;
            tbody.appendChild(row);
        });
    }

    async updateSalesReports(data) {
        const { sales, products } = data;
        
        // تحديث الرسوم البيانية
        this.renderSalesByCategoryChart(sales, products);
        this.renderDailySalesChart(sales);
        this.renderSalesByEmployeeChart(sales);
        
        // تحديث جدول تفاصيل المبيعات
        this.updateSalesTable(sales);
    }

    renderSalesByCategoryChart(sales, products) {
        const ctx = document.getElementById('salesByCategoryChart').getContext('2d');
        
        // تجميع المبيعات حسب الفئة
        const salesByCategory = {};
        sales.forEach(sale => {
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product) {
                    if (!salesByCategory[product.category]) {
                        salesByCategory[product.category] = 0;
                    }
                    salesByCategory[product.category] += item.total;
                }
            });
        });

        const categories = Object.keys(salesByCategory);
        const amounts = Object.values(salesByCategory);

        if (this.charts.salesByCategory) {
            this.charts.salesByCategory.destroy();
        }

        this.charts.salesByCategory = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', 
                        '#e74a3b', '#6f42c1', '#fd7e14', '#20c9a6'
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
    }

    renderDailySalesChart(sales) {
        const ctx = document.getElementById('dailySalesChart').getContext('2d');
        
        // تجميع المبيعات حسب اليوم
        const salesByDay = {};
        sales.forEach(sale => {
            const saleDate = new Date(sale.date).toLocaleDateString('ar-SA');
            if (!salesByDay[saleDate]) {
                salesByDay[saleDate] = 0;
            }
            salesByDay[saleDate] += sale.total;
        });

        const dates = Object.keys(salesByDay);
        const amounts = Object.values(salesByDay);

        if (this.charts.dailySales) {
            this.charts.dailySales.destroy();
        }

        this.charts.dailySales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'المبيعات اليومية',
                    data: amounts,
                    backgroundColor: '#4e73df'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'المبيعات اليومية'
                    }
                }
            }
        });
    }

    renderSalesByEmployeeChart(sales) {
        const ctx = document.getElementById('salesByEmployeeChart').getContext('2d');
        
        // تجميع المبيعات حسب الموظف
        const salesByEmployee = {};
        sales.forEach(sale => {
            const employee = sale.employee || 'غير معروف';
            if (!salesByEmployee[employee]) {
                salesByEmployee[employee] = 0;
            }
            salesByEmployee[employee] += sale.total;
        });

        const employees = Object.keys(salesByEmployee);
        const amounts = Object.values(salesByEmployee);

        if (this.charts.salesByEmployee) {
            this.charts.salesByEmployee.destroy();
        }

        this.charts.salesByEmployee = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: employees,
                datasets: [{
                    data: amounts,
                    backgroundColor: [
                        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'
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
                        text: 'المبيعات حسب الموظف'
                    }
                }
            }
        });
    }

    updateSalesTable(sales) {
        const tbody = document.querySelector('#sales-report-table tbody');
        tbody.innerHTML = '';

        // ترتيب المبيعات من الأحدث إلى الأقدم
        sales.sort((a, b) => new Date(b.date) - new Date(a.date));

        sales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.invoiceNumber}</td>
                <td>${this.formatDate(new Date(sale.date))}</td>
                <td>${sale.employee || 'غير معروف'}</td>
                <td>${Utils.formatCurrency(sale.total)}</td>
                <td>${sale.paymentMethod}</td>
                <td>
                    <button class="btn btn-sm btn-info view-sale-btn" data-id="${sale.id}">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // إضافة مستمعي الأحداث لأزرار العرض
        document.querySelectorAll('.view-sale-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const saleId = btn.getAttribute('data-id');
                this.viewSaleDetails(saleId);
            });
        });
    }

    async viewSaleDetails(saleId) {
        try {
            const sale = await this.db.get(STORES.SALES, saleId);
            if (sale) {
                // يمكنك إنشاء modal لعرض تفاصيل الفاتورة هنا
                let detailsHtml = `
                    <h5>تفاصيل الفاتورة #${sale.invoiceNumber}</h5>
                    <p><strong>التاريخ:</strong> ${this.formatDate(new Date(sale.date))}</p>
                    <p><strong>الموظف:</strong> ${sale.employee || 'غير معروف'}</p>
                    <p><strong>طريقة الدفع:</strong> ${sale.paymentMethod}</p>
                    <p><strong>الإجمالي:</strong> ${Utils.formatCurrency(sale.total)}</p>
                    <hr>
                    <h6>المنتجات:</h6>
                    <ul class="list-group">
                `;

                sale.items.forEach(item => {
                    detailsHtml += `
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            ${item.name}
                            <span>${item.quantity} × ${Utils.formatCurrency(item.price)} = ${Utils.formatCurrency(item.total)}</span>
                        </li>
                    `;
                });

                detailsHtml += `</ul>`;

                // استخدام SweetAlert2 لعرض التفاصيل
                Swal.fire({
                    title: 'تفاصيل الفاتورة',
                    html: detailsHtml,
                    icon: 'info',
                    confirmButtonText: 'موافق'
                });
            }
        } catch (error) {
            console.error('خطأ في عرض تفاصيل الفاتورة:', error);
            Utils.showToast('حدث خطأ في عرض التفاصيل', 'danger');
        }
    }

    async updateFinancialReports(data) {
        const { sales, products } = data;
        
        // حساب الأرباح والمصروفات
        const financialData = this.calculateFinancialData(sales, products);
        
        // تحديث الرسوم البيانية
        this.renderProfitExpensesChart(financialData);
        this.renderProfitAnalysisChart(financialData);
        
        // تحديث جدول التدفق النقدي
        this.updateCashflowTable(financialData);
    }

    calculateFinancialData(sales, products) {
        let totalRevenue = 0;
        let totalCost = 0;
        let totalProfit = 0;
        
        // حساب الإيرادات والتكاليف
        sales.forEach(sale => {
            totalRevenue += sale.total;
            
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && product.cost) {
                    totalCost += product.cost * item.quantity;
                }
            });
        });
        
        totalProfit = totalRevenue - totalCost;
        
        // تجميع البيانات حسب اليوم
        const dailyData = {};
        sales.forEach(sale => {
            const saleDate = new Date(sale.date).toLocaleDateString('ar-SA');
            if (!dailyData[saleDate]) {
                dailyData[saleDate] = {
                    revenue: 0,
                    cost: 0,
                    profit: 0
                };
            }
            
            dailyData[saleDate].revenue += sale.total;
            
            sale.items.forEach(item => {
                const product = products.find(p => p.id === item.productId);
                if (product && product.cost) {
                    dailyData[saleDate].cost += product.cost * item.quantity;
                }
            });
            
            dailyData[saleDate].profit = dailyData[saleDate].revenue - dailyData[saleDate].cost;
        });
        
        return {
            totalRevenue,
            totalCost,
            totalProfit,
            dailyData
        };
    }

    renderProfitExpensesChart(financialData) {
        const ctx = document.getElementById('profitExpensesChart').getContext('2d');
        
        if (this.charts.profitExpenses) {
            this.charts.profitExpenses.destroy();
        }

        this.charts.profitExpenses = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['الإيرادات', 'التكاليف', 'الأرباح'],
                datasets: [{
                    label: 'المبلغ',
                    data: [
                        financialData.totalRevenue, 
                        financialData.totalCost, 
                        financialData.totalProfit
                    ],
                    backgroundColor: [
                        '#4e73df', '#e74a3b', '#1cc88a'
                    ]
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: 'الأرباح والمصروفات'
                    }
                }
            }
        });
    }

    renderProfitAnalysisChart(financialData) {
        const ctx = document.getElementById('profitAnalysisChart').getContext('2d');
        const dates = Object.keys(financialData.dailyData);
        const profits = dates.map(date => financialData.dailyData[date].profit);
        
        if (this.charts.profitAnalysis) {
            this.charts.profitAnalysis.destroy();
        }

        this.charts.profitAnalysis = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: [{
                    label: 'الأرباح اليومية',
                    data: profits,
                    borderColor: '#1cc88a',
                    backgroundColor: 'rgba(28, 200, 138, 0.1)',
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: 'تحليل الأرباح'
                    }
                }
            }
        });
    }

    updateCashflowTable(financialData) {
        const tbody = document.querySelector('#cashflow-table tbody');
        tbody.innerHTML = '';
        
        let balance = 0;
        const dates = Object.keys(financialData.dailyData);
        
        dates.forEach(date => {
            const daily = financialData.dailyData[date];
            balance += daily.profit;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${date}</td>
                <td>المبيعات اليومية</td>
                <td>${Utils.formatCurrency(daily.revenue)}</td>
                <td>${Utils.formatCurrency(daily.cost)}</td>
                <td>${Utils.formatCurrency(balance)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    formatDate(date) {
        return date.toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    exportToPDF() {
        Utils.showToast('جاري تحضير التقرير PDF...', 'info');
        
        // استخدام jsPDF لإنشاء تقرير PDF
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // إضافة عنوان التقرير
        doc.setFontSize(20);
        doc.text('تقرير النظام', 105, 15, { align: 'center' });
        
        // إضافة تاريخ التقرير
        doc.setFontSize(12);
        doc.text(`تاريخ التقرير: ${new Date().toLocaleDateString('ar-SA')}`, 105, 25, { align: 'center' });
        
        // إضافة نوع التقرير
        let reportType = '';
        switch(this.currentReportType) {
            case 'inventory': reportType = 'تقارير المخزون'; break;
            case 'sales': reportType = 'تقارير المبيعات'; break;
            case 'financial': reportType = 'تقارير مالية'; break;
        }
        doc.text(`نوع التقرير: ${reportType}`, 105, 35, { align: 'center' });
        
        // إضافة الفترة الزمنية
        let periodText = '';
        switch(this.currentPeriod) {
            case 'today': periodText = 'اليوم'; break;
            case 'week': periodText = 'أسبوع'; break;
            case 'month': periodText = 'شهر'; break;
            case 'year': periodText = 'سنة'; break;
            case 'custom': 
                const from = document.getElementById('report-from').value;
                const to = document.getElementById('report-to').value;
                periodText = `من ${from} إلى ${to}`;
                break;
        }
        doc.text(`الفترة: ${periodText}`, 105, 45, { align: 'center' });
        
        // حفظ الملف
        doc.save(`تقرير_النظام_${new Date().toISOString().slice(0, 10)}.pdf`);
        
        Utils.showToast('تم تصدير التقرير بنجاح', 'success');
    }

    exportToExcel() {
        Utils.showToast('جاري تحضير التقرير Excel...', 'info');
        
        // يمكن استخدام مكتبة مثل SheetJS لإنشاء تقرير Excel
        // هنا نعرض رسالة أن هذه الميزة تحت التطوير
        
        Swal.fire({
            title: 'تحت التطوير',
            text: 'سيتم إضافة دعم تصدير Excel في نسخة قادمة',
            icon: 'info',
            confirmButtonText: 'موافق'
        });
    }
}

// تهيئة التقارير عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const reports = new Reports();
});
