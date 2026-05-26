const FileUtils = {
    isImageFile(file) {
        return CONFIG.supportedFormats.includes(file.type);
    },
    
    isArchiveFile(file) {
        return ArchiveManager.isArchiveFile(file);
    },
    
    naturalSort(a, b) {
        const ax = [];
        const bx = [];
        
        a.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
            ax.push([$1 || Infinity, $2 || '']);
        });
        b.replace(/(\d+)|(\D+)/g, (_, $1, $2) => {
            bx.push([$1 || Infinity, $2 || '']);
        });
        
        while (ax.length && bx.length) {
            const an = ax.shift();
            const bn = bx.shift();
            const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
            if (nn) return nn;
        }
        
        return ax.length - bx.length;
    },
    
    sortFiles(files) {
        return [...files].sort((a, b) => this.naturalSort(a.name, b.name));
    },
    
    async selectFiles() {
        return new Promise((resolve) => {
            const input = document.getElementById('file-input');
            input.multiple = true;
            input.accept = 'image/*';
            
            input.onchange = (e) => {
                const files = Array.from(e.target.files).filter(f => this.isImageFile(f));
                resolve(this.sortFiles(files));
                input.value = '';
            };
            
            input.click();
        });
    },
    
    async selectFolder() {
        if ('showDirectoryPicker' in window) {
            try {
                const dirHandle = await window.showDirectoryPicker();
                const files = [];
                
                for await (const entry of dirHandle.values()) {
                    if (entry.kind === 'file') {
                        const file = await entry.getFile();
                        if (this.isImageFile(file)) {
                            files.push(file);
                        }
                    }
                }
                
                return this.sortFiles(files);
            } catch (e) {
                if (e.name === 'AbortError') return [];
                console.error('Folder selection error:', e);
                return [];
            }
        } else {
            return this.selectFiles();
        }
    },
    
    async selectArchive() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.zip,.cbz,.7z,.cb7,.rar,.cbr,.tar,.tar.gz,.tar.bz2,.tar.xz,.tgz,.tbz2,.txz,.gz,.bz2,.xz';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file && this.isArchiveFile(file)) {
                    const files = await this.extractArchive(file);
                    resolve(files);
                } else {
                    resolve([]);
                }
            };
            
            input.oncancel = () => {
                resolve([]);
            };
            
            document.body.onfocus = () => {
                setTimeout(() => {
                    if (!input.files || input.files.length === 0) {
                        resolve([]);
                    }
                }, 300);
                document.body.onfocus = null;
            };
            
            input.click();
        });
    },
    
    async extractArchive(archiveFile) {
        try {
            const files = await ArchiveManager.extract(archiveFile);
            return this.sortFiles(files);
        } catch (e) {
            console.error('Archive extraction error:', e);
            return [];
        }
    },
    
    async handleDrop(dataTransfer) {
        const items = Array.from(dataTransfer.items);
        const files = [];
        
        for (const item of items) {
            if (item.kind === 'file') {
                const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
                
                if (entry) {
                    if (entry.isFile) {
                        const file = await this.getFileFromEntry(entry);
                        if (file) {
                            if (this.isImageFile(file)) {
                                files.push(file);
                            } else if (this.isArchiveFile(file)) {
                                const archiveFiles = await this.extractArchive(file);
                                files.push(...archiveFiles);
                            }
                        }
                    } else if (entry.isDirectory) {
                        const dirFiles = await this.getFilesFromDirectory(entry);
                        files.push(...dirFiles.filter(f => this.isImageFile(f)));
                    }
                } else {
                    const file = item.getAsFile();
                    if (file) {
                        if (this.isImageFile(file)) {
                            files.push(file);
                        } else if (this.isArchiveFile(file)) {
                            const archiveFiles = await this.extractArchive(file);
                            files.push(...archiveFiles);
                        }
                    }
                }
            }
        }
        
        return this.sortFiles(files);
    },
    
    getFileFromEntry(entry) {
        return new Promise((resolve) => {
            entry.file(resolve, () => resolve(null));
        });
    },
    
    async getFilesFromDirectory(directoryEntry) {
        const files = [];
        const reader = directoryEntry.createReader();
        
        const readAllEntries = async () => {
            const entries = await new Promise((resolve) => {
                reader.readEntries(resolve, () => resolve([]));
            });
            
            if (entries.length === 0) return;
            
            for (const entry of entries) {
                if (entry.isFile) {
                    const file = await this.getFileFromEntry(entry);
                    if (file) files.push(file);
                } else if (entry.isDirectory) {
                    const subFiles = await this.getFilesFromDirectory(entry);
                    files.push(...subFiles);
                }
            }
            
            await readAllEntries();
        };
        
        await readAllEntries();
        return files;
    },
    
    hasFileSystemAccess() {
        return 'showDirectoryPicker' in window && 'showOpenFilePicker' in window;
    },
    
    async selectFolderWithHandle() {
        if (!this.hasFileSystemAccess()) {
            const files = await this.selectFolder();
            return { files: files, handle: null };
        }
        try {
            const dirHandle = await window.showDirectoryPicker();
            const files = await this.loadFromDirectoryHandle(dirHandle);
            return { files: files, handle: dirHandle };
        } catch (e) {
            if (e.name === 'AbortError') {
                return { files: [], handle: null };
            }
            console.error('Folder selection error:', e);
            return { files: [], handle: null };
        }
    },
    
    async selectArchiveWithHandle() {
        if (!this.hasFileSystemAccess()) {
            const files = await this.selectArchive();
            return { files: files, handle: null };
        }
        try {
            const fileHandles = await window.showOpenFilePicker({
                types: [{
                    description: 'Archive Files',
                    accept: {
                        'application/octet-stream': ['.zip', '.cbz', '.7z', '.cb7', '.rar', '.cbr', '.tar', '.gz', '.tgz', '.bz2', '.tbz2', '.xz', '.txz']
                    }
                }],
                multiple: false
            });
            const file = await fileHandles[0].getFile();
            const files = await this.extractArchive(file);
            return { files: files, handle: fileHandles[0] };
        } catch (e) {
            if (e.name === 'AbortError') {
                return { files: [], handle: null };
            }
            console.error('Archive selection error:', e);
            return { files: [], handle: null };
        }
    },
    
    async loadFromDirectoryHandle(dirHandle) {
        const files = [];
        for await (const entry of dirHandle.values()) {
            if (entry.kind === 'file') {
                const file = await entry.getFile();
                if (this.isImageFile(file)) {
                    files.push(file);
                }
            }
        }
        return this.sortFiles(files);
    },
    
    generateId(files) {
        const names = files.map(f => f.name).join(',');
        let hash = 0;
        for (let i = 0; i < names.length; i++) {
            const char = names.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `manga-${Math.abs(hash).toString(36)}`;
    }
};
