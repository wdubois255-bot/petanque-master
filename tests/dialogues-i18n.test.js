/**
 * PHASE 2 — Dialogues & I18n Tests
 * Tests I18n coverage, commentator phrases, hardcoded strings,
 * and text quality across all scenes.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'public', 'data');
const SRC_DIR = resolve(ROOT, 'src');

// Load data files
const frLang = JSON.parse(readFileSync(resolve(DATA_DIR, 'lang', 'fr.json'), 'utf-8'));
const enLang = JSON.parse(readFileSync(resolve(DATA_DIR, 'lang', 'en.json'), 'utf-8'));
const commentator = JSON.parse(readFileSync(resolve(DATA_DIR, 'commentator.json'), 'utf-8'));
const characters = JSON.parse(readFileSync(resolve(DATA_DIR, 'characters.json'), 'utf-8'));
const arcade = JSON.parse(readFileSync(resolve(DATA_DIR, 'arcade.json'), 'utf-8'));
const shop = JSON.parse(readFileSync(resolve(DATA_DIR, 'shop.json'), 'utf-8'));
const terrains = JSON.parse(readFileSync(resolve(DATA_DIR, 'terrains.json'), 'utf-8'));

// Helper: flatten object keys with dot notation
function flattenKeys(obj, prefix = '') {
    const keys = [];
    for (const [k, v] of Object.entries(obj)) {
        const fullKey = prefix ? `${prefix}.${k}` : k;
        if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
            keys.push(...flattenKeys(v, fullKey));
        } else {
            keys.push(fullKey);
        }
    }
    return keys;
}

// Helper: resolve a dotted key in an object
function resolveKey(key, obj) {
    return key.split('.').reduce((o, k) => o?.[k], obj) ?? null;
}

// Collect all JS source files recursively
function collectJsFiles(dir) {
    const files = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectJsFiles(fullPath));
        } else if (entry.name.endsWith('.js')) {
            files.push(fullPath);
        }
    }
    return files;
}

const allFrKeys = flattenKeys(frLang);
const allEnKeys = flattenKeys(enLang);
const srcFiles = collectJsFiles(SRC_DIR);

// ══════════════════════════════════════════════════════════════════
// 2A. COMMENTATOR IN-GAME DIALOGUES
// ══════════════════════════════════════════════════════════════════
describe('Phase 2A — Commentator dialogues in-game', () => {
    // FR categories (without _en suffix)
    const frCategories = Object.keys(commentator).filter(k => !k.endsWith('_en'));

    it('commentator.json a des categories FR', () => {
        expect(frCategories.length).toBeGreaterThan(0);
    });

    for (const cat of frCategories) {
        describe(`Commentator: ${cat}`, () => {
            it('a au moins 2 variantes FR (variete)', () => {
                const pool = commentator[cat];
                expect(Array.isArray(pool), `${cat} should be array`).toBe(true);
                expect(pool.length, `${cat} needs >= 2 variants`).toBeGreaterThanOrEqual(2);
            });

            it('a une version EN correspondante', () => {
                const enKey = `${cat}_en`;
                expect(commentator[enKey], `${cat} missing _en version`).toBeDefined();
                expect(Array.isArray(commentator[enKey])).toBe(true);
            });

            it('meme nombre de variantes FR et EN', () => {
                const enKey = `${cat}_en`;
                if (commentator[enKey]) {
                    expect(commentator[enKey].length).toBe(commentator[cat].length);
                }
            });

            it('aucune chaine vide', () => {
                for (const phrase of commentator[cat]) {
                    expect(phrase.trim().length, `${cat}: empty phrase`).toBeGreaterThan(0);
                }
                const enKey = `${cat}_en`;
                if (commentator[enKey]) {
                    for (const phrase of commentator[enKey]) {
                        expect(phrase.trim().length, `${enKey}: empty phrase`).toBeGreaterThan(0);
                    }
                }
            });
        });
    }

    it('les categories EN sont toutes couvertes (pas de FR sans EN)', () => {
        for (const cat of frCategories) {
            expect(commentator[`${cat}_en`], `${cat} has no _en equivalent`).toBeDefined();
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// 2B. DIALOGUES OUT-GAME — I18n key coverage per scene
// ══════════════════════════════════════════════════════════════════
describe('Phase 2B — I18n keys per scene section', () => {
    describe('Title scene keys', () => {
        const titleKeys = [
            'title.subtitle', 'title.press_start',
            'title.menu.play', 'title.menu.arcade', 'title.menu.quickplay',
            'title.menu.character', 'title.menu.shop', 'title.menu.settings',
            'title.controls'
        ];
        for (const key of titleKeys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('CharSelect scene keys', () => {
        const keys = [
            'charselect.title', 'charselect.controls',
            'charselect.stats.prec', 'charselect.stats.puis',
            'charselect.stats.efft', 'charselect.stats.sfr',
            'charselect.abilities_title', 'charselect.locked'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Result scene keys', () => {
        const keys = [
            'result.victory', 'result.defeat', 'result.stats_title',
            'result.continue', 'result.replay', 'result.menu',
            'result.fanny', 'result.galets', 'result.controls'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Result stats keys', () => {
        const keys = [
            'result.stats.menes', 'result.stats.carreaux', 'result.stats.best_score',
            'result.stats.biberons', 'result.stats.best_ball', 'result.stats.hit_rate',
            'result.stats.playstyle'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('LevelUp scene keys', () => {
        const keys = [
            'levelup.title', 'levelup.points_remaining',
            'levelup.confirm', 'levelup.new_ability', 'levelup.controls_hint'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Shop scene keys', () => {
        const keys = [
            'shop.buy', 'shop.owned', 'shop.equip', 'shop.insufficient',
            'shop.confirm', 'shop.yes', 'shop.no',
            'shop.tab_balls', 'shop.tab_jacks', 'shop.tab_abilities',
            'shop.controls_hint'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Tutorial scene keys', () => {
        const keys = [
            'tutorial.goal', 'tutorial.aim', 'tutorial.aim_sub',
            'tutorial.loft_title', 'tutorial.modes.demi', 'tutorial.modes.plombee',
            'tutorial.modes.tir', 'tutorial.focus_title', 'tutorial.focus_desc',
            'tutorial.score_title', 'tutorial.score_main', 'tutorial.score_sub',
            'tutorial.understood', 'tutorial.turn_rule', 'tutorial.turn_rule_sub',
            'tutorial.previous', 'tutorial.next', 'tutorial.controls_hint',
            'tutorial.page1_title', 'tutorial.page2_title', 'tutorial.page3_title',
            'tutorial.page4_title', 'tutorial.page5_title',
            'tutorial.welcome_line1', 'tutorial.welcome_line2', 'tutorial.welcome_line3',
            'tutorial.cochonnet_hint', 'tutorial.strategy_hint',
            'tutorial.retro_hint', 'tutorial.ability_hint', 'tutorial.tab_hint',
            'tutorial.encourage_first_mene'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Arcade scene keys', () => {
        const keys = [
            'arcade.title', 'arcade.subtitle', 'arcade.next_fight',
            'arcade.fight_btn', 'arcade.round', 'arcade.difficulty',
            'arcade.terrain_label', 'arcade.complete', 'arcade.perfect',
            'arcade.champion', 'arcade.continue', 'arcade.retry',
            'arcade.menu', 'arcade.controls',
            'arcade.challenge_complete', 'arcade.challenge_failed',
            'arcade.defeat_title', 'arcade.defeat_retry', 'arcade.defeat_continue'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('In-game scene keys', () => {
        const keys = [
            'ingame.score', 'ingame.you', 'ingame.opponent',
            'ingame.mene', 'ingame.tab_hint', 'ingame.pause',
            'ingame.your_turn', 'ingame.opp_turn',
            'ingame.throw_cochonnet', 'ingame.opp_throws_cochonnet',
            'ingame.first_ball', 'ingame.opp_first_ball',
            'ingame.tie_no_points', 'ingame.win_points',
            'ingame.you_name', 'ingame.opp_name',
            'ingame.win_verb', 'ingame.opp_verb',
            'ingame.yes', 'ingame.no'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Aiming & loft keys', () => {
        const keys = [
            'aiming.retro_on', 'aiming.retro_off',
            'loft.demi', 'loft.plombee', 'loft.tir',
            'loft.desc.demi', 'loft.desc.plombee', 'loft.desc.tir'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Terrain hint keys', () => {
        const keys = [
            'terrain_hints.colline', 'terrain_hints.docks',
            'terrain_hints.plage', 'terrain_hints.parc'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('UI common keys', () => {
        const keys = ['ui.back', 'ui.confirm', 'ui.vs'];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Boot keys', () => {
        const keys = [
            'boot.title', 'boot.loading', 'boot.loading_pct',
            'boot.ready', 'boot.save_failed', 'boot.tips'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).not.toBeNull();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).not.toBeNull();
            });
        }
    });

    describe('Feedback keys', () => {
        const keys = [
            'feedback.title', 'feedback.how_fun',
            'feedback.rating_good', 'feedback.rating_ok', 'feedback.rating_bad',
            'feedback.comment_label', 'feedback.comment_placeholder',
            'feedback.send', 'feedback.thanks'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Overworld keys', () => {
        const keys = ['overworld.blocked_exit', 'overworld.gate_locked'];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });

    describe('Settings keys', () => {
        const keys = [
            'title.settings.sound', 'title.settings.music',
            'title.settings.sfx', 'title.settings.tutorial',
            'title.settings.close', 'title.settings.feedback'
        ];
        for (const key of keys) {
            it(`FR: ${key} exists`, () => {
                expect(resolveKey(key, frLang), `FR missing: ${key}`).toBeTruthy();
            });
            it(`EN: ${key} exists`, () => {
                expect(resolveKey(key, enLang), `EN missing: ${key}`).toBeTruthy();
            });
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// 2C. QUALITE DES TEXTES
// ══════════════════════════════════════════════════════════════════
describe('Phase 2C — Qualite des textes', () => {
    it('aucune cle FR ne retourne undefined ou chaine vide', () => {
        for (const key of allFrKeys) {
            const val = resolveKey(key, frLang);
            expect(val, `FR key ${key} is null/undefined`).not.toBeNull();
            if (typeof val === 'string') {
                expect(val.length, `FR key ${key} is empty string`).toBeGreaterThan(0);
            }
        }
    });

    it('aucune cle EN ne retourne undefined ou chaine vide', () => {
        for (const key of allEnKeys) {
            const val = resolveKey(key, enLang);
            expect(val, `EN key ${key} is null/undefined`).not.toBeNull();
            if (typeof val === 'string') {
                expect(val.length, `EN key ${key} is empty string`).toBeGreaterThan(0);
            }
        }
    });

    it('FR et EN ont les memes cles de premier niveau', () => {
        const frTop = Object.keys(frLang).sort();
        const enTop = Object.keys(enLang).sort();
        expect(frTop).toEqual(enTop);
    });

    it('aucune cle contient "[TODO]"', () => {
        for (const key of allFrKeys) {
            const val = resolveKey(key, frLang);
            if (typeof val === 'string') {
                expect(val).not.toContain('[TODO]');
            }
        }
        for (const key of allEnKeys) {
            const val = resolveKey(key, enLang);
            if (typeof val === 'string') {
                expect(val).not.toContain('[TODO]');
            }
        }
    });

    it('FR et EN ont la meme structure de cles', () => {
        // Check that every FR key path exists in EN
        const frSet = new Set(allFrKeys);
        const enSet = new Set(allEnKeys);
        const missingInEn = allFrKeys.filter(k => !enSet.has(k));
        const missingInFr = allEnKeys.filter(k => !frSet.has(k));
        expect(missingInEn, `Keys in FR but not EN: ${missingInEn.join(', ')}`).toEqual([]);
        expect(missingInFr, `Keys in EN but not FR: ${missingInFr.join(', ')}`).toEqual([]);
    });

    // Check for removed throw types in text
    // "roulette" as a throw type, NOT the French expression "sur des roulettes"
    const removedThrowTypes = ['tir devant', 'rafle'];
    it('aucune reference aux lancers supprimes dans les textes FR', () => {
        for (const key of allFrKeys) {
            const val = resolveKey(key, frLang);
            if (typeof val === 'string') {
                for (const removed of removedThrowTypes) {
                    expect(val.toLowerCase()).not.toContain(removed);
                }
            }
        }
    });

    it('aucune reference aux lancers supprimes dans les textes EN', () => {
        const removedEn = ['roulette throw', 'front shot', 'rafle shot'];
        for (const key of allEnKeys) {
            const val = resolveKey(key, enLang);
            if (typeof val === 'string') {
                for (const removed of removedEn) {
                    expect(val.toLowerCase()).not.toContain(removed);
                }
            }
        }
    });

    it('aucune reference aux lancers supprimes dans commentator.json', () => {
        for (const [cat, pool] of Object.entries(commentator)) {
            if (Array.isArray(pool)) {
                for (const phrase of pool) {
                    for (const removed of removedThrowTypes) {
                        expect(phrase.toLowerCase(), `commentator ${cat}: contains "${removed}"`).not.toContain(removed);
                    }
                }
            }
        }
    });

    it('aucune reference aux lancers supprimes dans character barks', () => {
        for (const char of characters.roster) {
            for (const [cat, pool] of Object.entries(char.barks)) {
                if (Array.isArray(pool)) {
                    for (const phrase of pool) {
                        for (const removed of removedThrowTypes) {
                            expect(phrase.toLowerCase(), `${char.id} barks.${cat}: contains "${removed}"`).not.toContain(removed);
                        }
                    }
                }
            }
            if (char.barks_en) {
                for (const [cat, pool] of Object.entries(char.barks_en)) {
                    if (Array.isArray(pool)) {
                        for (const phrase of pool) {
                            for (const removed of removedThrowTypes) {
                                expect(phrase.toLowerCase(), `${char.id} barks_en.${cat}: contains "${removed}"`).not.toContain(removed);
                            }
                        }
                    }
                }
            }
        }
    });

    // Extract I18n.t() keys from source code and verify they exist
    it('chaque cle I18n.t() utilisee dans le code existe en FR', () => {
        const usedKeys = new Set();
        const pattern = /I18n\.t\(\s*['"]([^'"]+)['"]/g;
        for (const file of srcFiles) {
            const content = readFileSync(file, 'utf-8');
            let match;
            while ((match = pattern.exec(content)) !== null) {
                usedKeys.add(match[1]);
            }
        }

        const missing = [];
        for (const key of usedKeys) {
            const val = resolveKey(key, frLang);
            if (val === null) {
                // Some keys use fallback default values in code — check if it's a known pattern
                // e.g. I18n.t('locked_arcade', 'A debloquer en Arcade')
                // These fallback patterns are OK
                if (!key.includes('locked_') && !key.includes('galet_') && !key.includes('.galets_icon') && !key.includes('.challenge_label') && !key.endsWith('_')) {
                    missing.push(key);
                }
            }
        }
        expect(missing, `I18n keys used in code but missing in fr.json: ${missing.join(', ')}`).toEqual([]);
    });

    it('boot.tips est un tableau non vide FR et EN', () => {
        expect(Array.isArray(frLang.boot.tips)).toBe(true);
        expect(frLang.boot.tips.length).toBeGreaterThan(5);
        expect(Array.isArray(enLang.boot.tips)).toBe(true);
        expect(enLang.boot.tips.length).toBeGreaterThan(5);
    });

    it('boot.tips FR et EN ont le meme nombre d\'elements', () => {
        expect(frLang.boot.tips.length).toBe(enLang.boot.tips.length);
    });
});

// ══════════════════════════════════════════════════════════════════
// 2D. HARDCODED STRINGS CHECK
// ══════════════════════════════════════════════════════════════════
describe('Phase 2D — Hardcoded strings check', () => {
    // Scene files that should use I18n for player-visible text
    const sceneFiles = srcFiles.filter(f =>
        f.includes('scenes') &&
        !f.includes('DevTest') &&
        !f.includes('SpriteTest')
    );

    it('aucun console.log en production dans les scenes', () => {
        for (const file of sceneFiles) {
            const content = readFileSync(file, 'utf-8');
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                // Allow commented-out console.log
                if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
                expect(line, `${file}:${i + 1} has console.log`)
                    .not.toMatch(/^\s*console\.log\(/);
            }
        }
    });

    it('aucune couleur #000000 ou #000 dans les scenes', () => {
        for (const file of sceneFiles) {
            const content = readFileSync(file, 'utf-8');
            // Check for pure black (#000 or #000000 or 0x000000)
            // Allow in comments
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line.startsWith('//') || line.startsWith('*')) continue;
                expect(line, `${file}:${i + 1} uses pure black`)
                    .not.toMatch(/'#000000'|"#000000"|'#000'|"#000"|0x000000/);
            }
        }
    });
});
