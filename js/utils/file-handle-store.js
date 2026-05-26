const FileHandleStore = {
    storeName: 'fileHandles',
    maxRecords: 50,
    
    async init() {
        if (!Storage.db) {
            await Storage.init();
        }
    },
    
    async saveHandle(id, name, type, handle, metadata) {
        if (!Storage.db) {
            await this.init();
        }
        
        var all = await this.getAllHandles();
        var existing = all.find(function(r) {
            return r.name === name && r.type === type;
        });
        
        return new Promise(function(resolve, reject) {
            var transaction = Storage.db.transaction([FileHandleStore.storeName], 'readwrite');
            var store = transaction.objectStore(FileHandleStore.storeName);
            
            if (existing) {
                existing.handle = handle;
                existing.fileCount = metadata ? (metadata.fileCount || 0) : existing.fileCount;
                existing.timestamp = Date.now();
                if (metadata && metadata.thumbnail) {
                    existing.thumbnail = metadata.thumbnail;
                }
                var request = store.put(existing);
                request.onsuccess = function() {
                    resolve(existing);
                };
                request.onerror = function() {
                    reject(request.error);
                };
            } else {
                var record = {
                    id: 'history-' + type + '-' + name + '-' + Date.now(),
                    name: name,
                    type: type,
                    handle: handle,
                    fileCount: metadata ? (metadata.fileCount || 0) : 0,
                    thumbnail: metadata ? (metadata.thumbnail || null) : null,
                    note: '',
                    timestamp: Date.now()
                };
                var request = store.put(record);
                request.onsuccess = function() {
                    FileHandleStore.cleanupOldRecords().then(function() {
                        resolve(record);
                    }).catch(function() {
                        resolve(record);
                    });
                };
                request.onerror = function() {
                    reject(request.error);
                };
            }
        });
    },
    
    async updateNote(id, note) {
        if (!Storage.db) {
            await this.init();
        }
        
        return new Promise(function(resolve, reject) {
            var transaction = Storage.db.transaction([FileHandleStore.storeName], 'readwrite');
            var store = transaction.objectStore(FileHandleStore.storeName);
            var getRequest = store.get(id);
            
            getRequest.onsuccess = function() {
                var record = getRequest.result;
                if (record) {
                    record.note = note || '';
                    var putRequest = store.put(record);
                    putRequest.onsuccess = function() {
                        resolve(record);
                    };
                    putRequest.onerror = function() {
                        reject(putRequest.error);
                    };
                } else {
                    reject(new Error('Record not found'));
                }
            };
            getRequest.onerror = function() {
                reject(getRequest.error);
            };
        });
    },
    
    async getHandle(id) {
        if (!Storage.db) {
            await this.init();
        }
        
        return new Promise(function(resolve, reject) {
            var transaction = Storage.db.transaction([FileHandleStore.storeName], 'readonly');
            var store = transaction.objectStore(FileHandleStore.storeName);
            var request = store.get(id);
            
            request.onsuccess = function() {
                resolve(request.result || null);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    },
    
    async getAllHandles() {
        if (!Storage.db) {
            await this.init();
        }
        
        return new Promise(function(resolve, reject) {
            var transaction = Storage.db.transaction([FileHandleStore.storeName], 'readonly');
            var store = transaction.objectStore(FileHandleStore.storeName);
            var request = store.getAll();
            
            request.onsuccess = function() {
                var results = request.result || [];
                results.sort(function(a, b) {
                    return b.timestamp - a.timestamp;
                });
                resolve(results);
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    },
    
    async removeHandle(id) {
        if (!Storage.db) {
            await this.init();
        }
        
        return new Promise(function(resolve, reject) {
            var transaction = Storage.db.transaction([FileHandleStore.storeName], 'readwrite');
            var store = transaction.objectStore(FileHandleStore.storeName);
            var request = store.delete(id);
            
            request.onsuccess = function() {
                resolve();
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    },
    
    async clearAll() {
        if (!Storage.db) {
            await this.init();
        }
        
        return new Promise(function(resolve, reject) {
            var transaction = Storage.db.transaction([FileHandleStore.storeName], 'readwrite');
            var store = transaction.objectStore(FileHandleStore.storeName);
            var request = store.clear();
            
            request.onsuccess = function() {
                resolve();
            };
            request.onerror = function() {
                reject(request.error);
            };
        });
    },
    
    async verifyHandle(handle) {
        if (!handle) {
            return false;
        }
        
        try {
            var permission = await handle.queryPermission({ mode: 'read' });
            if (permission === 'granted') {
                return true;
            }
            
            var requestPermission = await handle.requestPermission({ mode: 'read' });
            return requestPermission === 'granted';
        } catch (e) {
            return false;
        }
    },
    
    async loadFilesFromHandle(handle) {
        if (!handle) {
            return [];
        }
        
        var files = [];
        
        try {
            if (handle.kind === 'file') {
                var file = await handle.getFile();
                if (ArchiveManager.isArchiveFile(file)) {
                    var extractedFiles = await ArchiveManager.extract(file);
                    return extractedFiles;
                }
                files.push({
                    name: file.name,
                    file: file,
                    handle: handle
                });
            } else if (handle.kind === 'directory') {
                var entries = [];
                for await (var entry of handle.values()) {
                    entries.push(entry);
                }
                
                entries.sort(function(a, b) {
                    var nameA = a.name.toLowerCase();
                    var nameB = b.name.toLowerCase();
                    if (nameA < nameB) {
                        return -1;
                    }
                    if (nameA > nameB) {
                        return 1;
                    }
                    return 0;
                });
                
                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    if (entry.kind === 'file') {
                        var ext = entry.name.toLowerCase();
                        if (ext.endsWith('.jpg') || ext.endsWith('.jpeg') || 
                            ext.endsWith('.png') || ext.endsWith('.webp') || 
                            ext.endsWith('.gif') || ext.endsWith('.bmp')) {
                            var file = await entry.getFile();
                            files.push({
                                name: file.name,
                                file: file,
                                handle: entry
                            });
                        }
                    }
                }
            }
        } catch (e) {
            console.error('loadFilesFromHandle error:', e);
        }
        
        return files;
    },
    
    async cleanupOldRecords() {
        var all = await FileHandleStore.getAllHandles();
        
        if (all.length <= FileHandleStore.maxRecords) {
            return;
        }
        
        var toRemove = all.slice(FileHandleStore.maxRecords);
        
        for (var i = 0; i < toRemove.length; i++) {
            await FileHandleStore.removeHandle(toRemove[i].id);
        }
    }
};

var ThumbnailGenerator = {
    size: 120,
    quality: 0.65,
    
    generate: function(file) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            var url = URL.createObjectURL(file);
            
            img.onload = function() {
                URL.revokeObjectURL(url);
                
                try {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    
                    canvas.width = ThumbnailGenerator.size;
                    canvas.height = ThumbnailGenerator.size;
                    
                    var scale = Math.max(ThumbnailGenerator.size / img.width, ThumbnailGenerator.size / img.height);
                    var width = img.width * scale;
                    var height = img.height * scale;
                    var x = (ThumbnailGenerator.size - width) / 2;
                    var y = (ThumbnailGenerator.size - height) / 2;
                    
                    ctx.fillStyle = '#1a1a1a';
                    ctx.fillRect(0, 0, ThumbnailGenerator.size, ThumbnailGenerator.size);
                    ctx.drawImage(img, x, y, width, height);
                    
                    var dataUrl = canvas.toDataURL('image/jpeg', ThumbnailGenerator.quality);
                    resolve(dataUrl);
                } catch (e) {
                    reject(e);
                }
            };
            
            img.onerror = function() {
                URL.revokeObjectURL(url);
                reject(new Error('Image load failed'));
            };
            
            img.src = url;
        });
    }
};