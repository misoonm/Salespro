// وظائف إدارة قاعدة البيانات المحلية
const DB = {
    // تهيئة قاعدة البيانات
    init: function() {
        console.log('تهيئة قاعدة البيانات...');
        
        // تهيئة جميع جداول البيانات إذا لم تكن موجودة
        const storageKeys = Object.values(CONSTANTS.STORAGE_KEYS);
        
        storageKeys.forEach(key => {
            if (!localStorage.getItem(key)) {
                let defaultValue = [];
                
                if (key === CONSTANTS.STORAGE_KEYS.EMPLOYEES) {
                    defaultValue = [{ 
                        id: this.generateId(), 
                        name: 'مدير النظام', 
                        role: 'مدير',
                        email: 'admin@store.com',
                        phone: '+967123456789',
                        createdAt: new Date().toISOString(),
                        isActive: true
                    }];
                } else if (key === CONSTANTS.STORAGE_KEYS.STORE_NAME) {
                    localStorage.setItem(key, 'متجري');
                    return;
                } else if (key === CONSTANTS.STORAGE_KEYS.SETTINGS) {
                    defaultValue = {
                        enableBarcode: true,
                        enableDiscounts: true,
                        receiptFooter: 'شكراً لشرائكم من متجرنا',
                        currency: 'ريال يمني',
                        currencySymbol: 'ريال',
                        taxRate: 0,
                        printReceipt: true,
                        lowStockThreshold: 10,
                        expiryWarningDays: 30,
                        theme: 'light',
                        language: 'ar'
                    };
                } else if (key === CONSTANTS.STORAGE_KEYS.PRODUCTS) {
                    // بيانات منتجات نموذجية للبداية
                    defaultValue = [
                        {
                            id: this.generateId(),
                            name: 'أرز بسمتي',
                            barcode: '1234567890123',
                            category: 'غذائية',
                            price: 2500,
                            cost: 2000,
                            quantity: 50,
                            minQuantity: 10,
                            supplierId: null,
                            expiryDate: '2024-12-31',
                            image: null,
                            description: 'أرز بسمتي عالي الجودة',
                            supplyDate: '2024-01-15',
                            isActive: true,
                            createdAt: new Date().toISOString()
                        },
                        {
                            id: this.generateId(),
                            name: 'سكر',
                            barcode: '1234567890124',
                            category: 'غذائية',
                            price: 1500,
                            cost: 1200,
                            quantity: 30,
                            minQuantity: 5,
                            supplierId: null,
                            expiryDate: '2025-06-30',
                            image: null,
                            description: 'سكر أبيض ناعم',
                            supplyDate: '2024-02-20',
                            isActive: true,
                            createdAt: new Date().toISOString()
                        }
                    ];
                } else if (key === CONSTANTS.STORAGE_KEYS.SUPPLIERS) {
                    // بيانات موردين نموذجيين للبداية
                    defaultValue = [
                        {
                            id: this.generateId(),
                            name: 'شركة الأغذية المتحدة',
                            contact: 'أحمد محمد',
                            phone: '+967711223344',
                            email: 'info@food-united.com',
                            address: 'صنعاء - شارع الزبيري',
                            products: 'أرز، سكر، دقيق، زيت',
                            accountNumber: '1234567890',
                            balance: 0,
                            isActive: true,
                            createdAt: new Date().toISOString()
                        }
                    ];
                }
                
                try {
                    localStorage.setItem(key, JSON.stringify(defaultValue));
                    console.log(`تم تهيئة ${key} بقيم افتراضية`);
                } catch (error) {
                    console.error(`خطأ في تهيئة ${key}:`, error);
                }
            }
        });
        
        // التحقق من سلامة البيانات
        this.validateData();
    },
    
    // توليد معرف فريد
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
    
    // الحصول على البيانات
    get: function(key, defaultValue = []) {
        try {
            const item = localStorage.getItem(key);
            if (!item) return defaultValue;
            
            const data = JSON.parse(item);
            
            // إذا كان المفتاح هو STORE_NAME أو SETTINGS، لا نعيد كمصفوفة
            if (key === CONSTANTS.STORAGE_KEYS.STORE_NAME) {
                return data;
            }
            
            if (key === CONSTANTS.STORAGE_KEYS.SETTINGS && typeof data === 'object' && !Array.isArray(data)) {
                return data;
            }
            
            return Array.isArray(data) ? data : defaultValue;
        } catch (error) {
            console.error(`خطأ في قراءة ${key}:`, error);
            return defaultValue;
        }
    },
    
    // حفظ البيانات
    set: function(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`خطأ في حفظ ${key}:`, error);
            UTILS.showNotification('خطأ في حفظ البيانات', 'error');
            return false;
        }
    },
    
    // إضافة عنصر جديد
    add: function(key, item) {
        const data = this.get(key);
        
        // إضافة الخصائص الأساسية إذا لم تكن موجودة
        const newItem = {
            ...item,
            id: item.id || this.generateId(),
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        data.push(newItem);
        
        if (this.set(key, data)) {
            return newItem;
        }
        
        return null;
    },
    
    // تحديث عنصر
    update: function(key, id, updates) {
        const data = this.get(key);
        const index = data.findIndex(item => item.id === id);
        
        if (index !== -1) {
            data[index] = { 
                ...data[index], 
                ...updates,
                updatedAt: new Date().toISOString()
            };
            
            if (this.set(key, data)) {
                return data[index];
            }
        }
        
        return null;
    },
    
    // حذف عنصر
    remove: function(key, id) {
        const data = this.get(key);
        const filteredData = data.filter(item => item.id !== id);
        
        if (this.set(key, filteredData)) {
            return true;
        }
        
        return false;
    },
    
    // البحث عن عنصر
    find: function(key, condition) {
        const data = this.get(key);
        return data.find(condition);
    },
    
    // تصفية البيانات
    filter: function(key, condition) {
        const data = this.get(key);
        return data.filter(condition);
    },
    
    // البحث المتقدم
    search: function(key, searchTerm, fields = ['name']) {
        const data = this.get(key);
        
        if (!searchTerm) return data;
        
        return data.filter(item => 
            fields.some(field => {
                const value = item[field];
                if (typeof value === 'string') {
                    return value.toLowerCase().includes(searchTerm.toLowerCase());
                }
                return false;
            })
        );
    },
    
    // الترتيب
    sort: function(key, field, direction = 'asc') {
        const data = this.get(key);
        
        return data.sort((a, b) => {
            let valueA = a[field];
            let valueB = b[field];
            
            // معالجة القيم المختلفة
            if (typeof valueA === 'string') {
                valueA = valueA.toLowerCase();
                valueB = valueB.toLowerCase();
            }
            
            if (valueA < valueB) return direction === 'asc' ? -1 : 1;
            if (valueA > valueB) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    },
    
    // التجميع
    groupBy: function(key, field) {
        const data = this.get(key);
        const grouped = {};
        
        data.forEach(item => {
            const groupValue = item[field];
            if (!grouped[groupValue]) {
                grouped[groupValue] = [];
            }
            grouped[groupValue].push(item);
        });
        
        return grouped;
    },
    
    // العد
    count: function(key, condition = null) {
        const data = this.get(key);
        
        if (condition) {
            return data.filter(condition).length;
        }
        
        return data.length;
    },
    
    // المجموع
    sum: function(key, field, condition = null) {
        const data = this.get(key);
        let filteredData = data;
        
        if (condition) {
            filteredData = data.filter(condition);
        }
        
        return filteredData.reduce((total, item) => {
            const value = parseFloat(item[field]) || 0;
            return total + value;
        }, 0);
    },
    
    // المتوسط
    average: function(key, field, condition = null) {
        const data = this.get(key);
        let filteredData = data;
        
        if (condition) {
            filteredData = data.filter(condition);
        }
        
        if (filteredData.length === 0) return 0;
        
        const total = this.sum(key, field, condition);
        return total / filteredData.length;
    },
    
    // الحصول على صفحة من البيانات
    paginate: function(key, page = 1, pageSize = 10, condition = null) {
        const data = this.get(key);
        let filteredData = data;
        
        if (condition) {
            filteredData = data.filter(condition);
        }
        
        const totalItems = filteredData.length;
        const totalPages = Math.ceil(totalItems / pageSize);
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, totalItems);
        
        return {
            data: filteredData.slice(startIndex, endIndex),
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
    
    // النسخ الاحتياطي
    backup: function() {
        const backupData = {};
        const storageKeys = Object.values(CONSTANTS.STORAGE_KEYS);
        
        storageKeys.forEach(key => {
            backupData[key] = this.get(key);
        });
        
        const backupStr = JSON.stringify(backupData);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `backup-${timestamp}.json`;
        
        UTILS.downloadFile(backupStr, fileName, 'application/json');
        UTILS.showNotification('تم إنشاء نسخة احتياطية بنجاح', 'success');
        
        return backupData;
    },
    
    // استعادة النسخة الاحتياطية
    restore: function(backupData) {
        if (!backupData || typeof backupData !== 'object') {
            UTILS.showNotification('بيانات النسخة الاحتياطية غير صالحة', 'error');
            return false;
        }
        
        try {
            Object.keys(backupData).forEach(key => {
                if (Object.values(CONSTANTS.STORAGE_KEYS).includes(key)) {
                    this.set(key, backupData[key]);
                }
            });
            
            UTILS.showNotification('تم استعادة النسخة الاحتياطية بنجاح', 'success');
            return true;
        } catch (error) {
            console.error('خطأ في استعادة النسخة الاحتياطية:', error);
            UTILS.showNotification('خطأ في استعادة النسخة الاحتياطية', 'error');
            return false;
        }
    },
    
    // استيراد البيانات من ملف
    importFromFile: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backupData = JSON.parse(e.target.result);
                    if (this.restore(backupData)) {
                        resolve(true);
                    } else {
                        reject(new Error('فشل في استيراد البيانات'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    },
    
    // مسح جميع البيانات
    clearAll: function() {
        if (!confirm('هل أنت متأكد من مسح جميع البيانات؟ لا يمكن التراجع عن هذا الإجراء!')) {
            return false;
        }
        
        const storageKeys = Object.values(CONSTANTS.STORAGE_KEYS);
        
        storageKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // إعادة التهيئة
        this.init();
        
        UTILS.showNotification('تم مسح جميع البيانات وإعادة التهيئة', 'info');
        return true;
    },
    
    // التحقق من سلامة البيانات
    validateData: function() {
        const storageKeys = Object.values(CONSTANTS.STORAGE_KEYS);
        let isValid = true;
        
        storageKeys.forEach(key => {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    JSON.parse(data);
                }
            } catch (error) {
                console.error(`بيانات ${key} تالفة:`, error);
                isValid = false;
                
                // محاولة إصلاح البيانات التالفة
                this.repairData(key);
            }
        });
        
        return isValid;
    },
    
    // إصلاح البيانات التالفة
    repairData: function(key) {
        try {
            localStorage.removeItem(key);
            this.init(); // إعادة التهيئة
            
            console.log(`تم إصلاح البيانات التالفة لـ ${key}`);
            UTILS.showNotification(`تم إصلاح البيانات التالفة لـ ${key}`, 'warning');
            
            return true;
        } catch (error) {
            console.error(`فشل في إصلاح ${key}:`, error);
            return false;
        }
    },
    
    // الحصول على إحصائيات قاعدة البيانات
    getStats: function() {
        const stats = {};
        const storageKeys = Object.values(CONSTANTS.STORAGE_KEYS);
        
        storageKeys.forEach(key => {
            const data = this.get(key);
            stats[key] = {
                count: Array.isArray(data) ? data.length : 1,
                size: JSON.stringify(data).length,
                lastUpdated: this.getLastUpdated(key)
            };
        });
        
        return stats;
    },
    
    // الحصول على وقت آخر تحديث
    getLastUpdated: function(key) {
        try {
            const data = this.get(key);
            if (Array.isArray(data) && data.length > 0) {
                // البحث عن آخر عنصر تم تحديثه
                const lastItem = data.reduce((latest, item) => {
                    const itemTime = new Date(item.updatedAt || item.createdAt || 0).getTime();
                    const latestTime = new Date(latest.updatedAt || latest.createdAt || 0).getTime();
                    return itemTime > latestTime ? item : latest;
                }, data[0]);
                
                return lastItem.updatedAt || lastItem.createdAt;
            }
            return null;
        } catch (error) {
            return null;
        }
    },
    
    // البحث عن المنتجات المنخفضة المخزون
    getLowStockProducts: function() {
        const products = this.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const settings = this.get(CONSTANTS.STORAGE_KEYS.SETTINGS);
        const threshold = settings.lowStockThreshold || 10;
        
        return products.filter(product => 
            product.isActive !== false && 
            product.quantity <= threshold
        );
    },
    
    // البحث عن المنتجات المنتهية الصلاحية أو القريبة من الانتهاء
    getExpiringProducts: function() {
        const products = this.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const settings = this.get(CONSTANTS.STORAGE_KEYS.SETTINGS);
        const warningDays = settings.expiryWarningDays || 30;
        
        const today = new Date();
        
        return products.filter(product => {
            if (!product.expiryDate || product.isActive === false) return false;
            
            const expiryDate = new Date(product.expiryDate);
            const diffTime = expiryDate - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return diffDays <= warningDays;
        });
    },
    
    // الحصول على المبيعات ضمن نطاق تاريخ
    getSalesByDateRange: function(startDate, endDate) {
        const sales = this.get(CONSTANTS.STORAGE_KEYS.SALES);
        
        return sales.filter(sale => {
            const saleDate = new Date(sale.date);
            const start = new Date(startDate);
            const end = new Date(endDate);
            
            return saleDate >= start && saleDate <= end;
        });
    },
    
    // الحصول على إجمالي المبيعات لنطاق تاريخ
    getTotalSalesByDateRange: function(startDate, endDate) {
        const sales = this.getSalesByDateRange(startDate, endDate);
        return sales.reduce((total, sale) => total + sale.total, 0);
    },
    
    // الحصول على أفضل المنتجات مبيعاً
    getTopSellingProducts: function(limit = 5) {
        const sales = this.get(CONSTANTS.STORAGE_KEYS.SALES);
        const productSales = {};
        
        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!productSales[item.productId]) {
                    productSales[item.productId] = {
                        productId: item.productId,
                        name: item.name,
                        quantity: 0,
                        revenue: 0
                    };
                }
                
                productSales[item.productId].quantity += item.quantity;
                productSales[item.productId].revenue += item.price * item.quantity;
            });
        });
        
        return Object.values(productSales)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit);
    },
    
    // تحديث المخزون بعد البيع
    updateInventoryAfterSale: function(saleItems) {
        const products = this.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        let updatedCount = 0;
        
        saleItems.forEach(saleItem => {
            const productIndex = products.findIndex(p => p.id === saleItem.productId);
            if (productIndex !== -1 && products[productIndex].quantity >= saleItem.quantity) {
                products[productIndex].quantity -= saleItem.quantity;
                updatedCount++;
            }
        });
        
        if (updatedCount > 0) {
            this.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
        }
        
        return updatedCount;
    },
    
    // استعادة المخزون بعد حذف البيع
    restoreInventoryAfterSaleDeletion: function(saleItems) {
        const products = this.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        let restoredCount = 0;
        
        saleItems.forEach(saleItem => {
            const productIndex = products.findIndex(p => p.id === saleItem.productId);
            if (productIndex !== -1) {
                products[productIndex].quantity += saleItem.quantity;
                restoredCount++;
            }
        });
        
        if (restoredCount > 0) {
            this.set(CONSTANTS.STORAGE_KEYS.PRODUCTS, products);
        }
        
        return restoredCount;
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.DB = DB;
