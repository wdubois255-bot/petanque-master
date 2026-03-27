import Phaser from 'phaser';
import config from './config.js';
import I18n from './utils/I18n.js';

// Global error capture — stores last errors for feedback/debug
// Errors are automatically included in FeedbackWidget reports
const MAX_ERRORS = 20;
const _capturedErrors = [];
let _errorToastTimeout = null;

function captureError(msg, source) {
    _capturedErrors.push({
        time: new Date().toISOString(),
        msg: String(msg).slice(0, 200),
        source: source || ''
    });
    if (_capturedErrors.length > MAX_ERRORS) _capturedErrors.shift();
    showErrorToast();
}

// Discreet toast at bottom of screen (DOM-based, works even if Phaser crashes)
function showErrorToast() {
    let toast = document.getElementById('error-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'error-toast';
        toast.style.cssText = `
            position: fixed; bottom: 8px; right: 8px; z-index: 9999;
            background: rgba(90,26,26,0.92); color: #F5E6D0;
            font-family: monospace; font-size: 11px;
            padding: 6px 12px; border-radius: 4px;
            border: 1px solid #C44B3F; opacity: 0;
            transition: opacity 0.3s; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }
    const count = _capturedErrors.length;
    const last = _capturedErrors[count - 1];
    toast.textContent = `[!] ${last.msg.slice(0, 60)}${count > 1 ? ` (+${count - 1})` : ''}`;
    toast.style.opacity = '1';
    clearTimeout(_errorToastTimeout);
    _errorToastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 5000);
}

window.addEventListener('error', (e) => {
    captureError(e.message, e.filename ? `${e.filename}:${e.lineno}` : '');
});
window.addEventListener('unhandledrejection', (e) => {
    captureError(e.reason?.message || String(e.reason), 'promise');
});
if (typeof globalThis !== 'undefined') globalThis.__GAME_ERRORS__ = _capturedErrors;

await I18n.load(I18n.detect());
const game = new Phaser.Game(config);
if (typeof globalThis !== 'undefined') globalThis.__PHASER_GAME__ = game;
