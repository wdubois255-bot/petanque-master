// src/utils/I18n.js
// Singleton i18n léger — fallback FR automatique, pas de framework

import { loadSave, saveSave } from './SaveManager.js';

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
            // Fallback silencieux vers fr
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
        const save = loadSave();
        if (save.lang === 'fr' || save.lang === 'en') return save.lang;
        const nav = navigator.language?.substring(0, 2);
        return nav === 'fr' ? 'fr' : 'en';
    },

    setLocale(locale) {
        const save = loadSave();
        save.lang = locale;
        saveSave(save);
        this._locale = locale;
    },

    // Résout un champ localisé dans un objet de données JSON
    // Ex: I18n.field(character, 'name') → character.name_en si locale=en, sinon character.name
    field(obj, fieldName) {
        if (this._locale !== 'fr') {
            const localized = obj[`${fieldName}_${this._locale}`];
            if (localized !== undefined && localized !== null && localized !== '') return localized;
        }
        return obj[fieldName];
    },

    // Pour les tableaux (barks, narratives)
    fieldArray(obj, fieldName) {
        if (this._locale !== 'fr') {
            const localized = obj[`${fieldName}_${this._locale}`];
            if (Array.isArray(localized) && localized.length > 0) return localized;
        }
        return obj[fieldName];
    }
};

export default I18n;
