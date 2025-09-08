// db.js - قاعدة بيانات IndexedDB لنظام إدارة المحلات التجارية

class StoreManagementDB {
    constructor() {
        this.dbName = 'StoreManagementDB';
        this.version = 1;
        this.db = null;
    }

    // فتح الاتصال بقاعدة البيانات
    async open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('فشل في فتح قاعدة البيانات');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                this.createStores(db);
                console.log('تم إنشاء/ترقية قاعدة البيانات');
            };
        });
    }

    // إنشاء جميع الجداول (object stores)
    createStores(db) {
        // جدول المنتجات
        if (!db.objectStoreNames.contains('products')) {
            const productsStore = db.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
            productsStore.createIndex('categoryId', 'categoryId', { unique: false });
            productsStore.createIndex('supplierId', 'supplierId', { unique: false });
            productsStore.createIndex('barcode', 'barcode', { unique: true });
            productsStore.createIndex('name', 'name', { unique: false });
        }

        // جدول الفئات
        if (!db.objectStoreNames.contains('categories')) {
            const categoriesStore = db.createObjectStore('categories', { keyPath: 'id', autoIncrement: true });
            categoriesStore.createIndex('name', 'name', { unique: true });
        }

        // جدول الموردين
        if (!db.objectStoreNames.contains('suppliers')) {
            const suppliersStore = db.createObjectStore('suppliers', { keyPath: 'id', autoIncrement: true });
            suppliersStore.createIndex('name', 'name', { unique: true });
            suppliersStore.createIndex('phone', 'phone', { unique: true });
        }

        // جدول العملاء
        if (!db.objectStoreNames.contains('customers')) {
            const customersStore = db.createObjectStore('customers', { keyPath: 'id', autoIncrement: true });
            customersStore.createIndex('phone', 'phone', { unique: true });
            customersStore.createIndex('name', 'name', { unique: false });
        }

        // جدول المبيعات
        if (!db.objectStoreNames.contains('sales')) {
            const salesStore = db.createObjectStore('sales', { keyPath: 'id', autoIncrement: true });
            salesStore.createIndex('customerId', 'customerId', { unique: false });
            salesStore.createIndex('date', 'date', { unique: false });
            salesStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
        }

        // جدول تفاصيل المبيعات
        if (!db.objectStoreNames.contains('saleDetails')) {
            const saleDetailsStore = db.createObjectStore('saleDetails', { keyPath: 'id', autoIncrement: true });
            saleDetailsStore.createIndex('saleId', 'saleId', { unique: false });
            saleDetailsStore.createIndex('productId', 'productId', { unique: false });
        }

        // جدول المشتريات
        if (!db.objectStoreNames.contains('purchases')) {
            const purchasesStore = db.createObjectStore('purchases', { keyPath: 'id', autoIncrement: true });
            purchasesStore.createIndex('supplierId', 'supplierId', { unique: false });
            purchasesStore.createIndex('date', 'date', { unique: false });
            purchasesStore.createIndex('invoiceNumber', 'invoiceNumber', { unique: true });
        }

        // جدول تفاصيل المشتريات
        if (!db.objectStoreNames.contains('purchaseDetails')) {
            const purchaseDetailsStore = db.createObjectStore('purchaseDetails', { keyPath: 'id', autoIncrement: true });
            purchaseDetailsStore.createIndex('purchaseId', 'purchaseId', { unique: false });
            purchaseDetailsStore.createIndex('productId', 'productId', { unique: false });
        }

        // جدول المستخدمين
        if (!db.objectStoreNames.contains('users')) {
            const usersStore = db.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
            usersStore.createIndex('username', 'username', { unique: true });
            usersStore.createIndex('email', 'email', { unique: true });
        }

        // جدول المخازن
        if (!db.objectStoreNames.contains('inventory')) {
            const inventoryStore = db.createObjectStore('inventory', { keyPath: 'id', autoIncrement: true });
            inventoryStore.createIndex('productId', 'productId', { unique: true });
        }

        // جدول الإعدادات
        if (!db.objectStoreNames.contains('settings')) {
            const settingsStore = db.createObjectStore('settings', { keyPath: 'id', autoIncrement: true });
            settingsStore.createIndex('key', 'key', { unique: true });
        }

        // جدول المصروفات
        if (!db.objectStoreNames.contains('expenses')) {
            const expensesStore = db.createObjectStore('expenses', { keyPath: 'id', autoIncrement: true });
            expensesStore.createIndex('date', 'date', { unique: false });
            expensesStore.createIndex('category', 'category', { unique: false });
        }
    }

    // إضافة سجل جديد
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // الحصول على سجل بواسطة المعرف
    async get(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // الحصول على جميع السجلات
    async getAll(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // تحديث سجل
    async update(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // حذف سجل
    async delete(storeName, id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // الحصول على سجلات باستخدام الفهرس
    async getByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // الحصول على سجل واحد باستخدام الفهرس
    async getOneByIndex(storeName, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.get(value);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // إضافة بيانات أولية للاختبار
    async seedInitialData() {
        // إضافة فئات
        const categories = [
            { name: 'أجهزة إلكترونية', description: 'الأجهزة الإلكترونية والكهربائية' },
            { name: 'ملابس', description: 'ملابس رجالية ونسائية وأطفال' },
            { name: 'أغذية', description: 'منتجات غذائية ومعلبات' },
            { name: 'أثاث', description: 'أثاث منزلي ومكتبي' }
        ];

        for (const category of categories) {
            await this.add('categories', category);
        }

        // إضافة موردين
        const suppliers = [
            { 
                name: 'شركة التقنية للأجهزة', 
                phone: '0123456789', 
                email: 'tech@example.com', 
                address: 'شارع التجارة، الرياض' 
            },
            { 
                name: 'مصنع الأزياء', 
                phone: '0987654321', 
                email: 'fashion@example.com', 
                address: 'حي الصناعة، جدة' 
            }
        ];

        for (const supplier of suppliers) {
            await this.add('suppliers', supplier);
        }

        // إضافة منتجات
        const products = [
            {
                name: 'هاتف ذكي',
                barcode: '1234567890123',
                price: 1500,
                cost: 1200,
                quantity: 50,
                categoryId: 1,
                supplierId: 1,
                minStock: 5
            },
            {
                name: 'قلم جاف',
                barcode: '1234567890124',
                price: 2,
                cost: 1,
                quantity: 200,
                categoryId: 1,
                supplierId: 1,
                minStock: 20
            },
            {
                name: 'قميص رجالي',
                barcode: '1234567890125',
                price: 80,
                cost: 50,
                quantity: 100,
                categoryId: 2,
                supplierId: 2,
                minStock: 10
            }
        ];

        for (const product of products) {
            await this.add('products', product);
        }

        // إضافة مستخدم
        const user = {
            username: 'admin',
            password: 'admin123', // في التطبيق الحقيقي يجب تشفير كلمة المرور
            email: 'admin@store.com',
            fullName: 'مدير النظام',
            role: 'admin',
            isActive: true
        };

        await this.add('users', user);

        // إضافة إعدادات
        const settings = [
            { key: 'storeName', value: 'متجري الإلكتروني' },
            { key: 'currency', value: 'ريال سعودي' },
            { key: 'taxRate', value: '15' },
            { key: 'receiptHeader', value: 'مرحبا بكم في متجرنا' }
        ];

        for (const setting of settings) {
            await this.add('settings', setting);
        }

        console.log('تم إضافة البيانات الأولية بنجاح');
    }

    // إنشاء فاتورة بيع جديدة
    async createSale(saleData, saleItems) {
        const transaction = this.db.transaction(['sales', 'saleDetails', 'inventory', 'products'], 'readwrite');
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            
            // إضافة الفاتورة
            const salesStore = transaction.objectStore('sales');
            const saleRequest = salesStore.add(saleData);
            
            saleRequest.onsuccess = (event) => {
                const saleId = event.target.result;
                
                // إضافة عناصر الفاتورة وتحديث المخزون
                const saleDetailsStore = transaction.objectStore('saleDetails');
                const inventoryStore = transaction.objectStore('inventory');
                const productsStore = transaction.objectStore('products');
                
                saleItems.forEach(async (item) => {
                    // إضافة عنصر الفاتورة
                    const saleDetail = { ...item, saleId };
                    saleDetailsStore.add(saleDetail);
                    
                    // تحديث كمية المنتج في المخزون
                    const productRequest = productsStore.get(item.productId);
                    productRequest.onsuccess = (e) => {
                        const product = e.target.result;
                        if (product) {
                            product.quantity -= item.quantity;
                            productsStore.put(product);
                        }
                    };
                });
            };
        });
    }

    // إنشاء فاتورة شراء جديدة
    async createPurchase(purchaseData, purchaseItems) {
        const transaction = this.db.transaction(['purchases', 'purchaseDetails', 'inventory', 'products'], 'readwrite');
        
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve(true);
            transaction.onerror = () => reject(transaction.error);
            
            // إضافة الفاتورة
            const purchasesStore = transaction.objectStore('purchases');
            const purchaseRequest = purchasesStore.add(purchaseData);
            
            purchaseRequest.onsuccess = (event) => {
                const purchaseId = event.target.result;
                
                // إضافة عناصر الفاتورة وتحديث المخزون
                const purchaseDetailsStore = transaction.objectStore('purchaseDetails');
                const inventoryStore = transaction.objectStore('inventory');
                const productsStore = transaction.objectStore('products');
                
                purchaseItems.forEach(async (item) => {
                    // إضافة عنصر الفاتورة
                    const purchaseDetail = { ...item, purchaseId };
                    purchaseDetailsStore.add(purchaseDetail);
                    
                    // تحديث كمية المنتج في المخزون
                    const productRequest = productsStore.get(item.productId);
                    productRequest.onsuccess = (e) => {
                        const product = e.target.result;
                        if (product) {
                            product.quantity += item.quantity;
                            product.cost = item.cost; // تحديث سعر التكلفة
                            productsStore.put(product);
                        }
                    };
                });
            };
        });
    }

    // الحصول على تقرير المبيعات لفترة محددة
    async getSalesReport(startDate, endDate) {
        const sales = await this.getAll('sales');
        const filteredSales = sales.filter(sale => {
            const saleDate = new Date(sale.date);
            return saleDate >= startDate && saleDate <= endDate;
        });
        
        let totalSales = 0;
        let totalItems = 0;
        
        for (const sale of filteredSales) {
            totalSales += sale.totalAmount;
            
            const saleDetails = await this.getByIndex('saleDetails', 'saleId', sale.id);
            totalItems += saleDetails.reduce((sum, detail) => sum + detail.quantity, 0);
        }
        
        return {
            totalSales,
            totalItems,
            numberOfInvoices: filteredSales.length,
            sales: filteredSales
        };
    }

    // الحصول على تقرير المنتجات الأكثر مبيعاً
    async getTopSellingProducts(limit = 10) {
        const saleDetails = await this.getAll('saleDetails');
        const productSales = {};
        
        // تجميع كميات البيع لكل منتج
        for (const detail of saleDetails) {
            if (!productSales[detail.productId]) {
                productSales[detail.productId] = 0;
            }
            productSales[detail.productId] += detail.quantity;
        }
        
        // تحويل إلى مصفوفة وترتيب تنازلي
        const topProducts = [];
        for (const productId in productSales) {
            const product = await this.get('products', parseInt(productId));
            if (product) {
                topProducts.push({
                    productId: parseInt(productId),
                    productName: product.name,
                    quantitySold: productSales[productId],
                    revenue: productSales[productId] * product.price
                });
            }
        }
        
        return topProducts
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, limit);
    }

    // التحقق من المنتجات التي تحت مستوى المخزون الأدنى
    async checkLowStock() {
        const products = await this.getAll('products');
        return products.filter(product => product.quantity <= product.minStock);
    }

    // إغلاق الاتصال بقاعدة البيانات
    close() {
        if (this.db) {
            this.db.close();
            console.log('تم إغلاق قاعدة البيانات');
        }
    }
}

// إنشاء وتصدير instance من قاعدة البيانات
const storeDB = new StoreManagementDB();

// فتح الاتصال بقاعدة البيانات وإضافة بيانات أولية عند التحميل
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await storeDB.open();
        // يمكنك إلغاء التعليق من السطر التالي لإضافة بيانات أولية للاختبار
        // await storeDB.seedInitialData();
    } catch (error) {
        console.error('فشل في تهيئة قاعدة البيانات:', error);
    }
});

export default storeDB;
