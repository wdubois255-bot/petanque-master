// ErrorReporter.js — capture globale des erreurs JS + UnhandledRejection.
// Source unique remplaçant l'ancien globalThis.__GAME_ERRORS__ (interdit par CLAUDE.md).
//
// - Garde en memoire les MAX_ERRORS dernieres erreurs (ring buffer)
// - Persiste les 10 dernieres dans localStorage (survit a un reload pour debug)
// - Tag chaque erreur avec un release/build identifier (visible dans FeedbackWidget)
// - Affiche un toast DOM discret (independant de Phaser → fonctionne meme si crash render)

const MAX_ERRORS = 20;
const PERSIST_KEY = 'petanque_recent_errors';
const PERSIST_MAX = 10;

// Release tag : injecte au build via Vite define (cf. vite.config.js).
// Fallback "dev" en developpement local.
const RELEASE = (typeof __APP_VERSION__ !== 'undefined') ? __APP_VERSION__ : 'dev';

const _captured = [];
let _toastTimeout = null;
let _onCapture = null;

function _persist() {
    try {
        const recent = _captured.slice(-PERSIST_MAX);
        localStorage.setItem(PERSIST_KEY, JSON.stringify(recent));
    } catch (_) { /* localStorage HS, silent */ }
}

function _showToast() {
    if (typeof document === 'undefined') return;
    let toast = document.getElementById('error-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'error-toast';
        toast.style.cssText =
            'position:fixed;bottom:8px;right:8px;z-index:9999;' +
            'background:rgba(90,26,26,0.92);color:#F5E6D0;' +
            'font-family:monospace;font-size:11px;padding:6px 12px;' +
            'border-radius:4px;border:1px solid #C44B3F;opacity:0;' +
            'transition:opacity 0.3s;pointer-events:none;max-width:60vw';
        document.body.appendChild(toast);
    }
    const last = _captured[_captured.length - 1];
    const count = _captured.length;
    // textContent (jamais innerHTML) → pas d'XSS si stack contient du HTML
    toast.textContent = `[!] ${(last.msg || '').slice(0, 60)}${count > 1 ? ` (+${count - 1})` : ''}`;
    toast.style.opacity = '1';
    clearTimeout(_toastTimeout);
    _toastTimeout = setTimeout(() => { toast.style.opacity = '0'; }, 5000);
}

export function captureError(msg, source) {
    const entry = {
        time: new Date().toISOString(),
        msg: String(msg || '').slice(0, 200),
        source: source || '',
        release: RELEASE,
        url: typeof location !== 'undefined' ? location.pathname : ''
    };
    _captured.push(entry);
    if (_captured.length > MAX_ERRORS) _captured.shift();
    _persist();
    _showToast();
    if (_onCapture) {
        try { _onCapture(entry); } catch (_) { /* observer crash → ignore */ }
    }
}

// Lecture (utilise par FeedbackWidget pour joindre les dernieres erreurs au feedback)
export function getRecentErrors() {
    return _captured.slice();
}

// Persisted errors recovery (lus au boot pour les inclure dans le prochain feedback)
export function getPersistedErrors() {
    try {
        const raw = localStorage.getItem(PERSIST_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
}

export function clearErrors() {
    _captured.length = 0;
    try { localStorage.removeItem(PERSIST_KEY); } catch (_) { /* ignore */ }
}

// Optional observer (Sentry/etc plug ici quand un DSN sera fourni)
export function onError(callback) { _onCapture = callback; }

export function getRelease() { return RELEASE; }

// Installe les listeners globaux (a appeler une fois au boot, depuis main.js)
export function installGlobalHandlers() {
    if (typeof window === 'undefined') return;
    window.addEventListener('error', (e) => {
        captureError(e.message, e.filename ? `${e.filename}:${e.lineno}` : '');
    });
    window.addEventListener('unhandledrejection', (e) => {
        captureError(e.reason?.message || String(e.reason), 'promise');
    });
}
