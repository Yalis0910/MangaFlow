# 文件路径记忆功能开发文档

## 一、功能概述

使用现代浏览器的 **File System Access API** 实现文件路径记忆功能。用户上传文件后，系统保存文件句柄(File Handle)，下次访问时可直接从历史记录中选择，无需重新查找和选择文件。

## 二、技术背景

### 2.1 File System Access API 简介

File System Access API 是现代浏览器提供的文件系统访问接口，允许 Web 应用：
- 读取本地文件
- 保存文件修改
- 获取文件/目录句柄并持久化存储

### 2.2 浏览器兼容性

| 浏览器 | 支持版本 | 备注 |
|--------|----------|------|
| Chrome | 86+ | 完整支持 |
| Edge | 86+ | 完整支持 |
| Opera | 72+ | 完整支持 |
| Firefox | 不支持 | 需要降级处理 |
| Safari | 不支持 | 需要降级处理 |
| Mobile Chrome | 部分支持 | Android 86+ |

### 2.3 核心概念

```javascript
// FileSystemFileHandle - 文件句柄
// FileSystemDirectoryHandle - 目录句柄
// 关键方法:
// - window.showOpenFilePicker() - 选择文件
// - window.showDirectoryPicker() - 选择目录
// - handle.getFile() - 从句柄获取文件
// - IndexedDB 存储句柄
```

## 三、功能模块设计

### 3.1 模块架构

```
js/
├── utils/
│   ├── file-handle-store.js    [新增] 文件句柄存储管理
│   └── file.js                 [修改] 集成句柄功能
├── components/
│   └── history-panel.js        [新增] 历史记录面板组件
└── reader/
    └── index.js                [修改] 集成历史记录功能
```

### 3.2 模块详细设计

#### 3.2.1 FileHandleStore 模块 (文件句柄存储)

**职责**: 管理文件/目录句柄的存储、读取、验证和清理

**数据结构**:
```javascript
{
    id: string,              // 唯一标识 (基于路径哈希生成)
    name: string,            // 显示名称
    type: 'file' | 'folder' | 'archive',  // 类型
    handle: FileSystemHandle, // 文件系统句柄
    lastAccess: number,      // 最后访问时间戳
    fileCount: number,       // 文件数量
    thumbnail: string        // 可选: 缩略图 DataURL
}
```

**核心方法**:
```javascript
const FileHandleStore = {
    // 初始化 IndexedDB 存储
    async init() {},
    
    // 保存句柄
    async saveHandle(id, name, type, handle, metadata) {},
    
    // 获取所有历史记录
    async getAllHandles() {},
    
    // 获取单个句柄
    async getHandle(id) {},
    
    // 验证句柄是否有效 (用户可能移动/删除了文件)
    async verifyHandle(handle) {},
    
    // 从句柄加载文件
    async loadFilesFromHandle(handle) {},
    
    // 删除历史记录
    async removeHandle(id) {},
    
    // 清理所有历史
    async clearAll() {}
};
```

#### 3.2.2 HistoryPanel 模块 (历史记录面板)

**职责**: 展示历史文件列表，支持快速访问和管理

**UI 结构**:
```html
<div class="history-panel" id="history-panel">
    <div class="history-header">
        <span class="history-title">历史记录</span>
        <button class="btn-clear-all">清空</button>
    </div>
    <div class="history-list" id="history-list">
        <!-- 历史项动态生成 -->
        <div class="history-item" data-id="xxx">
            <div class="history-icon"><!-- 类型图标 --></div>
            <div class="history-info">
                <span class="history-name">文件夹名称</span>
                <span class="history-meta">12 张图片 · 2024-01-15</span>
            </div>
            <button class="btn-remove">×</button>
        </div>
    </div>
    <div class="history-empty">
        <p>暂无历史记录</p>
    </div>
</div>
```

#### 3.2.3 FileUtils 扩展

