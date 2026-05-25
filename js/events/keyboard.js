class KeyboardManager {
    constructor(reader) {
        this.reader = reader;
        this.init();
    }
    
    init() {
        document.addEventListener('keydown', (e) => this.handleKeydown(e));
    }
    
    handleKeydown(e) {
        if (DOM.hasClass(DOM.$('#welcome-screen'), 'hidden') === false) {
            return;
        }
        
        switch(e.key) {
            case 'ArrowUp':
                e.preventDefault();
                this.reader.scrollBy(-100);
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.reader.scrollBy(100);
                break;
            case 'PageUp':
                e.preventDefault();
                this.reader.prevPage();
                break;
            case 'PageDown':
            case ' ':
                e.preventDefault();
                this.reader.nextPage();
                break;
            case 'Home':
                e.preventDefault();
                this.reader.goTo(0);
                break;
            case 'End':
                e.preventDefault();
                this.reader.goTo(this.reader.images.length - 1);
                break;
            case 'f':
            case 'F11':
                e.preventDefault();
                this.reader.toggleFullscreen();
                break;
            case 'Escape':
                this.handleEscape();
                break;
            case '+':
            case '=':
                e.preventDefault();
                this.reader.zoom.in();
                break;
            case '-':
                e.preventDefault();
                this.reader.zoom.out();
                break;
            case 't':
                e.preventDefault();
                this.reader.toggleThumbnailPanel();
                break;
        }
    }
    
    handleEscape() {
        const thumbnailPanel = DOM.$('#thumbnail-panel');
        if (!DOM.hasClass(thumbnailPanel, 'hidden')) {
            DOM.hide(thumbnailPanel);
            return;
        }
        
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
    }
}
