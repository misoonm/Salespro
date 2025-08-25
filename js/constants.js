// الثوابت العامة للتطبيق
const CONSTANTS = {
    // مفاتيح التخزين المحلي
    STORAGE_KEYS: {
        PRODUCTS: 'products',
        SALES: 'sales',
        CREDIT_SALES: 'creditSales',
        PAID_CREDIT_SALES: 'paidCreditSales',
        SUPPLIERS: 'suppliers',
        PURCHASES: 'purchases',
        EMPLOYEES: 'employees',
        EXPENSES: 'expenses',
        STORE_NAME: 'storeName',
        SETTINGS: 'settings',
        CUSTOMERS: 'customers',
        CATEGORIES: 'categories',
        TAXES: 'taxes'
    },

    // أنواع المنتجات والفئات
    CATEGORIES: [
        'غذائية',
        'مشروبات',
        'ملابس',
        'أحذية',
        'الكترونيات',
        'أجهزة منزلية',
        'أثاث',
        'ادوات منزلية',
        'محروقات',
        'مواد بناء',
        'أدوات كهربائية',
        'عطور ومستحضرات تجميل',
        'ألعاب وأطفال',
        'كتب وقرطاسية',
        'رياضة ولياقة',
        'سيارات ودراجات',
        'حيوانات أليفة',
        'زراعة وحدائق',
        'صحة وطب',
        '其他' // أخرى
    ],

    // وحدات القياس
    UNITS: {
        PIECE: 'قطعة',
        KILOGRAM: 'كيلوغرام',
        GRAM: 'غرام',
        LITER: 'لتر',
        MILLILITER: 'ملليلتر',
        METER: 'متر',
        CENTIMETER: 'سنتيمتر',
        PACK: 'عبوة',
        BOX: 'صندوق',
        BOTTLE: 'زجاجة',
        CAN: 'علبة'
    },

    // طرق الدفع
    PAYMENT_METHODS: [
        { value: 'نقدي', label: 'نقدي', icon: 'bi-cash' },
        { value: 'بطاقة', label: 'بطاقة ائتمان', icon: 'bi-credit-card' },
        { value: 'تحويل', label: 'تحويل بنكي', icon: 'bi-bank' },
        { value: 'آجل', label: 'آجل (دين)', icon: 'bi-clock-history' },
        { value: 'محفظة', label: 'محفظة إلكترونية', icon: 'bi-wallet' },
        { value: 'أخرى', label: 'أخرى', icon: 'bi-three-dots' }
    ],

    // حالات الفواتير
    INVOICE_STATUS: {
        PENDING: 'قيد المعالجة',
        COMPLETED: 'مكتمل',
        CANCELLED: 'ملغي',
        REFUNDED: 'مرتجع',
        PARTIAL: 'جزئي'
    },

    // حالات المبيعات الآجلة
    CREDIT_STATUS: {
        PENDING: 'قيد السداد',
        PARTIAL: 'سداد جزئي',
        PAID: 'مسدد',
        OVERDUE: 'متأخر',
        CANCELLED: 'ملغي'
    },

    // أنواع الخصم
    DISCOUNT_TYPES: {
        PERCENT: 'percent',
        FIXED: 'fixed',
        NONE: 'none'
    },

    // إعدادات المتجر الافتراضية
    DEFAULT_SETTINGS: {
        storeName: 'متجري',
        currency: 'ريال يمني',
        currencySymbol: 'ريال',
        currencyPosition: 'after',
        taxRate: 0,
        taxInclusive: false,
        lowStockThreshold: 10,
        expiryWarningDays: 30,
        receiptFooter: 'شكراً لشرائكم من متجرنا\nنتمنى لكم يومًا سعيداً',
        printReceipt: true,
        enableBarcode: true,
        enableDiscounts: true,
        enableTax: false,
        language: 'ar',
        theme: 'light',
        dateFormat: 'dd/MM/yyyy',
        timeFormat: '12h',
        autoPrint: false,
        backupInterval: 7,
        customerPoints: false,
        multiCurrency: false,
        defaultPaymentMethod: 'نقدي'
    },

    // الألوان والثيمات
    COLORS: {
        PRIMARY: '#4e73df',
        SECONDARY: '#6c757d',
        SUCCESS: '#1cc88a',
        DANGER: '#e74a3b',
        WARNING: '#f6c23e',
        INFO: '#36b9cc',
        LIGHT: '#f8f9fc',
        DARK: '#5a5c69',
        
        // تدرجات الألوان
        GRADIENTS: {
            PRIMARY: ['#4e73df', '#2a4b9e'],
            SUCCESS: ['#1cc88a', '#138a5e'],
            DANGER: ['#e74a3b', '#b21f15'],
            WARNING: ['#f6c23e', '#c99a1a'],
            INFO: ['#36b9cc', '#258391']
        }
    },

    // أحجام الشاشات
    BREAKPOINTS: {
        XS: 0,
        SM: 576,
        MD: 768,
        LG: 992,
        XL: 1200,
        XXL: 1400
    },

    // رموز الأخطاء
    ERROR_CODES: {
        PRODUCT_NOT_FOUND: 'PRODUCT_001',
        INSUFFICIENT_STOCK: 'STOCK_001',
        INVALID_PAYMENT: 'PAYMENT_001',
        DATABASE_ERROR: 'DB_001',
        NETWORK_ERROR: 'NET_001',
        PERMISSION_DENIED: 'AUTH_001',
        VALIDATION_ERROR: 'VALID_001'
    },

    // رسائل الأخطاء
    ERROR_MESSAGES: {
        PRODUCT_NOT_FOUND: 'المنتج غير موجود',
        INSUFFICIENT_STOCK: 'الكمية غير متوفرة في المخزون',
        INVALID_PAYMENT: 'طريقة الدفع غير صالحة',
        DATABASE_ERROR: 'خطأ في قاعدة البيانات',
        NETWORK_ERROR: 'خطأ في الاتصال بالشبكة',
        PERMISSION_DENIED: 'ليس لديك صلاحية للقيام بهذا الإجراء',
        VALIDATION_ERROR: 'بيانات غير صالحة'
    },

    // رسائل النجاح
    SUCCESS_MESSAGES: {
        PRODUCT_ADDED: 'تم إضافة المنتج بنجاح',
        PRODUCT_UPDATED: 'تم تحديث المنتج بنجاح',
        PRODUCT_DELETED: 'تم حذف المنتج بنجاح',
        SALE_COMPLETED: 'تم إتمام البيع بنجاح',
        PAYMENT_RECEIVED: 'تم استلام الدفعة بنجاح',
        DATA_SAVED: 'تم حفظ البيانات بنجاح',
        BACKUP_CREATED: 'تم إنشاء نسخة احتياطية بنجاح',
        RESTORE_COMPLETED: 'تم استعادة البيانات بنجاح'
    },

    // أنواع الإشعارات
    NOTIFICATION_TYPES: {
        SUCCESS: 'success',
        ERROR: 'error',
        WARNING: 'warning',
        INFO: 'info'
    },

    // فترات الوقت
    TIME_PERIODS: {
        TODAY: 'today',
        YESTERDAY: 'yesterday',
        THIS_WEEK: 'this_week',
        LAST_WEEK: 'last_week',
        THIS_MONTH: 'this_month',
        LAST_MONTH: 'last_month',
        THIS_QUARTER: 'this_quarter',
        LAST_QUARTER: 'last_quarter',
        THIS_YEAR: 'this_year',
        LAST_YEAR: 'last_year',
        CUSTOM: 'custom'
    },

    // أنواع التقارير
    REPORT_TYPES: {
        SALES: 'sales',
        INVENTORY: 'inventory',
        FINANCIAL: 'financial',
        CUSTOMER: 'customer',
        SUPPLIER: 'supplier',
        PRODUCT: 'product',
        EMPLOYEE: 'employee'
    },

    // صيغ التصدير
    EXPORT_FORMATS: {
        PDF: 'pdf',
        EXCEL: 'excel',
        CSV: 'csv',
        JSON: 'json'
    },

    // أدوار المستخدمين
    USER_ROLES: {
        ADMIN: 'admin',
        MANAGER: 'manager',
        CASHIER: 'cashier',
        STOCK_KEEPER: 'stock_keeper',
        VIEWER: 'viewer'
    },

    // صلاحيات المستخدمين
    PERMISSIONS: {
        // المنتجات
        VIEW_PRODUCTS: 'view_products',
        ADD_PRODUCTS: 'add_products',
        EDIT_PRODUCTS: 'edit_products',
        DELETE_PRODUCTS: 'delete_products',
        
        // المبيعات
        VIEW_SALES: 'view_sales',
        CREATE_SALES: 'create_sales',
        EDIT_SALES: 'edit_sales',
        DELETE_SALES: 'delete_sales',
        
        // العملاء
        VIEW_CUSTOMERS: 'view_customers',
        ADD_CUSTOMERS: 'add_customers',
        EDIT_CUSTOMERS: 'edit_customers',
        DELETE_CUSTOMERS: 'delete_customers',
        
        // الموردين
        VIEW_SUPPLIERS: 'view_suppliers',
        ADD_SUPPLIERS: 'add_suppliers',
        EDIT_SUPPLIERS: 'edit_suppliers',
        DELETE_SUPPLIERS: 'delete_suppliers',
        
        // التقارير
        VIEW_REPORTS: 'view_reports',
        EXPORT_REPORTS: 'export_reports',
        
        // الإعدادات
        MANAGE_SETTINGS: 'manage_settings',
        MANAGE_USERS: 'manage_users',
        
        // النظام
        BACKUP_RESTORE: 'backup_restore',
        VIEW_LOGS: 'view_logs'
    },

    // أنماط التصميم
    THEMES: {
        LIGHT: {
            name: 'light',
            colors: {
                primary: '#4e73df',
                background: '#f8f9fc',
                text: '#5a5c69',
                border: '#e3e6f0',
                card: '#ffffff',
                success: '#1cc88a',
                danger: '#e74a3b',
                warning: '#f6c23e'
            }
        },
        DARK: {
            name: 'dark',
            colors: {
                primary: '#4e73df',
                background: '#2a2b3d',
                text: '#eaecf4',
                border: '#3f4051',
                card: '#353646',
                success: '#1cc88a',
                danger: '#e74a3b',
                warning: '#f6c23e'
            }
        },
        BLUE: {
            name: 'blue',
            colors: {
                primary: '#4e73df',
                background: '#f0f8ff',
                text: '#2c5282',
                border: '#bee3f8',
                card: '#ffffff',
                success: '#38a169',
                danger: '#e53e3e',
                warning: '#d69e2e'
            }
        }
    },

    // اللغات المدعومة
    LANGUAGES: {
        AR: { code: 'ar', name: 'العربية', dir: 'rtl' },
        EN: { code: 'en', name: 'English', dir: 'ltr' },
        FR: { code: 'fr', name: 'Français', dir: 'ltr' }
    },

    // تنسيقات التاريخ والوقت
    DATE_FORMATS: {
        'dd/MM/yyyy': 'يوم/شهر/سنة',
        'MM/dd/yyyy': 'شهر/يوم/سنة',
        'yyyy-MM-dd': 'سنة-شهر-يوم',
        'dd MMM yyyy': 'يوم شهر سنة'
    },

    TIME_FORMATS: {
        '12h': '12 ساعة (AM/PM)',
        '24h': '24 ساعة'
    },

    // وحدات العملة
    CURRENCIES: {
        YER: { code: 'YER', symbol: 'ريال', name: 'ريال يمني' },
        SAR: { code: 'SAR', symbol: 'ر.س', name: 'ريال سعودي' },
        USD: { code: 'USD', symbol: '$', name: 'دولار أمريكي' },
        EUR: { code: 'EUR', symbol: '€', name: 'يورو' },
        EGP: { code: 'EGP', symbol: 'ج.م', name: 'جنيه مصري' }
    },

    // أنواع الضرائب
    TAX_TYPES: {
        VAT: 'vat',        // ضريبة القيمة المضافة
        SALES: 'sales',    // ضريبة المبيعات
        INCOME: 'income',  // ضريبة الدخل
        NONE: 'none'       // بدون ضريبة
    },

    // حالات المخزون
    STOCK_STATUS: {
        IN_STOCK: 'in_stock',      // متوفر
        LOW_STOCK: 'low_stock',    // منخفض
        OUT_OF_STOCK: 'out_of_stock', // منتهي
        DISCONTINUED: 'discontinued' // متوقف
    },

    // أنواع الموردين
    SUPPLIER_TYPES: {
        WHOLESALER: 'wholesaler',  // جملة
        RETAILER: 'retailer',      // تجزئة
        MANUFACTURER: 'manufacturer', // مصنع
        IMPORTER: 'importer',      // مستورد
        DISTRIBUTOR: 'distributor' // موزع
    },

    // طرق الشحن
    SHIPPING_METHODS: {
        STANDARD: 'standard',  // عادي
        EXPRESS: 'express',    // سريع
        PICKUP: 'pickup',      // استلام من المتجر
        FREE: 'free'           // مجاني
    },

    // أنواع العملاء
    CUSTOMER_TYPES: {
        REGULAR: 'regular',    // عادي
        VIP: 'vip',            // مهم
        WHOLESALE: 'wholesale', // جملة
        CORPORATE: 'corporate'  // شركات
    },

    // مستويات الأولوية
    PRIORITY_LEVELS: {
        LOW: 'low',        // منخفض
        MEDIUM: 'medium',  // متوسط
        HIGH: 'high',      // عالي
        URGENT: 'urgent'   // عاجل
    },

    // حالة الطلبات
    ORDER_STATUS: {
        PENDING: 'pending',        // قيد الانتظار
        PROCESSING: 'processing',  // قيد المعالجة
        SHIPPED: 'shipped',        // تم الشحن
        DELIVERED: 'delivered',    // تم التسليم
        CANCELLED: 'cancelled',    // ملغي
        RETURNED: 'returned'       // مرتجع
    },

    // أنواع التنبيهات
    ALERT_TYPES: {
        STOCK: 'stock',            // تنبيهات المخزون
        EXPIRY: 'expiry',          // تنبيهات انتهاء الصلاحية
        PAYMENT: 'payment',        // تنبيهات الدفع
        SECURITY: 'security',      // تنبيهات الأمان
        SYSTEM: 'system'           // تنبيهات النظام
    },

    // إعدادات النسخ الاحتياطي
    BACKUP_SETTINGS: {
        AUTO_BACKUP: true,
        BACKUP_INTERVAL: 7, // أيام
        MAX_BACKUPS: 30,
        CLOUD_BACKUP: false
    },

    // حدود النظام
    SYSTEM_LIMITS: {
        MAX_PRODUCTS: 10000,
        MAX_CUSTOMERS: 5000,
        MAX_SUPPLIERS: 1000,
        MAX_USERS: 50,
        MAX_CATEGORIES: 100,
        MAX_SALES_PER_DAY: 1000,
        MAX_IMPORT_RECORDS: 1000
    },

    // إصدار النظام
    VERSION: {
        CURRENT: '1.0.0',
        MINIMUM: '1.0.0',
        LATEST: '1.0.0'
    },

    // معلومات التطبيق
    APP_INFO: {
        NAME: 'نظام إدارة المحلات التجارية',
        DESCRIPTION: 'نظام متكامل لإدارة المبيعات والمخزون والعملاء',
        DEVELOPER: 'فريق التطوير',
        WEBSITE: 'https://example.com',
        SUPPORT_EMAIL: 'support@example.com',
        PHONE: '+967123456789'
    },

    // روابط مهمة
    LINKS: {
        DOCUMENTATION: 'https://docs.example.com',
        SUPPORT: 'https://support.example.com',
        FORUM: 'https://forum.example.com',
        CHANGELOG: 'https://changelog.example.com'
    },

    // رموز الباركود
    BARCODE_TYPES: {
        UPC: 'UPC',
        EAN: 'EAN',
        CODE39: 'CODE39',
        CODE128: 'CODE128',
        QR: 'QR'
    },

    // إعدادات الطباعة
    PRINT_SETTINGS: {
        PAPER_SIZE: '80mm',
        FONT_SIZE: 'small',
        LOGO: true,
        HEADER: true,
        FOOTER: true,
        AUTO_PRINT: false
    },

    // أنواع المرفقات
    ATTACHMENT_TYPES: {
        IMAGE: 'image',
        DOCUMENT: 'document',
        INVOICE: 'invoice',
        RECEIPT: 'receipt',
        CONTRACT: 'contract'
    }
};

// جعل الثوابت متاحة globally
window.CONSTANTS = CONSTANTS;
