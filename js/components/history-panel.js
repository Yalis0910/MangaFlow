class HistoryPanel {
    constructor(reader) {
        this.reader = reader;
        this.isOpen = false;
        this.elements = {
            panel: DOM.$('#history-panel'),
            list: DOM.$('#history-list'),
            empty: DOM.$('#history-empty'),
            clearBtn: DOM.$('#btn-clear-history'),
            closeBtn: DOM.$('#btn-close-history')
        };
    }
    
    async init() {
        if (!this.isVisible()) {
            return;
        }
        await FileHandleStore.init();
        this.bindEvents();
        await this.render();
    }
    
    bindEvents() {
        DOM.$('#btn-history').addEventListener('click', () => this.toggle());
        this.elements.closeBtn.addEventListener('click', () => this.hide());
        this.elements.clearBtn.addEventListener('click', () => this.clearHistory());
    }
    
    toggle() {
        if (this.isOpen) {
            this.hide();
        } else {
            this.show();
        }
    }
    
    show() {
        if (!this.isVisible()) return;
        this.isOpen = true;
        DOM.show(this.elements.panel);
    }
    
    hide() {
        this.isOpen = false;
        DOM.hide(this.elements.panel);
    }
    
    isVisible() {
        return FileUtils.hasFileSystemAccess();
    }
    
    async render() {
        var records = await FileHandleStore.getAllHandles();
        
        this.elements.list.innerHTML = '';
        
        if (records.length === 0) {
            DOM.show(this.elements.empty);
            DOM.hide(this.elements.clearBtn);
            return;
        }
        
        DOM.hide(this.elements.empty);
        DOM.show(this.elements.clearBtn);
        
        for (var i = 0; i < records.length; i++) {
            var card = this.createCard(records[i]);
            this.elements.list.appendChild(card);
        }
    }
    
    createCard(record) {
        var card = DOM.create('div', {
            className: 'history-card',
            dataset: { id: record.id }
        });
        
        var thumb = DOM.create('div', { className: 'history-card-thumb' });
        
        if (record.thumbnail) {
            var img = DOM.create('img', {
                attributes: { src: record.thumbnail, alt: record.name }
            });
            thumb.appendChild(img);
        } else {
            var iconSvg = record.type === 'folder' 
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.25 7.5v6a2.25 2.25 0 01-2.25 2.25H9a2.25 2.25 0 01-2.25-2.25v-3a2.25 2.25 0 012.25-2.25h.75m8.25-3v3m0 0h-3m3 0l-3-3m1.5 12H6a2.25 2.25 0 01-2.25-2.25V9a2.25 2.25 0 012.25-2.25h.75"/></svg>';
            thumb.innerHTML = iconSvg;
            thumb.classList.add('history-card-thumb-icon');
        }
        
        var info = DOM.create('div', { className: 'history-card-info' });
        
        var displayName = record.note || record.name;
        var name = DOM.create('div', {
            className: 'history-card-name',
            textContent: displayName
        });
        
        if (record.note) {
            var originalName = DOM.create('div', {
                className: 'history-card-original',
                textContent: record.name
            });
            info.appendChild(name);
            info.appendChild(originalName);
        } else {
            info.appendChild(name);
        }
        
        var meta = DOM.create('div', {
            className: 'history-card-meta',
            textContent: record.fileCount + '张 · ' + this.formatTime(record.timestamp)
        });
        info.appendChild(meta);
        
        var actions = DOM.create('div', { className: 'history-card-actions' });
        
        var editBtn = DOM.create('button', {
            className: 'history-card-edit',
            innerHTML: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6.18 17.34l.34-2.505a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.5M18 14h4.5"/></svg>'
        });
        
        var deleteBtn = DOM.create('button', {
            className: 'history-card-remove',
            innerHTML: '&times;'
        });
        
        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);
        
        card.appendChild(thumb);
        card.appendChild(info);
        card.appendChild(actions);
        
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.history-card-edit') && !e.target.closest('.history-card-remove')) {
                this.loadFromHistory(record);
            }
        });
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showNoteEditor(record);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeHistory(record.id);
        });
        
        return card;
    }
    
    showNoteEditor(record) {
        var modal = DOM.create('div', { className: 'note-editor-modal' });
        var content = DOM.create('div', { className: 'note-editor-content' });
        
        var title = DOM.create('div', {
            className: 'note-editor-title',
            textContent: '编辑备注'
        });
        
        var input = DOM.create('input', {
            className: 'note-editor-input',
            attributes: {
                type: 'text',
                placeholder: '输入备注名称（可选）',
                value: record.note || ''
            }
        });
        
        var hint = DOM.create('div', {
            className: 'note-editor-hint',
            textContent: '原名称: ' + record.name
        });
        
        var buttons = DOM.create('div', { className: 'note-editor-buttons' });
        
        var cancelBtn = DOM.create('button', {
            className: 'btn btn-secondary',
            textContent: '取消'
        });
        
        var saveBtn = DOM.create('button', {
            className: 'btn btn-primary',
            textContent: '保存'
        });
        
        buttons.appendChild(cancelBtn);
        buttons.appendChild(saveBtn);
        
        content.appendChild(title);
        content.appendChild(input);
        content.appendChild(hint);
        content.appendChild(buttons);
        modal.appendChild(content);
        
        document.body.appendChild(modal);
        
        input.focus();
        
        var closeModal = () => {
            document.body.removeChild(modal);
        };
        
        cancelBtn.addEventListener('click', closeModal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        saveBtn.addEventListener('click', async () => {
            var note = input.value.trim();
            await FileHandleStore.updateNote(record.id, note);
            closeModal();
            await this.render();
        });
        
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveBtn.click();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        });
    }
    
    formatTime(timestamp) {
        var now = Date.now();
        var diff = now - timestamp;
        
        var minute = 60 * 1000;
        var hour = 60 * minute;
        var day = 24 * hour;
        var week = 7 * day;
        
        if (diff < minute) {
            return '刚刚';
        } else if (diff < hour) {
            return Math.floor(diff / minute) + '分钟前';
        } else if (diff < day) {
            return Math.floor(diff / hour) + '小时前';
        } else if (diff < week) {
            return Math.floor(diff / day) + '天前';
        } else {
            return Math.floor(diff / week) + '周前';
        }
    }
    
    async loadFromHistory(record) {
        try {
            DOM.showLoading();
            this.hide();
            
            var verified = await FileHandleStore.verifyHandle(record.handle);
            
            if (!verified) {
                DOM.hideLoading();
                DOM.showToast('无法访问该文件，请重新选择');
                this.removeHistory(record.id);
                return;
            }
            
            var files = await FileHandleStore.loadFilesFromHandle(record.handle);
            
            if (files.length === 0) {
                DOM.hideLoading();
                DOM.showToast('未找到图片文件');
                return;
            }
            
            var sortedFiles;
            if (files[0] && files[0].file) {
                sortedFiles = FileUtils.sortFiles(files.map(function(f) { return f.file; }));
            } else {
                sortedFiles = FileUtils.sortFiles(files);
            }
            
            var displayName = record.note || record.name;
            this.reader.loadImages(sortedFiles);
            this.reader.toolbar.setTitle(displayName);
        } catch (e) {
            DOM.hideLoading();
            console.error('Load from history error:', e);
            DOM.showToast('加载失败，请重新选择文件');
            this.removeHistory(record.id);
        }
    }
    
    async removeHistory(id) {
        await FileHandleStore.removeHandle(id);
        await this.render();
    }
    
    async clearHistory() {
        if (!confirm('确定要清空所有历史记录吗？')) {
            return;
        }
        
        await FileHandleStore.clearAll();
        await this.render();
        DOM.showToast('历史记录已清空');
    }
}