// DeviceDetect.js — Source UNIQUE de détection device.
// Aucune dépendance interne (pas d'import) → utilisable depuis Constants.js
// sans créer de cycle. Constants.js et Layout.js doivent passer par ici.
//
// Trois niveaux de détection :
// - isMobileUA()        : sniff user-agent (rapide, suffisant pour 95% des cas)
// - isTouchOnly()       : pointer coarse + pas de pointer fine (anti UA spoofing)
// - isPortraitDevice()  : combine UA + matchMedia, c'est le predicat utilise
//                         pour appliquer les SCALES (TERRAIN, VELOCITY, FRICTION)

export function isMobileUA() {
    if (typeof navigator === 'undefined' || !navigator.userAgent) return false;
    return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isTouchOnly() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(pointer: coarse)').matches &&
           !window.matchMedia('(pointer: fine)').matches;
}

export function isPortraitOrientation() {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(orientation: portrait)').matches;
}

// Predicat principal utilise par Constants/Layout pour decider portrait vs paysage.
// Mobile = UA mobile, OU (touch-only + petit ecran portrait pour DevTools device mode).
export function isPortraitDevice() {
    if (isMobileUA()) return true;
    return isTouchOnly() && typeof window !== 'undefined' &&
           window.innerWidth < 800 && isPortraitOrientation();
}