**新增方法**:
```javascript
// 使用 File System Access API 选择文件
async selectFilesWithHandle() {
    if (!('showOpenFilePicker' in window)) {
        return this.selectFiles(); // 降级到传统方式
    }
    
    try {
        const handles = await window.showOpenFilePicker({
            multiple: true,
            types: [{
                description: 'Images',
                accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'] }
            }]
        });
        
        const files = [];
        for (const handle of handles) {
            const file = await handle.getFile();
            if (this.isImageFile(file)) {
                files.push({ file, handle });
            }
        }
        return files;
    } catch (e) {
        if (e.name === 'AbortError') return [];
        throw e;
    }
}

// 使用 File System Access API 选择文件夹
async selectFolderWithHandle() {
    if (!('showDirectoryPicker' in window)) {
        return this.selectFolder(); // 降级
    }
    
    try {
        const dirHandle = await window.showDirectoryPicker();
        const result = await this.loadFromDirectoryHandle(dirHandle);
        return { files: result.files, handle: dirHandle };
    } catch (e) {
        if (e.name === 'AbortError') return { files: [], handle: null };
        throw e;
    }
}

// 从目录句柄加载文件
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
    return { files: this.sortFiles(files), handle: dirHandle };
}
```

### 3.3 数据流程图

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户操作流程                              │
└─────────────────────────────────────────────────────────────────┘

[选择文件/文件夹]
       │
       ▼
┌──────────────────┐
│ 检测浏览器支持    │
│ File System API  │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[支持]      [不支持]
    │         │
    ▼         ▼
┌─────────┐ ┌─────────┐
│showOpen │ │传统input│
│FilePicker│ │方式选择 │
└────┬────┘ └────┬────┘
     │           │
     ▼           ▼
┌─────────────────────┐
│ 获取文件 + 句柄      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 保存句柄到 IndexedDB │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ 加载并显示图片       │
└─────────────────────┘


[从历史记录打开]
       │
       ▼
┌──────────────────┐
│ 从 IndexedDB 读取 │
│ 保存的句柄        │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ 验证句柄有效性    │
│ requestPermission │
└────────┬─────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
[有效]      [无效/权限被拒]
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│加载文件 │ │提示重新选择 │
└─────────┘ │或删除记录   │
            └─────────────┘
```

## 四、功能入口

### 4.1 入口位置

| 入口 | 位置 | 触发方式 |
|------|------|----------|
| 选择图片 | 欢迎页「选择图片」按钮 | 点击 |
| 选择文件夹 | 欢迎页「选择文件夹」按钮 | 点击 |
| 选择压缩包 | 欢迎页「选择压缩包」按钮 | 点击 |
| 拖拽上传 | 欢迎页上传区域 | 拖拽 |
| 历史记录 | 欢迎页新增「历史记录」区域 | 点击列表项 |

### 4.2 UI 入口设计

**欢迎页新增历史记录区域**:
```html
<div class="welcome-screen">
    <!-- 现有上传区域 -->
    <div class="upload-area">...</div>
    
    <!-- 新增: 历史记录区域 -->
    <div class="history-section" id="history-section">
        <h3 class="history-section-title">
            <svg>...</svg>
            最近打开
        </h3>
        <div class="history-grid" id="history-grid">
            <!-- 历史卡片 -->
            <div class="history-card" data-id="xxx">
                <div class="history-card-thumb">
                    <img src="thumbnail" alt="">
                </div>
                <div class="history-card-info">
                    <span class="history-card-name">漫画名称</span>
                    <span class="history-card-meta">12张 · 昨天</span>
                </div>
                <button class="history-card-remove">×</button>
            </div>
        </div>
        <button class="btn-show-all-history">查看全部</button>
    </div>
</div>
```

### 4.3 交互流程

```
1. 首次使用
   └─ 显示上传区域，历史记录为空

2. 选择文件后
   ├─ 请求文件系统权限
   ├─ 保存句柄到 IndexedDB
   └─ 更新历史记录列表

3. 点击历史记录
   ├─ 验证句柄权限
   │   ├─ 有权限 → 直接加载
   │   └─ 无权限 → 重新请求
   │       ├─ 用户同意 → 加载
   │       └─ 用户拒绝 → 提示删除记录
   └─ 加载文件并进入阅读

