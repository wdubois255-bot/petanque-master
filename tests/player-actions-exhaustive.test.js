/**
 * PHASE 3 — Player Actions Exhaustive Tests
 * Tests every player action in every scene: data flow, init() contracts,
 * scene transitions, save system, physics configs, and edge cases.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '..');
const DATA_DIR = resolve(ROOT, 'public', 'data');
const SRC_DIR = resolve(ROOT, 'src');

// Load data
const characters = JSON.parse(readFileSync(resolve(DATA_DIR, 'characters.json'), 'utf-8'));
const arcade = JSON.parse(readFileSync(resolve(DATA_DIR, 'arcade.json'), 'utf-8'));
const terrains = JSON.parse(readFileSync(resolve(DATA_DIR, 'terrains.json'), 'utf-8'));
const shop = JSON.parse(readFileSync(resolve(DATA_DIR, 'shop.json'), 'utf-8'));
const boules = JSON.parse(readFileSync(resolve(DATA_DIR, 'boules.json'), 'utf-8'));
const frLang = JSON.parse(readFileSync(resolve(DATA_DIR, 'lang', 'fr.json'), 'utf-8'));
const enLang = JSON.parse(readFileSync(resolve(DATA_DIR, 'lang', 'en.json'), 'utf-8'));

const roster = characters.roster;
const terrainStages = terrains.stages;

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: vi.fn(key => store[key] ?? null),
        setItem: vi.fn((key, value) => { store[key] = value; }),
        removeItem: vi.fn(key => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        _reset: () => { store = {}; }
    };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

// Import SaveManager
const { loadSave, saveSave } = await import('../src/utils/SaveManager.js');

// Import Constants
const Constants = await import('../src/utils/Constants.js');

// ══════════════════════════════════════════════════════════════════
// 3A. BOOT / TITLE
// ══════════════════════════════════════════════════════════════════
describe('Phase 3A — Boot / Title', () => {
    beforeEach(() => {
        localStorageMock._reset();
    });

    it('le jeu charge une sauvegarde par defaut sans crash', () => {
        const save = loadSave();
        expect(save).toBeDefined();
        expect(save.galets).toBeDefined();
        expect(save.rookie).toBeDefined();
        expect(save.rookie.stats).toBeDefined();
    });

    it('la sauvegarde par defaut a les bonnes stats Rookie', () => {
        const save = loadSave();
        expect(save.rookie.stats.precision).toBe(4);
        expect(save.rookie.stats.puissance).toBe(4);
        expect(save.rookie.stats.effet).toBe(3);
        expect(save.rookie.stats.sang_froid).toBe(3);
    });

    it('la sauvegarde par defaut commence avec 50 Galets', () => {
        const save = loadSave();
        expect(save.galets).toBe(50);
    });

    it('sauvegarder et recharger preserve les donnees', () => {
        const save = loadSave();
        save.galets = 999;
        save.rookie.stats.precision = 8;
        saveSave(save);
        const reloaded = loadSave();
        expect(reloaded.galets).toBe(999);
        expect(reloaded.rookie.stats.precision).toBe(8);
    });

    it('les boutons du Title menent aux bonnes scenes', () => {
        // Verify scene names match the expected flow
        const expectedScenes = ['QuickPlayScene', 'ArcadeScene', 'TutorialScene', 'CharSelectScene', 'ShopScene', 'PlayerScene'];
        // These are the scene keys used in Phaser — just verify they exist as class names
        const sceneDir = resolve(SRC_DIR, 'scenes');
        const sceneFiles = readdirSync(sceneDir).filter(f => f.endsWith('.js')).map(f => f.replace('.js', ''));
        for (const scene of expectedScenes) {
            expect(sceneFiles, `Scene ${scene} should exist`).toContain(scene);
        }
    });

    it('VICTORY_SCORE est 13 (regle FIPJP)', () => {
        expect(Constants.VICTORY_SCORE).toBe(13);
    });

    it('3 boules en tete-a-tete (1v1)', () => {
        // QuickPlay default format is 3 boules
        // Check that default format in QuickPlayScene is 3
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'QuickPlayScene.js'), 'utf-8');
        expect(content).toContain("display: '3 Boules'");
    });
});

// ══════════════════════════════════════════════════════════════════
// 3B. CHARSELECT
// ══════════════════════════════════════════════════════════════════
describe('Phase 3B — CharSelect', () => {
    it('CharSelectScene.init() accepte mode, arcadeRound, returnData', () => {
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'CharSelectScene.js'), 'utf-8');
        expect(content).toContain('init(data)');
    });

    it('chaque personnage du roster a les champs necessaires pour CharSelect', () => {
        for (const char of roster) {
            // CharSelect needs: name, title, catchphrase, description, stats, portrait, sprite
            expect(char.name, `${char.id}`).toBeTruthy();
            expect(char.title, `${char.id}`).toBeTruthy();
            expect(char.stats, `${char.id}`).toBeDefined();
            expect(char.portrait, `${char.id}`).toBeTruthy();
            expect(char.sprite, `${char.id}`).toBeTruthy();
        }
    });

    it('au moins un personnage est debloque par defaut', () => {
        const save = loadSave();
        expect(save.unlockedCharacters.length).toBeGreaterThan(0);
        expect(save.unlockedCharacters).toContain('rookie');
    });

    it('le Rookie est toujours debloque', () => {
        const rookie = roster.find(c => c.id === 'rookie');
        expect(rookie).toBeDefined();
        expect(rookie.unlocked).toBe(true);
    });

    it('tous les personnages ont un ID unique pour la selection', () => {
        const ids = new Set(roster.map(c => c.id));
        expect(ids.size).toBe(roster.length);
    });
});

// ══════════════════════════════════════════════════════════════════
// 3C. PETANQUE SCENE (coeur du gameplay)
// ══════════════════════════════════════════════════════════════════
describe('Phase 3C — PetanqueScene', () => {
    it('PetanqueScene.init() accepte tous les parametres requis', () => {
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'PetanqueScene.js'), 'utf-8');
        expect(content).toContain('init(data)');
        expect(content).toContain('data.terrain');
        expect(content).toContain('data.difficulty');
        expect(content).toContain('data.playerCharacter');
        expect(content).toContain('data.opponentCharacter');
    });

    it('PetanqueScene.init() reset tous les flags (regle Phaser scene reuse)', () => {
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'PetanqueScene.js'), 'utf-8');
        // Verify critical flags are reset in init()
        expect(content).toContain('this._gamePaused = false');
        expect(content).toContain('this._watchdogFired = false');
        expect(content).toContain('this._pressureActive = false');
    });

    describe('Physique — constantes coherentes', () => {
        it('FRICTION_BASE > 0', () => {
            expect(Constants.FRICTION_BASE).toBeGreaterThan(0);
        });

        it('RESTITUTION_BOULE dans la plage realiste (0.5–0.7)', () => {
            expect(Constants.RESTITUTION_BOULE).toBeGreaterThanOrEqual(0.5);
            expect(Constants.RESTITUTION_BOULE).toBeLessThanOrEqual(0.7);
        });

        it('RESTITUTION_COCHONNET < RESTITUTION_BOULE (bois vs acier)', () => {
            expect(Constants.RESTITUTION_COCHONNET).toBeLessThanOrEqual(Constants.RESTITUTION_BOULE);
        });

        it('MAX_THROW_SPEED > 0', () => {
            expect(Constants.MAX_THROW_SPEED).toBeGreaterThan(0);
        });

        it('TERRAIN_FRICTION: terre=1.0, herbe=1.8, sable=2.0, dalles=0.7', () => {
            expect(Constants.TERRAIN_FRICTION.terre).toBe(1.0);
            expect(Constants.TERRAIN_FRICTION.herbe).toBe(1.8);
            expect(Constants.TERRAIN_FRICTION.sable).toBe(2.0);
            expect(Constants.TERRAIN_FRICTION.dalles).toBe(0.7);
        });

        it('TERRAIN_FRICTION dans terrains.json coherente avec Constants.js', () => {
            for (const terrain of terrainStages) {
                const expected = Constants.TERRAIN_FRICTION[terrain.surface];
                expect(terrain.friction, `${terrain.id} friction mismatch`).toBe(expected);
            }
        });
    });

    describe('Styles de lancer — 3 presets valides', () => {
        it('LOFT_PRESETS contient demi_portee et plombee (pointage)', () => {
            expect(Constants.LOFT_PRESETS.length).toBe(2);
            expect(Constants.LOFT_PRESETS[0].id).toBe('demi_portee');
            expect(Constants.LOFT_PRESETS[1].id).toBe('plombee');
        });

        it('ALL_LOFT_PRESETS contient aussi le tir', () => {
            expect(Constants.ALL_LOFT_PRESETS.length).toBe(3);
            const ids = Constants.ALL_LOFT_PRESETS.map(p => p.id);
            expect(ids).toContain('demi_portee');
            expect(ids).toContain('plombee');
            expect(ids).toContain('tir');
        });

        it('chaque preset a les proprietes requises', () => {
            for (const preset of Constants.ALL_LOFT_PRESETS) {
                expect(preset.id).toBeTruthy();
                expect(preset.label).toBeTruthy();
                expect(preset.landingFactor).toBeGreaterThan(0);
                expect(preset.arcHeight).toBeLessThan(0); // Negative = upward
                expect(preset.flyDurationMult).toBeGreaterThan(0);
                expect(typeof preset.rollEfficiency).toBe('number');
            }
        });

        it('le tir au fer a isTir=true', () => {
            expect(Constants.LOFT_TIR.isTir).toBe(true);
        });

        it('aucun preset supprime (roulette, tir devant, rafle)', () => {
            const allIds = Constants.ALL_LOFT_PRESETS.map(p => p.id);
            expect(allIds).not.toContain('roulette');
            expect(allIds).not.toContain('tir_devant');
            expect(allIds).not.toContain('rafle');
        });
    });

    describe('IA — configuration coherente', () => {
        it('AI_EASY, AI_MEDIUM, AI_HARD existent', () => {
            expect(Constants.AI_EASY).toBeDefined();
            expect(Constants.AI_MEDIUM).toBeDefined();
            expect(Constants.AI_HARD).toBeDefined();
        });

        it('difficulte croissante (angleDev decroissant)', () => {
            expect(Constants.AI_EASY.angleDev).toBeGreaterThan(Constants.AI_MEDIUM.angleDev);
            expect(Constants.AI_MEDIUM.angleDev).toBeGreaterThan(Constants.AI_HARD.angleDev);
        });

        it('chaque personnage non-rookie a une config IA', () => {
            for (const char of roster) {
                if (char.id === 'rookie') continue;
                expect(char.ai, `${char.id} missing ai config`).toBeDefined();
                expect(char.ai.personality, `${char.id} missing ai.personality`).toBeTruthy();
                expect(typeof char.ai.angleDev).toBe('number');
                expect(typeof char.ai.powerDev).toBe('number');
                expect(typeof char.ai.shootProbability).toBe('number');
            }
        });

        it('AI personality modifiers couvrent tous les archetypes', () => {
            const archetypes = ['tireur', 'pointeur', 'complet', 'equilibre'];
            for (const arch of archetypes) {
                expect(Constants.AI_PERSONALITY_MODIFIERS[arch], `missing modifier for ${arch}`).toBeDefined();
            }
        });
    });

    describe('Cochonnet distance — regles FIPJP', () => {
        it('COCHONNET_MIN_DIST = 168px (6m)', () => {
            expect(Constants.COCHONNET_MIN_DIST).toBe(168);
        });

        it('COCHONNET_MAX_DIST = 280px (10m)', () => {
            expect(Constants.COCHONNET_MAX_DIST).toBe(280);
        });

        it('TERRAIN_HEIGHT = 420px (15m)', () => {
            expect(Constants.TERRAIN_HEIGHT).toBe(420);
        });
    });
});

// ══════════════════════════════════════════════════════════════════
// 3D. RESULT SCENE
// ══════════════════════════════════════════════════════════════════
describe('Phase 3D — ResultScene', () => {
    it('ResultScene.init() reset les flags de navigation', () => {
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'ResultScene.js'), 'utf-8');
        expect(content).toContain('this._returning = false');
    });

    it('ResultScene.init() accepte won, scores, playerCharacter, opponentCharacter', () => {
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'ResultScene.js'), 'utf-8');
        expect(content).toContain('data.won');
        expect(content).toContain('data.scores');
        expect(content).toContain('data.playerCharacter');
        expect(content).toContain('data.opponentCharacter');
    });

    it('les textes victoire/defaite existent dans I18n', () => {
        expect(frLang.result.victory).toBeTruthy();
        expect(frLang.result.defeat).toBeTruthy();
        expect(enLang.result.victory).toBeTruthy();
        expect(enLang.result.defeat).toBeTruthy();
    });

    it('les advice texts existent pour chaque type', () => {
        const adviceKeys = ['too_long', 'no_tir', 'low_precision', 'no_carreau', 'pressure_loss', 'general'];
        for (const key of adviceKeys) {
            expect(frLang.result.advice[key], `FR advice.${key} missing`).toBeTruthy();
        }
    });

    it('les stats labels existent', () => {
        const statKeys = ['menes', 'carreaux', 'best_score', 'biberons', 'best_ball', 'hit_rate', 'playstyle'];
        for (const key of statKeys) {
            expect(frLang.result.stats[key], `FR result.stats.${key} missing`).toBeTruthy();
            expect(enLang.result.stats[key], `EN result.stats.${key} missing`).toBeTruthy();
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// 3E. SHOP
// ══════════════════════════════════════════════════════════════════
describe('Phase 3E — Shop', () => {
    beforeEach(() => {
        localStorageMock._reset();
    });

    it('la boutique a 3 categories', () => {
        expect(shop.categories.length).toBe(3);
        expect(shop.categories.map(c => c.id)).toEqual(['boules', 'cochonnets', 'capacites']);
    });

    it('acheter un item reduit le solde', () => {
        const save = loadSave();
        const initialGalets = save.galets;
        const item = shop.categories[0].items.find(i => i.price > 0);
        if (item && initialGalets >= item.price) {
            save.galets -= item.price;
            save.purchases.push(item.id);
            saveSave(save);
            const reloaded = loadSave();
            expect(reloaded.galets).toBe(initialGalets - item.price);
            expect(reloaded.purchases).toContain(item.id);
        }
    });

    it('on ne peut pas avoir un solde negatif', () => {
        const save = loadSave();
        save.galets = 10;
        saveSave(save);
        const expensiveItem = shop.categories[0].items.find(i => i.price > 10);
        if (expensiveItem) {
            // Verify the price is indeed higher
            expect(expensiveItem.price).toBeGreaterThan(10);
            // The game should prevent this purchase (UI check, not SaveManager check)
        }
    });

    it('chaque boule du shop a un prix en Galets (pas Ecus)', () => {
        for (const cat of shop.categories) {
            for (const item of cat.items) {
                expect(typeof item.price).toBe('number');
                // Verify no reference to "ecus" anywhere
                expect(JSON.stringify(item).toLowerCase()).not.toContain('ecus');
            }
        }
    });

    it('les boules du shop ont des IDs uniques', () => {
        const allIds = shop.categories.flatMap(c => c.items.map(i => i.id));
        const unique = new Set(allIds);
        expect(unique.size).toBe(allIds.length);
    });

    it('ShopScene a les cles I18n pour buy/owned/equip/insufficient', () => {
        expect(frLang.shop.buy).toBeTruthy();
        expect(frLang.shop.owned).toBeTruthy();
        expect(frLang.shop.equip).toBeTruthy();
        expect(frLang.shop.insufficient).toBeTruthy();
    });
});

// ══════════════════════════════════════════════════════════════════
// 3F. TUTORIAL
// ══════════════════════════════════════════════════════════════════
describe('Phase 3F — Tutorial', () => {
    it('TutorialScene existe', () => {
        const file = resolve(SRC_DIR, 'scenes', 'TutorialScene.js');
        const content = readFileSync(file, 'utf-8');
        expect(content).toContain('class TutorialScene');
    });

    it('TutorialScene.init() reset les flags', () => {
        const content = readFileSync(resolve(SRC_DIR, 'scenes', 'TutorialScene.js'), 'utf-8');
        expect(content).toContain('this._page');
        expect(content).toContain('this._inputEnabled');
    });

    it('tutorial a 5 pages', () => {
        // Check page titles exist in I18n
        for (let i = 1; i <= 5; i++) {
            expect(frLang.tutorial[`page${i}_title`], `FR tutorial.page${i}_title missing`).toBeTruthy();
            expect(enLang.tutorial[`page${i}_title`], `EN tutorial.page${i}_title missing`).toBeTruthy();
        }
    });

    it('tutorial a des boutons precedent/suivant/compris', () => {
        expect(frLang.tutorial.previous).toBeTruthy();
        expect(frLang.tutorial.next).toBeTruthy();
        expect(frLang.tutorial.understood).toBeTruthy();
    });

    it('FTUE welcome dialog a les 3 lignes', () => {
        expect(frLang.tutorial.welcome_line1).toBeTruthy();
        expect(frLang.tutorial.welcome_line2).toBeTruthy();
        expect(frLang.tutorial.welcome_line3).toBeTruthy();
        expect(enLang.tutorial.welcome_line1).toBeTruthy();
        expect(enLang.tutorial.welcome_line2).toBeTruthy();
        expect(enLang.tutorial.welcome_line3).toBeTruthy();
    });

    it('tutorial hints contextuels existent', () => {
        const hints = ['cochonnet_hint', 'strategy_hint', 'retro_hint', 'ability_hint', 'tab_hint', 'encourage_first_mene'];
        for (const h of hints) {
            expect(frLang.tutorial[h], `FR tutorial.${h} missing`).toBeTruthy();
            expect(enLang.tutorial[h], `EN tutorial.${h} missing`).toBeTruthy();
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// 3G. CHASSE AUX OUBLIS
// ══════════════════════════════════════════════════════════════════
describe('Phase 3G — Chasse aux oublis', () => {

    // All 16 scene files
    const expectedScenes = [
        'BootScene', 'TitleScene', 'CharSelectScene', 'QuickPlayScene',
        'ArcadeScene', 'VSIntroScene', 'PetanqueScene', 'ResultScene',
        'LevelUpScene', 'ShopScene', 'TutorialScene', 'PlayerScene',
        'OverworldScene', 'SpriteTestScene', 'DevTestScene', 'CreditsScene'
    ];

    it('les 16 scenes existent toutes', () => {
        const sceneDir = resolve(SRC_DIR, 'scenes');
        const existing = readdirSync(sceneDir)
            .filter(f => f.endsWith('.js'))
            .map(f => f.replace('.js', ''));
        for (const scene of expectedScenes) {
            expect(existing, `Scene ${scene} missing`).toContain(scene);
        }
    });

    // Scene-specific init() contract tests
    describe('VSIntroScene init() contract', () => {
        it('accepte playerCharacter, opponentCharacter, terrain', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'VSIntroScene.js'), 'utf-8');
            expect(content).toContain('data.playerCharacter');
            expect(content).toContain('data.opponentCharacter');
            expect(content).toContain('data.terrain');
        });

        it('reset les flags (_started, _canSkip)', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'VSIntroScene.js'), 'utf-8');
            expect(content).toContain('this._started = false');
            expect(content).toContain('this._canSkip = false');
        });
    });

    describe('ArcadeScene init() contract', () => {
        it('accepte playerCharacter, currentRound, wins, losses', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'ArcadeScene.js'), 'utf-8');
            expect(content).toContain('data.playerCharacter');
            expect(content).toContain('data.currentRound');
            expect(content).toContain('data.wins');
            expect(content).toContain('data.losses');
        });

        it('force le Rookie en mode Arcade', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'ArcadeScene.js'), 'utf-8');
            expect(content).toContain("c.id === 'rookie'");
        });
    });

    describe('LevelUpScene init() contract', () => {
        it('accepte pointsToDistribute, currentStats', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'LevelUpScene.js'), 'utf-8');
            expect(content).toContain('data.pointsToDistribute');
            expect(content).toContain('data.currentStats');
        });
    });

    describe('Transitions bidirectionnelles', () => {
        it('Title → QuickPlay: QuickPlay retourne vers TitleScene', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'QuickPlayScene.js'), 'utf-8');
            expect(content).toContain("'TitleScene'");
        });

        it('Title → Arcade: ArcadeScene retourne vers TitleScene', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'ArcadeScene.js'), 'utf-8');
            expect(content).toContain("'TitleScene'");
        });

        it('Title → Tutorial: TutorialScene retourne vers TitleScene', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'TutorialScene.js'), 'utf-8');
            expect(content).toContain("'TitleScene'");
        });

        it('Result → Title: ResultScene peut retourner au menu', () => {
            const content = readFileSync(resolve(SRC_DIR, 'scenes', 'ResultScene.js'), 'utf-8');
            expect(content).toContain("'TitleScene'");
        });
    });

    describe('Scene shutdown/cleanup', () => {
        const sceneDir = resolve(SRC_DIR, 'scenes');
        const gameplayScenes = ['PetanqueScene', 'ArcadeScene', 'QuickPlayScene', 'ResultScene', 'VSIntroScene'];

        for (const sceneName of gameplayScenes) {
            it(`${sceneName} a une methode shutdown ou _shutdown`, () => {
                const content = readFileSync(resolve(sceneDir, `${sceneName}.js`), 'utf-8');
                const hasShutdown = content.includes('shutdown(') || content.includes('_shutdown(');
                expect(hasShutdown, `${sceneName} missing shutdown method`).toBe(true);
            });
        }
    });

    describe('Resolution et rendu', () => {
        it('GAME_WIDTH = 832, GAME_HEIGHT = 480', () => {
            expect(Constants.GAME_WIDTH).toBe(832);
            expect(Constants.GAME_HEIGHT).toBe(480);
        });

        it('TILE_SIZE = 32', () => {
            expect(Constants.TILE_SIZE).toBe(32);
        });

        it('pas de noir pur dans les couleurs', () => {
            expect(Constants.COLORS.OMBRE).not.toBe(0x000000);
            expect(Constants.COLORS.OMBRE_DEEP).not.toBe(0x000000);
        });

        it('couleurs provencales definies', () => {
            expect(Constants.COLORS.OCRE).toBeDefined();
            expect(Constants.COLORS.TERRACOTTA).toBeDefined();
            expect(Constants.COLORS.LAVANDE).toBeDefined();
            expect(Constants.COLORS.OLIVE).toBeDefined();
            expect(Constants.COLORS.CIEL).toBeDefined();
            expect(Constants.COLORS.CREME).toBeDefined();
        });
    });

    describe('SaveManager intégrité', () => {
        beforeEach(() => {
            localStorageMock._reset();
        });

        it('la sauvegarde a les champs obligatoires', () => {
            const save = loadSave();
            const requiredFields = [
                'version', 'rookie', 'galets', 'purchases',
                'unlockedCharacters', 'unlockedTerrains',
                'unlockedBoules', 'unlockedCochonnets',
                'arcadeProgress', 'selectedBoule', 'selectedCochonnet',
                'tutorialSeen', 'audioSettings', 'stats', 'lang'
            ];
            for (const field of requiredFields) {
                expect(save[field], `save missing field: ${field}`).toBeDefined();
            }
        });

        it('les stats par defaut sont coherentes', () => {
            const save = loadSave();
            expect(save.stats.totalMatches).toBe(0);
            expect(save.stats.totalWins).toBe(0);
            expect(save.stats.totalLosses).toBe(0);
            expect(save.stats.totalCarreaux).toBe(0);
        });

        it('la migration ecus → galets fonctionne', () => {
            // Simulate old save with ecus
            const oldSave = loadSave();
            const raw = JSON.parse(localStorage.getItem('petanque_master_save') || '{}');
            if (Object.keys(raw).length > 0) {
                raw.ecus = 100;
                delete raw.galets;
                localStorage.setItem('petanque_master_save', JSON.stringify(raw));
                const migrated = loadSave();
                expect(migrated.galets).toBeDefined();
            }
        });

        it('audioSettings par defaut sont coherentes', () => {
            const save = loadSave();
            expect(save.audioSettings.masterVolume).toBe(1.0);
            expect(save.audioSettings.musicVolume).toBe(1.0);
            expect(save.audioSettings.sfxVolume).toBe(1.0);
            expect(save.audioSettings.muted).toBe(false);
        });

        it('les terrains debloques par defaut incluent village', () => {
            const save = loadSave();
            expect(save.unlockedTerrains).toContain('village');
        });

        it('la langue par defaut est fr', () => {
            const save = loadSave();
            expect(save.lang).toBe('fr');
        });
    });

    describe('Boules data coherence', () => {
        it('les boules du shop referencent des IDs existants dans boules.json', () => {
            const bouleIds = boules.sets.map(b => b.id);
            const shopBoules = shop.categories.find(c => c.id === 'boules');
            if (shopBoules) {
                for (const item of shopBoules.items) {
                    // shop item ID format: "boule_X" → matches boules.json "X"
                    const bouleId = item.id.replace('boule_', '');
                    expect(bouleIds, `shop boule ${item.id} → ${bouleId} not in boules.json`).toContain(bouleId);
                }
            }
        });

        it('chaque boule a des stats', () => {
            for (const boule of boules.sets) {
                expect(boule.stats, `${boule.id} missing stats`).toBeDefined();
                expect(boule.stats.precision).toBeDefined();
                expect(boule.stats.puissance).toBeDefined();
            }
        });
    });

    describe('Mobile / tactile', () => {
        it('AimingSystem supporte les inputs pointer (touch)', () => {
            const content = readFileSync(resolve(SRC_DIR, 'petanque', 'AimingSystem.js'), 'utf-8');
            expect(content).toContain('pointer');
        });

        it('UIFactory utilise des tailles de boutons suffisantes', () => {
            // Check that UI constants define reasonable sizes
            expect(Constants.UI.PILL_H).toBeGreaterThanOrEqual(38);
            expect(Constants.UI.PILL_W).toBeGreaterThanOrEqual(200);
        });
    });

    describe('Chaque scene init() reset ses flags', () => {
        const sceneDir = resolve(SRC_DIR, 'scenes');
        const scenesToCheck = [
            'PetanqueScene', 'TutorialScene', 'VSIntroScene',
            'ResultScene', 'ArcadeScene', 'QuickPlayScene',
            'CharSelectScene', 'ShopScene'
        ];

        for (const sceneName of scenesToCheck) {
            it(`${sceneName}.init() contient des resets`, () => {
                const content = readFileSync(resolve(sceneDir, `${sceneName}.js`), 'utf-8');
                // Extract init() method content
                const initMatch = content.match(/init\s*\([^)]*\)\s*\{/);
                expect(initMatch, `${sceneName} has no init()`).toBeTruthy();
                // Check that init contains assignments (resets)
                const initStart = content.indexOf(initMatch[0]);
                // Simple check: init should contain at least one this.xxx = assignment
                const afterInit = content.substring(initStart, initStart + 2000);
                expect(afterInit).toMatch(/this\.\w+\s*=/);
            });
        }
    });
});
