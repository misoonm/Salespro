// إدارة المنتجات
const PRODUCTS = {
    currentPage: 1,
    pageSize: 10,
    currentSort: { field: 'name', direction: 'asc' },
    currentFilter: 'all',
    searchTerm: '',
    
    init: function() {
        this.setupEventHandlers();
        this.loadProducts();
        this.loadSuppliersDropdown();
    },
    
    setupEventHandlers: function() {
        // البحث عن المنتجات
        document.getElementById('product-search').addEventListener('input', 
            UTILS.debounce(this.searchProducts.bind(this), 300)
        );
        
        // إضافة منتج جديد
        document.getElementById('save-product-btn').addEventListener('click', this.saveProduct.bind(this));
        
        // تحديث منتج
        document.getElementById('update-product-btn').addEventListener('click', this.updateProduct.bind(this));
        
        // تصفية المنتجات
        document.getElementById('product-filter').addEventListener('change', (e) => {
            this.currentFilter = e.target.value;
            this.loadProducts();
        });
        
        // ترتيب المنتجات
        document.querySelectorAll('.sort-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const field = e.currentTarget.getAttribute('data-sort');
                this.sortProducts(field);
            });
        });
        
        // استيراد المنتجات
        document.getElementById('import-products-btn').addEventListener('click', this.importProducts.bind(this));
        
        // تصدير المنتجات
        document.getElementById('export-products-btn').addEventListener('click', this.exportProducts.bind(this));
        
        // معالجة تحميل الصورة
        document.getElementById('productImage').addEventListener('change', this.handleImageUpload.bind(this));
        document.getElementById('editProductImage').addEventListener('change', this.handleEditImageUpload.bind(this));
    },
    
    loadProducts: function() {
        let products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        
        // التصفية
        products = this.filterProducts(products);
        
        // البحث
        if (this.searchTerm) {
            products = this.searchProductsData(products, this.searchTerm);
        }
        
        // الترتيب
        products = this.sortProductsData(products, this.currentSort.field, this.currentSort.direction);
        
        // عرض المنتجات
        this.renderProductsTable(products);
        
        // تحديث إحصائيات التصفية
        this.updateFilterStats(products);
    },
    
    filterProducts: function(products) {
        switch(this.currentFilter) {
            case 'low-stock':
                return products.filter(product => {
                    const minQuantity = product.minQuantity || 10;
                    return product.quantity > 0 && product.quantity <= minQuantity;
                });
            case 'out-of-stock':
                return products.filter(product => product.quantity === 0);
            case 'expiring':
                return products.filter(product => 
                    product.expiryDate && UTILS.isExpiringSoon(product.expiryDate, 30)
                );
            case 'inactive':
                return products.filter(product => product.isActive === false);
            default:
                return products;
        }
    },
    
    searchProductsData: function(products, searchTerm) {
        return products.filter(product => 
            product.name.toLowerCase().includes(searchTerm) || 
            product.category.toLowerCase().includes(searchTerm) ||
            (product.barcode && product.barcode.includes(searchTerm)) ||
            (product.description && product.description.toLowerCase().includes(searchTerm))
        );
    },
    
    sortProductsData: function(products, field, direction = 'asc') {
        return products.sort((a, b) => {
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
    
    renderProductsTable: function(products) {
        const tableBody = document.querySelector('#products-table tbody');
        tableBody.innerHTML = '';
        
        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-5 text-muted">
                        <i class="bi bi-box display-4 d-block mb-2"></i>
                        ${this.searchTerm ? 'لا توجد منتجات تطابق البحث' : 'لا توجد منتجات'}
                    </td>
                </tr>
            `;
            return;
        }
        
        // التقسيم إلى صفحات
        const paginatedProducts = this.paginate(products, this.currentPage, this.pageSize);
        
        paginatedProducts.data.forEach(product => {
            const row = document.createElement('tr');
            row.className = product.isActive === false ? 'table-secondary' : '';
            
            row.innerHTML = `
                <td>
                    ${product.image ? `
                        <img src="${product.image}" class="product-image" alt="${product.name}" 
                             onerror="this.src='https://via.placeholder.com/50?text=صورة'" 
                             data-bs-toggle="tooltip" data-bs-title="${product.name}">
                    ` : `
                        <div class="product-image-placeholder bg-secondary rounded d-flex align-items-center justify-content-center"
                             data-bs-toggle="tooltip" data-bs-title="${product.name}">
                            <i class="bi bi-box text-white"></i>
                        </div>
                    `}
                </td>
                <td>
                    <span class="product-id">${product.id}</span>
                    ${product.barcode ? `<br><small class="text-muted">${product.barcode}</small>` : ''}
                </td>
                <td>
                    <div class="product-name">${product.name}</div>
                    ${product.description ? `<small class="text-muted">${product.description.substring(0, 50)}...</small>` : ''}
                </td>
                <td>
                    <span class="badge bg-primary">${product.category}</span>
                </td>
                <td>${UTILS.formatDate(product.supplyDate)}</td>
                <td class="text-nowrap">
                    <div class="fw-bold">${UTILS.formatCurrency(product.price)}</div>
                    ${product.cost ? `<small class="text-muted">التكلفة: ${UTILS.formatCurrency(product.cost)}</small>` : ''}
                </td>
                <td>
                    <div class="d-flex align-items-center">
                        <span class="quantity-badge ${this.getQuantityBadgeClass(product.quantity, product.minQuantity)} me-2">
                            ${product.quantity}
                        </span>
                        ${product.expiryDate ? `
                            <span class="badge bg-${UTILS.isExpiringSoon(product.expiryDate, 7) ? 'danger' : 'warning'} ms-2"
                                  data-bs-toggle="tooltip" data-bs-title="ينتهي في ${UTILS.formatDate(product.expiryDate)}">
                                <i class="bi bi-clock"></i>
                            </span>
                        ` : ''}
                    </div>
                </td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-primary edit-product-btn" data-id="${product.id}" title="تعديل">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-info view-product-btn" data-id="${product.id}" title="عرض">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-${product.isActive === false ? 'success' : 'warning'} toggle-product-btn" 
                                data-id="${product.id}" title="${product.isActive === false ? 'تفعيل' : 'تعطيل'}">
                            <i class="bi bi-${product.isActive === false ? 'check' : 'x'}"></i>
                        </button>
                        <button class="btn btn-danger delete-product-btn" data-id="${product.id}" title="حذف">
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
        this.updatePagination(paginatedProducts.pagination);
        
        // تهيئة أدوات التلميح
        this.initTooltips();
    },
    
    getQuantityBadgeClass: function(quantity, minQuantity = 10) {
        if (quantity === 0) return 'bg-danger';
        if (quantity <= minQuantity) return 'bg-warning';
        return 'bg-success';
    },
    
    addTableEventHandlers: function() {
        // زر التعديل
        document.querySelectorAll('.edit-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                this.editProduct(productId);
            });
        });
        
        // زر العرض
        document.querySelectorAll('.view-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                this.viewProduct(productId);
            });
        });
        
        // زر التفعيل/التعطيل
        document.querySelectorAll('.toggle-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                this.toggleProductStatus(productId);
            });
        });
        
        // زر الحذف
        document.querySelectorAll('.delete-product-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productId = e.currentTarget.getAttribute('data-id');
                this.deleteProduct(productId);
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
        const paginationElement = document.getElementById('products-pagination');
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
                    this.loadProducts();
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
    
    updateFilterStats: function(filteredProducts) {
        const allProducts = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        
        const statsElement = document.getElementById('products-stats');
        if (statsElement) {
            statsElement.innerHTML = `
                <div class="row">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-boxes"></i>
                            <span>${allProducts.length} منتج</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-filter"></i>
                            <span>${filteredProducts.length} نتيجة</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-currency-exchange"></i>
                            <span>${UTILS.formatCurrency(this.calculateTotalValue(allProducts))}</span>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <i class="bi bi-exclamation-triangle"></i>
                            <span>${this.getLowStockCount(allProducts)} منخفض</span>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    
    calculateTotalValue: function(products) {
        return products.reduce((total, product) => {
            return total + (product.price * product.quantity);
        }, 0);
    },
    
    getLowStockCount: function(products) {
        return products.filter(product => {
            const minQuantity = product.minQuantity || 10;
            return product.quantity > 0 && product.quantity <= minQuantity;
        }).length;
    },
    
    searchProducts: function() {
        this.searchTerm = document.getElementById('product-search').value.toLowerCase();
        this.currentPage = 1;
        this.loadProducts();
    },
    
    sortProducts: function(field) {
        if (this.currentSort.field === field) {
            this.currentSort.direction = this.currentSort.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSort.field = field;
            this.currentSort.direction = 'asc';
        }
        
        this.loadProducts();
    },
    
    loadSuppliersDropdown: function() {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const supplierDropdowns = [
            document.getElementById('productSupplier'),
            document.getElementById('editProductSupplier')
        ];
        
        supplierDropdowns.forEach(dropdown => {
            if (dropdown) {
                // حفظ القيمة المحددة حالياً
                const currentValue = dropdown.value;
                
                // مسح الخيارات الحالية (مع الاحتفاظ على الخيار الأول)
                while (dropdown.options.length > 1) {
                    dropdown.remove(1);
                }
                
                // إضافة الموردين
                suppliers.forEach(supplier => {
                    const option = document.createElement('option');
                    option.value = supplier.id;
                    option.textContent = supplier.name;
                    dropdown.appendChild(option);
                });
                
                // استعادة القيمة المحددة إن أمكن
                if (currentValue && dropdown.querySelector(`option[value="${currentValue}"]`)) {
                    dropdown.value = currentValue;
                }
            }
        });
    },
    
    saveProduct: function() {
        const formData = this.getProductFormData('add');
        
        if (!this.validateProductForm(formData)) {
            return;
        }
        
        // معالجة صورة المنتج إذا تم تحميلها
        const imageFile = document.getElementById('productImage').files[0];
        
        if (imageFile) {
            UTILS.readImageAsBase64(imageFile)
                .then(imageData => {
                    formData.image = imageData;
                    this.completeSaveProduct(formData);
                })
                .catch(error => {
                    UTILS.showNotification('خطأ في تحميل الصورة: ' + error.message, 'error');
                });
        } else {
            this.completeSaveProduct(formData);
        }
    },
    
    getProductFormData: function(formType) {
        const prefix = formType === 'add' ? '' : 'edit';
        
        return {
            name: document.getElementById(`${prefix}ProductName`).value,
            barcode: document.getElementById(`${prefix}ProductBarcode`).value,
            category: document.getElementById(`${prefix}ProductCategory`).value,
            price: parseFloat(document.getElementById(`${prefix}ProductPrice`).value),
            cost: parseFloat(document.getElementById(`${prefix}ProductCost`).value) || 0,
            quantity: parseInt(document.getElementById(`${prefix}ProductQuantity`).value),
            supplierId: document.getElementById(`${prefix}ProductSupplier`).value || null,
            expiryDate: document.getElementById(`${prefix}ProductExpiry`).value || null,
            description: document.getElementById(`${prefix}ProductDescription`).value,
            minQuantity: parseInt(document.getElementById(`${prefix}ProductMinQuantity`)?.value) || 10
        };
    },
    
    validateProductForm: function(formData) {
        if (!formData.name || !formData.category) {
            UTILS.showNotification('يرجى ملء الحقول الإلزامية (الاسم والفئة)', 'error');
            return false;
        }
        
        if (isNaN(formData.price) || formData.price < 0) {
            UTILS.showNotification('يرجى إدخال سعر صحيح', 'error');
            return false;
        }
        
        if (isNaN(formData.quantity) || formData.quantity < 0) {
            UTILS.showNotification('يرجى إدخال كمية صحيحة', 'error');
            return false;
        }
        
        return true;
    },
    
    completeSaveProduct: function(productData) {
        const newProduct = {
            ...productData,
            supplyDate: new Date().toISOString().split('T')[0],
            isActive: true,
            createdAt: new Date().toISOString()
        };
        
        const savedProduct = DB.add(CONSTANTS.STORAGE_KEYS.PRODUCTS, newProduct);
        
        if (savedProduct) {
            // إغلاق النموذج
            bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
            document.getElementById('add-product-form').reset();
            
            UTILS.showNotification('تم إضافة المنتج بنجاح', 'success');
            
            // إعادة تحميل البيانات
            this.loadProducts();
            
            // تحديث لوحة التحكم إذا كانت موجودة
            if (typeof DASHBOARD !== 'undefined' && typeof DASHBOARD.loadData === 'function') {
                DASHBOARD.loadData();
            }
            
            // تحديث نقطة البيع إذا كانت موجودة
            if (typeof POS !== 'undefined' && typeof POS.loadAvailableProducts === 'function') {
                POS.loadAvailableProducts();
            }
        } else {
            UTILS.showNotification('خطأ في حفظ المنتج', 'error');
        }
    },
    
    editProduct: function(productId) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            UTILS.showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        // تعبئة النموذج
        document.getElementById('editProductId').value = product.id;
        document.getElementById('editProductName').value = product.name;
        document.getElementById('editProductBarcode').value = product.barcode || '';
        document.getElementById('editProductCategory').value = product.category;
        document.getElementById('editProductPrice').value = product.price;
        document.getElementById('editProductCost').value = product.cost || '';
        document.getElementById('editProductQuantity').value = product.quantity;
        document.getElementById('editProductSupplier').value = product.supplierId || '';
        document.getElementById('editProductExpiry').value = product.expiryDate || '';
        document.getElementById('editProductDescription').value = product.description || '';
        
        // حقل الكمية الدنيا إذا كان موجوداً
        const minQuantityInput = document.getElementById('editProductMinQuantity');
        if (minQuantityInput) {
            minQuantityInput.value = product.minQuantity || 10;
        }
        
        // عرض الصورة الحالية
        const imageContainer = document.getElementById('current-image-container');
        imageContainer.innerHTML = '';
        
        if (product.image) {
            const img = document.createElement('img');
            img.src = product.image;
            img.className = 'product-image-preview img-thumbnail';
            img.style.maxWidth = '200px';
            img.onerror = function() {
                this.style.display = 'none';
            };
            imageContainer.appendChild(img);
        }
        
        // فتح النموذج
        const editModal = new bootstrap.Modal(document.getElementById('editProductModal'));
        editModal.show();
    },
    
    updateProduct: function() {
        const productId = document.getElementById('editProductId').value;
        const formData = this.getProductFormData('edit');
        
        if (!this.validateProductForm(formData)) {
            return;
        }
        
        const imageFile = document.getElementById('editProductImage').files[0];
        
        const updateProduct = (imageData = null) => {
            const updates = {
                ...formData,
                updatedAt: new Date().toISOString()
            };
            
            if (imageData !== null) {
                updates.image = imageData;
            }
            
            const updatedProduct = DB.update(CONSTANTS.STORAGE_KEYS.PRODUCTS, productId, updates);
            
            if (updatedProduct) {
                bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
                UTILS.showNotification('تم تحديث المنتج بنجاح', 'success');
                
                this.loadProducts();
                
                // تحديث لوحة التحكم ونقطة البيع
                if (typeof DASHBOARD !== 'undefined') DASHBOARD.loadData();
                if (typeof POS !== 'undefined') POS.loadAvailableProducts();
            } else {
                UTILS.showNotification('خطأ في تحديث المنتج', 'error');
            }
        };
        
        if (imageFile) {
            UTILS.readImageAsBase64(imageFile)
                .then(imageData => {
                    updateProduct(imageData);
                })
                .catch(error => {
                    UTILS.showNotification('خطأ في تحميل الصورة', 'error');
                });
        } else {
            updateProduct();
        }
    },
    
    viewProduct: function(productId) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            UTILS.showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        this.showProductDetailsModal(product);
    },
    
    showProductDetailsModal: function(product) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header bg-primary text-white">
                        <h5 class="modal-title">تفاصيل المنتج</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="row">
                            <div class="col-md-4">
                                ${product.image ? `
                                    <img src="${product.image}" class="img-fluid rounded" alt="${product.name}"
                                         onerror="this.src='https://via.placeholder.com/300?text=صورة+غير+متوفرة'">
                                ` : `
                                    <div class="bg-secondary rounded d-flex align-items-center justify-content-center" 
                                         style="height: 200px;">
                                        <i class="bi bi-box text-white" style="font-size: 3rem;"></i>
                                    </div>
                                `}
                            </div>
                            <div class="col-md-8">
                                <h4>${product.name}</h4>
                                <p class="text-muted">${product.description || 'لا يوجد وصف'}</p>
                                
                                <div class="row mt-4">
                                    <div class="col-6">
                                        <strong>رقم المنتج:</strong><br>
                                        <span class="text-muted">${product.id}</span>
                                    </div>
                                    <div class="col-6">
                                        <strong>الباركود:</strong><br>
                                        <span class="text-muted">${product.barcode || 'غير متوفر'}</span>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-6">
                                        <strong>الفئة:</strong><br>
                                        <span class="badge bg-primary">${product.category}</span>
                                    </div>
                                    <div class="col-6">
                                        <strong>الحالة:</strong><br>
                                        <span class="badge bg-${product.isActive === false ? 'secondary' : 'success'}">
                                            ${product.isActive === false ? 'غير نشط' : 'نشط'}
                                        </span>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-6">
                                        <strong>السعر:</strong><br>
                                        <span class="text-success fw-bold">${UTILS.formatCurrency(product.price)}</span>
                                    </div>
                                    <div class="col-6">
                                        <strong>التكلفة:</strong><br>
                                        <span class="text-muted">${product.cost ? UTILS.formatCurrency(product.cost) : 'غير محددة'}</span>
                                    </div>
                                </div>
                                
                                <div class="row mt-3">
                                    <div class="col-6">
                                        <strong>المخزون:</strong><br>
                                        <span class="badge ${this.getQuantityBadgeClass(product.quantity, product.minQuantity)}">
                                            ${product.quantity} وحدة
                                        </span>
                                    </div>
                                    <div class="col-6">
                                        <strong>أقل كمية:</strong><br>
                                        <span class="text-muted">${product.minQuantity || 10} وحدة</span>
                                    </div>
                                </div>
                                
                                ${product.expiryDate ? `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <strong>تاريخ الانتهاء:</strong><br>
                                        <span class="text-${UTILS.isExpiringSoon(product.expiryDate, 7) ? 'danger' : 'warning'}">
                                            ${UTILS.formatDate(product.expiryDate)}
                                            ${UTILS.isExpiringSoon(product.expiryDate, 7) ? 
                                                ` (${UTILS.dateDifference(new Date(), product.expiryDate, 'days')} يوم متبقي)` : ''}
                                        </span>
                                    </div>
                                </div>
                                ` : ''}
                                
                                ${product.supplyDate ? `
                                <div class="row mt-3">
                                    <div class="col-12">
                                        <strong>تاريخ التوريد:</strong><br>
                                        <span class="text-muted">${UTILS.formatDate(product.supplyDate)}</span>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                        <button type="button" class="btn btn-primary" onclick="PRODUCTS.editProduct('${product.id}')">تعديل</button>
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
    
    toggleProductStatus: function(productId) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) {
            UTILS.showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        const newStatus = products[productIndex].isActive === false;
        products[productIndex].isActive = newStatus;
        products[productIndex].updatedAt = new Date().toISOString();
        
        DB.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
        
        UTILS.showNotification(`تم ${newStatus ? 'تفعيل' : 'تعطيل'} المنتج بنجاح`, 'success');
        this.loadProducts();
    },
    
    deleteProduct: function(productId) {
        if (!confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
            return;
        }
        
        // التحقق من وجود المنتج في المبيعات
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        const productInSales = sales.some(sale => 
            sale.items.some(item => item.productId === productId)
        );
        
        if (productInSales) {
            if (!confirm('هذا المنتج موجود في فواتير مبيعات سابقة. هل تريد الاستمرار في الحذف؟')) {
                return;
            }
        }
        
        const success = DB.remove(CONSTANTS.STORAGE_KEYS.PRODUCTS, productId);
        
        if (success) {
            UTILS.showNotification('تم حذف المنتج بنجاح', 'success');
            this.loadProducts();
            
            // تحديث لوحة التحكم ونقطة البيع
            if (typeof DASHBOARD !== 'undefined') DASHBOARD.loadData();
            if (typeof POS !== 'undefined') POS.loadAvailableProducts();
        } else {
            UTILS.showNotification('خطأ في حذف المنتج', 'error');
        }
    },
    
    handleImageUpload: function(e) {
        const file = e.target.files[0];
        if (file) {
            this.previewImage(file, 'image-preview');
        }
    },
    
    handleEditImageUpload: function(e) {
        const file = e.target.files[0];
        if (file) {
            this.previewImage(file, 'edit-image-preview');
        }
    },
    
    previewImage: function(file, previewId) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById(previewId);
            if (preview) {
                preview.innerHTML = `
                    <img src="${e.target.result}" class="img-thumbnail mt-2" 
                         style="max-width: 200px; max-height: 200px;">
                `;
            }
        };
        reader.readAsDataURL(file);
    },
    
    importProducts: function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json,.csv';
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processImportFile(file);
            }
        });
        fileInput.click();
    },
    
    processImportFile: function(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target.result;
                let products = [];
                
                if (file.name.endsWith('.json')) {
                    products = JSON.parse(content);
                } else if (file.name.endsWith('.csv')) {
                    products = this.parseCSV(content);
                }
                
                if (Array.isArray(products) && products.length > 0) {
                    this.confirmImport(products);
                } else {
                    UTILS.showNotification('صيغة الملف غير صحيحة', 'error');
                }
            } catch (error) {
                UTILS.showNotification('خطأ في قراءة الملف: ' + error.message, 'error');
            }
        };
        reader.readAsText(file);
    },
    
    parseCSV: function(csvContent) {
        // تنفيذ بسيط لتحليل CSV
        const lines = csvContent.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const products = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length === headers.length) {
                const product = {};
                headers.forEach((header, index) => {
                    product[header] = values[index];
                });
                products.push(product);
            }
        }
        
        return products;
    },
    
    confirmImport: function(products) {
        const modal = document.createElement('div');
        modal.className = 'modal fade';
        modal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-warning">
                        <h5 class="modal-title">تأكيد الاستيراد</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p>سيتم استيراد ${products.length} منتج. كيف تريد معالجة المنتجات المتكررة؟</p>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="importStrategy" id="replaceStrategy" value="replace" checked>
                            <label class="form-check-label" for="replaceStrategy">
                                استبدال المنتجات الموجودة
                            </label>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="radio" name="importStrategy" id="skipStrategy" value="skip">
                            <label class="form-check-label" for="skipStrategy">
                                تخطي المنتجات الموجودة
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إلغاء</button>
                        <button type="button" class="btn btn-primary" id="confirmImport">استيراد</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
        modal.addEventListener('shown.bs.modal', () => {
            document.getElementById('confirmImport').addEventListener('click', () => {
                const strategy = document.querySelector('input[name="importStrategy"]:checked').value;
                this.executeImport(products, strategy);
                bsModal.hide();
            });
        });
        
        modal.addEventListener('hidden.bs.modal', () => {
            modal.remove();
        });
    },
    
    executeImport: function(importedProducts, strategy) {
        const existingProducts = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        let newProducts = [...existingProducts];
        let added = 0;
        let updated = 0;
        let skipped = 0;
        
        importedProducts.forEach(importedProduct => {
            const existingIndex = existingProducts.findIndex(p => 
                p.id === importedProduct.id || p.barcode === importedProduct.barcode
            );
            
            if (existingIndex !== -1) {
                if (strategy === 'replace') {
                    newProducts[existingIndex] = {
                        ...newProducts[existingIndex],
                        ...importedProduct,
                        updatedAt: new Date().toISOString()
                    };
                    updated++;
                } else {
                    skipped++;
                }
            } else {
                newProducts.push({
                    ...importedProduct,
                    createdAt: new Date().toISOString(),
                    isActive: true
                });
                added++;
            }
        });
        
        DB.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, newProducts);
        
        UTILS.showNotification(
            `تم الاستيراد بنجاح: ${added} مضاف, ${updated} محدث, ${skipped} م跳过`,
            'success'
        );
        
        this.loadProducts();
    },
    
    exportProducts: function() {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const exportData = products.map(product => ({
            ...product,
            // إزالة الصورة لتجنب حجم الملف الكبير
            image: undefined
        }));
        
        const exportStr = JSON.stringify(exportData, null, 2);
        const fileName = `منتجات-${new Date().toISOString().split('T')[0]}.json`;
        
        UTILS.downloadFile(exportStr, fileName, 'application/json');
        UTILS.showNotification('تم تصدير المنتجات بنجاح', 'success');
    },
    
    // دالة للبحث السريع في المنتجات (للاستخدام من أقسام أخرى)
    quickSearch: function(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase();
        this.currentPage = 1;
        this.currentFilter = 'all';
        this.loadProducts();
        
        // التنقل إلى قسم المنتجات
        this.navigateToProductsSection();
    },
    
    navigateToProductsSection: function() {
        const productsSection = document.querySelector('[data-section="products-section"]');
        if (productsSection) {
            productsSection.click();
        }
    },
    
    // دالة للحصول على منتج بالباركود
    getProductByBarcode: function(barcode) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        return products.find(product => product.barcode === barcode);
    },
    
    // دالة لتحديث مخزون المنتج
    updateProductQuantity: function(productId, quantityChange) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const productIndex = products.findIndex(p => p.id === productId);
        
        if (productIndex === -1) return false;
        
        const newQuantity = products[productIndex].quantity + quantityChange;
        if (newQuantity < 0) return false;
        
        products[productIndex].quantity = newQuantity;
        products[productIndex].updatedAt = new Date().toISOString();
        
        return DB.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.PRODUCTS = PRODUCTS;
