const CONFIG = {
    deviceType: 'auto',
    readingMode: 'vertical',
    fitMode: 'auto',
    theme: 'light',
    lazyLoad: {
        enabled: true,
        rootMargin: '100px',
        threshold: 0.01
    },
    preload: {
        enabled: true,
        count: 3
    },
    zoom: {
        min: 0.5,
        max: 3,
        step: 0.25,
        default: 1
    },
    toolbar: {
        autoHide: true,
        hideDelay: 3000
    },
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'image/avif'],
    storageKeys: {
        theme: 'manga-reader-theme',
        progress: 'manga-reader-progress',
        settings: 'manga-reader-settings'
    }
};

function detectDevice() {
    const width = window.innerWidth;
    return width >= 1024 ? 'pc' : 'mobile';
}

function isMobile() {
    return detectDevice() === 'mobile';
}

function isPC() {
    return detectDevice() === 'pc';
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}
