// Layout.js — Central orientation & dimensions module
// Desktop = paysage 832x480 (inchangé). Mobile = portrait 480x960.
// Décidé dans project_mobile_strategy.md (24/04/2026).
//
// Mode figé au boot (reload requis pour bascule), évite re-layout runtime coûteux.
// Toute valeur dépendant de l'orientation doit passer par ce module, JAMAIS de
// lecture directe de GAME_WIDTH/GAME_HEIGHT dans les scènes (ces constantes = desktop default).

import {
    GAME_WIDTH as DESKTOP_W,
    GAME_HEIGHT as DESKTOP_H,
    GAME_WIDTH_PORTRAIT as MOBILE_W,
    GAME_HEIGHT_PORTRAIT as MOBILE_H
} from './Constants.js';

// --- Détection device ---------------------------------------------------

function detectMobileUA() {
    if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function detectPortraitOrientation() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(orientation: portrait)').matches;
}

// Mobile = UA mobile OU (simulateur en portrait via matchMedia)
// Permet DevTools device mode (desktop Chrome passé en mobile) de basculer.
function detectMobile() {
    return detectMobileUA() || (typeof window !== 'undefined' && window.innerWidth < 800 && detectPortraitOrientation());
}

// --- Résolution du mode (une seule fois au boot) ------------------------

const isMobile = detectMobile();
const mode = isMobile ? 'portrait' : 'landscape';
const W = isMobile ? MOBILE_W : DESKTOP_W;
const H = isMobile ? MOBILE_H : DESKTOP_H;

// --- Safe area insets (iOS notch, home indicator) -----------------------

function readSafeInsets() {
    if (typeof window === 'undefined' || !window.getComputedStyle || !document.body) {
        return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    // On lit les paddings calcules du <body> qui utilise env(safe-area-inset-*)
    // (cf. index.html). getPropertyValue sur custom property retourne le literal
    // CSS, pas la valeur resolue — il faut passer par un element qui la consomme.
    const bodyStyle = window.getComputedStyle(document.body);
    const parse = (prop) => {
        const v = bodyStyle.getPropertyValue(prop).trim();
        const n = parseFloat(v);
        return Number.isFinite(n) ? Math.round(n) : 0;
    };
    return {
        top: parse('padding-top'),
        right: parse('padding-right'),
        bottom: parse('padding-bottom'),
        left: parse('padding-left')
    };
}

// --- Ancres UI nommées (centralisation des positions par mode) ----------

// Chaque ancre retourne un {x, y} calculé selon le mode actif.
// Ajouter ici toute nouvelle ancre — évite la duplication dans les scènes.
const ANCHORS = {
    landscape: {
        scorePanel:   () => ({ x: W - 70, y: 30 }),
        abilityHud:   () => ({ x: W - 40, y: H / 2 }),
        modeSelector: () => ({ x: W / 2, y: H - 52 }),
        throwCircle:  () => ({ x: W / 2, y: H - 40 })
    },
    portrait: {
        scorePanel:   () => ({ x: W / 2, y: 40 }),
        abilityHud:   () => ({ x: W - 40, y: H - 280 }),
        modeSelector: () => ({ x: W / 2, y: H - 180 }),
        throwCircle:  () => ({ x: W / 2, y: H - 120 })
    }
};

function anchor(name) {
    const fn = ANCHORS[mode][name];
    if (!fn) throw new Error(`[Layout] unknown anchor "${name}" for mode "${mode}"`);
    return fn();
}

// --- API publique -------------------------------------------------------

const Layout = {
    mode,
    W,
    H,
    isMobile,
    isPortrait: mode === 'portrait',
    isLandscape: mode === 'landscape',
    get safe() { return readSafeInsets(); },
    anchor,
    // Helpers position relative (0.0-1.0) → pixels
    relX: (ratio) => Math.round(W * ratio),
    relY: (ratio) => Math.round(H * ratio)
};

export default Layout;
