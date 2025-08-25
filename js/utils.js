// وظائف مساعدة عامة
const UTILS = {
    // تنسيق العملة
    formatCurrency: function(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        return amount.toLocaleString('ar-YE') + ' ريال';
    },
    
    // تنسيق التاريخ
    formatDate: function(date, format = 'full') {
        if (!date) return 'غير محدد';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return 'تاريخ غير صحيح';
        
        const options = {
            full: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            short: { year: 'numeric', month: 'short', day: 'numeric' },
            numeric: { year: 'numeric', month: 'numeric', day: 'numeric' }
        };
        
        return dateObj.toLocaleDateString('ar-YE', options[format] || options.full);
    },
    
    // تنسيق الوقت
    formatTime: function(date) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        return dateObj.toLocaleTimeString('ar-YE', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    },
    
    // إظهار الإشعارات
    showNotification: function(message, type = 'success') {
        // إزالة أي إشعارات سابقة
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());
        
        // إنشاء الإشعار الجديد
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        
        notification.innerHTML = `
            <i class="bi bi-${icons[type] || 'info-circle'}"></i>
            <span>${message}</span>
            <button class="btn-close-notification" onclick="this.parentElement.remove()">
                <i class="bi bi-x"></i>
            </button>
        `;
        
        // إضافة الأنماط إذا لم تكن موجودة
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    padding: 15px 20px;
                    border-radius: 8px;
                    color: white;
                    z-index: 1060;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    min-width: 300px;
                    max-width: 500px;
                    animation: slideIn 0.3s ease;
                }
                
                .notification.success {
                    background: linear-gradient(135deg, #28a745, #20c997);
                    border-left: 4px solid #218838;
                }
                
                .notification.error {
                    background: linear-gradient(135deg, #dc3545, #e4606d);
                    border-left: 4px solid #c82333;
                }
                
                .notification.warning {
                    background: linear-gradient(135deg, #ffc107, #ffda6a);
                    border-left: 4px solid #e0a800;
                    color: #212529;
                }
                
                .notification.info {
                    background: linear-gradient(135deg, #17a2b8, #39c0d3);
                    border-left: 4px solid #138496;
                }
                
                .notification i {
                    margin-left: 10px;
                    font-size: 1.2rem;
                }
                
                .btn-close-notification {
                    background: none;
                    border: none;
                    color: inherit;
                    margin-right: auto;
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                
                .btn-close-notification:hover {
                    opacity: 1;
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }
        
        document.body.appendChild(notification);
        
        // إزالة الإشعار تلقائياً بعد 5 ثوان
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
        
        return notification;
    },
    
    // توليد معرف فريد
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },
    
    // منع التكرار المفرط للوظائف
    debounce: function(func, wait, immediate) {
        let timeout;
        return function executedFunction(...args) {
            const context = this;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    },
    
    // التحقق من صحة البريد الإلكتروني
    isValidEmail: function(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },
    
    // التحقق من صحة رقم الهاتف
    isValidPhone: function(phone) {
        const phoneRegex = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/;
        return phoneRegex.test(phone);
    },
    
    // تقييد الإدخال للأرقام فقط
    restrictToNumbers: function(inputElement) {
        inputElement.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    },
    
    // تقييد الإدخال للأرقام والنقاط العشرية
    restrictToDecimal: function(inputElement) {
        inputElement.addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9.]/g, '');
            // منع أكثر من نقطة عشرية
            if ((this.value.match(/\./g) || []).length > 1) {
                this.value = this.value.substring(0, this.value.lastIndexOf('.'));
            }
        });
    },
    
    // نسخ النص إلى الحافظة
    copyToClipboard: function(text) {
        return new Promise((resolve, reject) => {
            if (navigator.clipboard && window.isSecureContext) {
                navigator.clipboard.writeText(text)
                    .then(() => resolve(true))
                    .catch(() => {
                        // Fallback for older browsers
                        this.copyToClipboardFallback(text) ? resolve(true) : reject(false);
                    });
            } else {
                this.copyToClipboardFallback(text) ? resolve(true) : reject(false);
            }
        });
    },
    
    // نسخ النص إلى الحافظة (طريقة بديلة)
    copyToClipboardFallback: function(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.opacity = '0';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (err) {
            return false;
        }
    },
    
    // تنزيل الملف
    downloadFile: function(content, fileName, contentType = 'text/plain') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.style.display = 'none';
        
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    },
    
    // تحميل الصورة وتحويلها إلى Base64
    readImageAsBase64: function(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type.startsWith('image/')) {
                reject(new Error('الملف ليس صورة'));
                return;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    },
    
    // ضغط الصورة
    compressImage: function(base64String, maxWidth = 800, maxHeight = 600, quality = 0.8) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // حساب الأبعاد الجديدة مع الحفاظ على التناسب
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                if (height > maxHeight) {
                    width = (width * maxHeight) / height;
                    height = maxHeight;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                try {
                    const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
                    resolve(compressedBase64);
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = function(error) {
                reject(error);
            };
            
            img.src = base64String;
        });
    },
    
    // حساب الفرق بين تاريخين
    dateDifference: function(date1, date2, unit = 'days') {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        
        const units = {
            days: diffTime / (1000 * 60 * 60 * 24),
            hours: diffTime / (1000 * 60 * 60),
            minutes: diffTime / (1000 * 60),
            seconds: diffTime / 1000
        };
        
        return Math.floor(units[unit] || units.days);
    },
    
    // التحقق من تاريخ انتهاء الصلاحية
    isExpired: function(expiryDate) {
        if (!expiryDate) return false;
        
        const today = new Date();
        const expiry = new Date(expiryDate);
        
        // إعادة ضبط الوقت للمقارنة الصحيحة
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        
        return expiry < today;
    },
    
    // التحقق من قرب انتهاء الصلاحية
    isExpiringSoon: function(expiryDate, daysThreshold = 30) {
        if (!expiryDate) return false;
        
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffDays = this.dateDifference(today, expiry, 'days');
        
        return diffDays <= daysThreshold && diffDays >= 0;
    },
    
    // تنسيق المدة الزمنية
    formatDuration: function(seconds) {
        const units = [
            { value: 60, label: 'ثانية' },
            { value: 60, label: 'دقيقة' },
            { value: 24, label: 'ساعة' },
            { value: 7, label: 'يوم' },
            { value: 4.34524, label: 'أسبوع' },
            { value: 12, label: 'شهر' },
            { value: Infinity, label: 'سنة' }
        ];
        
        let duration = seconds;
        let unitIndex = 0;
        
        while (duration >= units[unitIndex].value && unitIndex < units.length - 1) {
            duration /= units[unitIndex].value;
            unitIndex++;
        }
        
        return Math.floor(duration) + ' ' + units[unitIndex].label;
    },
    
    // إنشاء رموز التقدم (Loading Spinner)
    createSpinner: function(size = 'md', color = 'primary') {
        const sizes = {
            sm: '1rem',
            md: '2rem',
            lg: '3rem'
        };
        
        const colors = {
            primary: '#4e73df',
            secondary: '#6c757d',
            success: '#1cc88a',
            danger: '#e74a3b',
            warning: '#f6c23e',
            info: '#36b9cc',
            light: '#f8f9fc',
            dark: '#5a5c69'
        };
        
        const spinner = document.createElement('div');
        spinner.className = 'spinner';
        spinner.style.width = sizes[size] || sizes.md;
        spinner.style.height = sizes[size] || sizes.md;
        spinner.style.borderColor = colors[color] || colors.primary;
        
        // إضافة أنماط السبينر إذا لم تكن موجودة
        if (!document.querySelector('#spinner-styles')) {
            const styles = document.createElement('style');
            styles.id = 'spinner-styles';
            styles.textContent = `
                .spinner {
                    border: 4px solid rgba(0, 0, 0, 0.1);
                    border-radius: 50%;
                    border-top: 4px solid;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(styles);
        }
        
        return spinner;
    },
    
    // إظهار/إخفاء عنصر مع تأثير
    toggleElement: function(element, show, effect = 'fade') {
        if (!element) return;
        
        const effects = {
            fade: {
                show: { opacity: 1, display: 'block' },
                hide: { opacity: 0, display: 'none' }
            },
            slide: {
                show: { height: 'auto', opacity: 1, display: 'block' },
                hide: { height: 0, opacity: 0, display: 'none' }
            }
        };
        
        const animation = effects[effect] || effects.fade;
        
        if (show) {
            element.style.display = animation.show.display;
            setTimeout(() => {
                element.style.opacity = animation.show.opacity;
                if (effect === 'slide') {
                    element.style.height = animation.show.height;
                }
            }, 10);
        } else {
            element.style.opacity = animation.hide.opacity;
            if (effect === 'slide') {
                element.style.height = '0';
            }
            setTimeout(() => {
                element.style.display = animation.hide.display;
            }, 300);
        }
    },
    
    // التحقق من اتصال الإنترنت
    checkOnlineStatus: function() {
        return navigator.onLine;
    },
    
    // إضافة مستمع لاتصال الإنترنت
    addOnlineListener: function(callback) {
        window.addEventListener('online', () => callback(true));
        window.addEventListener('offline', () => callback(false));
    },
    
    // تخزين البيانات مؤقتاً مع وقت انتهاء
    setWithExpiry: function(key, value, ttl) {
        const now = new Date();
        const item = {
            value: value,
            expiry: now.getTime() + ttl
        };
        localStorage.setItem(key, JSON.stringify(item));
    },
    
    // استرجاع البيانات المؤقتة
    getWithExpiry: function(key) {
        const itemStr = localStorage.getItem(key);
        if (!itemStr) return null;
        
        const item = JSON.parse(itemStr);
        const now = new Date();
        
        if (now.getTime() > item.expiry) {
            localStorage.removeItem(key);
            return null;
        }
        
        return item.value;
    },
    
    // تحويل الأرقام إلى كلمات (بالعربية)
    numberToArabicWords: function(number) {
        if (isNaN(number) || number < 0) return 'رقم غير صحيح';
        
        const units = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
        const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
        const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
        const hundreds = ['', 'مائة', 'مئتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
        
        const thousands = ['', 'ألف', 'ألفان', 'آلاف'];
        const millions = ['', 'مليون', 'مليونان', 'ملايين'];
        
        if (number === 0) return 'صفر';
        
        let words = '';
        
        // الملايين
        if (number >= 1000000) {
            const millionsPart = Math.floor(number / 1000000);
            words += this.numberToArabicWords(millionsPart) + ' ';
            
            if (millionsPart === 1) {
                words += millions[1];
            } else if (millionsPart === 2) {
                words += millions[2];
            } else if (millionsPart > 2 && millionsPart < 11) {
                words += millions[3];
            } else {
                words += millions[1];
            }
            
            number %= 1000000;
            if (number > 0) words += ' و ';
        }
        
        // الآلاف
        if (number >= 1000) {
            const thousandsPart = Math.floor(number / 1000);
            words += this.numberToArabicWords(thousandsPart) + ' ';
            
            if (thousandsPart === 1) {
                words += thousands[1];
            } else if (thousandsPart === 2) {
                words += thousands[2];
            } else if (thousandsPart > 2 && thousandsPart < 11) {
                words += thousands[3];
            } else {
                words += thousands[1];
            }
            
            number %= 1000;
            if (number > 0) words += ' و ';
        }
        
        // المئات
        if (number >= 100) {
            const hundredsPart = Math.floor(number / 100);
            words += hundreds[hundredsPart];
            number %= 100;
            if (number > 0) words += ' و ';
        }
        
        // العشرات والآحاد
        if (number > 0) {
            if (number < 10) {
                words += units[number];
            } else if (number < 20) {
                words += teens[number - 10];
            } else {
                const tensPart = Math.floor(number / 10);
                const unitsPart = number % 10;
                
                if (unitsPart > 0) {
                    words += units[unitsPart] + ' و ' + tens[tensPart];
                } else {
                    words += tens[tensPart];
                }
            }
        }
        
        return words;
    }
};

// جعل الدوال متاحة globally للاستخدام في event handlers في HTML
window.UTILS = UTILS;
