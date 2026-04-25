import Phaser from 'phaser';
import config from './config.js';
import I18n from './utils/I18n.js';
import { initAudioOnFirstGesture } from './utils/SoundManager.js';
import { isMobileUA } from './utils/DeviceDetect.js';
import { installGlobalHandlers } from './utils/ErrorReporter.js';

// Capture globale des erreurs (toast DOM + ring buffer + persist localStorage).
// Module ErrorReporter — remplace l'ancien globalThis.__GAME_ERRORS__.
installGlobalHandlers();

await I18n.load(I18n.detect());
initAudioOnFirstGesture();
const game = new Phaser.Game(config);

// __PHASER_GAME__ : conserve uniquement en DEV pour debug DevTools/Playwright.
// En production le bundle ne l'expose pas (interdit par CLAUDE.md).
if (import.meta.env.DEV && typeof globalThis !== 'undefined') {
    globalThis.__PHASER_GAME__ = game;
}

// === Mobile: orientation lock + paysage warning + auto-fullscreen ===
if (isMobileUA()) {
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
    // textContent + DOM API plutot qu'innerHTML (CSP strict, evite XSS)
    const icon = document.createElement('div');
    icon.style.fontSize = '52px';
    icon.textContent = '↻';
    const text = document.createElement('div');
    text.textContent = 'Retournez votre telephone en mode portrait';
    orientOverlay.appendChild(icon);
    orientOverlay.appendChild(text);
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
