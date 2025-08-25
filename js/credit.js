// إدارة المبيعات الآجلة
const CREDIT = {
    currentPage: 1,
    pageSize: 10,
    currentFilter: 'unpaid',
    
    init: function() {
        this.setupEventHandlers();
        this.loadCreditSales();
    },
    
    setupEventHandlers: function() {
        // البحث في المبيعات الآجلة
        document.getElementById('credit-search').addEventListener('input', 
            UTILS.debounce(this.searchCreditSales.bind(this), 300)
        );
        
        // تحديث القائمة
        document.getElementById('refresh-credit-btn').addEventListener('click', () => {
            this.loadCreditSales();
            UTILS.showNotification('تم تحديث قائمة المبيعات الآجلة', 'success');
        });
        
        // تغيير التبويب بين المسددة وغير المسددة
        document.querySelectorAll('[data-credit-filter]').forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                const filter = tab.getAttribute('data-credit-filter');
                this.switchFilter(filter);
            });
        });
        
        // تأكيد تسديد الدين
        document.getElementById('confirm-payment-btn').addEventListener('click', this.confirmCreditPayment.bind(this));
        
        // معالجة تغيير مبلغ السداد
        document.getElementById('credit-payment-amount').addEventListener('input', this.updatePaymentAmount.bind(this));
    },
    
    loadCreditSales: function() {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
        
        this.renderCreditSalesTable(creditSales);
        this.renderPaidCreditTable(paidCreditSales);
        this.updateStats(creditSales, paidCreditSales);
    },
    
    switchFilter: function(filter) {
        this.currentFilter = filter;
        
        // تحديث حالة التبويبات
        document.querySelectorAll('[data-credit-filter]').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-credit-filter') === filter) {
                tab.classList.add('active');
            }
        });
        
        // إظهار/إخفاء الجداول
        if (filter === 'unpaid') {
            document.getElementById('credit-sales-table').closest('.card').style.display = 'block';
            document.getElementById('paid-credit-table').closest('.card').style.display = 'none';
        } else {
            document.getElementById('credit-sales-table').closest('.card').style.display = 'none';
            document.getElementById('paid-credit-table').closest('.card').style.display = 'block';
        }
    },
    
    renderCreditSalesTable: function(creditSales) {
        const tableBody = document.querySelector('#credit-sales-table tbody');
        tableBody.innerHTML = '';
        
        if (creditSales.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-receipt display-4 text-muted d-block mb-2"></i>
                        <span class="text-muted">لا توجد فواتير آجلة</span>
                    </td>
                </tr>
            `;
            return;
        }
        
        // ترتيب الفواتير حسب الأقدم (الأولوية للسداد)
        const sortedSales = creditSales.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        sortedSales.forEach(sale => {
            const dueDate = new Date(sale.date);
            dueDate.setDate(dueDate.getDate() + 30); // افترض أن срок السداد 30 يوم
            const today = new Date();
            const isOverdue = dueDate < today;
            
            const row = document.createElement('tr');
            row.className = isOverdue ? 'table-danger' : '';
            row.innerHTML = `
                <td>
                    <span class="fw-bold">${sale.invoiceNumber}</span>
                    ${isOverdue ? '<span class="badge bg-danger ms-2">متأخر</span>' : ''}
                </td>
                <td>${UTILS.formatDate(sale.date, 'short')}</td>
                <td>
                    <span class="customer-name">${sale.customerName}</span>
                    ${sale.customerPhone ? `<br><small class="text-muted">${sale.customerPhone}</small>` : ''}
                </td>
                <td>${UTILS.formatCurrency(sale.total)}</td>
                <td class="${sale.remainingAmount > 0 ? 'text-danger fw-bold' : ''}">
                    ${UTILS.formatCurrency(sale.remainingAmount)}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-success pay-credit-btn" data-id="${sale.invoiceNumber}" title="تسديد">
                            <i class="bi bi-cash-coin"></i>
                        </button>
                        <button class="btn btn-info view-credit-btn" data-id="${sale.invoiceNumber}" title="عرض">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-warning edit-credit-btn" data-id="${sale.invoiceNumber}" title="تعديل">
                            <i class="bi bi-pencil"></i>
                        </button>
                        ${isOverdue ? `
                        <button class="btn btn-danger reminder-btn" data-id="${sale.invoiceNumber}" title="إرسال تذكير">
                            <i class="bi bi-bell"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // إضافة معالجات الأحداث
        this.addCreditTableEventHandlers();
    },
    
    renderPaidCreditTable: function(paidCreditSales) {
        const tableBody = document.querySelector('#paid-credit-table tbody');
        tableBody.innerHTML = '';
        
        if (paidCreditSales.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-4">
                        <i class="bi bi-check-circle display-4 text-muted d-block mb-2"></i>
                        <span class="text-muted">لا توجد فواتير مسددة</span>
                    </td>
                </tr>
            `;
            return;
        }
        
        // ترتيب الفواتير حسب تاريخ السداد (الأحدث أولاً)
        const sortedSales = paidCreditSales.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
        
        sortedSales.forEach(sale => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.invoiceNumber}</td>
                <td>${UTILS.formatDate(sale.date, 'short')}</td>
                <td>${sale.customerName}</td>
                <td>${UTILS.formatCurrency(sale.total)}</td>
                <td>${UTILS.formatDate(sale.paymentDate, 'short')}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-info view-paid-credit-btn" data-id="${sale.invoiceNumber}" title="عرض">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-secondary receipt-btn" data-id="${sale.invoiceNumber}" title="إيصال">
                            <i class="bi bi-receipt"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // إضافة معالجات الأحداث
        this.addPaidCreditTableEventHandlers();
    },
    
    addCreditTableEventHandlers: function() {
        // زر التسديد
        document.querySelectorAll('.pay-credit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.openPayCreditModal(invoiceNumber);
            });
        });
        
        // زر العرض
        document.querySelectorAll('.view-credit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.viewCreditSale(invoiceNumber);
            });
        });
        
        // زر التعديل
        document.querySelectorAll('.edit-credit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.editCreditSale(invoiceNumber);
            });
        });
        
        // زر التذكير
        document.querySelectorAll('.reminder-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.sendReminder(invoiceNumber);
            });
        });
    },
    
    addPaidCreditTableEventHandlers: function() {
        // زر العرض
        document.querySelectorAll('.view-paid-credit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.viewPaidCreditSale(invoiceNumber);
            });
        });
        
        // زر الإيصال
        document.querySelectorAll('.receipt-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.printPaymentReceipt(invoiceNumber);
            });
        });
    },
    
    updateStats: function(creditSales, paidCreditSales) {
        const totalUnpaid = creditSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
        const totalPaid = paidCreditSales.reduce((sum, sale) => sum + sale.total, 0);
        const overdueCount = creditSales.filter(sale => {
            const dueDate = new Date(sale.date);
            dueDate.setDate(dueDate.getDate() + 30);
            return dueDate < new Date();
        }).length;
        
        // تحديث الإحصائيات في الواجهة إذا كانت موجودة
        const statsElement = document.getElementById('credit-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="row">
                    <div class="col-md-4">
                        <div class="card bg-warning text-white">
                            <div class="card-body">
                                <h5>${UTILS.formatCurrency(totalUnpaid)}</h5>
                                <p>إجمالي الديون الغير مسددة</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-success text-white">
                            <div class="card-body">
                                <h5>${UTILS.formatCurrency(totalPaid)}</h5>
                                <p>إجمالي المبالغ المسددة</p>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="card bg-danger text-white">
                            <div class="card-body">
                                <h5>${overdueCount}</h5>
                                <p>فواتير متأخرة</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    
    searchCreditSales: function() {
        const searchTerm = document.getElementById('credit-search').value.toLowerCase();
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
        
        if (!searchTerm) {
            this.renderCreditSalesTable(creditSales);
            this.renderPaidCreditTable(paidCreditSales);
            return;
        }
        
        const filteredCredit = creditSales.filter(sale => 
            sale.invoiceNumber.includes(searchTerm) ||
            sale.customerName.toLowerCase().includes(searchTerm) ||
            (sale.customerPhone && sale.customerPhone.includes(searchTerm))
        );
        
        const filteredPaid = paidCreditSales.filter(sale => 
            sale.invoiceNumber.includes(searchTerm) ||
            sale.customerName.toLowerCase().includes(searchTerm)
        );
        
        this.renderCreditSalesTable(filteredCredit);
        this.renderPaidCreditTable(filteredPaid);
    },
    
    openPayCreditModal: function(invoiceNumber) {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const sale = creditSales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        // تعبئة النموذج ببيانات الفاتورة
        document.getElementById('credit-invoice-id').value = sale.invoiceNumber;
        document.getElementById('credit-invoice-number').value = sale.invoiceNumber;
        document.getElementById('credit-customer-name').value = sale.customerName;
        document.getElementById('credit-total-amount').value = UTILS.formatCurrency(sale.total);
        document.getElementById('credit-remaining-amount').value = UTILS.formatCurrency(sale.remainingAmount);
        document.getElementById('credit-payment-amount').value = sale.remainingAmount;
        document.getElementById('credit-payment-amount').setAttribute('max', sale.remainingAmount);
        document.getElementById('credit-payment-method').value = 'نقدي';
        
        // حساب تاريخ الاستحقاق
        const dueDate = new Date(sale.date);
        dueDate.setDate(dueDate.getDate() + 30);
        const today = new Date();
        const daysOverdue = Math.max(0, Math.floor((today - dueDate) / (1000 * 60 * 60 * 24)));
        
        // إضافة معلومات إضافية
        const extraInfo = document.getElementById('credit-extra-info') || document.createElement('div');
        extraInfo.id = 'credit-extra-info';
        extraInfo.className = 'mt-3 p-3 bg-light rounded';
        extraInfo.innerHTML = `
            <h6>معلومات إضافية:</h6>
            <div class="row">
                <div class="col-md-6">
                    <small>تاريخ الفاتورة: ${UTILS.formatDate(sale.date)}</small>
                </div>
                <div class="col-md-6">
                    <small>تاريخ الاستحقاق: ${UTILS.formatDate(dueDate)}</small>
                </div>
                ${daysOverdue > 0 ? `
                <div class="col-md-12 mt-2">
                    <span class="badge bg-danger">متأخر بـ ${daysOverdue} يوم</span>
                </div>
                ` : ''}
            </div>
        `;
        
        // إدراج المعلومات الإضافية في النموذج
        const form = document.getElementById('pay-credit-form');
        if (!form.querySelector('#credit-extra-info')) {
            form.appendChild(extraInfo);
        }
        
        // فتح النموذج
        const payModal = new bootstrap.Modal(document.getElementById('payCreditModal'));
        payModal.show();
    },
    
    updatePaymentAmount: function() {
        const paymentAmount = parseFloat(document.getElementById('credit-payment-amount').value) || 0;
        const remainingAmount = parseFloat(
            document.getElementById('credit-remaining-amount').value.replace(/[^\d.]/g, '')
        ) || 0;
        
        if (paymentAmount > remainingAmount) {
            document.getElementById('credit-payment-amount').value = remainingAmount;
            UTILS.showNotification('لا يمكن أن يتجاوز المبلغ المسدد المبلغ المتبقي', 'warning');
        }
    },
    
    confirmCreditPayment: function() {
        const invoiceNumber = document.getElementById('credit-invoice-id').value;
        const paymentAmount = parseFloat(document.getElementById('credit-payment-amount').value);
        const paymentMethod = document.getElementById('credit-payment-method').value;
        const paymentDate = new Date().toISOString().split('T')[0]; // تاريخ اليوم
        
        if (isNaN(paymentAmount) || paymentAmount <= 0) {
            UTILS.showNotification('يرجى إدخال مبلغ صحيح', 'error');
            return;
        }
        
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const saleIndex = creditSales.findIndex(s => s.invoiceNumber === invoiceNumber);
        
        if (saleIndex === -1) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        const sale = creditSales[saleIndex];
        
        if (paymentAmount > sale.remainingAmount) {
            UTILS.showNotification('المبلغ المسدد أكبر من المبلغ المتبقي', 'error');
            return;
        }
        
        // تسجيل عملية السداد
        const payment = {
            id: UTILS.generateId(),
            invoiceNumber: sale.invoiceNumber,
            amount: paymentAmount,
            method: paymentMethod,
            date: paymentDate,
            receivedBy: 'مدير النظام' // يمكن تغيير هذا حسب المستخدم المسجل
        };
        
        // إضافة السداد إلى تاريخ المبيعات الآجلة
        if (!sale.payments) {
            sale.payments = [];
        }
        sale.payments.push(payment);
        
        // تحديث المبلغ المتبقي
        sale.remainingAmount -= paymentAmount;
        
        if (sale.remainingAmount <= 0) {
            // إذا تم سداد كامل المبلغ، نقل الفاتورة إلى الفواتير المسددة
            const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
            
            sale.paymentDate = paymentDate;
            sale.paymentMethod = paymentMethod;
            sale.remainingAmount = 0;
            
            paidCreditSales.push(sale);
            DB.set(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES, paidCreditSales);
            
            // إزالة الفاتورة من الفواتير الآجلة
            creditSales.splice(saleIndex, 1);
            
            UTILS.showNotification('تم سداد الدين بالكامل بنجاح', 'success');
        } else {
            // إذا لم يتم سداد كامل المبلغ، تحديث الفاتورة فقط
            creditSales[saleIndex] = sale;
            UTILS.showNotification(`تم تسديد ${UTILS.formatCurrency(paymentAmount)} من الدين`, 'success');
        }
        
        // حفظ البيانات المحدثة
        DB.set(CONSTANTS.STORAGE_KEYS.CREDIT_SALES, creditSales);
        
        // إغلاق النموذج
        bootstrap.Modal.getInstance(document.getElementById('payCreditModal')).hide();
        
        // طباعة إيصال السداد
        this.printPaymentReceipt(invoiceNumber, payment);
        
        // إعادة تحميل البيانات
        this.loadCreditSales();
        
        // تحديث لوحة التحكم إذا كانت موجودة
        if (typeof DASHBOARD !== 'undefined' && typeof DASHBOARD.loadData === 'function') {
            DASHBOARD.loadData();
        }
    },
    
    viewCreditSale: function(invoiceNumber) {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const sale = creditSales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        this.showCreditSaleDetails(sale, false);
    },
    
    viewPaidCreditSale: function(invoiceNumber) {
        const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
        const sale = paidCreditSales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        this.showCreditSaleDetails(sale, true);
    },
    
    showCreditSaleDetails: function(sale, isPaid) {
        let message = `
            <div class="credit-sale-details">
                <h4>تفاصيل الفاتورة الآجلة</h4>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>رقم الفاتورة:</strong> ${sale.invoiceNumber}
                    </div>
                    <div class="col-md-6">
                        <strong>التاريخ:</strong> ${UTILS.formatDate(sale.date)}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>اسم العميل:</strong> ${sale.customerName}
                    </div>
                    <div class="col-md-6">
                        <strong>هاتف العميل:</strong> ${sale.customerPhone || 'غير متوفر'}
                    </div>
                </div>
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>الإجمالي:</strong> ${UTILS.formatCurrency(sale.total)}
                    </div>
                    <div class="col-md-6">
                        <strong>المتبقي:</strong> <span class="${sale.remainingAmount > 0 ? 'text-danger' : 'text-success'}">${UTILS.formatCurrency(sale.remainingAmount)}</span>
                    </div>
                </div>
        `;
        
        if (isPaid) {
            message += `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>تاريخ التسديد:</strong> ${UTILS.formatDate(sale.paymentDate)}
                    </div>
                    <div class="col-md-6">
                        <strong>طريقة الدفع:</strong> ${sale.paymentMethod}
                    </div>
                </div>
            `;
        }
        
        message += `
                <h5 class="mt-4">المنتجات:</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>المنتج</th>
                                <th>الكمية</th>
                                <th>السعر</th>
                                <th>الإجمالي</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        sale.items.forEach(item => {
            message += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${UTILS.formatCurrency(item.price)}</td>
                    <td>${UTILS.formatCurrency(item.quantity * item.price)}</td>
                </tr>
            `;
        });
        
        message += `
                        </tbody>
                    </table>
                </div>
        `;
        
        if (sale.payments && sale.payments.length > 0) {
            message += `
                <h5 class="mt-4">المدفوعات:</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>التاريخ</th>
                                <th>المبلغ</th>
                                <th>طريقة الدفع</th>
                                <th>المسؤول</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            sale.payments.forEach(payment => {
                message += `
                    <tr>
                        <td>${UTILS.formatDate(payment.date)}</td>
                        <td>${UTILS.formatCurrency(payment.amount)}</td>
                        <td>${payment.method}</td>
                        <td>${payment.receivedBy}</td>
                    </tr>
                `;
            });
            
            message += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        message += `</div>`;
        
        // استخدام modal لعرض التفاصيل
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">تفاصيل الفاتورة الآجلة</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        ${message}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        ${!isPaid ? `
                        <button type="button" class="btn btn-success" onclick="CREDIT.openPayCreditModal('${sale.invoiceNumber}')">تسديد</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        // إزالة الـ modal من DOM عند الإغلاق
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    },
    
    editCreditSale: function(invoiceNumber) {
        UTILS.showNotification('ميزة تعديل الفواتير الآجلة قيد التطوير', 'info');
    },
    
    sendReminder: function(invoiceNumber) {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const sale = creditSales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        // هنا يمكن إضافة إرسال رسالة تذكير عبر WhatsApp أو SMS
        const message = `تذكير: الفاتورة ${invoiceNumber} بمبلغ ${UTILS.formatCurrency(sale.remainingAmount)} متأخرة. يرجى السداد`;
        
        // محاكاة إرسال التذكير
        setTimeout(() => {
            UTILS.showNotification(`تم إرسال تذكير إلى ${sale.customerName}`, 'success');
            
            // تسجيل تاريخ آخر تذكير
            const saleIndex = creditSales.findIndex(s => s.invoiceNumber === invoiceNumber);
            if (saleIndex !== -1) {
                creditSales[saleIndex].lastReminder = new Date().toISOString();
                DB.set(CONSTANTS.STORAGE_KEYS.CREDIT_SALES, creditSales);
            }
        }, 1000);
    },
    
    printPaymentReceipt: function(invoiceNumber, payment = null) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
        
        const sale = creditSales.find(s => s.invoiceNumber === invoiceNumber) || 
                    paidCreditSales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        // إذا لم يتم توفير payment، نستخدم آخر دفعة
        const lastPayment = payment || (sale.payments && sale.payments[sale.payments.length - 1]);
        
        // إعداد الإيصال
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text('إيصال سداد', 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`رقم الإيصال: RCP-${UTILS.generateId().substr(0, 8)}`, 105, 25, { align: 'center' });
        doc.text(`التاريخ: ${new Date().toLocaleDateString('ar-YE')}`, 105, 32, { align: 'center' });
        
        doc.line(10, 40, 200, 40);
        
        let y = 50;
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        
        doc.text(`رقم الفاتورة: ${sale.invoiceNumber}`, 20, y);
        doc.text(`اسم العميل: ${sale.customerName}`, 20, y + 10);
        
        if (lastPayment) {
            doc.text(`المبلغ المسدد: ${UTILS.formatCurrency(lastPayment.amount)}`, 20, y + 20);
            doc.text(`طريقة الدفع: ${lastPayment.method}`, 20, y + 30);
            doc.text(`تاريخ السداد: ${UTILS.formatDate(lastPayment.date)}`, 20, y + 40);
        }
        
        doc.text(`المبلغ المتبقي: ${UTILS.formatCurrency(sale.remainingAmount)}`, 20, y + 50);
        
        doc.text('شكراً لتعاملكم معنا', 105, y + 70, { align: 'center' });
        
        // حفظ PDF
        const fileName = lastPayment ? 
            `إيصال-سداد-${sale.invoiceNumber}.pdf` : 
            `كشف-حساب-${sale.invoiceNumber}.pdf`;
        
        doc.save(fileName);
        UTILS.showNotification('تم طباعة الإيصال بنجاح', 'success');
    },
    
    // دالة للحصول على إحصائيات المبيعات الآجلة
    getCreditStats: function() {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
        
        const totalUnpaid = creditSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
        const totalPaid = paidCreditSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalCredit = totalUnpaid + totalPaid;
        
        const overdueSales = creditSales.filter(sale => {
            const dueDate = new Date(sale.date);
            dueDate.setDate(dueDate.getDate() + 30);
            return dueDate < new Date();
        });
        
        const totalOverdue = overdueSales.reduce((sum, sale) => sum + sale.remainingAmount, 0);
        
        return {
            totalUnpaid,
            totalPaid,
            totalCredit,
            totalOverdue,
            unpaidCount: creditSales.length,
            paidCount: paidCreditSales.length,
            overdueCount: overdueSales.length
        };
    },
    
    // دالة لإنشاء تقرير المبيعات الآجلة
    generateCreditReport: function(startDate, endDate) {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const paidCreditSales = DB.get(CONSTANTS.STORAGE_KEYS.PAID_CREDIT_SALES);
        
        const allSales = [...creditSales, ...paidCreditSales].filter(sale => {
            const saleDate = new Date(sale.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return saleDate >= start && saleDate <= end;
        });
        
        return allSales;
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.CREDIT = CREDIT;
