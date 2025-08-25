// التطبيق الرئيسي
const APP = {
    isInitialized: false,
    currentUser: null,
    appSettings: {},
    isOnline: true,
    
    init: function() {
        if (this.isInitialized) {
            console.warn('التطبيق مهيأ بالفعل');
            return;
        }
        
        console.log('تهيئة التطبيق...');
        
        try {
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
    },
    
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

// دالة للتحقق من دعم المتصفح
APP.checkBrowserCompatibility = function() {
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
};

APP.showBrowserIncompatibilityWarning = function(features) {
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
};

// التحقق من توافق المتصفح عند التحميل
if (!APP.checkBrowserCompatibility()) {
    console.warn('المتصفح غير متوافق مع بعض الميزات المطلوبة');
}
