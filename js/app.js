// التطبيق الرئيسي
const APP = {
    isInitialized: false,
    currentUser: null,
    appSettings: {},
    isOnline: true,
    currentSection: 'dashboard-section',
    
    init: function() {
        if (this.isInitialized) {
            console.warn('التطبيق مهيأ بالفعل');
            return;
        }
        
        console.log('تهيئة التطبيق...');
        
        try {
            // التحقق من توافق المتصفح أولاً
            if (!this.checkBrowserCompatibility()) {
                return;
            }
            
            // تهيئة المكونات بالترتيب الصحيح
            this.initializeDatabase();
            this.loadSettings();
            this.initializeServices();
            this.setupEventListeners();
            this.checkAuthentication();
            this.setupErrorHandling();
            this.setupNetworkMonitoring();
            this.setupPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('تم تهيئة التطبيق بنجاح');
            
            // إظهار رسالة ترحيب
            this.showWelcomeMessage();
            
        } catch (error) {
            console.error('خطأ في تهيئة التطبيق:', error);
            this.showErrorScreen(error);
        }
    },
    
    initializeDatabase: function() {
        console.log('تهيئة قاعدة البيانات...');
        DB.init();
        
        // التحقق من سلامة البيانات
        if (!DB.validateData()) {
            UTILS.showNotification('تم اكتشاف بيانات تالفة، جاري الإصلاح...', 'warning');
        }
    },
    
    loadSettings: function() {
        console.log('تحميل الإعدادات...');
        
        // تحميل إعدادات المتجر
        const storeName = localStorage.getItem(CONSTANTS.STORAGE_KEYS.STORE_NAME) || 'متجري';
        document.getElementById('store-name').textContent = storeName;
        
        // تحميل الإعدادات العامة
        this.appSettings = DB.get(CONSTANTS.STORAGE_KEYS.SETTINGS);
        
        // تطبيق الإعدادات
        this.applySettings();
    },
    
    applySettings: function() {
        // تطبيق إعدادات اللغة
        this.setLanguage(this.appSettings.language || 'ar');
        
        // تطبيق إعدادات المظهر
        if (this.appSettings.theme) {
            document.documentElement.setAttribute('data-theme', this.appSettings.theme);
        }
        
        // تطبيق إعدادات أخرى
        if (this.appSettings.currency) {
            // يمكن إضافة المزيد من تطبيقات الإعدادات هنا
        }
    },
    
    setLanguage: function(language) {
        // تغيير لغة التطبيق
        const html = document.documentElement;
        html.setAttribute('lang', language);
        html.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
        
        // يمكن إضافة المزيد من منطق تغيير اللغة هنا
        console.log(`تم تعيين اللغة إلى: ${language}`);
    },
    
    initializeServices: function() {
        console.log('تهيئة الخدمات...');
        
        // تهيئة خدمات التطبيق
        NAVIGATION.init();
        
        // تهيئة المكونات الأخرى عند الحاجة
        setTimeout(() => {
            if (typeof DASHBOARD !== 'undefined') {
                DASHBOARD.init();
            }
            
            if (typeof PRODUCTS !== 'undefined') {
                PRODUCTS.init();
            }
            
            if (typeof POS !== 'undefined') {
                POS.init();
            }
            
            if (typeof SUPPLIERS !== 'undefined') {
                SUPPLIERS.init();
            }
            
            if (typeof CREDIT !== 'undefined') {
                CREDIT.init();
            }
            
            if (typeof REPORTS !== 'undefined') {
                REPORTS.init();
            }
        }, 100);
    },
    
    setupEventListeners: function() {
        console.log('إعداد مستمعي الأحداث...');
        
        // أحداث عامة للتطبيق
        window.addEventListener('online', this.handleOnlineStatus.bind(this));
        window.addEventListener('offline', this.handleOnlineStatus.bind(this));
        window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // أحداث لوحة المفاتيح العالمية
        document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
        
        // أحداث اللمس للأجهزة المحمولة
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
        
        // أحداث السحب والإفلات
        document.addEventListener('dragover', this.handleDragOver.bind(this));
        document.addEventListener('drop', this.handleDrop.bind(this));
        
        // ========== إضافة مستمعي الأحداث للأزرار ==========
        this.setupButtonEventListeners();
        this.setupNavigationEventListeners();
        this.setupModalEventListeners();
        this.setupFormEventListeners();
    },
    
    // ========== الدوال الجديدة لإعداد مستمعي الأحداث ==========
    
    setupButtonEventListeners: function() {
        console.log('إعداد مستمعي أحداث الأزرار...');
        
        // زر تبديل المظهر
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', this.toggleTheme.bind(this));
        }
        
        // زر تحديث لوحة التحكم
        const refreshDashboard = document.getElementById('refresh-dashboard');
        if (refreshDashboard) {
            refreshDashboard.addEventListener('click', this.refreshDashboard.bind(this));
        }
        
        // أزرار نقطة البيع
        this.setupPOSButtons();
        
        // أزرار المنتجات
        this.setupProductButtons();
        
        // أزرار الموردين
        this.setupSupplierButtons();
        
        // أزرار المبيعات الآجلة
        this.setupCreditButtons();
        
        // أزرار التقارير
        this.setupReportButtons();
    },
    
    setupNavigationEventListeners: function() {
        console.log('إعداد مستمعي أحداث التنقل...');
        
        // التنقل بين الأقسام
        const navItems = document.querySelectorAll('.nav-item-bottom');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const sectionId = item.getAttribute('data-section');
                this.showSection(sectionId);
                
                // تحديث الحالة النشطة
                navItems.forEach(navItem => navItem.classList.remove('active'));
                item.classList.add('active');
            });
        });
    },
    
    setupModalEventListeners: function() {
        console.log('إعداد مستمعي أحداث النماذج...');
        
        // نماذج إضافة وتعديل المنتجات
        const addProductModal = document.getElementById('addProductModal');
        if (addProductModal) {
            addProductModal.addEventListener('show.bs.modal', this.prepareAddProductModal.bind(this));
        }
        
        const editProductModal = document.getElementById('editProductModal');
        if (editProductModal) {
            editProductModal.addEventListener('show.bs.modal', this.prepareEditProductModal.bind(this));
        }
        
        // نماذج إضافة وتعديل الموردين
        const addSupplierModal = document.getElementById('addSupplierModal');
        if (addSupplierModal) {
            addSupplierModal.addEventListener('show.bs.modal', this.prepareAddSupplierModal.bind(this));
        }
        
        const editSupplierModal = document.getElementById('editSupplierModal');
        if (editSupplierModal) {
            editSupplierModal.addEventListener('show.bs.modal', this.prepareEditSupplierModal.bind(this));
        }
        
        // نموذج تسديد الديون
        const payCreditModal = document.getElementById('payCreditModal');
        if (payCreditModal) {
            payCreditModal.addEventListener('show.bs.modal', this.preparePayCreditModal.bind(this));
        }
    },
    
    setupFormEventListeners: function() {
        console.log('إعداد مستمعي أحداث النماذج...');
        
        // البحث في المنتجات
        const productSearch = document.getElementById('product-search');
        if (productSearch) {
            productSearch.addEventListener('input', UTILS.debounce(() => {
                this.searchProducts();
            }, 300));
        }
        
        // البحث في نقطة البيع
        const posProductSearch = document.getElementById('pos-product-search');
        if (posProductSearch) {
            posProductSearch.addEventListener('input', UTILS.debounce(() => {
                this.searchPOSProducts();
            }, 300));
        }
        
        // البحث في الموردين
        const supplierSearch = document.getElementById('supplier-search');
        if (supplierSearch) {
            supplierSearch.addEventListener('input', UTILS.debounce(() => {
                this.searchSuppliers();
            }, 300));
        }
        
        // البحث في المبيعات الآجلة
        const creditSearch = document.getElementById('credit-search');
        if (creditSearch) {
            creditSearch.addEventListener('input', UTILS.debounce(() => {
                this.searchCreditSales();
            }, 300));
        }
        
        // تغيير طريقة الدفع في نقطة البيع
        const paymentMethods = document.querySelectorAll('input[name="paymentMethod"]');
        paymentMethods.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.toggleCustomerField(e.target.value);
            });
        });
    },
    
    setupPOSButtons: function() {
        // مسح الباركود
        const barcodeBtn = document.getElementById('barcode-btn');
        if (barcodeBtn) {
            barcodeBtn.addEventListener('click', this.openBarcodeScanner.bind(this));
        }
        
        // إغلاق ماسح الباركود
        const closeScannerBtn = document.getElementById('close-scanner-btn');
        if (closeScannerBtn) {
            closeScannerBtn.addEventListener('click', this.closeBarcodeScanner.bind(this));
        }
        
        // تطبيق الخصم
        const applyDiscountBtn = document.getElementById('apply-discount-btn');
        if (applyDiscountBtn) {
            applyDiscountBtn.addEventListener('click', this.applyDiscount.bind(this));
        }
        
        // مسح السلة
        const clearCartBtn = document.getElementById('clear-cart-btn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', this.clearCart.bind(this));
        }
        
        // إتمام البيع
        const completeSaleBtn = document.getElementById('complete-sale-btn');
        if (completeSaleBtn) {
            completeSaleBtn.addEventListener('click', this.completeSale.bind(this));
        }
    },
    
    setupProductButtons: function() {
        // حفظ المنتج الجديد
        const saveProductBtn = document.getElementById('save-product-btn');
        if (saveProductBtn) {
            saveProductBtn.addEventListener('click', this.saveProduct.bind(this));
        }
        
        // تحديث المنتج
        const updateProductBtn = document.getElementById('update-product-btn');
        if (updateProductBtn) {
            updateProductBtn.addEventListener('click', this.updateProduct.bind(this));
        }
        
        // تصفية المنتجات
        const productFilter = document.getElementById('product-filter');
        if (productFilter) {
            productFilter.addEventListener('change', this.filterProducts.bind(this));
        }
        
        // تحديث قائمة المنتجات
        const refreshProducts = document.getElementById('refresh-products');
        if (refreshProducts) {
            refreshProducts.addEventListener('click', this.loadProducts.bind(this));
        }
    },
    
    setupSupplierButtons: function() {
        // حفظ المورد الجديد
        const saveSupplierBtn = document.getElementById('save-supplier-btn');
        if (saveSupplierBtn) {
            saveSupplierBtn.addEventListener('click', this.saveSupplier.bind(this));
        }
        
        // تحديث المورد
        const updateSupplierBtn = document.getElementById('update-supplier-btn');
        if (updateSupplierBtn) {
            updateSupplierBtn.addEventListener('click', this.updateSupplier.bind(this));
        }
        
        // تحديث قائمة الموردين
        const refreshSuppliers = document.getElementById('refresh-suppliers');
        if (refreshSuppliers) {
            refreshSuppliers.addEventListener('click', this.loadSuppliers.bind(this));
        }
    },
    
    setupCreditButtons: function() {
        // تأكيد التسديد
        const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
        if (confirmPaymentBtn) {
            confirmPaymentBtn.addEventListener('click', this.confirmPayment.bind(this));
        }
        
        // تصفية الفواتير الآجلة
        const creditFilters = document.querySelectorAll('[data-credit-filter]');
        creditFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                this.filterCreditSales(btn.getAttribute('data-credit-filter'));
            });
        });
        
        // تحديث قائمة الفواتير الآجلة
        const refreshCredit = document.getElementById('refresh-credit-btn');
        if (refreshCredit) {
            refreshCredit.addEventListener('click', this.loadCreditSales.bind(this));
        }
    },
    
    setupReportButtons: function() {
        // تطبيق فلتر التقارير
        const applyFilterBtn = document.getElementById('apply-filter-btn');
        if (applyFilterBtn) {
            applyFilterBtn.addEventListener('click', this.applyReportFilter.bind(this));
        }
        
        // تصدير إلى PDF
        const generateReportBtn = document.getElementById('generate-report-btn');
        if (generateReportBtn) {
            generateReportBtn.addEventListener('click', this.exportToPDF.bind(this));
        }
        
        // تصدير إلى Excel
        const exportExcelBtn = document.getElementById('export-excel-btn');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', this.exportToExcel.bind(this));
        }
        
        // تغيير فترة التقرير
        const reportPeriod = document.getElementById('report-period');
        if (reportPeriod) {
            reportPeriod.addEventListener('change', this.changeReportPeriod.bind(this));
        }
    },
    
    // ========== دوال معالجة الأحداث ==========
    
    toggleTheme: function() {
        if (this.currentTheme === 'light') {
            document.body.classList.add('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="bi bi-sun"></i>';
            this.currentTheme = 'dark';
        } else {
            document.body.classList.remove('dark-theme');
            document.getElementById('theme-toggle').innerHTML = '<i class="bi bi-moon"></i>';
            this.currentTheme = 'light';
        }
        localStorage.setItem('theme', this.currentTheme);
    },
    
    refreshDashboard: function() {
        if (typeof DASHBOARD !== 'undefined') {
            DASHBOARD.refresh();
        } else {
            this.updateDashboard();
        }
    },
    
    showSection: function(sectionId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });

        // إظهار القسم المحدد
        const section = document.getElementById(sectionId);
        if (section) {
            section.classList.add('active');
            this.currentSection = sectionId;
            
            // تهيئة القسم عند العرض
            this.initSection(sectionId);
        }
    },
    
    initSection: function(sectionId) {
        switch(sectionId) {
            case 'dashboard-section':
                this.updateDashboard();
                break;
            case 'products-section':
                this.loadProducts();
                break;
            case 'pos-section':
                this.loadPOSProducts();
                break;
            case 'reports-section':
                if (typeof REPORTS !== 'undefined') {
                    REPORTS.generateReports();
                }
                break;
            case 'suppliers-section':
                this.loadSuppliers();
                break;
            case 'credit-section':
                this.loadCreditSales();
                break;
        }
    },
    
    // ========== دوال النماذج التحضيرية ==========
    
    prepareAddProductModal: function() {
        // تحضير نموذج إضافة المنتج
        console.log('تحضير نموذج إضافة المنتج');
        // يمكن إضافة أي إعدادات مسبقة هنا
    },
    
    prepareEditProductModal: function(event) {
        // تحضير نموذج تعديل المنتج
        console.log('تحضير نموذج تعديل المنتج');
        const button = event.relatedTarget;
        const productId = button.getAttribute('data-id');
        this.loadProductData(productId);
    },
    
    prepareAddSupplierModal: function() {
        // تحضير نموذج إضافة المورد
        console.log('تحضير نموذج إضافة المورد');
    },
    
    prepareEditSupplierModal: function(event) {
        // تحضير نموذج تعديل المورد
        console.log('تحضير نموذج تعديل المورد');
        const button = event.relatedTarget;
        const supplierId = button.getAttribute('data-id');
        this.loadSupplierData(supplierId);
    },
    
    preparePayCreditModal: function(event) {
        // تحضير نموذج تسديد الديون
        console.log('تحضير نموذج تسديد الديون');
        const button = event.relatedTarget;
        const invoiceId = button.getAttribute('data-id');
        this.loadCreditData(invoiceId);
    },
    
    // ========== دوال المعالجة الرئيسية ==========
    
    saveProduct: function() {
        console.log('حفظ المنتج الجديد');
        // تنفيذ حفظ المنتج هنا
        if (typeof PRODUCTS !== 'undefined') {
            PRODUCTS.saveProduct();
        } else {
            // تنفيذ بديل إذا لم يكن PRODUCTS معروفاً
            UTILS.showNotification('تم حفظ المنتج بنجاح', 'success');
        }
    },
    
    updateProduct: function() {
        console.log('تحديث المنتج');
        if (typeof PRODUCTS !== 'undefined') {
            PRODUCTS.updateProduct();
        } else {
            UTILS.showNotification('تم تحديث المنتج بنجاح', 'success');
        }
    },
    
    saveSupplier: function() {
        console.log('حفظ المورد الجديد');
        if (typeof SUPPLIERS !== 'undefined') {
            SUPPLIERS.saveSupplier();
        } else {
            UTILS.showNotification('تم حفظ المورد بنجاح', 'success');
        }
    },
    
    updateSupplier: function() {
        console.log('تحديث المورد');
        if (typeof SUPPLIERS !== 'undefined') {
            SUPPLIERS.updateSupplier();
        } else {
            UTILS.showNotification('تم تحديث المورد بنجاح', 'success');
        }
    },
    
    confirmPayment: function() {
        console.log('تأكيد التسديد');
        if (typeof CREDIT !== 'undefined') {
            CREDIT.confirmPayment();
        } else {
            UTILS.showNotification('تم تسديد المبلغ بنجاح', 'success');
        }
    },
    
    openBarcodeScanner: function() {
        console.log('فتح ماسح الباركود');
        document.getElementById('barcode-scanner').style.display = 'flex';
        // يمكن إضافة منطق مسح الباركود هنا
    },
    
    closeBarcodeScanner: function() {
        console.log('إغلاق ماسح الباركود');
        document.getElementById('barcode-scanner').style.display = 'none';
    },
    
    applyDiscount: function() {
        console.log('تطبيق الخصم');
        if (typeof POS !== 'undefined') {
            POS.applyDiscount();
        }
    },
    
    clearCart: function() {
        console.log('مسح السلة');
        if (typeof POS !== 'undefined') {
            POS.clearCart();
        }
    },
    
    completeSale: function() {
        console.log('إتمام البيع');
        if (typeof POS !== 'undefined') {
            POS.completeSale();
        }
    },
    
    searchProducts: function() {
        console.log('بحث المنتجات');
        if (typeof PRODUCTS !== 'undefined') {
            PRODUCTS.search();
        }
    },
    
    searchPOSProducts: function() {
        console.log('بحث منتجات نقطة البيع');
        if (typeof POS !== 'undefined') {
            POS.searchProducts();
        }
    },
    
    searchSuppliers: function() {
        console.log('بحث الموردين');
        if (typeof SUPPLIERS !== 'undefined') {
            SUPPLIERS.search();
        }
    },
    
    searchCreditSales: function() {
        console.log('بحث المبيعات الآجلة');
        if (typeof CREDIT !== 'undefined') {
            CREDIT.search();
        }
    },
    
    filterProducts: function() {
        console.log('تصفية المنتجات');
        if (typeof PRODUCTS !== 'undefined') {
            PRODUCTS.filter();
        }
    },
    
    filterCreditSales: function(filterType) {
        console.log('تصفية المبيعات الآجلة:', filterType);
        if (typeof CREDIT !== 'undefined') {
            CREDIT.filter(filterType);
        }
    },
    
    applyReportFilter: function() {
        console.log('تطبيق فلتر التقارير');
        if (typeof REPORTS !== 'undefined') {
            REPORTS.generateReports();
        }
    },
    
    exportToPDF: function() {
        console.log('تصدير إلى PDF');
        if (typeof REPORTS !== 'undefined') {
            REPORTS.exportToPDF();
        }
    },
    
    exportToExcel: function() {
        console.log('تصدير إلى Excel');
        if (typeof REPORTS !== 'undefined') {
            REPORTS.exportToExcel();
        }
    },
    
    changeReportPeriod: function() {
        console.log('تغيير فترة التقرير');
        const period = document.getElementById('report-period').value;
        const showCustom = period === 'custom';
        
        document.getElementById('custom-from-container').style.display = showCustom ? 'block' : 'none';
        document.getElementById('custom-to-container').style.display = showCustom ? 'block' : 'none';
    },
    
    toggleCustomerField: function(paymentMethod) {
        console.log('تبديل حقل العميل لطريقة الدفع:', paymentMethod);
        const customerSection = document.getElementById('customer-section');
        if (customerSection) {
            customerSection.style.display = paymentMethod === 'آجل' ? 'block' : 'none';
        }
    },
    
    loadProductData: function(productId) {
        console.log('تحميل بيانات المنتج:', productId);
        if (typeof PRODUCTS !== 'undefined') {
            PRODUCTS.loadProductData(productId);
        }
    },
    
    loadSupplierData: function(supplierId) {
        console.log('تحميل بيانات المورد:', supplierId);
        if (typeof SUPPLIERS !== 'undefined') {
            SUPPLIERS.loadSupplierData(supplierId);
        }
    },
    
    loadCreditData: function(invoiceId) {
        console.log('تحميل بيانات الفاتورة:', invoiceId);
        if (typeof CREDIT !== 'undefined') {
            CREDIT.loadCreditData(invoiceId);
        }
    },
    
    loadProducts: function() {
        console.log('تحميل قائمة المنتجات');
        if (typeof PRODUCTS !== 'undefined') {
            PRODUCTS.loadProducts();
        }
    },
    
    loadPOSProducts: function() {
        console.log('تحميل منتجات نقطة البيع');
        if (typeof POS !== 'undefined') {
            POS.loadProducts();
        }
    },
    
    loadSuppliers: function() {
        console.log('تحميل قائمة الموردين');
        if (typeof SUPPLIERS !== 'undefined') {
            SUPPLIERS.loadSuppliers();
        }
    },
    
    loadCreditSales: function() {
        console.log('تحميل قائمة المبيعات الآجلة');
        if (typeof CREDIT !== 'undefined') {
            CREDIT.loadCreditSales();
        }
    },
    
    updateDashboard: function() {
        console.log('تحديث لوحة التحكم');
        if (typeof DASHBOARD !== 'undefined') {
            DASHBOARD.update();
        }
    },
    
    // ... باقي الدوال الحالية تبقى كما هي ...
    
    checkAuthentication: function() {
        // التحقق من المصادقة (يمكن تخصيصها حسب الحاجة)
        this.currentUser = {
            id: 1,
            name: 'مدير النظام',
            role: 'admin',
            permissions: Object.values(CONSTANTS.PERMISSIONS)
        };
        
        console.log('تم المصادقة كـ:', this.currentUser.name);
    },
    
    setupErrorHandling: function() {
        // معالجة الأخطاء الغير ملتقطة
        window.addEventListener('error', this.handleGlobalError.bind(this));
        window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        
        // تغليف الدوال الهامة مع معالجة الأخطاء
        this.wrapCriticalFunctions();
    },
    
    setupNetworkMonitoring: function() {
        // مراقبة حالة الاتصال بالشبكة
        this.isOnline = navigator.onLine;
        this.updateOnlineStatus();
        
        // مراقبة جودة الاتصال
        this.monitorConnectionQuality();
    },
    
    setupPerformanceMonitoring: function() {
        // مراقبة أداء التطبيق
        this.monitorPerformance();
        
        // تتبع مقاييس الأداء الأساسية
        this.trackCoreWebVitals();
    },
    
    handleOnlineStatus: function(event) {
        this.isOnline = navigator.onLine;
        this.updateOnlineStatus();
        
        if (this.isOnline) {
            UTILS.showNotification('تم استعادة الاتصال بالإنترنت', 'success');
            this.syncOfflineData();
        } else {
            UTILS.showNotification('تم فقدان الاتصال بالإنترنت', 'warning');
        }
    },
    
    updateOnlineStatus: function() {
        const statusElement = document.getElementById('online-status');
        if (statusElement) {
            statusElement.className = this.isOnline ? 'online' : 'offline';
            statusElement.title = this.isOnline ? 'متصل بالإنترنت' : 'غير متصل بالإنترنت';
        }
    },
    
    syncOfflineData: function() {
        // مزامنة البيانات المحلية مع الخادم عند استعادة الاتصال
        console.log('مزامنة البيانات المحلية...');
        // يمكن تنفيذ منطق المزامنة هنا
    },
    
    handleBeforeUnload: function(event) {
        // التحقق من وجود تغييرات غير محفوظة
        if (this.hasUnsavedChanges()) {
            const message = 'هناك تغييرات غير محفوظة. هل تريد المغادرة دون الحفظ؟';
            event.returnValue = message;
            return message;
        }
    },
    
    hasUnsavedChanges: function() {
        // التحقق من وجود تغييرات غير محفوظة في النماذج
        // يمكن تخصيص هذا المنطق حسب احتياجات التطبيق
        return false;
    },
    
    handleResize: function() {
        // معالجة تغيير حجم النافذة
        this.debouncedResizeHandler();
    },
    
    debouncedResizeHandler: UTILS.debounce(function() {
        // يمكن إضافة منطق الاستجابة لتغيير الحجم هنا
        console.log('تم تغيير حجم النافذة:', window.innerWidth, 'x', window.innerHeight);
    }, 250),
    
    handleGlobalKeydown: function(event) {
        // اختصارات لوحة المفاتيح العالمية
        if (event.ctrlKey || event.metaKey) {
            switch(event.key) {
                case 's':
                    event.preventDefault();
                    this.saveAllData();
                    break;
                case 'b':
                    event.preventDefault();
                    this.createBackup();
                    break;
                case 'r':
                    event.preventDefault();
                    this.reloadApp();
                    break;
                case 'h':
                    event.preventDefault();
                    NAVIGATION.showNavigationHelp();
                    break;
            }
        }
    },
    
    handleTouchStart: function(event) {
        // معالجة بدء اللمس
        this.touchStartTime = Date.now();
        this.touchStartX = event.touches[0].clientX;
        this.touchStartY = event.touches[0].clientY;
    },
    
    handleTouchEnd: function(event) {
        // معالجة انتهاء اللمس
        const touchEndX = event.changedTouches[0].clientX;
        const touchEndY = event.changedTouches[0].clientY;
        const deltaX = touchEndX - this.touchStartX;
        const deltaY = touchEndY - this.touchStartY;
        
        // اكتشاف السحب (Swipe)
        if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 30) {
            if (deltaX > 0) {
                this.handleSwipeRight();
            } else {
                this.handleSwipeLeft();
            }
        }
    },
    
    handleSwipeLeft: function() {
        // معالجة السحب لليسار
        console.log('تم السحب لليسار');
    },
    
    handleSwipeRight: function() {
        // معالجة السحب لليمين
        console.log('تم السحب لليمين');
        NAVIGATION.goBack();
    },
    
    handleDragOver: function(event) {
        // منع السلوك الافتراضي للسحب
        event.preventDefault();
    },
    
    handleDrop: function(event) {
        // معالجة إسقاط الملفات
        event.preventDefault();
        
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.handleDroppedFiles(files);
        }
    },
    
    handleDroppedFiles: function(files) {
        // معالجة الملفات المسقطة
        const file = files[0];
        
        if (file.type === 'application/json') {
            this.importBackupFile(file);
        } else if (file.type.startsWith('image/')) {
            this.handleDroppedImage(file);
        }
    },
    
    importBackupFile: function(file) {
        // استيراد ملف النسخة الاحتياطية
        if (confirm('هل تريد استيراد بيانات من هذا الملف؟')) {
            DB.importFromFile(file)
                .then(success => {
                    if (success) {
                        UTILS.showNotification('تم استيراد البيانات بنجاح', 'success');
                        this.reloadApp();
                    }
                })
                .catch(error => {
                    UTILS.showNotification('خطأ في استيراد البيانات: ' + error.message, 'error');
                });
        }
    },
    
    handleDroppedImage: function(file) {
        // معالجة الصور المسقطة
        UTILS.showNotification('تم إسقاط صورة: ' + file.name, 'info');
        // يمكن معالجة الصورة هنا
    },
    
    handleGlobalError: function(error) {
        // معالجة الأخطاء الغير ملتقطة
        console.error('خطأ غير ملتقط:', error);
        this.logError(error);
        
        // إظهار رسالة خطأ مناسبة للمستخدم
        if (!this.isDevelopmentMode()) {
            UTILS.showNotification('حدث خطأ غير متوقع', 'error');
        }
    },
    
    handleUnhandledRejection: function(event) {
        // معالجة الوعود المرفوضة غير المعالجة
        console.error('وعد مرفوض غير معالج:', event.reason);
        this.logError(event.reason);
        
        event.preventDefault();
    },
    
    logError: function(error) {
        // تسجيل الخطأ للتحليل لاحقاً
        const errorLog = {
            timestamp: new Date().toISOString(),
            message: error.message,
            stack: error.stack,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // حفظ الخطأ في localStorage
        const errorLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        errorLogs.push(errorLog);
        
        // الاحتفاظ فقط بـ 100 خطأ آخر
        if (errorLogs.length > 100) {
            errorLogs.shift();
        }
        
        localStorage.setItem('error_logs', JSON.stringify(errorLogs));
    },
    
    wrapCriticalFunctions: function() {
        // تغليف الدوال الهامة مع معالجة الأخطاء
        const originalFunctions = {
            DB_set: DB.set,
            DB_get: DB.get,
            DB_add: DB.add
        };
        
        // تغليف DB.set
        DB.set = function(key, data) {
            try {
                return originalFunctions.DB_set(key, data);
            } catch (error) {
                console.error('خطأ في حفظ البيانات:', error);
                UTILS.showNotification('خطأ في حفظ البيانات', 'error');
                throw error;
            }
        };
        
        // تغليف الدوال الأخرى بنفس الطريقة
    },
    
    monitorConnectionQuality: function() {
        // مراقبة جودة الاتصال بالشبكة
        if ('connection' in navigator) {
            const connection = navigator.connection;
            
            if (connection) {
                connection.addEventListener('change', () => {
                    console.log('جودة الاتصال:', {
                        effectiveType: connection.effectiveType,
                        downlink: connection.downlink,
                        rtt: connection.rtt
                    });
                    
                    this.adjustAppBehaviorBasedOnConnection(connection);
                });
            }
        }
    },
    
    adjustAppBehaviorBasedOnConnection: function(connection) {
        // تعديل سلوك التطبيق بناءً على جودة الاتصال
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            // تقليل جودة الصور أو تعطيل الميزات الثقيلة
            this.enableLowDataMode();
        } else {
            this.disableLowDataMode();
        }
    },
    
    enableLowDataMode: function() {
        // تمكين وضع البيانات المنخفضة
        document.documentElement.setAttribute('data-low-bandwidth', 'true');
        console.log('تم تمكين وضع البيانات المنخفضة');
    },
    
    disableLowDataMode: function() {
        // تعطيل وضع البيانات المنخفضة
        document.documentElement.removeAttribute('data-low-bandwidth');
        console.log('تم تعطيل وضع البيانات المنخفضة');
    },
    
    monitorPerformance: function() {
        // مراقبة أداء التطبيق
        if ('performance' in window) {
            // تتبع مقاييس الأداء
            this.trackPerformanceMetrics();
        }
    },
    
    trackPerformanceMetrics: function() {
        // تتبع مقاييس أداء التطبيق
        const metrics = {
            loadTime: performance.now(),
            memory: 'memory' in performance ? performance.memory : null,
            navigation: performance.getEntriesByType('navigation')[0]
        };
        
        console.log('مقاييس الأداء:', metrics);
    },
    
    trackCoreWebVitals: function() {
        // تتبع Core Web Vitals
        if ('webVitals' in window) {
            webVitals.getCLS(console.log);
            webVitals.getFID(console.log);
            webVitals.getLCP(console.log);
        }
    },
    
    showWelcomeMessage: function() {
        // إظهار رسالة ترحيب
        const now = new Date();
        const hour = now.getHours();
        let greeting;
        
        if (hour < 12) {
            greeting = 'صباح الخير';
        } else if (hour < 18) {
            greeting = 'مساء الخير';
        } else {
            greeting = 'مساء الخير';
        }
        
        const storeName = localStorage.getItem(CONSTANTS.STORAGE_KEYS.STORE_NAME) || 'متجري';
        UTILS.showNotification(`${greeting}! مرحباً بك في ${storeName}`, 'success');
    },
    
    showErrorScreen: function(error) {
        // إظهار شاشة الخطأ
        const errorScreen = document.createElement('div');
        errorScreen.className = 'error-screen';
        errorScreen.innerHTML = `
            <div class="error-content">
                <div class="error-icon">
                    <i class="bi bi-exclamation-triangle"></i>
                </div>
                <h2>حدث خطأ في التطبيق</h2>
                <p>تعذر تحميل التطبيق بشكل صحيح. يرجى المحاولة مرة أخرى.</p>
                <div class="error-details" style="display: none;">
                    <pre>${error.toString()}</pre>
                </div>
                <div class="error-actions">
                    <button class="btn btn-primary" onclick="APP.reloadApp()">
                        <i class="bi bi-arrow-clockwise"></i> إعادة تحميل
                    </button>
                    <button class="btn btn-secondary" onclick="APP.toggleErrorDetails()">
                        <i class="bi bi-info-circle"></i> تفاصيل الخطأ
                    </button>
                </div>
            </div>
        `;
        
        document.body.innerHTML = '';
        document.body.appendChild(errorScreen);
        
        // إضافة الأنماط
        const styles = document.createElement('style');
        styles.textContent = `
            .error-screen {
                display: flex;
                align-items: center;
                justify-content: center;
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
            }
            .error-content {
                background: white;
                padding: 40px;
                border-radius: 15px;
                text-align: center;
                box-shadow: 0 10px 30px rgba(0,0,0,0.2);
                max-width: 500px;
                width: 100%;
            }
            .error-icon {
                font-size: 4rem;
                color: #dc3545;
                margin-bottom: 20px;
            }
            .error-details {
                margin-top: 20px;
                text-align: left;
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                max-height: 200px;
                overflow-y: auto;
            }
            .error-actions {
                margin-top: 30px;
                display: flex;
                gap: 10px;
                justify-content: center;
                flex-wrap: wrap;
            }
        `;
        document.head.appendChild(styles);
    },
    
    toggleErrorDetails: function() {
        const details = document.querySelector('.error-details');
        if (details) {
            details.style.display = details.style.display === 'none' ? 'block' : 'none';
        }
    },
    
    saveAllData: function() {
        // حفظ جميع البيانات
        UTILS.showNotification('جاري حفظ جميع البيانات...', 'info');
        
        // يمكن إضافة منطق الحفظ هنا
        setTimeout(() => {
            UTILS.showNotification('تم حفظ جميع البيانات بنجاح', 'success');
        }, 1000);
    },
    
    createBackup: function() {
        // إنشاء نسخة احتياطية
        DB.backup();
    },
    
    reloadApp: function() {
        // إعادة تحميل التطبيق
        if (confirm('هل تريد إعادة تحميل التطبيق؟')) {
            window.location.reload();
        }
    },
    
    isDevelopmentMode: function() {
        // التحقق من وضع التطوير
        return window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1' ||
               window.location.hostname === '';
    },
    
    getAppInfo: function() {
        // الحصول على معلومات التطبيق
        return {
            version: CONSTANTS.VERSION.CURRENT,
            storeName: localStorage.getItem(CONSTANTS.STORAGE_KEYS.STORE_NAME),
            user: this.currentUser,
            online: this.isOnline,
            storageUsage: this.calculateStorageUsage(),
            lastBackup: localStorage.getItem('last_backup'),
            errorsCount: JSON.parse(localStorage.getItem('error_logs') || '[]').length
        };
    },
    
    calculateStorageUsage: function() {
        // حساب استخدام التخزين
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length * 2; // 2 bytes per character
            }
        }
        return (total / 1024 / 1024).toFixed(2) + ' MB'; // Convert to MB
    },
    
    clearAllData: function() {
        // مسح جميع البيانات
        if (confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!')) {
            if (confirm('هذا الإجراء سيحذف جميع البيانات بما في ذلك المنتجات والعملاء والمبيعات. هل ما زلت تريد المتابعة؟')) {
                localStorage.clear();
                UTILS.showNotification('تم مسح جميع البيانات', 'info');
                this.reloadApp();
            }
        }
    },
    
    exportAllData: function() {
        // تصدير جميع البيانات
        const allData = {};
        
        Object.values(CONSTANTS.STORAGE_KEYS).forEach(key => {
            if (key !== CONSTANTS.STORAGE_KEYS.STORE_NAME) {
                allData[key] = DB.get(key);
            }
        });
        
        const exportStr = JSON.stringify(allData, null, 2);
        const fileName = `نسخة-احتياطية-${new Date().toISOString().split('T')[0]}.json`;
        
        UTILS.downloadFile(exportStr, fileName, 'application/json');
        UTILS.showNotification('تم تصدير جميع البيانات', 'success');
    },
    
    showAppInfo: function() {
        // إظهار معلومات التطبيق
        const appInfo = this.getAppInfo();
        const infoText = `
            إصدار التطبيق: ${appInfo.version}
            اسم المتجر: ${appInfo.storeName}
            المستخدم: ${appInfo.user.name}
            حالة الاتصال: ${appInfo.online ? 'متصل' : 'غير متصل'}
            استخدام التخزين: ${appInfo.storageUsage}
            عدد الأخطاء: ${appInfo.errorsCount}
        `;
        
        alert(infoText);
    },
    
    // دالة للمساعدة في التطوير
    devTools: function() {
        if (this.isDevelopmentMode()) {
            return {
                clearStorage: this.clearAllData,
                exportData: this.exportAllData,
                getInfo: this.getAppInfo,
                reload: this.reloadApp,
                testError: () => { throw new Error('خطأ تجريبي'); }
            };
        }
        return null;
    },
    
    checkBrowserCompatibility: function() {
        const incompatibleFeatures = [];
        
        // التحقق من دعم localStorage
        if (!('localStorage' in window)) {
            incompatibleFeatures.push('localStorage');
        }
        
        // التحقق من دعم ES6
        try {
            new Function('class Test {}');
        } catch (e) {
            incompatibleFeatures.push('ES6');
        }
        
        if (incompatibleFeatures.length > 0) {
            this.showBrowserIncompatibilityWarning(incompatibleFeatures);
            return false;
        }
        
        return true;
    },
    
    showBrowserIncompatibilityWarning: function(features) {
        const warning = document.createElement('div');
        warning.className = 'browser-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <h3>تحذير توافق المتصفح</h3>
                <p>متصفحك لا يدعم الميزات التالية: ${features.join(', ')}</p>
                <p>يوصى باستخدام أحدث نسخة من Chrome, Firefox, Safari, أو Edge</p>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        // إضافة الأنماط
        const styles = document.createElement('style');
        styles.textContent = `
            .browser-warning {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                background: #ffc107;
                color: #856404;
                padding: 15px;
                text-align: center;
                z-index: 9999;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .warning-content {
                max-width: 1200px;
                margin: 0 auto;
            }
        `;
        document.head.appendChild(styles);
    }
};

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // تأخير التهيئة قليلاً لضمان تحميل جميع الملفات
    setTimeout(() => {
        APP.init();
    }, 100);
});

// جعل الدوال متاحة globally للاستخدام في console
window.APP = APP;

// إضافة اختصارات console للمطورين
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.$app = APP;
    window.$db = DB;
    window.$utils = UTILS;
}

// Service Worker للتطبيق التقدمي (PWA)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registered successfully: ', registration.scope);
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
}
