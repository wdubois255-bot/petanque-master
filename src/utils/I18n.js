// src/utils/I18n.js
// Singleton i18n léger — fallback FR automatique, pas de framework

const I18n = {
    _locale: 'fr',
    _strings: {},
    _fallback: {},

    async load(locale) {
        const BASE = import.meta.env.BASE_URL;
        try {
            const res = await fetch(`${BASE}data/lang/${locale}.json`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this._strings = await res.json();
            this._locale = locale;
        } catch (e) {
            console.warn(`I18n: failed to load ${locale}, falling back to fr`);
            if (locale !== 'fr') await this.load('fr');
            return;
        }
        // Toujours charger le FR comme fallback
        if (locale !== 'fr' && Object.keys(this._fallback).length === 0) {
            try {
                const res = await fetch(`${BASE}data/lang/fr.json`);
                this._fallback = await res.json();
            } catch (_) {}
        }
    },

    // Résolution d'une clé dotted avec interpolation {var}
    t(key, params = {}) {
        let str = this._resolve(key, this._strings)
                || this._resolve(key, this._fallback)
                || key;
        if (typeof str !== 'string') return key;
        for (const [k, v] of Object.entries(params)) {
            str = str.replace(`{${k}}`, v);
        }
        return str;
    },

    // Retourne un tableau (ex: boot.tips)
    ta(key) {
        const arr = this._resolve(key, this._strings)
                 || this._resolve(key, this._fallback);
        return Array.isArray(arr) ? arr : [];
    },

    _resolve(key, obj) {
        return key.split('.').reduce((o, k) => o?.[k], obj) ?? null;
    },

    get locale() { return this._locale; },

    detect() {
        const saved = localStorage.getItem('petanque_lang');
        if (saved === 'fr' || saved === 'en') return saved;
        const nav = navigator.language?.substring(0, 2);
        return nav === 'fr' ? 'fr' : 'en';
    },

    setLocale(locale) {
        localStorage.setItem('petanque_lang', locale);
        this._locale = locale;
    }
};

export default I18n;
