import Phaser from 'phaser';
import config from './config.js';
import I18n from './utils/I18n.js';
import { initAudioOnFirstGesture } from './utils/SoundManager.js';

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
initAudioOnFirstGesture();
const game = new Phaser.Game(config);
if (typeof globalThis !== 'undefined') globalThis.__PHASER_GAME__ = game;

// === Mobile: orientation lock + paysage warning + auto-fullscreen ===
if (typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent)) {
    // 1. Lock portrait — Android Chrome uniquement, echec silencieux sur iOS
    if (screen?.orientation?.lock) {
        screen.orientation.lock('portrait-primary').catch(() => {});
    }

    // 2. Overlay si l'utilisateur tourne quand meme en paysage (iOS ou lock echoue)
    const orientOverlay = document.createElement('div');
    orientOverlay.style.cssText = [
        'display:none', 'position:fixed', 'inset:0', 'z-index:10000',
        'background:#1A1510', 'color:#F5E6D0', 'font-family:monospace',
        'font-size:15px', 'line-height:1.8', 'text-align:center',
        'flex-direction:column', 'justify-content:center', 'align-items:center',
        'gap:20px', 'padding:24px', 'pointer-events:none'
    ].join(';');
    orientOverlay.innerHTML =
        '<div style="font-size:52px">↻</div>' +
        '<div>Retournez votre telephone<br>en mode portrait</div>';
    document.body.appendChild(orientOverlay);
    const checkOrient = () => {
        orientOverlay.style.display =
            window.matchMedia('(orientation:landscape)').matches ? 'flex' : 'none';
    };
    window.addEventListener('orientationchange', checkOrient);
    window.addEventListener('resize', checkOrient);
    checkOrient();

    // 3. Auto-fullscreen au premier geste (itch.io iframe supporte allowfullscreen)
    document.addEventListener('pointerdown', () => {
        const el = document.documentElement;
        const req = el.requestFullscreen || el.webkitRequestFullscreen;
        if (req && !document.fullscreenElement && !document.webkitFullscreenElement) {
            req.call(el).catch(() => {});
        }
    }, { once: true });
}
