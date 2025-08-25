// إدارة التنقل بين الأقسام
const NAVIGATION = {
    currentSection: 'dashboard-section',
    previousSection: null,
    navigationHistory: [],
    isSidebarOpen: false,
    
    init: function() {
        this.setupNavigationHandlers();
        this.updateDateTime();
        this.setupThemeToggle();
        this.setupKeyboardNavigation();
        this.setupResizeHandler();
        this.setupIdleTimer();
        
        // تحديث التاريخ والوقت كل دقيقة
        setInterval(this.updateDateTime.bind(this), 60000);
        
        // تحميل القسم النشط عند التهيئة
        this.loadCurrentSection();
    },
    
    setupNavigationHandlers: function() {
        // التنقل عبر القوائم السفلية
        const navItems = document.querySelectorAll('.nav-item-bottom');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSection = item.getAttribute('data-section');
                if (targetSection) {
                    this.navigateTo(targetSection);
                }
            });
        });
        
        // التنقل عبر الروابط الداخلية
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-nav-section]');
            if (link) {
                e.preventDefault();
                const targetSection = link.getAttribute('data-nav-section');
                this.navigateTo(targetSection);
            }
        });
        
        // زر العودة للخلف
        const backButton = document.getElementById('back-button');
        if (backButton) {
            backButton.addEventListener('click', () => {
                this.goBack();
            });
        }
        
        // زر الذهاب للأمام
        const forwardButton = document.getElementById('forward-button');
        if (forwardButton) {
            forwardButton.addEventListener('click', () => {
                this.goForward();
            });
        }
        
        // زر الصفحة الرئيسية
        const homeButton = document.getElementById('home-button');
        if (homeButton) {
            homeButton.addEventListener('click', () => {
                this.navigateTo('dashboard-section');
            });
        }
    },
    
    setupThemeToggle: function() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }
        
        // تحميل الثيم المحفوظ
        this.loadTheme();
    },
    
    setupKeyboardNavigation: function() {
        document.addEventListener('keydown', (e) => {
            // تجاهل إذا كان المستخدم يكتب في حقل نصي
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // اختصارات التنقل
            switch(e.key) {
                case 'F1':
                    e.preventDefault();
                    this.navigateTo('dashboard-section');
                    break;
                case 'F2':
                    e.preventDefault();
                    this.navigateTo('products-section');
                    break;
                case 'F3':
                    e.preventDefault();
                    this.navigateTo('pos-section');
                    break;
                case 'F4':
                    e.preventDefault();
                    this.navigateTo('reports-section');
                    break;
                case 'F5':
                    e.preventDefault();
                    this.navigateTo('suppliers-section');
                    break;
                case 'F6':
                    e.preventDefault();
                    this.navigateTo('credit-section');
                    break;
                case 'Escape':
                    e.preventDefault();
                    this.closeModals();
                    break;
                case 'ArrowLeft':
                    if (e.altKey) {
                        e.preventDefault();
                        this.goBack();
                    }
                    break;
                case 'ArrowRight':
                    if (e.altKey) {
                        e.preventDefault();
                        this.goForward();
                    }
                    break;
            }
        });
    },
    
    setupResizeHandler: function() {
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });
        
        // معالجة الحجم الأولي
        this.handleResize();
    },
    
    setupIdleTimer: function() {
        // إعادة تحميل البيانات بعد فترة من الخمول
        let idleTimer;
        const resetTimer = () => {
            clearTimeout(idleTimer);
            idleTimer = setTimeout(() => {
                this.handleIdleTimeout();
            }, 5 * 60 * 1000); // 5 دقائق
        };
        
        // إعادة تعيين المؤقت عند التفاعل مع الصفحة
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });
        
        resetTimer();
    },
    
    navigateTo: function(sectionId) {
        if (this.currentSection === sectionId) {
            return; // لا تفعل شيئاً إذا كان القسم نفسه نشطاً بالفعل
        }
        
        // حفظ التاريخ للتنقل
        this.navigationHistory.push(this.currentSection);
        if (this.navigationHistory.length > 50) {
            this.navigationHistory.shift(); // الحد الأقصى لسجل التنقل
        }
        
        this.previousSection = this.currentSection;
        this.currentSection = sectionId;
        
        this.updateNavigation();
        this.loadSectionData(sectionId);
        this.updateBrowserHistory(sectionId);
        this.trackNavigation(sectionId);
    },
    
    updateNavigation: function() {
        // إزالة النشاط من جميع عناصر التنقل
        document.querySelectorAll('.nav-item-bottom').forEach(item => {
            item.classList.remove('active');
        });
        
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        // إضافة النشاط للعناصر الحالية
        const activeNavItem = document.querySelector(`[data-section="${this.currentSection}"]`);
        const activeSection = document.getElementById(this.currentSection);
        
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }
        
        if (activeSection) {
            activeSection.classList.add('active');
        }
        
        // تحديث عنوان الصفحة
        this.updatePageTitle();
        
        // إظهار/إخفاء أزرار التنقل
        this.updateNavigationButtons();
        
        // إغلاق القوائم المنبثقة إذا كانت مفتوحة
        this.closeAllDropdowns();
    },
    
    loadSectionData: function(sectionId) {
        // إظهار مؤشر التحميل
        this.showLoadingIndicator();
        
        // تحميل البيانات الخاصة بالقسم
        setTimeout(() => {
            switch(sectionId) {
                case 'dashboard-section':
                    if (typeof DASHBOARD !== 'undefined' && typeof DASHBOARD.loadData === 'function') {
                        DASHBOARD.loadData();
                    }
                    break;
                case 'products-section':
                    if (typeof PRODUCTS !== 'undefined' && typeof PRODUCTS.loadProducts === 'function') {
                        PRODUCTS.loadProducts();
                    }
                    break;
                case 'pos-section':
                    if (typeof POS !== 'undefined' && typeof POS.init === 'function') {
                        POS.init();
                    }
                    break;
                case 'reports-section':
                    if (typeof REPORTS !== 'undefined' && typeof REPORTS.loadData === 'function') {
                        REPORTS.loadData();
                    }
                    break;
                case 'suppliers-section':
                    if (typeof SUPPLIERS !== 'undefined' && typeof SUPPLIERS.loadSuppliers === 'function') {
                        SUPPLIERS.loadSuppliers();
                    }
                    break;
                case 'credit-section':
                    if (typeof CREDIT !== 'undefined' && typeof CREDIT.loadCreditSales === 'function') {
                        CREDIT.loadCreditSales();
                    }
                    break;
            }
            
            // إخفاء مؤشر التحميل
            this.hideLoadingIndicator();
        }, 100);
    },
    
    updatePageTitle: function() {
        const sectionTitles = {
            'dashboard-section': 'لوحة التحكم',
            'products-section': 'إدارة المنتجات',
            'pos-section': 'نقطة البيع',
            'reports-section': 'التقارير والإحصائيات',
            'suppliers-section': 'إدارة الموردين',
            'credit-section': 'المبيعات الآجلة'
        };
        
        const storeName = localStorage.getItem(CONSTANTS.STORAGE_KEYS.STORE_NAME) || 'متجري';
        const sectionTitle = sectionTitles[this.currentSection] || 'نظام الإدارة';
        
        document.title = `${sectionTitle} - ${storeName}`;
    },
    
    updateBrowserHistory: function(sectionId) {
        // تحديث تاريخ المتصفح بدون إعادة تحميل الصفحة
        const state = { section: sectionId };
        const title = document.title;
        const url = `#${sectionId}`;
        
        window.history.pushState(state, title, url);
    },
    
    trackNavigation: function(sectionId) {
        // تتبع التنقل (يمكن استخدامها للإحصاءات)
        console.log(`تم التنقل إلى: ${sectionId}`);
        
        // يمكن إضافة تكامل مع خدمات التحليل هنا
        if (typeof gtag !== 'undefined') {
            gtag('event', 'navigation', {
                'event_category': 'engagement',
                'event_label': sectionId
            });
        }
    },
    
    goBack: function() {
        if (this.navigationHistory.length > 0) {
            const previousSection = this.navigationHistory.pop();
            this.navigateTo(previousSection);
        }
    },
    
    goForward: function() {
        // هذه الوظيفة تحتاج إلى تنفيذ أكثر تطوراً مع إدارة كاملة لسجل المتصفح
        UTILS.showNotification('ميزة التقدم للأمام قيد التطوير', 'info');
    },
    
    updateNavigationButtons: function() {
        const backButton = document.getElementById('back-button');
        const forwardButton = document.getElementById('forward-button');
        
        if (backButton) {
            backButton.disabled = this.navigationHistory.length === 0;
        }
        
        if (forwardButton) {
            forwardButton.disabled = true; // غير مفعل حالياً
        }
    },
    
    updateDateTime: function() {
        const now = new Date();
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const timeOptions = {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        };
        
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('ar-YE', dateOptions);
        }
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('ar-YE', timeOptions);
        }
    },
    
    toggleTheme: function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        // تحديث أيقونة الزر
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = newTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
            }
        }
        
        UTILS.showNotification(`تم التغيير إلى الوضع ${newTheme === 'dark' ? 'الليلي' : 'النهاري'}`, 'success');
    },
    
    loadTheme: function() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // تحديث أيقونة الزر
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.className = savedTheme === 'dark' ? 'bi bi-sun' : 'bi bi-moon';
            }
        }
    },
    
    handleResize: function() {
        const width = window.innerWidth;
        
        // إغلاق القوائم المنبثقة على الشاشات الصغيرة
        if (width < 768) {
            this.closeAllDropdowns();
        }
        
        // إدارة الشريط الجانبي على الشاشات الصغيرة
        if (width < 992) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    },
    
    handleIdleTimeout: function() {
        // إعادة تحميل البيانات عند الخمول
        if (document.visibilityState === 'visible') {
            this.reloadCurrentSection();
        }
    },
    
    reloadCurrentSection: function() {
        UTILS.showNotification('جاري تحديث البيانات...', 'info');
        this.loadSectionData(this.currentSection);
    },
    
    showLoadingIndicator: function() {
        // إظهار مؤشر تحميل بسيط
        const loadingIndicator = document.getElementById('loading-indicator') || this.createLoadingIndicator();
        loadingIndicator.style.display = 'block';
    },
    
    hideLoadingIndicator: function() {
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
        }
    },
    
    createLoadingIndicator: function() {
        const indicator = document.createElement('div');
        indicator.id = 'loading-indicator';
        indicator.className = 'loading-indicator';
        indicator.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">جاري التحميل...</span>
            </div>
        `;
        
        // إضافة الأنماط إذا لم تكن موجودة
        if (!document.querySelector('#loading-indicator-styles')) {
            const styles = document.createElement('style');
            styles.id = 'loading-indicator-styles';
            styles.textContent = `
                .loading-indicator {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    z-index: 9999;
                    background: rgba(255, 255, 255, 0.9);
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    display: none;
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(indicator);
        return indicator;
    },
    
    closeAllDropdowns: function() {
        // إغلاق جميع القوائم المنبثقة في Bootstrap
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            const dropdown = menu.closest('.dropdown');
            if (dropdown) {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                if (toggle) {
                    bootstrap.Dropdown.getInstance(toggle)?.hide();
                }
            }
        });
    },
    
    closeModals: function() {
        // إغلاق جميع النماذج المفتوحة في Bootstrap
        document.querySelectorAll('.modal.show').forEach(modal => {
            bootstrap.Modal.getInstance(modal)?.hide();
        });
    },
    
    openSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('open');
            this.isSidebarOpen = true;
        }
    },
    
    closeSidebar: function() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
            this.isSidebarOpen = false;
        }
    },
    
    toggleSidebar: function() {
        if (this.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    },
    
    loadCurrentSection: function() {
        // محاولة تحميل القسم من عنوان URL
        const hash = window.location.hash.replace('#', '');
        if (hash && document.getElementById(hash)) {
            this.navigateTo(hash);
        } else {
            this.navigateTo('dashboard-section');
        }
    },
    
    // معالجة حالة المتصفح (الخلف/الأمام)
    setupPopStateHandler: function() {
        window.addEventListener('popstate', (event) => {
            if (event.state && event.state.section) {
                this.navigateTo(event.state.section);
            }
        });
    },
    
    // التنقل السريع بين الأقسام
    quickNavigate: function(sectionKey) {
        const sectionMap = {
            '1': 'dashboard-section',
            '2': 'products-section',
            '3': 'pos-section',
            '4': 'reports-section',
            '5': 'suppliers-section',
            '6': 'credit-section'
        };
        
        const sectionId = sectionMap[sectionKey];
        if (sectionId) {
            this.navigateTo(sectionId);
        }
    },
    
    // إظهار مساعدة التنقل
    showNavigationHelp: function() {
        const helpModal = document.createElement('div');
        helpModal.className = 'modal fade';
        helpModal.innerHTML = `
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header bg-info text-white">
                        <h5 class="modal-title">مساعدة التنقل</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <h6>اختصارات لوحة المفاتيح:</h6>
                        <ul class="list-unstyled">
                            <li><kbd>F1</kbd> - لوحة التحكم</li>
                            <li><kbd>F2</kbd> - المنتجات</li>
                            <li><kbd>F3</kbd> - نقطة البيع</li>
                            <li><kbd>F4</kbd> - التقارير</li>
                            <li><kbd>F5</kbd> - الموردين</li>
                            <li><kbd>F6</kbd> - المبيعات الآجلة</li>
                            <li><kbd>Alt + ←</kbd> - الرجوع للخلف</li>
                            <li><kbd>Esc</kbd> - إغلاق النماذج</li>
                        </ul>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">إغلاق</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpModal);
        const bsModal = new bootstrap.Modal(helpModal);
        bsModal.show();
        
        helpModal.addEventListener('hidden.bs.modal', () => {
            helpModal.remove();
        });
    },
    
    // تحديث إشعارات التنقل
    updateNavigationNotifications: function() {
        // يمكن إضافة إشعارات للتنقل (مثل عدد المنتجات المنخفضة، إلخ)
        const notifications = {
            'products-section': this.getProductNotifications(),
            'credit-section': this.getCreditNotifications(),
            'suppliers-section': this.getSupplierNotifications()
        };
        
        Object.entries(notifications).forEach(([sectionId, count]) => {
            if (count > 0) {
                this.addNotificationBadge(sectionId, count);
            } else {
                this.removeNotificationBadge(sectionId);
            }
        });
    },
    
    getProductNotifications: function() {
        const products = DB.get(CONSTANTS.STORAGE_KEYS.PRODUCTS);
        const lowStockCount = products.filter(product => {
            const minQuantity = product.minQuantity || 10;
            return product.quantity > 0 && product.quantity <= minQuantity;
        }).length;
        
        return lowStockCount;
    },
    
    getCreditNotifications: function() {
        const creditSales = DB.get(CONSTANTS.STORAGE_KEYS.CREDIT_SALES);
        const overdueCount = creditSales.filter(sale => {
            const dueDate = new Date(sale.date);
            dueDate.setDate(dueDate.getDate() + 30);
            return dueDate < new Date();
        }).length;
        
        return overdueCount;
    },
    
    getSupplierNotifications: function() {
        const suppliers = DB.get(CONSTANTS.STORAGE_KEYS.SUPPLIERS);
        const balanceCount = suppliers.filter(supplier => (supplier.balance || 0) > 0).length;
        
        return balanceCount;
    },
    
    addNotificationBadge: function(sectionId, count) {
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) {
            let badge = navItem.querySelector('.notification-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'notification-badge';
                navItem.appendChild(badge);
            }
            badge.textContent = count > 99 ? '99+' : count;
        }
    },
    
    removeNotificationBadge: function(sectionId) {
        const navItem = document.querySelector(`[data-section="${sectionId}"]`);
        if (navItem) {
            const badge = navItem.querySelector('.notification-badge');
            if (badge) {
                badge.remove();
            }
        }
    },
    
    // إعادة تحميل التطبيق
    reloadApp: function() {
        if (confirm('هل تريد إعادة تحميل التطبيق؟ سيتم فقدان أي تغييرات غير محفوظة.')) {
            window.location.reload();
        }
    },
    
    // الخروج من التطبيق
    exitApp: function() {
        if (confirm('هل تريد الخروج من التطبيق؟')) {
            // يمكن إضافة أي تنظيف ضروري هنا
            window.close(); // قد لا يعمل في جميع المتصفحات
        }
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.NAVIGATION = NAVIGATION;

// معالجة حالة المتصفح عند التحميل
document.addEventListener('DOMContentLoaded', function() {
    NAVIGATION.init();
    NAVIGATION.setupPopStateHandler();
});

// معالجة حالة المتصفح عند العودة/الأمام
window.addEventListener('popstate', function(event) {
    if (event.state && event.state.section) {
        NAVIGATION.navigateTo(event.state.section);
    }
});
