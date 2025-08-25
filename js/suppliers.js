// إدارة الموردين
const SUPPLIERS = {
    currentPage: 1,
    pageSize: 10,
    currentSort: { field: 'name', direction: 'asc' },
    currentFilter: 'all',
    searchTerm: '',
    
    init: function() {
        this.setupEventHandlers();
        this.loadSuppliers();
        this.loadPurchases();
    },
    
    setupEventHandlers: function() {
        // البحث عن الموردين
        document.getElementById('supplier-search').addEventListener('input', 
            UTILS.debounce(this.searchSuppliers.bind(this), 300)
        );
        
        // إضافة مورد جديد
        document.getElementById('save-supplier-btn').addEventListener('click', this.saveSupplier.bind(this));
        
        // تصفية الموردين
        document.getElementById('supplier-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadSuppliers();
        });
        
        // استيراد الموردين
        document.getElementById('import-suppliers-btn').addEventListener('click', this.importSuppliers.bind(this));
        
        // تصدير الموردين
        document.getElementById('export-suppliers-btn').addEventListener('click', this.exportSuppliers.bind(this));
        
        // تحديث القائمة
        document.getElementById('refresh-suppliers-btn').addEventListener('click', () => {
            this.loadSuppliers();
            UTILS.showNotification('تم تحديث قائمة الموردين', 'success');
        });
    },
    
    loadSuppliers: function() {
        let suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        
        // التصفية
        suppliers = this.filterSuppliers(suppliers);
        
        // البحث
        if (this.searchTerm) {
            suppliers = this.searchSuppliersData(suppliers, this.searchTerm);
        }
        
        // الترتيب
        suppliers = this.sortSuppliersData(suppliers, this.currentSort.field, this.currentSort.direction);
        
        // عرض الموردين
        this.renderSuppliersTable(suppliers);
        
        // تحديث الإحصائيات
        this.updateSupplierStats(suppliers);
    },
    
    filterSuppliers: function(suppliers) {
        switch(this.currentFilter) {
            case 'active':
                return suppliers.filter(supplier => supplier.isActive !== false);
            case 'inactive':
                return suppliers.filter(supplier => supplier.isActive === false);
            case 'with-balance':
                return suppliers.filter(supplier => (supplier.balance || 0) > 0);
            case 'wholesaler':
                return suppliers.filter(supplier => supplier.type === 'wholesaler');
            case 'manufacturer':
                return suppliers.filter(supplier => supplier.type === 'manufacturer');
            default:
                return suppliers;
        }
    },
    
    searchSuppliersData: function(suppliers, searchTerm) {
        return suppliers.filter(supplier => 
            supplier.name.toLowerCase().includes(searchTerm) || 
            (supplier.contact && supplier.contact.toLowerCase().includes(searchTerm)) ||
            (supplier.phone && supplier.phone.includes(searchTerm)) ||
            (supplier.email && supplier.email.toLowerCase().includes(searchTerm)) ||
            (supplier.products && supplier.products.toLowerCase().includes(searchTerm))
        );
    },
    
    sortSuppliersData: function(suppliers, field, direction = 'asc') {
        return suppliers.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];
            
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    renderSuppliersTable: function(suppliers) {
        const tableBody = document.querySelector('#suppliers-table tbody');
        tableBody.innerHTML = '';
        
        if (suppliers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5 text-muted">
                        <i class="bi bi-truck display-4 d-block mb-2"></i>
                        ${this.searchTerm ? 'لا توجد موردين مطابقين للبحث' : 'لا توجد موردين'}
                    </td>
                </tr>
            `;
            return;
        }
        
        // التقسيم إلى صفحات
        const paginatedSuppliers = this.paginate(suppliers, this.currentPage, this.pageSize);
        
        paginatedSuppliers.data.forEach(supplier => {
            const row = document.createElement('tr');
            row.className = supplier.isActive === false ? 'table-secondary' : '';
            
            row.innerHTML = `
                <td>
                    <div class="supplier-info">
                        <div class="supplier-name fw-bold">${supplier.name}</div>
                        ${supplier.type ? `<small class="text-muted">${this.getSupplierTypeLabel(supplier.type)}</small>` : ''}
                    </div>
                </td>
                <td>
                    ${supplier.contact || '-'}
                    ${supplier.position ? `<br><small class="text-muted">${supplier.position}</small>` : ''}
                </td>
                <td>
                    ${supplier.phone ? `
                        <div class="d-flex align-items-center">
                            <i class="bi bi-telephone me-2 text-muted"></i>
                            <a href="tel:${supplier.phone}" class="text-decoration-none">${supplier.phone}</a>
                        </div>
                    ` : '-'}
                    ${supplier.phone2 ? `<small class="text-muted">${supplier.phone2}</small>` : ''}
                </td>
                <td>
                    ${supplier.email ? `
                        <div class="d-flex align-items-center">
                            <i class="bi bi-envelope me-2 text-muted"></i>
                            <a href="mailto:${supplier.email}" class="text-decoration-none">${supplier.email}</a>
                        </div>
                    ` : '-'}
                </td>
                <td>
                    ${supplier.products ? `
                        <span class="products-badge" data-bs-toggle="tooltip" data-bs-title="${supplier.products}">
                            ${supplier.products.split(',').length} منتج
                        </span>
                    ` : '-'}
                </td>
                <td class="${(supplier.balance || 0) > 0 ? 'text-danger fw-bold' : 'text-success'}">
                    ${UTILS.formatCurrency(supplier.balance || 0)}
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary edit-supplier-btn" data-id="${supplier.id}" title="تعديل">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-info view-supplier-btn" data-id="${supplier.id}" title="عرض">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-${supplier.isActive === false ? 'success' : 'warning'} toggle-supplier-btn" 
                                data-id="${supplier.id}" title="${supplier.isActive === false ? 'تفعيل' : 'تعطيل'}">
                            <i class="bi bi-${supplier.isActive === false ? 'check' : 'x'}"></i>
                        </button>
                        <button class="btn btn-danger delete-supplier-btn" data-id="${supplier.id}" title="حذف">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // إضافة معالجات الأحداث
        this.addTableEventHandlers();
        
        // تحديث أداة التصفح
        this.updatePagination(paginatedSuppliers.pagination);
        
        // تهيئة أدوات التلميح
        this.initTooltips();
    },
    
    getSupplierTypeLabel: function(type) {
        const types = {
            'wholesaler': 'جملة',
            'retailer': 'تجزئة',
            'manufacturer': 'مصنع',
            'importer': 'مستورد',
            'distributor': 'موزع',
            'other': 'أخرى'
        };
        return types[type] || type;
    },
    
    addTableEventHandlers: function() {
        // زر التعديل
        document.querySelectorAll('.edit-supplier-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const supplierId = e.currentTarget.getAttribute('data-id');
                this.editSupplier(supplierId);
            });
        });
        
        // زر العرض
        document.querySelectorAll('.view-supplier-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const supplierId = e.currentTarget.getAttribute('data-id');
                this.viewSupplier(supplierId);
            });
        });
        
        // زر التفعيل/التعطيل
        document.querySelectorAll('.toggle-supplier-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const supplierId = e.currentTarget.getAttribute('data-id');
                this.toggleSupplierStatus(supplierId);
            });
        });
        
        // زر الحذف
        document.querySelectorAll('.delete-supplier-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const supplierId = e.currentTarget.getAttribute('data-id');
                this.deleteSupplier(supplierId);
            });
        });
    },
    
    initTooltips: function() {
        // تهيئة أدوات التلميح Bootstrap
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    },
    
    updatePagination: function(pagination) {
        const paginationElement = document.getElementById('suppliers-pagination');
        if (!paginationElement) return;
        
        paginationElement.innerHTML = '';
        
        if (pagination.totalPages <= 1) return;
        
        // زر السابق
        const prevLi = document.createElement('li');
        prevLi.className = `page-item ${pagination.hasPrev ? '' : 'disabled'}`;
        prevLi.innerHTML = `
            <a class="page-link" href="#" data-page="${pagination.page - 1}">
                <i class="bi bi-chevron-right"></i>
            </a>
        `;
        paginationElement.appendChild(prevLi);
        
        // أرقام الصفحات
        for (let i = 1; i <= pagination.totalPages; i++) {
            const pageLi = document.createElement('li');
            pageLi.className = `page-item ${i === pagination.page ? 'active' : ''}`;
            pageLi.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            paginationElement.appendChild(pageLi);
        }
        
        // زر التالي
        const nextLi = document.createElement('li');
        nextLi.className = `page-item ${pagination.hasNext ? '' : 'disabled'}`;
        nextLi.innerHTML = `
            <a class="page-link" href="#" data-page="${pagination.page + 1}">
                <i class="bi bi-chevron-left"></i>
            </a>
        `;
        paginationElement.appendChild(nextLi);
        
        // إضافة معالجات الأحداث
        paginationElement.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.getAttribute('data-page'));
                if (!isNaN(page)) {
                    this.currentPage = page;
                    this.loadSuppliers();
                }
            });
        });
    },
    
    paginate: function(data, page, pageSize) {
        const totalItems = data.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        
        return {
            data: data.slice(startIndex, endIndex),
            pagination: {
                page,
                pageSize,
                totalItems,
                totalPages,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        };
    },
    
    updateSupplierStats: function(filteredSuppliers) {
        const allSuppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        
        const statsElement = document.getElementById('suppliers-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="row">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-truck"></i>
                            <span>${allSuppliers.length} مورد</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-filter"></i>
                            <span>${filteredSuppliers.length} نتيجة</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-currency-exchange"></i>
                            <span>${UTILS.formatCurrency(this.calculateTotalBalance(allSuppliers))}</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-check-circle"></i>
                            <span>${this.getActiveSuppliersCount(allSuppliers)} نشط</span>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    
    calculateTotalBalance: function(suppliers) {
        return suppliers.reduce((total, supplier) => {
            return total + (supplier.balance || 0);
        }, 0);
    },
    
    getActiveSuppliersCount: function(suppliers) {
        return suppliers.filter(supplier => supplier.isActive !== false).length;
    },
    
    searchSuppliers: function() {
        this.searchTerm = document.getElementById('supplier-search').value.toLowerCase();
        this.currentPage = 1;
        this.loadSuppliers();
    },
    
    saveSupplier: function() {
        const formData = this.getSupplierFormData();
        
        if (!this.validateSupplierForm(formData)) {
            return;
        }
        
        const newSupplier = {
            ...formData,
            isActive: true,
            balance: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const savedSupplier = DB.add(CONSTANTS.STORAGE_KEYS.SUPPLIERS, newSupplier);
        
        if (savedSupplier) {
            // إغلاق النموذج
            bootstrap.Modal.getInstance(document.getElementById('addSupplierModal')).hide();
            document.getElementById('add-supplier-form').reset();
            
            UTILS.showNotification('تم إضافة المورد بنجاح', 'success');
            
            // إعادة تحميل البيانات
            this.loadSuppliers();
            
            // تحديث قوائم الموردين في الأقسام الأخرى
            this.updateSuppliersDropdowns();
        } else {
            UTILS.showNotification('خطأ في حفظ المورد', 'error');
        }
    },
    
    getSupplierFormData: function() {
        return {
            name: document.getElementById('supplierName').value,
            type: document.getElementById('supplierType').value,
            contact: document.getElementById('supplierContact').value,
            position: document.getElementById('supplierPosition').value,
            phone: document.getElementById('supplierPhone').value,
            phone2: document.getElementById('supplierPhone2').value,
            email: document.getElementById('supplierEmail').value,
            address: document.getElementById('supplierAddress').value,
            products: document.getElementById('supplierProducts').value,
            accountNumber: document.getElementById('supplierAccount').value,
            taxNumber: document.getElementById('supplierTax').value,
            notes: document.getElementById('supplierNotes').value,
            paymentTerms: document.getElementById('supplierPaymentTerms').value
        };
    },
    
    validateSupplierForm: function(formData) {
        if (!formData.name) {
            UTILS.showNotification('يرجى إدخال اسم المورد', 'error');
            return false;
        }
        
        if (formData.email && !UTILS.isValidEmail(formData.email)) {
            UTILS.showNotification('يرجى إدخال بريد إلكتروني صحيح', 'error');
            return false;
        }
        
        return true;
    },
    
    editSupplier: function(supplierId) {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const supplier = suppliers.find(s => s.id === supplierId);
        
        if (!supplier) {
            UTILS.showNotification('المورد غير موجود', 'error');
            return;
        }
        
        // تعبئة النموذج
        document.getElementById('editSupplierId').value = supplier.id;
        document.getElementById('editSupplierName').value = supplier.name;
        document.getElementById('editSupplierType').value = supplier.type || '';
        document.getElementById('editSupplierContact').value = supplier.contact || '';
        document.getElementById('editSupplierPosition').value = supplier.position || '';
        document.getElementById('editSupplierPhone').value = supplier.phone || '';
        document.getElementById('editSupplierPhone2').value = supplier.phone2 || '';
        document.getElementById('editSupplierEmail').value = supplier.email || '';
        document.getElementById('editSupplierAddress').value = supplier.address || '';
        document.getElementById('editSupplierProducts').value = supplier.products || '';
        document.getElementById('editSupplierAccount').value = supplier.accountNumber || '';
        document.getElementById('editSupplierTax').value = supplier.taxNumber || '';
        document.getElementById('editSupplierNotes').value = supplier.notes || '';
        document.getElementById('editSupplierPaymentTerms').value = supplier.paymentTerms || '';
        
        // فتح النموذج
        const editModal = new bootstrap.Modal(document.getElementById('editSupplierModal'));
        editModal.show();
    },
    
    updateSupplier: function() {
        const supplierId = document.getElementById('editSupplierId').value;
        const formData = this.getEditSupplierFormData();
        
        if (!this.validateSupplierForm(formData)) {
            return;
        }
        
        const updates = {
            ...formData,
            updatedAt: new Date().toISOString()
        };
        
        const updatedSupplier = DB.update(CONSTANTS.STORAGE_KEYS.SUPPLIERS, supplierId, updates);
        
        if (updatedSupplier) {
            bootstrap.Modal.getInstance(document.getElementById('editSupplierModal')).hide();
            UTILS.showNotification('تم تحديث المورد بنجاح', 'success');
            
            this.loadSuppliers();
            this.updateSuppliersDropdowns();
        } else {
            UTILS.showNotification('خطأ في تحديث المورد', 'error');
        }
    },
    
    getEditSupplierFormData: function() {
        return {
            name: document.getElementById('editSupplierName').value,
            type: document.getElementById('editSupplierType').value,
            contact: document.getElementById('editSupplierContact').value,
            position: document.getElementById('editSupplierPosition').value,
            phone: document.getElementById('editSupplierPhone').value,
            phone2: document.getElementById('editSupplierPhone2').value,
            email: document.getElementById('editSupplierEmail').value,
            address: document.getElementById('editSupplierAddress').value,
            products: document.getElementById('editSupplierProducts').value,
            accountNumber: document.getElementById('editSupplierAccount').value,
            taxNumber: document.getElementById('editSupplierTax').value,
            notes: document.getElementById('editSupplierNotes').value,
            paymentTerms: document.getElementById('editSupplierPaymentTerms').value
        };
    },
    
    viewSupplier: function(supplierId) {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const supplier = suppliers.find(s => s.id === supplierId);
        
        if (!supplier) {
            UTILS.showNotification('المورد غير موجود', 'error');
            return;
        }
        
        this.showSupplierDetailsModal(supplier);
    },
    
    showSupplierDetailsModal: function(supplier) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">تفاصيل المورد</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h4>${supplier.name}</h4>
                                ${supplier.type ? `<span class="badge bg-secondary">${this.getSupplierTypeLabel(supplier.type)}</span>` : ''}
                                
                                <div class="mt-4">
                                    <h6>معلومات الاتصال:</h6>
                                    <table class="table table-sm">
                                        <tbody>
                                            ${supplier.contact ? `
                                                <tr>
                                                    <th>جهة الاتصال:</th>
                                                    <td>${supplier.contact}</td>
                                                </tr>
                                            ` : ''}
                                            ${supplier.position ? `
                                                <tr>
                                                    <th>المنصب:</th>
                                                    <td>${supplier.position}</td>
                                                </tr>
                                            ` : ''}
                                            ${supplier.phone ? `
                                                <tr>
                                                    <th>الهاتف:</th>
                                                    <td>
                                                        <a href="tel:${supplier.phone}" class="text-decoration-none">${supplier.phone}</a>
                                                        ${supplier.phone2 ? `<br><small>${supplier.phone2}</small>` : ''}
                                                    </td>
                                                </tr>
                                            ` : ''}
                                            ${supplier.email ? `
                                                <tr>
                                                    <th>البريد الإلكتروني:</th>
                                                    <td><a href="mailto:${supplier.email}">${supplier.email}</a></td>
                                                </tr>
                                            ` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div class="col-md-6">
                                <div class="supplier-balance-card text-center p-3 rounded ${(supplier.balance || 0) > 0 ? 'bg-warning' : 'bg-success'} text-white">
                                    <h5>الرصيد الحالي</h5>
                                    <h3>${UTILS.formatCurrency(supplier.balance || 0)}</h3>
                                    ${(supplier.balance || 0) > 0 ? '<p class="mb-0">هناك مبلغ مستحق</p>' : '<p class="mb-0">لا يوجد رصيد مستحق</p>'}
                                </div>
                                
                                <div class="mt-3">
                                    <h6>معلومات إضافية:</h6>
                                    <table class="table table-sm">
                                        <tbody>
                                            ${supplier.address ? `
                                                <tr>
                                                    <th>العنوان:</th>
                                                    <td>${supplier.address}</td>
                                                </tr>
                                            ` : ''}
                                            ${supplier.accountNumber ? `
                                                <tr>
                                                    <th>رقم الحساب:</th>
                                                    <td>${supplier.accountNumber}</td>
                                                </tr>
                                            ` : ''}
                                            ${supplier.taxNumber ? `
                                                <tr>
                                                    <th>الرقم الضريبي:</th>
                                                    <td>${supplier.taxNumber}</td>
                                                </tr>
                                            ` : ''}
                                            ${supplier.paymentTerms ? `
                                                <tr>
                                                    <th>شروط الدفع:</th>
                                                    <td>${supplier.paymentTerms}</td>
                                                </tr>
                                            ` : ''}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                        
                        ${supplier.products ? `
                            <div class="row mt-4">
                                <div class="col-12">
                                    <h6>المنتجات الموردة:</h6>
                                    <div class="products-list bg-light p-2 rounded">
                                        ${supplier.products}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        ${supplier.notes ? `
                            <div class="row mt-3">
                                <div class="col-12">
                                    <h6>ملاحظات:</h6>
                                    <div class="notes-container bg-light p-2 rounded">
                                        ${supplier.notes}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        <button type="button" class="btn btn-primary" onclick="SUPPLIERS.editSupplier('${supplier.id}')">تعديل</button>
                        ${(supplier.balance || 0) > 0 ? `
                            <button type="button" class="btn btn-success" onclick="SUPPLIERS.openPaymentModal('${supplier.id}')">تسديد</button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    },
    
    toggleSupplierStatus: function(supplierId) {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const supplierIndex = suppliers.findIndex(s => s.id === supplierId);
        
        if (supplierIndex === -1) {
            UTILS.showNotification('المورد غير موجود', 'error');
            return;
        }
        
        const newStatus = suppliers[supplierIndex].isActive === false;
        suppliers[supplierIndex].isActive = newStatus;
        suppliers[supplierIndex].updatedAt = new Date().toISOString();
        
        DB.set(CONSTANTS.STORAGE_KEYS.SUPPLIERS, suppliers);
        
        UTILS.showNotification(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المورد بنجاح`, 'success');
        this.loadSuppliers();
    },
    
    deleteSupplier: function(supplierId) {
        if (!confirm('هل أنت متأكد من حذف هذا المورد؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }
        
        // التحقق من وجود المورد في المشتريات
        const purchases = DB.get(CONSTANTS.STORAGE_KEYS.PURCHASES);
        const supplierInPurchases = purchases.some(purchase => purchase.supplierId === supplierId);
        
        if (supplierInPurchases) {
            if (!confirm('هذا المورد موجود في سجلات المشتريات. هل تريد الاستمرار في الحذف؟')) {
                return;
            }
        }
        
        const success = DB.remove(CONSTANTS.STORAGE_KEYS.SUPPLIERS, supplierId);
        
        if (success) {
            UTILS.showNotification('تم حذف المورد بنجاح', 'success');
            this.loadSuppliers();
            this.updateSuppliersDropdowns();
        } else {
            UTILS.showNotification('خطأ في حذف المورد', 'error');
        }
    },
    
    updateSuppliersDropdowns: function() {
        // تحديث قوائم الموردين في النماذج الأخرى
        if (typeof PRODUCTS !== 'undefined' && typeof PRODUCTS.loadSuppliersDropdown === 'function') {
            PRODUCTS.loadSuppliersDropdown();
        }
    },
    
    loadPurchases: function() {
        const purchases = DB.get(CONSTANTS.STORAGE_KEYS.PURCHASES);
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        
        this.renderPurchasesTable(purchases, suppliers);
    },
    
    renderPurchasesTable: function(purchases, suppliers) {
        const tableBody = document.querySelector('#purchases-table tbody');
        tableBody.innerHTML = '';
        
        if (purchases.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5 text-muted">
                        <i class="bi bi-cart display-4 d-block mb-2"></i>
                        لا توجد مشتريات مسجلة
                    </td>
                </tr>
            `;
            return;
        }
        
        // ترتيب المشتريات من الأحدث إلى الأقدم
        const sortedPurchases = purchases.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
        
        sortedPurchases.forEach(purchase => {
            const supplier = suppliers.find(s => s.id === purchase.supplierId);
            const supplierName = supplier ? supplier.name : 'مورد غير معروف';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${purchase.invoiceNumber}</td>
                <td>${UTILS.formatDate(purchase.date)}</td>
                <td>${supplierName}</td>
                <td>${purchase.items.length} منتج</td>
                <td class="fw-bold">${UTILS.formatCurrency(purchase.total)}</td>
                <td>
                    <button class="btn btn-sm btn-info view-purchase-btn" data-id="${purchase.invoiceNumber}" title="عرض التفاصيل">
                        <i class="bi bi-eye"></i>
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
        
        // إضافة معالجات الأحداث
        this.addPurchasesTableEventHandlers();
    },
    
    addPurchasesTableEventHandlers: function() {
        document.querySelectorAll('.view-purchase-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const invoiceNumber = e.currentTarget.getAttribute('data-id');
                this.viewPurchase(invoiceNumber);
            });
        });
    },
    
    viewPurchase: function(invoiceNumber) {
        const purchases = DB.get(CONSTANTS.STORAGE_KEYS.PURCHASES);
        const purchase = purchases.find(p => p.invoiceNumber === invoiceNumber);
        
        if (!purchase) {
            UTILS.showNotification('الفاتورة غير موجودة', 'error');
            return;
        }
        
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const supplier = suppliers.find(s => s.id === purchase.supplierId);
        
        this.showPurchaseDetailsModal(purchase, supplier);
    },
    
    showPurchaseDetailsModal: function(purchase, supplier) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">تفاصيل فاتورة الشراء</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row mb-4">
                            <div class="col-md-6">
                                <strong>رقم الفاتورة:</strong> ${purchase.invoiceNumber}<br>
                                <strong>التاريخ:</strong> ${UTILS.formatDate(purchase.date)}<br>
                                <strong>المورد:</strong> ${supplier ? supplier.name : 'غير معروف'}
                            </div>
                            <div class="col-md-6 text-end">
                                <strong>الإجمالي:</strong> ${UTILS.formatCurrency(purchase.total)}<br>
                                <strong>الحالة:</strong> <span class="badge bg-success">مكتمل</span>
                            </div>
                        </div>
                        
                        <h6>المنتجات المشتراة:</h6>
                        <div class="table-responsive">
                            <table class="table table-bordered">
                                <thead>
                                    <tr>
                                        <th>المنتج</th>
                                        <th>الكمية</th>
                                        <th>سعر الشراء</th>
                                        <th>الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${purchase.items.map(item => `
                                        <tr>
                                            <td>${item.name}</td>
                                            <td>${item.quantity}</td>
                                            <td>${UTILS.formatCurrency(item.price)}</td>
                                            <td>${UTILS.formatCurrency(item.total)}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        
                        ${purchase.notes ? `
                            <div class="mt-3">
                                <strong>ملاحظات:</strong>
                                <p class="bg-light p-2 rounded">${purchase.notes}</p>
                            </div>
                        ` : ''}
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        <button type="button" class="btn btn-primary" onclick="window.print()">طباعة</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    },
    
    importSuppliers: function() {
        UTILS.showNotification('ميزة الاستيراد قيد التطوير', 'info');
    },
    
    exportSuppliers: function() {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const exportData = suppliers.map(supplier => ({
            name: supplier.name,
            type: supplier.type,
            contact: supplier.contact,
            phone: supplier.phone,
            email: supplier.email,
            address: supplier.address,
            products: supplier.products,
            balance: supplier.balance
        }));
        
        const exportStr = JSON.stringify(exportData, null, 2);
        const fileName = `موردين-${new Date().toISOString().split('T')[0]}.json`;
        
        UTILS.downloadFile(exportStr, fileName, 'application/json');
        UTILS.showNotification('تم تصدير بيانات الموردين بنجاح', 'success');
    },
    
    openPaymentModal: function(supplierId) {
        UTILS.showNotification('ميزة التسديد قيد التطوير', 'info');
    },
    
    // دالة للبحث السريع عن مورد
    quickSearchSupplier: function(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        this.currentPage = 1;
        this.currentFilter = 'all';
        this.loadSuppliers();
    },
    
    // دالة للحصول على مورد بالاسم
    getSupplierByName: function(name) {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        return suppliers.find(supplier => 
            supplier.name.toLowerCase() === name.toLowerCase() && supplier.isActive !== false
        );
    },
    
    // دالة لتحديث رصيد المورد
    updateSupplierBalance: function(supplierId, amount) {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const supplierIndex = suppliers.findIndex(s => s.id === supplierId);
        
        if (supplierIndex === -1) return false;
        
        suppliers[supplierIndex].balance = (suppliers[supplierIndex].balance || 0) + amount;
        suppliers[supplierIndex].updatedAt = new Date().toISOString();
        
        return DB.set(CONSTANTS.STORAGE_KEYS.SUPPLIERS, suppliers);
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.SUPPLIERS = SUPPLIERS;
