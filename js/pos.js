// إدارة نقطة البيع
const POS = {
    cart: [],
    currentDiscount: { type: 'percent', value: 0, amount: 0 },
    scanner: null,
    
    init: function() {
        this.setupEventHandlers();
        this.loadAvailableProducts();
        this.updateCartDisplay();
        this.setupBarcodeScanner();
    },
    
    setupEventHandlers: function() {
        // البحث في المنتجات
        const searchInput = document.getElementById('pos-product-search');
        if (searchInput) {
            searchInput.addEventListener('input', 
                UTILS.debounce(this.searchProductsPOS.bind(this), 300)
            );
            
            // عند الضغط على Enter في البحث
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addFirstSearchResultToCart();
                }
            });
        }
        
        // مسح الباركود
        const barcodeBtn = document.getElementById('barcode-btn');
        if (barcodeBtn) {
            barcodeBtn.addEventListener('click', this.openBarcodeScanner.bind(this));
        }
        
        const closeScannerBtn = document.getElementById('close-scanner-btn');
        if (closeScannerBtn) {
            closeScannerBtn.addEventListener('click', this.closeBarcodeScanner.bind(this));
        }
        
        // إدارة السلة
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', this.clearCart.bind(this));
        }
        
        const completeSaleBtn = document.getElementById('complete-sale-btn');
        if (completeSaleBtn) {
            completeSaleBtn.addEventListener('click', this.completeSale.bind(this));
        }
        
        // الخصم
        const applyDiscountBtn = document.getElementById('apply-discount-btn');
        if (applyDiscountBtn) {
            applyDiscountBtn.addEventListener('click', this.applyDiscount.bind(this));
        }
        
        const discountType = document.getElementById('discount-type');
        if (discountType) {
            discountType.addEventListener('change', this.updateDiscountUI.bind(this));
        }
        
        const discountValue = document.getElementById('discount-value');
        if (discountValue) {
            discountValue.addEventListener('input', this.updateDiscountUI.bind(this));
        }
        
        // طريقة الدفع
        document.querySelectorAll('input[name="paymentMethod"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleCustomerSection(e.target.value === 'آجل');
            });
        });
        
        // إدارة الكميات في السلة
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('increase-btn')) {
                this.changeQuantity(e.target.closest('.cart-item'), 1);
            } else if (e.target.classList.contains('decrease-btn')) {
                this.changeQuantity(e.target.closest('.cart-item'), -1);
            } else if (e.target.classList.contains('remove-btn')) {
                this.removeFromCart(e.target.closest('.cart-item'));
            } else if (e.target.closest('.product-card')) {
                // إضافة المنتج عند النقر على البطاقة
                const productCard = e.target.closest('.product-card');
                if (!productCard.classList.contains('out-of-stock')) {
                    const productId = productCard.getAttribute('data-id');
                    this.addToCart(productId, 1);
                }
            } else if (e.target.closest('.search-result-item')) {
                // إضافة نتيجة البحث عند النقر عليها
                const resultItem = e.target.closest('.search-result-item');
                const productId = resultItem.getAttribute('data-id');
                this.addToCart(productId, 1);
                
                // مسح نتائج البحث وإعادة تعيين الحقل
                if (document.getElementById('pos-product-search')) {
                    document.getElementById('pos-product-search').value = '';
                }
                this.loadAvailableProducts();
            }
        });
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    },
    
    setupBarcodeScanner: function() {
        // تهيئة ماسح الباركود إذا كان متاحاً
        if (typeof ZXing !== 'undefined') {
            this.scanner = new ZXing.BrowserMultiFormatReader();
        }
    },
    
    loadAvailableProducts: function() {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        this.renderAvailableProducts(products.filter(p => p.isActive !== false));
    },
    
    renderAvailableProducts: function(products) {
        const availableProductsDiv = document.getElementById('available-products');
        if (!availableProductsDiv) return;
        
        availableProductsDiv.innerHTML = '';
        
        if (products.length === 0) {
            availableProductsDiv.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-box display-4 d-block mb-2"></i>
                    لا توجد منتجات متاحة
                </div>
            `;
            return;
        }
        
        // تجميع المنتجات حسب الفئة
        const productsByCategory = {};
        products.forEach(product => {
            if (!productsByCategory[product.category]) {
                productsByCategory[product.category] = [];
            }
            productsByCategory[product.category].push(product);
        });
        
        // عرض المنتجات حسب الفئة
        Object.keys(productsByCategory).sort().forEach(category => {
            const categorySection = document.createElement('div');
            categorySection.className = 'category-section mb-4';
            categorySection.innerHTML = `
                <h6 class="category-header bg-light p-2 rounded mb-2">
                    <i class="bi bi-tag me-2"></i>${category}
                </h6>
                <div class="category-products">
                    ${productsByCategory[category].map(product => this.createProductCard(product)).join('')}
                </div>
            `;
            availableProductsDiv.appendChild(categorySection);
        });
    },
    
    createProductCard: function(product) {
        const isOutOfStock = product.quantity === 0;
        const isLowStock = product.quantity > 0 && product.quantity <= (product.minQuantity || 10);
        
        return `
            <div class="product-card ${isOutOfStock ? 'out-of-stock' : ''}" 
                 data-id="${product.id}" 
                 data-barcode="${product.barcode || ''}">
                <div class="product-image-container">
                    ${product.image ? `
                        <img src="${product.image}" class="product-image" alt="${product.name}"
                             onerror="this.style.display='none'">
                    ` : `
                        <div class="product-image-placeholder">
                            <i class="bi bi-box"></i>
                        </div>
                    `}
                    ${isOutOfStock ? `
                        <div class="out-of-stock-overlay">
                            <i class="bi bi-x-circle"></i>
                        </div>
                    ` : ''}
                </div>
                <div class="product-info">
                    <h6 class="product-name">${product.name}</h6>
                    <div class="product-price">${UTILS.formatCurrency(product.price)}</div>
                    <div class="product-stock ${isLowStock ? 'text-warning' : 'text-muted'}">
                        ${isOutOfStock ? 'منتهي' : `${product.quantity} متوفر`}
                    </div>
                    ${product.barcode ? `
                        <div class="product-barcode">
                            <small class="text-muted">${product.barcode}</small>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    },
    
    searchProductsPOS: function() {
        const searchInput = document.getElementById('pos-product-search');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        
        if (!searchTerm.trim()) {
            this.loadAvailableProducts();
            return;
        }
        
        const filteredProducts = products.filter(product => 
            product.isActive !== false && (
                product.name.toLowerCase().includes(searchTerm) || 
                product.category.toLowerCase().includes(searchTerm) ||
                (product.barcode && product.barcode.includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            )
        );
        
        this.renderSearchResults(filteredProducts);
    },
    
    renderSearchResults: function(products) {
        const availableProductsDiv = document.getElementById('available-products');
        if (!availableProductsDiv) return;
        
        availableProductsDiv.innerHTML = '';
        
        if (products.length === 0) {
            availableProductsDiv.innerHTML = `
                <div class="text-center py-5 text-muted">
                    <i class="bi bi-search display-4 d-block mb-2"></i>
                    لا توجد نتائج للبحث
                </div>
            `;
            return;
        }
        
        // عرض نتائج البحث
        products.forEach(product => {
            const isOutOfStock = product.quantity === 0;
            
            const resultElement = document.createElement('div');
            resultElement.className = `search-result-item ${isOutOfStock ? 'out-of-stock' : ''}`;
            resultElement.setAttribute('data-id', product.id);
            resultElement.innerHTML = `
                <div class="d-flex justify-content-between align-items-center p-3 border-bottom">
                    <div>
                        <h6 class="mb-1">${product.name}</h6>
                        <small class="text-muted">${product.category} • ${UTILS.formatCurrency(product.price)}</small>
                    </div>
                    <div>
                        <span class="badge ${isOutOfStock ? 'bg-danger' : 'bg-success'}">
                            ${isOutOfStock ? 'منتهي' : `${product.quantity} متوفر`}
                        </span>
                    </div>
                </div>
            `;
            availableProductsDiv.appendChild(resultElement);
        });
    },
    
    addFirstSearchResultToCart: function() {
        const searchInput = document.getElementById('pos-product-search');
        if (!searchInput) return;
        
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm.trim()) return;
        
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const filteredProducts = products.filter(product => 
            product.isActive !== false && (
                product.name.toLowerCase().includes(searchTerm) || 
                product.category.toLowerCase().includes(searchTerm) ||
                (product.barcode && product.barcode.includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            )
        );
        
        if (filteredProducts.length > 0) {
            this.addToCart(filteredProducts[0].id, 1);
            searchInput.value = '';
            this.loadAvailableProducts();
        }
    },
    
    addToCart: function(productId, quantity = 1) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const product = products.find(p => p.id === productId);
        
        if (!product) {
            UTILS.showNotification('المنتج غير موجود', 'error');
            return;
        }
        
        if (product.quantity === 0) {
            UTILS.showNotification('المنتج غير متوفر في المخزون', 'warning');
            return;
        }
        
        const existingItemIndex = this.cart.findIndex(item => item.productId === productId);
        
        if (existingItemIndex !== -1) {
            // زيادة الكمية إذا كان المنتج موجوداً بالفعل
            const newQuantity = this.cart[existingItemIndex].quantity + quantity;
            
            if (newQuantity > product.quantity) {
                UTILS.showNotification(`لا يمكن إضافة أكثر من ${product.quantity} وحدة`, 'warning');
                return;
            }
            
            this.cart[existingItemIndex].quantity = newQuantity;
            this.cart[existingItemIndex].total = newQuantity * product.price;
        } else {
            // إضافة منتج جديد إلى السلة
            if (quantity > product.quantity) {
                UTILS.showNotification(`الكمية المتاحة: ${product.quantity} وحدة فقط`, 'warning');
                return;
            }
            
            this.cart.push({
                productId: product.id,
                name: product.name,
                price: product.price,
                quantity: quantity,
                total: quantity * product.price,
                maxQuantity: product.quantity
            });
        }
        
        this.updateCartDisplay();
        UTILS.showNotification(`تم إضافة ${product.name} إلى السلة`, 'success');
        
        // مسح حقل البحث بعد الإضافة الناجحة
        const searchInput = document.getElementById('pos-product-search');
        if (searchInput) {
            searchInput.value = '';
        }
        this.loadAvailableProducts();
    },
    
    removeFromCart: function(cartItemElement) {
        const productId = cartItemElement.getAttribute('data-id');
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.updateCartDisplay();
    },
    
    changeQuantity: function(cartItemElement, change) {
        const productId = cartItemElement.getAttribute('data-id');
        const cartItem = this.cart.find(item => item.productId === productId);
        
        if (!cartItem) return;
        
        const newQuantity = cartItem.quantity + change;
        
        if (newQuantity < 1) {
            this.removeFromCart(cartItemElement);
            return;
        }
        
        if (newQuantity > cartItem.maxQuantity) {
            UTILS.showNotification(`لا يمكن إضافة أكثر من ${cartItem.maxQuantity} وحدة`, 'warning');
            return;
        }
        
        cartItem.quantity = newQuantity;
        cartItem.total = newQuantity * cartItem.price;
        
        this.updateCartDisplay();
    },
    
    updateCartDisplay: function() {
        const cartItemsContainer = document.getElementById('cart-items');
        const emptyCartMessage = document.getElementById('empty-cart-message');
        const discountSection = document.getElementById('discount-section');
        const cartTotalElement = document.getElementById('cart-total');
        
        if (!cartItemsContainer || !emptyCartMessage || !discountSection || !cartTotalElement) return;
        
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = '';
            emptyCartMessage.style.display = 'block';
            discountSection.style.display = 'none';
            cartTotalElement.textContent = UTILS.formatCurrency(0);
            return;
        }
        
        emptyCartMessage.style.display = 'none';
        discountSection.style.display = 'block';
        
        // عرض عناصر السلة
        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-id="${item.productId}">
                <div class="cart-item-info">
                    <h6 class="mb-1">${item.name}</h6>
                    <small class="text-muted">${UTILS.formatCurrency(item.price)} للوحدة</small>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button class="btn btn-sm btn-outline-secondary decrease-btn">
                            <i class="bi bi-dash"></i>
                        </button>
                        <span class="quantity-display mx-2">${item.quantity}</span>
                        <button class="btn btn-sm btn-outline-secondary increase-btn">
                            <i class="bi bi-plus"></i>
                        </button>
                    </div>
                    <div class="price-display mx-3">
                        ${UTILS.formatCurrency(item.total)}
                    </div>
                    <button class="btn btn-sm btn-danger remove-btn">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        // تحديث الإجمالي
        this.updateCartTotal();
    },
    
    updateCartTotal: function() {
        const subtotal = this.cart.reduce((sum, item) => sum + item.total, 0);
        const discountAmount = this.calculateDiscountAmount(subtotal);
        const total = subtotal - discountAmount;
        
        const cartSubtotal = document.getElementById('cart-subtotal');
        const discountAmountElement = document.getElementById('discount-amount');
        const cartTotalElement = document.getElementById('cart-total');
        
        if (cartSubtotal) cartSubtotal.textContent = UTILS.formatCurrency(subtotal);
        if (discountAmountElement) discountAmountElement.textContent = UTILS.formatCurrency(discountAmount);
        if (cartTotalElement) cartTotalElement.textContent = UTILS.formatCurrency(total);
        
        // حفظ الإجمالي للاستخدام لاحقاً
        this.cartTotal = total;
        this.cartSubtotal = subtotal;
    },
    
    applyDiscount: function() {
        const discountType = document.getElementById('discount-type');
        const discountValue = document.getElementById('discount-value');
        
        if (!discountType || !discountValue) return;
        
        const discountTypeValue = discountType.value;
        const discountValueValue = parseFloat(discountValue.value) || 0;
        
        if (discountValueValue < 0) {
            UTILS.showNotification('قيمة الخصم يجب أن تكون موجبة', 'error');
            return;
        }
        
        this.currentDiscount = {
            type: discountTypeValue,
            value: discountValueValue,
            amount: this.calculateDiscountAmount(this.cartSubtotal)
        };
        
        this.updateCartTotal();
        UTILS.showNotification('تم تطبيق الخصم بنجاح', 'success');
    },
    
    calculateDiscountAmount: function(subtotal) {
        if (this.currentDiscount.value === 0) return 0;
        
        let discountAmount = 0;
        
        if (this.currentDiscount.type === 'percent') {
            discountAmount = subtotal * (this.currentDiscount.value / 100);
        } else {
            discountAmount = this.currentDiscount.value;
        }
        
        // التأكد من أن الخصم لا يتجاوز الإجمالي
        return Math.min(discountAmount, subtotal);
    },
    
    updateDiscountUI: function() {
        // تحديث واجهة الخصم بناءً على القيم الحالية
        const discountType = document.getElementById('discount-type');
        const discountValue = document.getElementById('discount-value');
        
        if (!discountType || !discountValue) return;
        
        const discountTypeValue = discountType.value;
        const discountValueValue = discountValue.value;
        
        // إضافة الرموز المناسبة
        const suffix = discountTypeValue === 'percent' ? '%' : 'ريال';
        const parentElement = discountValue.parentElement;
        const existingSuffix = parentElement.querySelector('.input-group-text');
        
        if (existingSuffix) {
            existingSuffix.remove();
        }
        
        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'input-group-text';
        suffixSpan.textContent = suffix;
        
        parentElement.appendChild(suffixSpan);
    },
    
    clearCart: function() {
        if (this.cart.length === 0) return;
        
        if (!confirm('هل تريد مسح السلة بالكامل؟')) {
            return;
        }
        
        this.cart = [];
        this.currentDiscount = { type: 'percent', value: 0, amount: 0 };
        
        const discountValue = document.getElementById('discount-value');
        const discountType = document.getElementById('discount-type');
        
        if (discountValue) discountValue.value = '0';
        if (discountType) discountType.value = 'percent';
        
        this.updateCartDisplay();
        UTILS.showNotification('تم مسح السلة', 'info');
    },
    
    toggleCustomerSection: function(show) {
        const customerSection = document.getElementById('customer-section');
        if (!customerSection) return;
        
        customerSection.style.display = show ? 'block' : 'none';
        
        if (show) {
            const customerName = document.getElementById('customer-name');
            if (customerName) customerName.focus();
        }
    },
    
    completeSale: function() {
        if (this.cart.length === 0) {
            UTILS.showNotification('السلة فارغة', 'warning');
            return;
        }
        
        // التحقق من المخزون قبل إتمام البيع
        if (!this.validateStock()) {
            return;
        }
        
        const paymentMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethodRadio) {
            UTILS.showNotification('يرجى اختيار طريقة الدفع', 'error');
            return;
        }
        
        const paymentMethod = paymentMethodRadio.value;
        const customerNameInput = document.getElementById('customer-name');
        const customerName = paymentMethod === 'آجل' && customerNameInput ? customerNameInput.value.trim() : null;
        
        if (paymentMethod === 'آجل' && (!customerName || customerName === '')) {
            UTILS.showNotification('يرجى إدخال اسم العميل للبيع الآجل', 'error');
            if (customerNameInput) customerNameInput.focus();
            return;
        }
        
        // إنشاء فاتورة البيع
        const sale = {
            invoiceNumber: this.generateInvoiceNumber(),
            date: new Date().toLocaleDateString('en-CA'),
            time: new Date().toLocaleTimeString('ar-YE'),
            items: this.cart.map(item => ({
                productId: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity,
                total: item.total
            })),
            subtotal: this.cartSubtotal,
            discount: this.currentDiscount.amount,
            total: this.cartTotal,
            paymentMethod: paymentMethod,
            customerName: customerName,
            employee: 'مدير النظام', // يمكن تغيير هذا حسب المستخدم المسجل
            createdAt: new Date().toISOString()
        };
        
        // معالجة البيع حسب طريقة الدفع
        if (paymentMethod === 'آجل') {
            this.processCreditSale(sale);
        } else {
            this.processCashSale(sale);
        }
    },
    
    validateStock: function() {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        let isValid = true;
        let errorMessage = '';
        
        for (const cartItem of this.cart) {
            const product = products.find(p => p.id === cartItem.productId);
            
            if (!product) {
                errorMessage = `المنتج ${cartItem.name} غير موجود`;
                isValid = false;
                break;
            }
            
            if (product.quantity < cartItem.quantity) {
                errorMessage = `الكمية المطلوبة غير متوفرة للمنتج ${cartItem.name}`;
                isValid = false;
                break;
            }
        }
        
        if (!isValid) {
            UTILS.showNotification(errorMessage, 'error');
        }
        
        return isValid;
    },
    
    processCashSale: function(sale) {
        // تحديث المخزون
        if (!this.updateInventory()) {
            UTILS.showNotification('خطأ في تحديث المخزون', 'error');
            return;
        }
        
        // حفظ الفاتورة
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        sales.push(sale);
        DB.set(CONSTANTS.STORAGE_KEYS.SALES, sales);
        
        // طباعة الفاتورة
        this.printInvoice(sale);
        
        UTILS.showNotification('تم إتمام البيع بنجاح', 'success');
        
        // إعادة تعيين السلة
        this.resetPOS();
    },
    
    processCreditSale: function(sale) {
        // تحديث المخزون
        if (!this.updateInventory()) {
            UTILS.showNotification('خطأ في تحديث المخزون', 'error');
            return;
        }
        
        // إضافة إلى المبيعات الآجلة
        const creditSale = {
            ...sale,
            remainingAmount: sale.total,
            payments: []
        };
        
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        creditSales.push(creditSale);
        DB.set(CONSTANTS.STORAGE_KEYS.CREDIT_SALES, creditSales);
        
        UTILS.showNotification('تم إتمام البيع الآجل بنجاح', 'success');
        
        // طباعة الفاتورة
        this.printInvoice(sale);
        
        // إعادة تعيين السلة
        this.resetPOS();
    },
    
    updateInventory: function() {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        let success = true;
        
        this.cart.forEach(cartItem => {
            const productIndex = products.findIndex(p => p.id === cartItem.productId);
            
            if (productIndex !== -1) {
                if (products[productIndex].quantity >= cartItem.quantity) {
                    products[productIndex].quantity -= cartItem.quantity;
                    products[productIndex].updatedAt = new Date().toISOString();
                } else {
                    success = false;
                }
            }
        });
        
        if (success) {
            DB.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
        }
        
        return success;
    },
    
    generateInvoiceNumber: function() {
        const now = new Date();
        const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
        const timePart = now.getTime().toString().slice(-6);
        return `INV-${datePart}-${timePart}`;
    },
    
    printInvoice: function(sale) {
        // يمكنك تنفيذ الطباعة حسب احتياجاتك
        console.log('فاتورة البيع:', sale);
        UTILS.showNotification('تم إنشاء الفاتورة بنجاح', 'success');
    },
    
    resetPOS: function() {
        this.cart = [];
        this.currentDiscount = { type: 'percent', value: 0, amount: 0 };
        
        // إعادة تعيين النماذج
        const searchInput = document.getElementById('pos-product-search');
        const discountValue = document.getElementById('discount-value');
        const discountType = document.getElementById('discount-type');
        const customerName = document.getElementById('customer-name');
        const paymentMethodCash = document.querySelector('input[name="paymentMethod"][value="نقدي"]');
        
        if (searchInput) searchInput.value = '';
        if (discountValue) discountValue.value = '0';
        if (discountType) discountType.value = 'percent';
        if (customerName) customerName.value = '';
        if (paymentMethodCash) paymentMethodCash.checked = true;
        
        this.toggleCustomerSection(false);
        this.updateCartDisplay();
        this.loadAvailableProducts();
    },
    
    openBarcodeScanner: function() {
        if (!this.scanner) {
            UTILS.showNotification('ماسح الباركود غير متاح', 'error');
            return;
        }
        
        const scannerElement = document.getElementById('barcode-scanner');
        if (!scannerElement) return;
        
        scannerElement.classList.add('active');
        
        this.scanner.listVideoInputDevices()
            .then((videoInputDevices) => {
                if (videoInputDevices.length > 0) {
                    const selectedDeviceId = videoInputDevices[0].deviceId;
                    
                    this.scanner.decodeFromVideoDevice(selectedDeviceId, 'barcode-video', (result, err) => {
                        if (result) {
                            this.handleBarcodeScan(result.text);
                            this.closeBarcodeScanner();
                        }
                        
                        if (err && !(err instanceof ZXing.NotFoundException)) {
                            console.error('خطأ في المسح:', err);
                        }
                    });
                } else {
                    UTILS.showNotification('لا توجد كاميرا متاحة', 'error');
                    this.closeBarcodeScanner();
                }
            })
            .catch((err) => {
                console.error('خطأ في الوصول إلى الكاميرا:', err);
                UTILS.showNotification('خطأ في الوصول إلى الكاميرا', 'error');
                this.closeBarcodeScanner();
            });
    },
    
    closeBarcodeScanner: function() {
        const scannerElement = document.getElementById('barcode-scanner');
        if (!scannerElement) return;
        
        scannerElement.classList.remove('active');
        
        if (this.scanner) {
            this.scanner.reset();
        }
        
        // إيقاف الكاميرا
        const video = document.getElementById('barcode-video');
        if (video && video.srcObject) {
            const tracks = video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            video.srcObject = null;
        }
    },
    
    handleBarcodeScan: function(barcode) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const product = products.find(p => p.barcode === barcode && p.isActive !== false);
        
        if (product) {
            this.addToCart(product.id, 1);
        } else {
            UTILS.showNotification('لم يتم العثور على منتج بهذا الباركود', 'warning');
        }
    },
    
    handleKeyboardShortcuts: function(e) {
        // تجاهل إذا كان المستخدم يكتب في حقل نصي
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch(e.key) {
            case 'F2':
                e.preventDefault();
                const searchInput = document.getElementById('pos-product-search');
                if (searchInput) searchInput.focus();
                break;
            case 'F3':
                e.preventDefault();
                this.openBarcodeScanner();
                break;
            case 'F9':
                e.preventDefault();
                this.completeSale();
                break;
            case 'Delete':
            case 'F8':
                e.preventDefault();
                this.clearCart();
                break;
            case '+':
                e.preventDefault();
                this.quickAddLastItem(1);
                break;
            case '-':
                e.preventDefault();
                this.quickRemoveLastItem(1);
                break;
        }
    },
    
    quickAddLastItem: function(quantity) {
        if (this.cart.length > 0) {
            const lastItem = this.cart[this.cart.length - 1];
            this.addToCart(lastItem.productId, quantity);
        }
    },
    
    quickRemoveLastItem: function(quantity) {
        if (this.cart.length > 0) {
            const lastItem = this.cart[this.cart.length - 1];
            const cartItemElement = document.querySelector(`.cart-item[data-id="${lastItem.productId}"]`);
            if (cartItemElement) {
                this.changeQuantity(cartItemElement, -quantity);
            }
        }
    },
    
    // دالة للبيع السريع (من شاشة أخرى)
    quickSale: function(productId, quantity = 1) {
        this.addToCart(productId, quantity);
        
        // التنقل إلى شاشة نقطة البيع
        const posSection = document.querySelector('[data-section="pos-section"]');
        if (posSection) {
            posSection.click();
        }
    },
    
    // دالة للحصول على إحصائيات سريعة
    getQuickStats: function() {
        const today = new Date().toLocaleDateString('en-CA');
        const sales = DB.get(CONSTANTS.STORAGE_KEYS.SALES);
        
        const todaySales = sales
            .filter(sale => sale.date === today)
            .reduce((total, sale) => total + sale.total, 0);
        
        const todayTransactions = sales.filter(sale => sale.date === today).length;
        
        return {
            todaySales,
            todayTransactions,
            currentCartTotal: this.cartTotal || 0,
            itemsInCart: this.cart.length
        };
    },
    
    // دالة لتحميل منتج سريع بالباركود
    quickBarcodeSearch: function(barcode) {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const product = products.find(p => p.barcode === barcode && p.isActive !== false);
        
        if (product) {
            this.addToCart(product.id, 1);
            return true;
        }
        
        return false;
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.POS = POS;

// تهيئة نقطة البيع عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    if (typeof POS !== 'undefined') {
        POS.init();
    }
});
