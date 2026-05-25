class ThumbnailPanel {
    constructor(reader) {
        this.reader = reader;
        this.panel = DOM.$('#thumbnail-panel');
        this.grid = DOM.$('#thumbnail-grid');
        this.thumbnails = [];
        this.activeIndex = -1;
        this.bindEvents();
    }
    
    bindEvents() {
        DOM.$('#btn-close-thumbnails').addEventListener('click', () => this.hide());
    }
    
    async generate(files) {
        this.clear();
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const thumbnail = await this.createThumbnail(file, i);
            this.grid.appendChild(thumbnail);
            this.thumbnails.push(thumbnail);
        }
    }
    
    async createThumbnail(file, index) {
        const item = DOM.create('div', {
            className: 'thumbnail-item',
            dataset: { index: index }
        });
        
        const url = URL.createObjectURL(file);
        const img = DOM.create('img', {
            attributes: {
                src: url,
                alt: `Page ${index + 1}`,
                loading: 'lazy'
            }
        });
        
        const number = DOM.create('span', {
            className: 'thumbnail-number',
            textContent: index + 1
        });
        
        item.appendChild(img);
        item.appendChild(number);
        
        item.addEventListener('click', () => {
            this.reader.goTo(index);
            this.hide();
        });
        
        return item;
    }
    
    setActive(index) {
        if (this.activeIndex >= 0 && this.thumbnails[this.activeIndex]) {
            DOM.removeClass(this.thumbnails[this.activeIndex], 'active');
        }
        
        this.activeIndex = index;
        if (this.thumbnails[index]) {
            DOM.addClass(this.thumbnails[index], 'active');
            this.thumbnails[index].scrollIntoView({ block: 'nearest' });
        }
    }
    
    show() {
        DOM.show(this.panel);
    }
    
    hide() {
        DOM.hide(this.panel);
    }
    
    toggle() {
        if (DOM.hasClass(this.panel, 'hidden')) {
            this.show();
        } else {
            this.hide();
        }
    }
    
    clear() {
        this.grid.innerHTML = '';
        this.thumbnails = [];
        this.activeIndex = -1;
    }
    
    isVisible() {
        return !DOM.hasClass(this.panel, 'hidden');
    }
}
