# MangaFlow

A modern, immersive manga reader with smooth vertical scrolling experience. Pure frontend implementation, no backend required.

**Live Demo:** https://manga.yalis.cn/

[中文文档](README_CN.md)

## Features

- **Vertical Scrolling Mode** - Immersive long-strip reading experience
- **Multiple Import Methods**
  - Select multiple images
  - Select folder (File System Access API)
  - Drag & drop support
  - Archive files (ZIP, CBZ, 7Z, CB7, RAR, CBR, TAR, etc.)
- **History Records(PC only)** - Quick access to recently opened folders/archives
  - Auto-save file handles with thumbnails
  - Custom notes for each record
  - One-click to resume reading
- **Lazy Loading** - Efficient image loading with Intersection Observer
- **Progress Tracking** - Auto-save reading progress, resume where you left off
- **Draggable Progress Bar** - Jump to any page by dragging
- **Thumbnail Navigation** - Quick page preview and navigation
- **Zoom Controls**
  - PC: Keyboard shortcuts (+/-), mouse wheel
  - Mobile: Pinch-to-zoom gesture
- **Day/Night Theme** - Toggle between light and dark modes
- **Keyboard Shortcuts** - Full keyboard navigation support
- **PWA Ready** - Install as standalone app on mobile devices
- **Responsive Design** - Optimized for both desktop and mobile

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `↑` / `↓` | Scroll up/down |
| `PageUp` | Previous page |
| `PageDown` / `Space` | Next page |
| `Home` | Jump to first page |
| `End` | Jump to last page |
| `F` or `F11` | Toggle fullscreen |
| `Esc` | Exit fullscreen / Close thumbnail panel |
| `+` / `=` | Zoom in |
| `-` | Zoom out |
| `T` | Toggle thumbnail panel |

## Mobile Gestures

- **Tap left area** - Previous page
- **Tap right area** - Next page
- **Tap center** - Toggle toolbar
- **Double tap** - Toggle zoom
- **Pinch** - Zoom in/out

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/mangaflow.git
cd mangaflow
```

2. Start a local server

**Windows:**
```bash
start.bat
```

**Or manually:**
```bash
python -m http.server 8080
```

3. Open http://localhost:8080 in your browser

### Important

This application requires an HTTP server due to:
- ES Modules dynamic imports
- WebAssembly (WASM) loading
- Service Worker registration

Opening `index.html` directly via `file://` protocol will not work.

## Project Structure

```
mangaflow/
├── index.html          # Main HTML file
├── manifest.json       # PWA manifest
├── start.bat           # Windows startup script
├── css/
│   ├── base.css        # Base styles, CSS variables
│   ├── reader.css      # Reader layout styles
│   ├── components.css  # UI components styles
│   └── themes.css      # Light/dark theme styles
├── js/
│   ├── main.js         # Application entry point
│   ├── config.js       # Configuration constants
│   ├── reader/
│   │   ├── index.js    # Main reader class
│   │   ├── lazy-loader.js   # Lazy loading with Intersection Observer
│   │   ├── progress.js      # Progress management
│   │   └── zoom.js          # Zoom controls
│   ├── components/
│   │   ├── toolbar.js       # Toolbar component
│   │   ├── thumbnail.js     # Thumbnail panel
│   │   └── history-panel.js # History records panel
│   ├── events/
│   │   ├── keyboard.js      # Keyboard event handling
│   │   └── gesture.js       # Touch gesture handling
│   └── utils/
│       ├── archive.js       # libarchive.js wrapper
│       ├── file.js          # File handling utilities
│       ├── file-handle-store.js  # File handle storage (IndexedDB)
│       ├── storage.js       # IndexedDB storage
│       └── dom.js           # DOM utilities
├── lib/
│   ├── libarchive.js   # Archive library
│   ├── libarchive.wasm # WebAssembly binary
│   └── worker-bundle.js # Web Worker bundle
└── assets/
    └── icons/          # PWA icons
```

## Technology Stack

- **Vanilla JavaScript** - No framework dependencies
- **ES Modules** - Modern JavaScript modules
- **WebAssembly** - libarchive.js for archive extraction
- **IndexedDB** - Persistent storage for reading progress
- **Intersection Observer API** - Efficient lazy loading
- **File System Access API** - Native folder selection
- **CSS Custom Properties** - Theme system

## Supported Formats

### Images
- JPEG / JPG
- PNG
- WebP
- GIF
- AVIF

### Archives
- ZIP / CBZ
- 7Z / CB7
- RAR / CBR
- TAR
- TAR.GZ / TGZ
- TAR.BZ2 / TBZ2
- TAR.XZ / TXZ

## Browser Support

| Browser | Support | History Feature |
|---------|---------|-----------------|
| Chrome (PC) | ✅ Full support | ✅ Supported |
| Edge (PC) | ✅ Full support | ✅ Supported |
| Chrome (Android) | ✅ Full support | ❌ Not supported |
| Firefox | ✅ Full support | ❌ Not supported |
| Safari (iOS/macOS) | ✅ Full support | ❌ Not supported |

### History Records Limitations

The History Records feature requires **File System Access API** to persist file handles across sessions. This API has significant limitations:

**Why it doesn't work on mobile browsers:**

1. **Android Chrome**: Although the API technically exists, it has unreliable behavior:
   - Permission requests may fail silently
   - Stored handles often lose validity after browser restart
   - File access becomes inconsistent

2. **iOS Safari**: Does not support File System Access API at all

3. **Firefox/Safari (Desktop)**: Do not support File System Access API

**Why OPFS (Origin Private File System) is not a solution:**

- OPFS is a virtual file system that can store files, but has limited quota (~100-500MB)
- Manga files are typically 50-200MB each, storing multiple would exceed quota
- Copying large files to OPFS is slow and impacts user experience
- iOS Safari doesn't support OPFS either

For these reasons, the History Records feature is only available on **PC Chrome/Edge**, and the button is automatically hidden on unsupported platforms.

## License

MIT License
