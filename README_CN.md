# MangaFlow

一个现代化的漫画阅读器，提供流畅的长条滚动阅读体验。纯前端实现，无需后端支持。

**在线预览：** https://manga.yalis.cn/

[English](README.md)

## 功能特性

- **长条滚动模式** - 沉浸式阅读体验
- **多种导入方式**
  - 多选图片
  - 选择文件夹
  - 拖拽上传
  - 压缩包（支持 ZIP、CBZ、7Z、RAR 等多种格式）
- **历史记录** - 快速访问最近打开的文件夹/压缩包
  - 自动保存文件句柄和缩略图
  - 支持自定义备注名称
  - 一键继续阅读
- **图片懒加载** - 高效的图片加载机制
- **阅读进度保存** - 自动保存进度，下次打开继续阅读
- **可拖拽进度条** - 拖动进度条快速跳转
- **缩略图导航** - 快速预览和跳转
- **缩放控制**
  - PC端：键盘快捷键、鼠标滚轮
  - 移动端：双指缩放手势
- **日/夜模式** - 亮色/暗色主题切换
- **键盘快捷键** - 完整的键盘导航支持
- **PWA 支持** - 可安装为独立应用
- **响应式设计** - 适配桌面端和移动端

## 键盘快捷键

| 按键 | 功能 |
|-----|------|
| `↑` / `↓` | 向上/向下滚动 |
| `PageUp` | 上一页 |
| `PageDown` / `空格` | 下一页 |
| `Home` | 跳转到第一页 |
| `End` | 跳转到最后一页 |
| `F` 或 `F11` | 切换全屏 |
| `Esc` | 退出全屏 / 关闭缩略图面板 |
| `+` / `=` | 放大 |
| `-` | 缩小 |
| `T` | 切换缩略图面板 |

## 移动端手势

- **点击左侧区域** - 上一页
- **点击右侧区域** - 下一页
- **点击中间区域** - 切换工具栏
- **双击** - 切换缩放
- **双指捏合** - 缩放

## 快速开始

### 环境要求

- 现代浏览器（Chrome、Firefox、Safari、Edge）
- Python 3.x（用于启动本地服务器）

### 安装使用

1. 克隆仓库
```bash
git clone https://github.com/yourusername/mangaflow.git
cd mangaflow
```

2. 启动本地服务器

**Windows:**
```bash
start.bat
```

**或手动启动:**
```bash
python -m http.server 8080
```

3. 浏览器访问 http://localhost:8080

### 注意事项

本应用需要通过 HTTP 服务器运行，原因：
- ES Modules 动态导入
- WebAssembly (WASM) 加载
- Service Worker 注册

直接通过 `file://` 协议打开 `index.html` 无法正常运行。

## 项目结构

```
mangaflow/
├── index.html          # 主页面
├── manifest.json       # PWA 配置
├── start.bat           # Windows 启动脚本
├── css/
│   ├── base.css        # 基础样式、CSS变量
│   ├── reader.css      # 阅读器布局样式
│   ├── components.css  # UI组件样式
│   └── themes.css      # 主题样式
├── js/
│   ├── main.js         # 应用入口
│   ├── config.js       # 配置常量
│   ├── reader/
│   │   ├── index.js    # 主阅读器类
│   │   ├── lazy-loader.js   # 懒加载
│   │   ├── progress.js      # 进度管理
│   │   └── zoom.js          # 缩放控制
│   ├── components/
│   │   ├── toolbar.js       # 工具栏组件
│   │   ├── thumbnail.js     # 缩略图面板
│   │   └── history-panel.js # 历史记录面板
│   ├── events/
│   │   ├── keyboard.js      # 键盘事件
│   │   └── gesture.js       # 触摸手势
│   └── utils/
│       ├── archive.js       # libarchive.js 封装
│       ├── file.js          # 文件处理工具
│       ├── file-handle-store.js  # 文件句柄存储
│       ├── storage.js       # IndexedDB 存储
│       └── dom.js           # DOM 工具函数
├── lib/
│   ├── libarchive.js   # 压缩包库
│   ├── libarchive.wasm # WebAssembly 二进制
│   └── worker-bundle.js # Web Worker
└── assets/
    └── icons/          # PWA 图标
```

## 技术栈

- 原生 JavaScript（无框架依赖）
- ES Modules 模块化
- WebAssembly (libarchive.js)
- IndexedDB 本地存储
- Intersection Observer API
- File System Access API
- CSS 自定义属性

## 支持格式

### 图片格式
- JPEG / JPG
- PNG
- WebP
- GIF
- AVIF

### 压缩包格式
- ZIP / CBZ
- 7Z / CB7
- RAR / CBR
- TAR
- TAR.GZ / TGZ
- TAR.BZ2 / TBZ2
- TAR.XZ / TXZ

## 浏览器支持

| 浏览器 | 支持情况 | 历史记录 |
|---------|---------|---------|
| Chrome | ✅ 完全支持 | ✅ 支持 |
| Edge | ✅ 完全支持 | ✅ 支持 |
| Firefox | ✅ 完全支持 | ❌ 不支持 |
| Safari | ✅ 完全支持 | ❌ 不支持 |

注意：历史记录功能需要 File System Access API，仅 Chromium 内核浏览器（Chrome、Edge、Opera）支持。Firefox/Safari 会自动隐藏历史记录按钮。

## 许可证

MIT License
