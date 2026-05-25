const ArchiveManager = {
    initialized: false,
    Archive: null,
    
    async init() {
        if (this.initialized) return;
        
        try {
            const module = await import('../../lib/libarchive.js');
            this.Archive = module.Archive;
            
            this.Archive.init({
                workerUrl: 'lib/worker-bundle.js'
            });
            
            this.initialized = true;
        } catch (e) {
            console.error('Failed to initialize libarchive.js:', e);
            throw e;
        }
    },
    
    async extract(archiveFile) {
        if (!this.initialized) {
            await this.init();
        }
        
        try {
            const archive = await this.Archive.open(archiveFile);
            const filesObj = await archive.extractFiles();
            
            const files = [];
            const processObject = async (obj, path = '') => {
                for (const key in obj) {
                    const item = obj[key];
                    if (item instanceof File) {
                        const lowerName = item.name.toLowerCase();
                        const isImage = lowerName.endsWith('.jpg') || 
                                        lowerName.endsWith('.jpeg') || 
                                        lowerName.endsWith('.png') || 
                                        lowerName.endsWith('.webp') || 
                                        lowerName.endsWith('.gif') ||
                                        lowerName.endsWith('.bmp') ||
                                        lowerName.endsWith('.avif');
                        
                        if (isImage) {
                            files.push(item);
                        }
                    } else if (typeof item === 'object' && item !== null) {
                        await processObject(item, path + key + '/');
                    }
                }
            };
            
            await processObject(filesObj);
            return files;
        } catch (e) {
            console.error('Archive extraction error:', e);
            return [];
        }
    },
    
    isArchiveFile(file) {
        const lowerName = file.name.toLowerCase();
        return lowerName.endsWith('.zip') ||
               lowerName.endsWith('.cbz') ||
               lowerName.endsWith('.7z') ||
               lowerName.endsWith('.cb7') ||
               lowerName.endsWith('.rar') ||
               lowerName.endsWith('.cbr') ||
               lowerName.endsWith('.tar') ||
               lowerName.endsWith('.tar.gz') ||
               lowerName.endsWith('.tar.bz2') ||
               lowerName.endsWith('.tar.xz') ||
               lowerName.endsWith('.tgz') ||
               lowerName.endsWith('.tbz2') ||
               lowerName.endsWith('.txz') ||
               lowerName.endsWith('.gz') ||
               lowerName.endsWith('.bz2') ||
               lowerName.endsWith('.xz');
    }
};
