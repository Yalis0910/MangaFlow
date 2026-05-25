const DOM = {
    $(selector) {
        return document.querySelector(selector);
    },
    
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    create(tag, options = {}) {
        const element = document.createElement(tag);
        
        if (options.className) {
            element.className = options.className;
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.attributes) {
            Object.entries(options.attributes).forEach(([key, value]) => {
                element.setAttribute(key, value);
            });
        }
        
        if (options.dataset) {
            Object.entries(options.dataset).forEach(([key, value]) => {
                element.dataset[key] = value;
            });
        }
        
        if (options.innerHTML) {
            element.innerHTML = options.innerHTML;
        }
        
        if (options.textContent) {
            element.textContent = options.textContent;
        }
        
        if (options.children) {
            options.children.forEach(child => {
                element.appendChild(child);
            });
        }
        
        if (options.parent) {
            options.parent.appendChild(element);
        }
        
        return element;
    },
    
    show(element) {
        element.classList.remove('hidden');
    },
    
    hide(element) {
        element.classList.add('hidden');
    },
    
    toggle(element, force) {
        element.classList.toggle('hidden', force);
    },
    
    addClass(element, className) {
        element.classList.add(className);
    },
    
    removeClass(element, className) {
        element.classList.remove(className);
    },
    
    hasClass(element, className) {
        return element.classList.contains(className);
    },
    
    showToast(message, duration = 2000) {
        const toast = this.$('#toast');
        toast.textContent = message;
        this.show(toast);
        
        setTimeout(() => {
            this.hide(toast);
        }, duration);
    },
    
    showLoading() {
        this.show(this.$('#loading-overlay'));
    },
    
    hideLoading() {
        this.hide(this.$('#loading-overlay'));
    }
};
