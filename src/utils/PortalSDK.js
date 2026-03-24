/**
 * PortalSDK — Wrapper léger pour CrazyGames SDK v2 et Poki SDK v2.
 *
 * IMPORTANT : Ne PAS charger les SDK réels ici.
 * Les scripts SDK sont injectés dans index.html au moment du build via
 * la variable d'environnement VITE_PLATFORM (voir vite.config.js).
 *
 * En standalone (itch.io, localhost, PC) : toutes les méthodes sont des no-ops.
 * Les SDK réels seront ajoutés uniquement au déploiement portail.
 *
 * Usage :
 *   import PortalSDK from '../utils/PortalSDK.js';
 *   await PortalSDK.init();
 *   PortalSDK.gameplayStart();
 *   PortalSDK.gameplayStop();
 *   PortalSDK.happyTime(0.5);
 */

import { setMuted } from './SoundManager.js';

class PortalSDKClass {
    constructor() {
        this.platform = 'standalone'; // 'crazygames' | 'poki' | 'standalone'
        this._initialized = false;
    }

    // ============================================================
    // DETECTION
    // ============================================================

    detect() {
        if (typeof window === 'undefined') {
            this.platform = 'standalone';
            return this.platform;
        }
        if (window.CrazyGames?.SDK) {
            this.platform = 'crazygames';
        } else if (window.PokiSDK) {
            this.platform = 'poki';
        } else {
            this.platform = 'standalone';
        }
        return this.platform;
    }

    // ============================================================
    // INIT
    // ============================================================

    async init() {
        this.detect();
        if (this._initialized) return;

        if (this.platform === 'poki') {
            try {
                await window.PokiSDK.init();
            } catch (_) {
                // SDK error — continuer quand même
            }
        }
        // CrazyGames s'auto-initialise, rien à faire

        this._initialized = true;
    }

    // ============================================================
    // LOADING (Poki)
    // ============================================================

    loadingFinished() {
        if (this.platform === 'poki') {
            try { window.PokiSDK.gameLoadingFinished(); } catch (_) {}
        }
        // CrazyGames : pas de loading event requis
    }

    // ============================================================
    // GAMEPLAY EVENTS
    // ============================================================

    gameplayStart() {
        if (this.platform === 'crazygames') {
            try { window.CrazyGames.SDK.game.gameplayStart(); } catch (_) {}
        } else if (this.platform === 'poki') {
            try { window.PokiSDK.gameplayStart(); } catch (_) {}
        }
    }

    gameplayStop() {
        if (this.platform === 'crazygames') {
            try { window.CrazyGames.SDK.game.gameplayStop(); } catch (_) {}
        } else if (this.platform === 'poki') {
            try { window.PokiSDK.gameplayStop(); } catch (_) {}
        }
    }

    // ============================================================
    // HAPPY TIME (CrazyGames uniquement)
    // ============================================================

    /**
     * @param {number} intensity 0.0 à 1.0
     * Moments : carreau = 0.4, ciseau = 0.5, victoire = 0.5, fanny = 0.8, arcade complete = 1.0
     */
    happyTime(intensity = 0.5) {
        if (this.platform === 'crazygames') {
            try { window.CrazyGames.SDK.game.happyTime(intensity); } catch (_) {}
        }
        // Poki n'a pas d'équivalent
    }

    // ============================================================
    // ADS — Interstitiels (entre les matchs Arcade)
    // ============================================================

    async showInterstitial() {
        if (this.platform === 'crazygames') {
            return new Promise((resolve) => {
                try {
                    window.CrazyGames.SDK.ad.requestAd('midgame', {
                        adStarted:  () => this._muteGame(),
                        adFinished: () => { this._unmuteGame(); resolve(true); },
                        adError:    () => { this._unmuteGame(); resolve(false); }
                    });
                } catch (_) { resolve(false); }
            });
        } else if (this.platform === 'poki') {
            try {
                await window.PokiSDK.commercialBreak(() => this._muteGame());
                this._unmuteGame();
                return true;
            } catch (_) { this._unmuteGame(); return false; }
        }
        return false; // standalone
    }

    // ============================================================
    // ADS — Rewarded (pub pour Galets bonus)
    // ============================================================

    async showRewarded() {
        if (this.platform === 'crazygames') {
            return new Promise((resolve) => {
                try {
                    window.CrazyGames.SDK.ad.requestAd('rewarded', {
                        adStarted:  () => this._muteGame(),
                        adFinished: () => { this._unmuteGame(); resolve(true); },
                        adError:    () => { this._unmuteGame(); resolve(false); }
                    });
                } catch (_) { resolve(false); }
            });
        } else if (this.platform === 'poki') {
            try {
                this._muteGame();
                const result = await window.PokiSDK.rewardedBreak({ size: 'medium' });
                this._unmuteGame();
                return !!result;
            } catch (_) { this._unmuteGame(); return false; }
        }
        return false; // standalone
    }

    // ============================================================
    // BANNERS (CrazyGames uniquement)
    // ============================================================

    showBanner(containerId, width = 728, height = 90) {
        if (this.platform === 'crazygames') {
            try {
                window.CrazyGames.SDK.banner.requestBanner({ id: containerId, width, height });
            } catch (_) {}
        }
    }

    hideBanner(containerId) {
        if (this.platform === 'crazygames') {
            try {
                window.CrazyGames.SDK.banner.requestBanner({ id: containerId, width: 0, height: 0 });
            } catch (_) {}
        }
    }

    // ============================================================
    // CLOUD SAVE (CrazyGames Data module — Phase D optionnel)
    // ============================================================

    async cloudSave(data) {
        if (this.platform === 'crazygames') {
            try {
                await window.CrazyGames.SDK.data.save(JSON.stringify(data));
                return true;
            } catch (_) { return false; }
        }
        return false;
    }

    async cloudLoad() {
        if (this.platform === 'crazygames') {
            try {
                const raw = await window.CrazyGames.SDK.data.load();
                return raw ? JSON.parse(raw) : null;
            } catch (_) { return null; }
        }
        return null;
    }

    // ============================================================
    // SHAREABLE URL (Poki uniquement)
    // ============================================================

    shareableURL(params = {}) {
        if (this.platform === 'poki') {
            try { return window.PokiSDK.shareableURL(params); } catch (_) {}
        }
        return null;
    }

    getURLParam(key) {
        if (this.platform === 'poki') {
            try { return window.PokiSDK.getURLParam(key); } catch (_) {}
        }
        return null;
    }

    // ============================================================
    // INTERNAL
    // ============================================================

    _muteGame() {
        try { setMuted(true); } catch (_) {}
    }

    _unmuteGame() {
        try { setMuted(false); } catch (_) {}
    }
}

export default new PortalSDKClass();
