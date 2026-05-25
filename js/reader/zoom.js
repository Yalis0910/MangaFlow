class ZoomManager {
    constructor(reader) {
        this.reader = reader;
        this.level = CONFIG.zoom.default;
        this.min = CONFIG.zoom.min;
        this.max = CONFIG.zoom.max;
        this.step = CONFIG.zoom.step;
    }
    
    set(level) {
        this.level = Math.max(this.min, Math.min(this.max, level));
        this.apply();
        this.updateUI();
        return this.level;
    }
    
    in() {
        return this.set(this.level + this.step);
    }
    
    out() {
        return this.set(this.level - this.step);
    }
    
    reset() {
        return this.set(CONFIG.zoom.default);
    }
    
    toggle() {
        if (this.level > 1) {
            return this.reset();
        } else {
            return this.set(2);
        }
    }
    
    apply() {
        const imageList = DOM.$('#image-list');
        imageList.style.transform = `scale(${this.level})`;
        imageList.style.transformOrigin = 'top center';
    }
    
    updateUI() {
        const zoomLevel = DOM.$('#zoom-level');
        zoomLevel.textContent = `${Math.round(this.level * 100)}%`;
    }
    
    getLevel() {
        return this.level;
    }
    
    isZoomed() {
        return this.level !== 1;
    }
}
