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
        document.getElementById('pos-product-search').addEventListener('input', 
            UTILS.debounce(this.searchProductsPOS.bind(this), 300)
        );
        
        // مسح الباركود
        document.getElementById('barcode-btn').addEventListener('click', this.openBarcodeScanner.bind(this));
        document.getElementById('close-scanner-btn').addEventListener('click', this.closeBarcodeScanner.bind(this));
        
        // إدارة السلة
        document.getElementById('clear-cart-btn').addEventListener('click', this.clearCart.bind(this));
        document.getElementById('complete-sale-btn').addEventListener('click', this.completeSale.bind(this));
        
        // الخصم
        document.getElementById('apply-discount-btn').addEventListener('click', this.applyDiscount.bind(this));
        document.getElementById('discount-type').addEventListener('change', this.updateDiscountUI.bind(this));
        document.getElementById('discount-value').addEventListener('input', this.updateDiscountUI.bind(this));
        
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
                 data-barcode="${product.barcode || ''}"
                 onclick="POS.addToCart('${product.id}')">
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
        const searchTerm = document.getElementById('pos-product-search').value.toLowerCase();
        const products = DB.get(CONSTANTS.SORAGE_KEYS.PRODUCTS);
        
        const filteredProducts = products.filter(product => 
            product.isActive !== false && (
                product.name.toLowerCase().includes(searchTerm) || 
                product.category.toLowerCase().includes(searchTerm) ||
                (product.barcode && product.barcode.includes(searchTerm)) ||
                (product.description && product.description.toLowerCase().includes(searchTerm))
            )
        );
        
        this.renderAvailableProducts(filteredProducts);
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
        document.getElementById('pos-product-search').value = '';
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
        
        document.getElementById('cart-subtotal').textContent = UTILS.formatCurrency(subtotal);
        document.getElementById('discount-amount').textContent = UTILS.formatCurrency(discountAmount);
        document.getElementById('cart-total').textContent = UTILS.formatCurrency(total);
        
        // حفظ الإجمالي للاستخدام لاحقاً
        this.cartTotal = total;
        this.cartSubtotal = subtotal;
    },
    
    applyDiscount: function() {
        const discountType = document.getElementById('discount-type').value;
        const discountValue = parseFloat(document.getElementById('discount-value').value) || 0;
        
        if (discountValue < 0) {
            UTILS.showNotification('قيمة الخصم يجب أن تكون موجبة', 'error');
            return;
        }
        
        this.currentDiscount = {
            type: discountType,
            value: discountValue,
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
        const discountType = document.getElementById('discount-type').value;
        const discountValue = document.getElementById('discount-value').value;
        
        // إضافة الرموز المناسبة
        const suffix = discountType === 'percent' ? '%' : 'ريال';
        document.getElementById('discount-value').parentElement.querySelector('.input-group-text')?.remove();
        
        const suffixSpan = document.createElement('span');
        suffixSpan.className = 'input-group-text';
        suffixSpan.textContent = suffix;
        
        document.getElementById('discount-value').parentElement.appendChild(suffixSpan);
    },
    
    clearCart: function() {
        if (this.cart.length === 0) return;
        
        if (!confirm('هل تريد مسح السلة بالكامل؟')) {
            return;
        }
        
        this.cart = [];
        this.currentDiscount = { type: 'percent', value: 0, amount: 0 };
        document.getElementById('discount-value').value = '0';
        document.getElementById('discount-type').value = 'percent';
        
        this.updateCartDisplay();
        UTILS.showNotification('تم مسح السلة', 'info');
    },
    
    toggleCustomerSection: function(show) {
        const customerSection = document.getElementById('customer-section');
        customerSection.style.display = show ? 'block' : 'none';
        
        if (show) {
            document.getElementById('customer-name').focus();
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
        
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        const customerName = paymentMethod === 'آجل' ? document.getElementById('customer-name').value.trim() : null;
        
        if (paymentMethod === 'آجل' && (!customerName || customerName === '')) {
            UTILS.showNotification('يرجى إدخال اسم العميل للبيع الآجل', 'error');
            document.getElementById('customer-name').focus();
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
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        // إعدادات المتجر
        const storeName = localStorage.getItem(CONSTANTS.STORAGE_KEYS.STORE_NAME) || 'متجري';
        const settings = DB.get(CONSTANTS.STORAGE_KEYS.SETTINGS);
        
        // ترويسة الفاتورة
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text(storeName, 105, 15, { align: 'center' });
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`رقم الفاتورة: ${sale.invoiceNumber}`, 105, 25, { align: 'center' });
        doc.text(`التاريخ: ${sale.date} - ${sale.time}`, 105, 32, { align: 'center' });
        
        doc.line(10, 40, 200, 40);
        
        // عناصر الفاتورة
        let y = 50;
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        
        // عناوين الأعمدة
        doc.text('المنتج', 180, y, { align: 'right' });
        doc.text('الكمية', 140, y, { align: 'right' });
        doc.text('السعر', 100, y, { align: 'right' });
        doc.text('الإجمالي', 60, y, { align: 'right' });
        
        y += 10;
        doc.line(10, y, 200, y);
        y += 10;
        
        // العناصر
        sale.items.forEach(item => {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            
            doc.text(item.name, 180, y, { align: 'right' });
            doc.text(item.quantity.toString(), 140, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(item.price), 100, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(item.total), 60, y, { align: 'right' });
            y += 10;
        });
        
        y += 5;
        doc.line(10, y, 200, y);
        y += 10;
        
        // المجموع والخصم
        doc.text('المجموع:', 180, y, { align: 'right' });
        doc.text(UTILS.formatCurrency(sale.subtotal), 140, y, { align: 'right' });
        y += 10;
        
        if (sale.discount > 0) {
            doc.text('الخصم:', 180, y, { align: 'right' });
            doc.text(UTILS.formatCurrency(sale.discount), 140, y, { align: 'right' });
            y += 10;
        }
        
        doc.setFontSize(14);
        doc.setTextColor(40, 40, 40);
        doc.text('الإجمالي النهائي:', 180, y, { align: 'right' });
        doc.text(UTILS.formatCurrency(sale.total), 140, y, { align: 'right' });
        y += 15;
        
        doc.setFontSize(12);
        doc.setTextColor(100, 100, 100);
        doc.text(`طريقة الدفع: ${sale.paymentMethod}`, 105, y, { align: 'center' });
        
        if (sale.customerName) {
            y += 10;
            doc.text(`اسم العميل: ${sale.customerName}`, 105, y, { align: 'center' });
        }
        
        y += 20;
        doc.setFontSize(10);
        doc.text(settings.receiptFooter || 'شكراً لشرائكم من متجرنا', 105, y, { align: 'center' });
        
        // حفظ PDF
        doc.save(`فاتورة-${sale.invoiceNumber}.pdf`);
    },
    
    resetPOS: function() {
        this.cart = [];
        this.currentDiscount = { type: 'percent', value: 0, amount: 0 };
        
        // إعادة تعيين النماذج
        document.getElementById('pos-product-search').value = '';
        document.getElementById('discount-value').value = '0';
        document.getElementById('discount-type').value = 'percent';
        document.getElementById('customer-name').value = '';
        document.querySelector('input[name="paymentMethod"][value="نقدي"]').checked = true;
        
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
        scannerElement.classList.remove('active');
        
        if (this.scanner) {
            this.scanner.reset();
        }
        
        // إيقاف الكاميرا
        const video = document.getElementById('barcode-video');
        if (video.srcObject) {
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
                document.getElementById('pos-product-search').focus();
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
            this.changeQuantity(
                document.querySelector(`.cart-item[data-id="${lastItem.productId}"]`),
                -quantity
            );
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
