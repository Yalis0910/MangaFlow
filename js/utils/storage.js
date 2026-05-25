const Storage = {
    db: null,
    dbName: 'MangaReaderDB',
    dbVersion: 1,
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('progress')) {
                    db.createObjectStore('progress', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    },
    
    async saveProgress(id, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readwrite');
            const store = transaction.objectStore('progress');
            const request = store.put({ id, ...data, timestamp: Date.now() });
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    async loadProgress(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readonly');
            const store = transaction.objectStore('progress');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    },
    
    async clearProgress(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['progress'], 'readwrite');
            const store = transaction.objectStore('progress');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    setTheme(theme) {
        localStorage.setItem(CONFIG.storageKeys.theme, theme);
    },
    
    getTheme() {
        return localStorage.getItem(CONFIG.storageKeys.theme) || 'light';
    },
    
    setSettings(settings) {
        localStorage.setItem(CONFIG.storageKeys.settings, JSON.stringify(settings));
    },
    
    getSettings() {
        const data = localStorage.getItem(CONFIG.storageKeys.settings);
        return data ? JSON.parse(data) : {};
    }
};
