// إدارة المبيعات
init: function() {
    // تأكد من تهيئة قاعدة البيانات أولاً
    if (typeof DB !== 'undefined' && typeof DB.init === 'function') {
        DB.init();
    }
    
    this.setupEventHandlers();
    this.loadProducts();
    this.loadSuppliersDropdown();
}

const SALES = {
    viewSale: function(invoiceNumber) {
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        let message = `رقم الفاتورة: ${sale.invoiceNumber}\n`;
        message += `التاريخ: ${sale.date}\n`;
        message += `طريقة الدفع: ${sale.paymentMethod}\n`;
        message += `الإجمالي: ${UTILS.formatCurrency(sale.total)}\n\n`;
        message += 'المنتجات:\n';
        
        sale.items.forEach(item => {
            message += `- ${item.name} (${item.quantity} × ${UTILS.formatCurrency(item.price)}) = ${UTILS.formatCurrency(item.quantity * item.price)}\n`;
        });
        
        if (sale.discount > 0) {
            message += `\nالخصم: ${UTILS.formatCurrency(sale.discount)}`;
        }
        
        // استخدام modal بدلاً من alert لعرض أفضل
        this.showSaleDetailsModal(sale, message);
    },
    
    showSaleDetailsModal: function(sale, message) {
        // إنشاء modal لعرض التفاصيل
        const modalId = 'sale-details-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">تفاصيل الفاتورة</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <div id="sale-details-content"></div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                            <button type="button" class="btn btn-primary" id="print-sale-btn">طباعة</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // إضافة معالج حدث لزر الطباعة
            modal.addEventListener('shown.bs.modal', function() {
                document.getElementById('print-sale-btn').addEventListener('click', function() {
                    SALES.printInvoice(sale);
                });
            });
        }
        
        // تعبئة المحتوى
        document.getElementById('sale-details-content').innerHTML = this.formatSaleDetails(sale);
        
        // عرض الـ modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    },
    
    formatSaleDetails: function(sale) {
        let html = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>رقم الفاتورة:</strong> ${sale.invoiceNumber}
                </div>
                <div class="col-md-6">
                    <strong>التاريخ:</strong> ${sale.date}
                </div>
            </div>
            <div class="row mb-3">
                <div class="col-md-6">
                    <strong>طريقة الدفع:</strong> ${sale.paymentMethod}
                </div>
                <div class="col-md-6">
                    <strong>الإجمالي:</strong> ${UTILS.formatCurrency(sale.total)}
                </div>
            </div>
        `;
        
        if (sale.discount > 0) {
            html += `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <strong>الخصم:</strong> ${UTILS.formatCurrency(sale.discount)}
                    </div>
                    <div class="col-md-6">
                        <strong>الصافي:</strong> ${UTILS.formatCurrency(sale.total + sale.discount)}
                    </div>
                </div>
            `;
        }
        
        html += `
            <div class="table-responsive mt-4">
                <table class="table table-bordered">
                    <thead class="table-light">
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
            html += `
                <tr>
                    <td>${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${UTILS.formatCurrency(item.price)}</td>
                    <td>${UTILS.formatCurrency(item.quantity * item.price)}</td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        return html;
    },
    
    editSale: function(invoiceNumber) {
        UTILS.showNotification(`تحرير عملية البيع رقم: ${invoiceNumber} - هذه الميزة قيد التطوير`, 'info');
        
        // في التطبيق الكامل، سيتم فتح نموذج تحرير الفاتورة
        // this.openEditSaleModal(invoiceNumber);
    },
    
    openEditSaleModal: function(invoiceNumber) {
        // هذا سيكون تنفيذ كامل لفتح نموذج التحرير
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        const sale = sales.find(s => s.invoiceNumber === invoiceNumber);
        
        if (!sale) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        // إنشاء وتعبئة نموذج التحرير
        const modalId = 'edit-sale-modal';
        let modal = document.getElementById(modalId);
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = modalId;
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">تحرير الفاتورة</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p>ميزة تحرير الفواتير قيد التطوير حالياً.</p>
                            <p>رقم الفاتورة: <strong>${sale.invoiceNumber}</strong></p>
                            <p>التاريخ: <strong>${sale.date}</strong></p>
                            <p>الإجمالي: <strong>${UTILS.formatCurrency(sale.total)}</strong></p>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                            <button type="button" class="btn btn-warning" disabled>حفظ التغييرات</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
    },
    
    deleteSale: function(invoiceNumber) {
        if (!confirm('هل أنت متأكد من حذف هذه الفاتورة؟ سيتم استعادة المخزون.')) {
            return;
        }
        
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        const saleIndex = sales.findIndex(s => s.invoiceNumber === invoiceNumber);
        
        if (saleIndex === -1) {
            UTILS.showNotification('لم يتم العثور على الفاتورة', 'error');
            return;
        }
        
        const sale = sales[saleIndex];
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        
        // استعادة المخزون
        let restoredItems = 0;
        sale.items.forEach(item => {
            const productIndex = products.findIndex(p => p.id == item.productId);
            if (productIndex !== -1) {
                products[productIndex].quantity += item.quantity;
                restoredItems++;
            }
        });
        
        // حذف الفاتورة
        sales.splice(saleIndex, 1);
        
        // حفظ البيانات المحدثة
        DB.set(CONSTANTS.STORAGE_KEYS.SALES, sales);
        DB.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
        
        // إعادة تحميل البيانات في الأقسام المتأثرة
        if (typeof DASHBOARD !== 'undefined' && typeof DASHBOARD.loadData === 'function') {
            DASHBOARD.loadData();
        }
        
        if (typeof REPORTS !== 'undefined' && typeof REPORTS.loadData === 'function') {
            REPORTS.loadData();
        }
        
        UTILS.showNotification(`تم حذف الفاتورة واستعادة ${restoredItems} منتج إلى المخزون`, 'success');
    },
    
    printInvoice: function(sale) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // إعدادات المتجر من localStorage
        const storeName = localStorage.getItem(CONSTANTS.STORAGE_KEYS.STORE_NAME) || 'متجري';
        const settings = DB.get(CONSTANTS.STORAGE_KEYS.SETTINGS);
        
        // إضافة محتوى الفاتورة بالعربية
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text(storeName, 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`رقم الفاتورة: ${sale.invoiceNumber}`, 105, 25, { align: 'center' });
        doc.text(`التاريخ: ${sale.date}`, 105, 32, { align: 'center' });
        
        // خط لعناصر الفاتورة
        doc.setDrawColor(200, 200, 200);
        doc.line(10, 40, 200, 40);
        
        // عناصر الفاتورة
        let y = 50;
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('المنتج', 180, y, { align: 'right' });
        doc.text('الكمية', 140, y, { align: 'right' });
        doc.text('السعر', 100, y, { align: 'right' });
        doc.text('الإجمالي', 60, y, { align: 'right' });
        
        y += 10;
        doc.line(10, y, 200, y);
        y += 10;
        
        sale.items.forEach(item => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.text(item.name, 180, y, { align: 'right' });
            doc.text(item.quantity.toString(), 140, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(item.price), 100, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(item.quantity * item.price), 60, y, { align: 'right' });
            y += 10;
        });
        
        y += 5;
        doc.line(10, y, 200, y);
        y += 10;
        
        if (sale.discount > 0) {
            const subtotal = sale.total + sale.discount;
            doc.text('الإجمالي:', 180, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(subtotal), 140, y, { align: 'right' });
            y += 10;
            
            doc.text('الخصم:', 180, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(sale.discount), 140, y, { align: 'right' });
            y += 10;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('المبلغ الإجمالي:', 180, y, { align: 'right' });
        doc.text(UTILS.formatCurrency(sale.total), 140, y, { align: 'right' });
        y += 10;
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`طريقة الدفع: ${sale.paymentMethod}`, 105, y, { align: 'center' });
        
        y += 20;
        doc.setFontSize(10);
        doc.text(settings.receiptFooter || 'شكراً لشرائكم من متجرنا', 105, y, { align: 'center' });
        
        // حفظ PDF
        doc.save(`فاتورة-${sale.invoiceNumber}.pdf`);
        
        UTILS.showNotification('تم طباعة الفاتورة بنجاح', 'success');
    },
    
    // دالة مساعدة للبحث في المبيعات
    searchSales: function(searchTerm, salesData = null) {
        const sales = salesData || DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        
        return sales.filter(sale => 
            sale.invoiceNumber.includes(searchTerm) ||
            (sale.customerName && sale.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            sale.paymentMethod.includes(searchTerm) ||
            sale.date.includes(searchTerm)
        );
    },
    
    // دالة للحصول على إحصائيات المبيعات
    getSalesStats: function(salesData = null) {
        const sales = salesData || DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        
        const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
        const totalTransactions = sales.length;
        
        // المبيعات اليومية
        const today = new Date().toLocaleDateString('en-CA');
        const todaySales = sales
            .filter(sale => sale.date === today)
            .reduce((sum, sale) => sum + sale.total, 0);
        
        // المبيعات حسب طريقة الدفع
        const salesByPayment = {};
        CONSTANTS.PAYMENT_METHODS.forEach(method => {
            salesByPayment[method] = sales
                .filter(sale => sale.paymentMethod === method)
                .reduce((sum, sale) => sum + sale.total, 0);
        });
        
        return {
            totalSales,
            totalTransactions,
            todaySales,
            salesByPayment,
            averageSale: totalTransactions > 0 ? totalSales / totalTransactions : 0
        };
    },
    
    // دالة لتصدير بيانات المبيعات
    exportSalesData: function(format = 'csv') {
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        
        if (format === 'csv') {
            this.exportToCSV(sales);
        } else if (format === 'json') {
            this.exportToJSON(sales);
        } else {
            UTILS.showNotification('صيغة التصدير غير مدعومة', 'error');
        }
    },
    
    exportToCSV: function(sales) {
        let csvContent = "رقم الفاتورة,التاريخ,طريقة الدفع,الإجمالي,الخصم,الصافي\n";
        
        sales.forEach(sale => {
            const netAmount = sale.total + (sale.discount || 0);
            csvContent += `"${sale.invoiceNumber}","${sale.date}","${sale.paymentMethod}",${sale.total},${sale.discount || 0},${netAmount}\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        
        link.setAttribute("href", url);
        link.setAttribute("download", `مبيعات-${new Date().toLocaleDateString('en-CA')}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        UTILS.showNotification('تم تصدير بيانات المبيعات بنجاح', 'success');
    },
    
    exportToJSON: function(sales) {
        const dataStr = JSON.stringify(sales, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const link = document.createElement("a");
        
        link.setAttribute("href", URL.createObjectURL(blob));
        link.setAttribute("download", `مبيعات-${new Date().toLocaleDateString('en-CA')}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        UTILS.showNotification('تم تصدير بيانات المبيعات بنجاح', 'success');
    }
};
