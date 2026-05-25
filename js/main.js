let reader;

document.addEventListener('DOMContentLoaded', () => {
    reader = new MangaReader();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    });
}