4. 管理历史记录
   ├─ 悬停显示删除按钮
   ├─ 点击删除 → 移除记录
   └─ 清空全部 → 确认后清空
```

## 五、PC/Mobile 适配

### 5.1 平台差异分析

| 特性 | PC | Mobile |
|------|-----|--------|
| File System Access API | 完整支持 | Android 部分支持, iOS 不支持 |
| 存储空间 | 充足 | 有限, 需控制缓存大小 |
| 交互方式 | 鼠标悬停、点击 | 触摸、长按 |
| 屏幕空间 | 宽敞, 可展示更多历史 | 紧凑, 需精简显示 |
| 权限管理 | 一次性授权 | 可能需要重复授权 |

### 5.2 适配策略

#### 5.2.1 功能降级

```javascript
const FeatureDetection = {
    hasFileSystemAccess() {
        return 'showOpenFilePicker' in window;
    },
    
    hasIndexedDB() {
        return 'indexedDB' in window;
    },
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    },
    
    supportsHandleStore() {
        return this.hasFileSystemAccess() && this.hasIndexedDB();
    }
};

// 根据能力选择策略
const StorageStrategy = FeatureDetection.supportsHandleStore() 
    ? 'handle-store'  // 完整功能
    : 'progress-only'; // 仅保存阅读进度
```

#### 5.2.2 UI 响应式设计

**PC 端 (> 768px)**:
```css
.history-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
}

