class Toolbar {
    constructor(reader) {
        this.reader = reader;
        this.visible = false;
        this.hideTimer = null;
        this.elements = {
            toolbar: DOM.$('#toolbar'),
            title: DOM.$('#toolbar-title'),
            zoomLevel: DOM.$('#zoom-level')
        };
        this.bindEvents();
    }
    
    bindEvents() {
        DOM.$('#btn-back').addEventListener('click', () => this.reader.goBack());
        DOM.$('#btn-zoom-out').addEventListener('click', () => this.reader.zoom.out());
        DOM.$('#btn-zoom-in').addEventListener('click', () => this.reader.zoom.in());
        DOM.$('#btn-theme').addEventListener('click', () => this.reader.toggleTheme());
        DOM.$('#btn-fullscreen').addEventListener('click', () => this.reader.toggleFullscreen());
        DOM.$('#btn-thumbnails').addEventListener('click', () => this.reader.toggleThumbnailPanel());
    }
    
    show() {
        DOM.addClass(this.elements.toolbar, 'visible');
        this.visible = true;
        this.scheduleHide();
    }
    
    hide() {
        DOM.removeClass(this.elements.toolbar, 'visible');
        this.visible = false;
    }
    
    toggle() {
        if (this.visible) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    scheduleHide() {
        if (!CONFIG.toolbar.autoHide) return;
        
        clearTimeout(this.hideTimer);
        this.hideTimer = setTimeout(() => {
            if (this.visible) {
                this.hide();
            }
        }, CONFIG.toolbar.hideDelay);
    }
    
    cancelHide() {
        clearTimeout(this.hideTimer);
    }
    
    setTitle(title) {
        this.elements.title.textContent = title || 'MangaFlow';
    }
    
    updateZoomLevel(level) {
        this.elements.zoomLevel.textContent = `${Math.round(level * 100)}%`;
    }
}
