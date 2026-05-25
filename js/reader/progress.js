class ProgressManager {
    constructor(reader) {
        this.reader = reader;
        this.mangaId = null;
        this.currentIndex = 0;
        this.totalImages = 0;
        this.isDragging = false;
        this.init();
    }
    
    init() {
        const progressBar = DOM.$('#progress-bar');
        
        progressBar.addEventListener('mousedown', (e) => this.handleDragStart(e));
        progressBar.addEventListener('touchstart', (e) => this.handleDragStart(e), { passive: true });
        
        document.addEventListener('mousemove', (e) => this.handleDragMove(e));
        document.addEventListener('touchmove', (e) => this.handleDragMove(e), { passive: true });
        
        document.addEventListener('mouseup', () => this.handleDragEnd());
        document.addEventListener('touchend', () => this.handleDragEnd());
    }
    
    handleDragStart(e) {
        if (this.totalImages === 0) return;
        
        this.isDragging = true;
        DOM.addClass(DOM.$('#progress-bar'), 'dragging');
        this.updateFromPosition(e);
    }
    
    handleDragMove(e) {
        if (!this.isDragging) return;
        
        e.preventDefault();
        this.updateFromPosition(e);
    }
    
    handleDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        DOM.removeClass(DOM.$('#progress-bar'), 'dragging');
        
        this.reader.goTo(this.currentIndex);
    }
    
    updateFromPosition(e) {
        const progressBar = DOM.$('#progress-bar');
        const rect = progressBar.getBoundingClientRect();
        
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        let percentage = (clientX - rect.left) / rect.width;
        percentage = Math.max(0, Math.min(1, percentage));
        
        const targetIndex = Math.round(percentage * (this.totalImages - 1));
        this.currentIndex = targetIndex;
        this.updateUI();
    }
    
    setManga(id, total) {
        this.mangaId = id;
        this.totalImages = total;
        this.currentIndex = 0;
    }
    
    update(index) {
        if (this.isDragging) return;
        
        this.currentIndex = index;
        this.updateUI();
    }
    
    updateUI() {
        const progressFill = DOM.$('#progress-fill');
        const progressThumb = DOM.$('#progress-thumb');
        const pageInfo = DOM.$('#page-info');
        
        if (this.totalImages > 0) {
            const progress = ((this.currentIndex + 1) / this.totalImages) * 100;
            progressFill.style.width = `${progress}%`;
            progressThumb.style.left = `${progress}%`;
            pageInfo.textContent = `${this.currentIndex + 1} / ${this.totalImages}`;
        }
    }
    
    async save(scrollPosition = 0) {
        if (!this.mangaId) return;
        
        await Storage.saveProgress(this.mangaId, {
            pageIndex: this.currentIndex,
            scrollPosition,
            totalImages: this.totalImages
        });
    }
    
    async load() {
        if (!this.mangaId) return null;
        
        const data = await Storage.loadProgress(this.mangaId);
        if (data && data.totalImages === this.totalImages) {
            return {
                pageIndex: data.pageIndex,
                scrollPosition: data.scrollPosition
            };
        }
        return null;
    }
    
    async clear() {
        if (!this.mangaId) return;
        await Storage.clearProgress(this.mangaId);
    }
}