.history-card {
    /* 卡片式布局 */
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.history-card:hover .history-card-remove {
    opacity: 1; /* 悬停显示删除按钮 */
}
```

**Mobile 端 (< 768px)**:
```css
.history-grid {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.history-card {
    /* 列表式布局 */
    display: flex;
    align-items: center;
    padding: 12px;
}

.history-card-thumb {
    width: 48px;
    height: 48px;
    flex-shrink: 0;
}

.history-card-remove {
    opacity: 1; /* 始终显示 */
    padding: 8px; /* 增大点击区域 */
}
```

#### 5.2.3 触摸交互优化

```javascript
// Mobile 端长按删除
if (isMobile()) {
    let longPressTimer;
    
    historyCard.addEventListener('touchstart', () => {
        longPressTimer = setTimeout(() => {
            showDeleteConfirm(id);
        }, 500);
    });
    
    historyCard.addEventListener('touchend', () => {
        clearTimeout(longPressTimer);
    });
    
    historyCard.addEventListener('touchmove', () => {
        clearTimeout(longPressTimer);
    });
}
```

### 5.3 权限处理差异

**PC 端**:
- 首次选择文件时授权
- 句柄持久化存储
- 后续访问自动验证权限

**Mobile 端**:
- 每次访问可能需要重新授权
- 提供友好的权限引导提示
- 存储最近访问时间,清理过期记录

```javascript
async function verifyPermission(handle) {
    const options = { mode: 'read' };
    
    // 检查已有权限
    if ((await handle.queryPermission(options)) === 'granted') {
        return true;
    }
    
    // 请求权限
    if ((await handle.requestPermission(options)) === 'granted') {
        return true;
    }
    
    return false;
}
```

## 六、实现步骤

### 6.1 Phase 1: 核心存储模块

1. 创建 `js/utils/file-handle-store.js`
2. 实现 IndexedDB 句柄存储
3. 实现句柄验证和加载

### 6.2 Phase 2: UI 组件

1. 创建 `js/components/history-panel.js`
2. 实现历史记录列表渲染
3. 实现删除/清空功能

### 6.3 Phase 3: 集成与适配

1. 修改 `js/utils/file.js` 集成句柄功能
2. 修改 `js/reader/index.js` 添加历史入口
3. 实现响应式布局
4. 添加权限处理逻辑

### 6.4 Phase 4: 测试与优化

1. PC 端 Chrome/Edge 测试
2. Mobile 端 Android Chrome 测试
3. 不支持浏览器降级测试
4. 性能优化 (大量历史记录)

## 七、注意事项

### 7.1 安全性

- 句柄存储在 IndexedDB, 仅限同源访问
- 每次使用句柄需验证权限
- 不存储敏感文件路径信息

### 7.2 隐私性

- 提供清除历史记录功能
- 不上传任何文件信息到服务器
- 缩略图仅在本地生成和存储

### 7.3 兼容性

- 始终提供传统上传方式作为降级方案
- 检测 API 支持情况,优雅降级
- Mobile 端 iOS 完全不支持,使用传统方式

### 7.4 性能

- 限制历史记录数量 (建议最多 50 条)
- 缩略图压缩存储
- 懒加载历史列表

## 八、API 参考

### 8.1 File System Access API

```javascript
// 选择文件
const [fileHandle] = await window.showOpenFilePicker({
    multiple: false,
    types: [{
        description: 'Images',
        accept: { 'image/*': ['.png', '.jpg'] }
    }]
});

// 选择目录
const dirHandle = await window.showDirectoryPicker();

// 从句柄获取文件
const file = await fileHandle.getFile();

// 遍历目录
for await (const entry of dirHandle.values()) {
    console.log(entry.name, entry.kind);
}

// 权限检查
const status = await handle.queryPermission({ mode: 'read' });
const granted = await handle.requestPermission({ mode: 'read' });
```

### 8.2 IndexedDB 存储句柄

```javascript
// 存储句柄 (IndexedDB 支持存储 FileSystemHandle)
const db = await indexedDB.open('MangaReaderDB', 2);

db.onupgradeneeded = (event) => {
    const db = event.target.result;
    if (!db.objectStoreNames.contains('fileHandles')) {
        db.createObjectStore('fileHandles', { keyPath: 'id' });
    }
};

// 保存
const tx = db.transaction('fileHandles', 'readwrite');
const store = tx.objectStore('fileHandles');
await store.put({
    id: 'unique-id',
    name: 'My Manga',
    handle: fileHandle,  // 直接存储句柄
    timestamp: Date.now()
});
```

## 九、示例代码

### 9.1 完整的 FileHandleStore 实现

```javascript
const FileHandleStore = {
    db: null,
    dbName: 'MangaReaderDB',
    storeName: 'fileHandles',
    maxRecords: 50,
    
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 2);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
                    store.createIndex('timestamp', 'timestamp', { unique: false });
                }
            };
        });
    },
    
    async saveHandle(id, name, type, handle, metadata = {}) {
        if (!this.db) await this.init();
        
        const record = {
            id,
            name,
            type,
            handle,
            timestamp: Date.now(),
            ...metadata
        };
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.put(record);
            
            request.onsuccess = () => resolve(record);
            request.onerror = () => reject(request.error);
        });
    },
    
    async getAllHandles() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readonly');
            const store = tx.objectStore(this.storeName);
            const index = store.index('timestamp');
            const request = index.openCursor(null, 'prev');
            
            const results = [];
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    results.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    },
    
    async verifyHandle(handle) {
        try {
            const permission = await handle.queryPermission({ mode: 'read' });
            if (permission === 'granted') return true;
            
            const request = await handle.requestPermission({ mode: 'read' });
            return request === 'granted';
        } catch (e) {
            console.error('Handle verification failed:', e);
            return false;
        }
    },
    
    async loadFilesFromHandle(handle) {
        const isValid = await this.verifyHandle(handle);
        if (!isValid) {
            throw new Error('Permission denied or handle invalid');
        }
        
        const files = [];
        
        if (handle.kind === 'file') {
            const file = await handle.getFile();
            return [file];
        }
        
        if (handle.kind === 'directory') {
            for await (const entry of handle.values()) {
                if (entry.kind === 'file') {
                    const file = await entry.getFile();
                    if (FileUtils.isImageFile(file)) {
                        files.push(file);
                    }
                }
            }
        }
        
        return FileUtils.sortFiles(files);
    },
    
    async removeHandle(id) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    },
    
    async clearAll() {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(this.storeName, 'readwrite');
            const store = tx.objectStore(this.storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
};
```

---

**文档版本**: v1.0  
**创建日期**: 2026-05-26  
**适用项目**: MangaFlow 漫画阅读器
