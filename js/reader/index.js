class MangaReader {
    constructor() {
        this.images = [];
        this.mangaId = null;
        this.currentIndex = 0;
        this.isFullscreen = false;
        this.theme = Storage.getTheme();
        
        this.lazyLoader = null;
        this.progress = null;
        this.zoom = null;
        this.keyboard = null;
        this.gesture = null;
        this.toolbar = null;
        this.thumbnail = null;
        
        this.init();
    }
    
    async init() {
        await Storage.init();
        this.applyTheme(this.theme);
        this.initComponents();
        this.bindEvents();
        this.bindScrollEvents();
    }
    
    initComponents() {
        this.lazyLoader = new LazyLoader();
        this.progress = new ProgressManager(this);
        this.zoom = new ZoomManager(this);
        this.keyboard = new KeyboardManager(this);
        this.gesture = new GestureManager(this);
        this.toolbar = new Toolbar(this);
        this.thumbnail = new ThumbnailPanel(this);
    }
    
    bindEvents() {
        DOM.$('#btn-welcome-theme').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        DOM.$('#btn-select-files').addEventListener('click', async () => {
            const files = await FileUtils.selectFiles();
            if (files.length > 0) {
                this.loadImages(files);
            }
        });
        
        DOM.$('#btn-select-folder').addEventListener('click', async () => {
            const files = await FileUtils.selectFolder();
            if (files.length > 0) {
                this.loadImages(files);
            }
        });
        
        DOM.$('#btn-select-zip').addEventListener('click', async () => {
            DOM.showLoading();
            const files = await FileUtils.selectArchive();
            if (files.length > 0) {
                this.loadImages(files);
            } else {
                DOM.hideLoading();
            }
        });
        
        const uploadArea = DOM.$('#upload-area');
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            DOM.addClass(uploadArea, 'drag-over');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            DOM.removeClass(uploadArea, 'drag-over');
        });
        
        uploadArea.addEventListener('drop', async (e) => {
            e.preventDefault();
            DOM.removeClass(uploadArea, 'drag-over');
            const files = await FileUtils.handleDrop(e.dataTransfer);
            if (files.length > 0) {
                this.loadImages(files);
            }
        });
    }
    
    bindScrollEvents() {
        const container = DOM.$('#reader-container');
        let ticking = false;
        
        const updateProgress = () => {
            const scrollTop = container.scrollTop;
            const scrollHeight = container.scrollHeight - container.clientHeight;
            const progress = scrollTop / scrollHeight;
            
            const imageWrappers = DOM.$$('.image-wrapper');
            let currentIndex = 0;
            
            imageWrappers.forEach((wrapper, index) => {
                const rect = wrapper.getBoundingClientRect();
                if (rect.top < container.clientHeight / 2) {
                    currentIndex = index;
                }
            });
            
            this.currentIndex = currentIndex;
            this.progress.update(currentIndex);
            this.thumbnail.setActive(currentIndex);
            
            if (this.mangaId) {
                this.progress.save(scrollTop);
            }
        };
        
        container.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateProgress();
                    ticking = false;
                });
                ticking = true;
            }
        }, { passive: true });
    }
    
    async loadImages(files) {
        DOM.showLoading();
        
        this.images = files;
        this.mangaId = FileUtils.generateId(files);
        
        this.progress.setManga(this.mangaId, files.length);
        this.render();
        await this.thumbnail.generate(files);
        
        DOM.hide(DOM.$('#welcome-screen'));
        DOM.show(DOM.$('#reader-screen'));
        
        const savedProgress = await this.progress.load();
        if (savedProgress) {
            this.goTo(savedProgress.pageIndex);
            if (savedProgress.scrollPosition) {
                DOM.$('#reader-container').scrollTop = savedProgress.scrollPosition;
            }
        }
        
        this.toolbar.setTitle(`${files.length} 张图片`);
        DOM.hideLoading();
        this.toolbar.show();
    }
    
    render() {
        const imageList = DOM.$('#image-list');
        imageList.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        
        this.images.forEach((file, index) => {
            const wrapper = this.createImageWrapper(file, index);
            fragment.appendChild(wrapper);
        });
        
        imageList.appendChild(fragment);
    }
    
    createImageWrapper(file, index) {
        const wrapper = DOM.create('div', {
            className: 'image-wrapper',
            dataset: { index: index }
        });
        
        const placeholder = DOM.create('div', {
            className: 'image-placeholder',
            innerHTML: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
            </svg>`
        });
        
        const img = DOM.create('img', {
            attributes: {
                alt: `Page ${index + 1}`
            }
        });
        
        wrapper.appendChild(placeholder);
        wrapper.appendChild(img);
        
        const url = URL.createObjectURL(file);
        this.lazyLoader.observe(img, url);
        
        return wrapper;
    }
    
    scrollBy(amount) {
        const container = DOM.$('#reader-container');
        container.scrollBy({ top: amount, behavior: 'smooth' });
    }
    
    async goTo(index) {
        if (index < 0 || index >= this.images.length) return;
        
        const img = DOM.$(`.image-wrapper[data-index="${index}"] img`);
        if (img && img.dataset.src && !img.src) {
            await this.loadImageAsync(img, img.dataset.src);
        }
        
        this.preloadImages(index);
        
        const wrapper = DOM.$(`.image-wrapper[data-index="${index}"]`);
        if (wrapper) {
            wrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
    
    loadImageAsync(img, src) {
        return new Promise((resolve) => {
            const tempImg = new Image();
            tempImg.onload = () => {
                img.src = src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
                const placeholder = img.parentElement.querySelector('.image-placeholder');
                if (placeholder) {
                    placeholder.style.display = 'none';
                }
                resolve();
            };
            tempImg.onerror = () => {
                img.classList.add('error');
                resolve();
            };
            tempImg.src = src;
        });
    }
    
    preloadImages(centerIndex) {
        const preloadRange = 5;
        const startIndex = Math.max(0, centerIndex - preloadRange);
        const endIndex = Math.min(this.images.length - 1, centerIndex + preloadRange);
        
        for (let i = startIndex; i <= endIndex; i++) {
            const img = DOM.$(`.image-wrapper[data-index="${i}"] img`);
            if (img && img.dataset.src && !img.src) {
                this.lazyLoader.loadImage(img, img.dataset.src);
                this.lazyLoader.unobserve(img);
            }
        }
    }
    
    prevPage() {
        if (this.currentIndex > 0) {
            this.goTo(this.currentIndex - 1);
        }
    }
    
    nextPage() {
        if (this.currentIndex < this.images.length - 1) {
            this.goTo(this.currentIndex + 1);
        }
    }
    
    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.applyTheme(this.theme);
        Storage.setTheme(this.theme);
    }
    
    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    toggleFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
            this.isFullscreen = false;
        } else {
            document.documentElement.requestFullscreen();
            this.isFullscreen = true;
        }
    }
    
    toggleThumbnailPanel() {
        this.thumbnail.toggle();
    }
    
    goBack() {
        if (this.thumbnail.isVisible()) {
            this.thumbnail.hide();
            return;
        }
        
        DOM.hide(DOM.$('#reader-screen'));
        DOM.show(DOM.$('#welcome-screen'));
        
        this.images = [];
        this.mangaId = null;
        this.currentIndex = 0;
        this.zoom.reset();
        this.thumbnail.clear();
        DOM.$('#image-list').innerHTML = '';
    }
}
