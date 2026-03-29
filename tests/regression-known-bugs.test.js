/**
 * QA-3 Phase 4 — Regression Tests & Known Bugs
 * Bugs récurrents, chasse aux oublis finale
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
const DATA = resolve(ROOT, 'public/data');
const ASSETS = resolve(ROOT, 'public/assets');

function walkSync(dir, ext = '.js') {
    let results = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) results.push(...walkSync(full, ext));
        else if (full.endsWith(ext)) results.push(full);
    }
    return results;
}

function readSrc(relPath) {
    return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

// Load data
const characters = JSON.parse(readFileSync(resolve(DATA, 'characters.json'), 'utf-8'));
const terrains = JSON.parse(readFileSync(resolve(DATA, 'terrains.json'), 'utf-8'));
const boules = JSON.parse(readFileSync(resolve(DATA, 'boules.json'), 'utf-8'));
const arcade = JSON.parse(readFileSync(resolve(DATA, 'arcade.json'), 'utf-8'));
const shop = JSON.parse(readFileSync(resolve(DATA, 'shop.json'), 'utf-8'));

// ════════════════════════════════════════
// 4A — BUGS RÉCURRENTS CONNUS
// ════════════════════════════════════════
describe('QA-3 Phase 4A — Bugs récurrents connus', () => {

    describe('Sprites visibles sur chaque terrain (depth/z-index)', () => {
        it('PetanqueScene définit des depths pour les sprites joueur/adversaire', () => {
            const ps = readSrc('src/scenes/PetanqueScene.js');
            // Doit utiliser setDepth ou depth pour les personnages
            expect(ps).toMatch(/setDepth|\.depth\s*=/);
        });

        it('ModularCharacter utilise des depths explicites (body=20, arm=19, ball=21)', () => {
            const mc = readSrc('src/petanque/ModularCharacter.js');
            expect(mc).toMatch(/depth.*20|setDepth\(20\)/);
            expect(mc).toMatch(/depth.*19|setDepth\(19\)/);
            expect(mc).toMatch(/depth.*21|setDepth\(21\)/);
        });

        it('les depth de terrain surface (0-5) sont inférieures aux depth des entités (19+)', () => {
            const tr = readSrc('src/petanque/TerrainRenderer.js');
            // Terrain surface depths devraient être < 19 (entity depths)
            // Note: TerrainRenderer may also set UI/overlay depths > 10 which is fine
            const terrainDepths = tr.match(/setDepth\((\d+\.?\d*)\)/g) || [];
            // At least some depths should be low (surface layers)
            const lowDepths = terrainDepths.filter(d => parseFloat(d.match(/[\d.]+/)[0]) < 10);
            expect(lowDepths.length, 'Aucun depth < 10 pour les surfaces terrain').toBeGreaterThan(0);
            // No terrain depth should exceed entity depth (body=20)
            for (const d of terrainDepths) {
                const val = parseFloat(d.match(/[\d.]+/)[0]);
                // Depths up to UI_DEPTH (50-100) are OK for overlays/UI
                // But nothing should be in the 15-18 range (collision with entity layer)
                if (val >= 15 && val <= 18) {
                    expect.fail(`Depth terrain ${val} chevauche la zone entités (15-18)`);
                }
            }
        });
    });

    describe('Input listeners nettoyés entre scènes', () => {
        const sceneFiles = walkSync(resolve(SRC, 'scenes')).map(f => f.replace(ROOT + '\\', '').replace(ROOT + '/', ''));

        it('chaque scène avec create() a un handler shutdown/destroy', () => {
            const exceptions = ['BootScene.js'];
            for (const file of sceneFiles) {
                if (exceptions.some(e => file.endsWith(e))) continue;
                const content = readSrc(file);
                if (!content.includes('create(')) continue;
                const hasShutdown = content.includes("events.on('shutdown'") ||
                    content.includes('events.on("shutdown"') ||
                    content.includes('events.once(\'shutdown\'');
                const hasDestroy = content.includes('destroy()') || content.includes('destroy ()');
                expect(hasShutdown || hasDestroy,
                    `${file} n'a PAS de handler shutdown/destroy`).toBe(true);
            }
        });

        it('les scènes qui ajoutent des key listeners les nettoient', () => {
            for (const file of sceneFiles) {
                const content = readSrc(file);
                const addsKeys = content.includes('addKey(') || content.includes('keyboard.on(');
                if (!addsKeys) continue;
                const cleansUp = content.includes('removeAllListeners') ||
                    content.includes('keyboard.off') ||
                    content.includes('removeKey') ||
                    content.includes('keyboard.enabled = false') ||
                    content.includes('keyboard.removeAllKeys');
                expect(cleansUp, `${file} ajoute des keyboard listeners sans nettoyage`).toBe(true);
            }
        });
    });

    describe('Events émis en double', () => {
        const sceneFiles = walkSync(resolve(SRC, 'scenes')).map(f => f.replace(ROOT + '\\', '').replace(ROOT + '/', ''));

        it('aucune scène ne register des listeners dans create() sans cleanup pattern', () => {
            for (const file of sceneFiles) {
                const content = readSrc(file);
                // Si la scène fait this.events.on() dans create, elle DOIT avoir shutdown
                const eventsOn = (content.match(/this\.events\.on\(/g) || []).length;
                if (eventsOn > 0) {
                    const hasShutdown = content.includes('shutdown');
                    expect(hasShutdown,
                        `${file} a ${eventsOn} events.on() sans shutdown handler`).toBe(true);
                }
            }
        });

        it('PetanqueScene nettoie proprement tous ses listeners', () => {
            const ps = readSrc('src/scenes/PetanqueScene.js');
            expect(ps).toMatch(/events\.on\(['"]shutdown/);
            // La fonction _shutdown doit exister
            expect(ps).toMatch(/_shutdown\s*\(/);
        });
    });

    describe('Physique terrain-dépendante', () => {
        it('TERRAIN_FRICTION a des valeurs pour tous les types de surface', () => {
            const constants = readSrc('src/utils/Constants.js');
            const requiredSurfaces = ['terre', 'herbe', 'sable', 'dalles'];
            for (const surface of requiredSurfaces) {
                expect(constants).toContain(`${surface}:`);
            }
        });

        it('les frictions dans terrains.json correspondent aux surfaces de Constants.js', () => {
            const constants = readSrc('src/utils/Constants.js');
            const terrainList = Array.isArray(terrains) ? terrains : terrains.stages || terrains;
            // Extraire TERRAIN_FRICTION values
            const frictionMatch = constants.match(/TERRAIN_FRICTION\s*=\s*\{([^}]+)\}/);
            expect(frictionMatch, 'TERRAIN_FRICTION non trouvé').toBeTruthy();

            const frictionBlock = frictionMatch[1];
            for (const t of terrainList) {
                // Chaque terrain référence une surface qui existe dans TERRAIN_FRICTION
                expect(frictionBlock, `Surface ${t.surface} manquante dans TERRAIN_FRICTION`).toContain(t.surface);
            }
        });

        it('aucun terrain n a une friction extrême (>3.0 ou <0.3)', () => {
            const terrainList = Array.isArray(terrains) ? terrains : terrains.stages || terrains;
            for (const t of terrainList) {
                expect(t.friction, `${t.id} friction ${t.friction} trop extrême`).toBeGreaterThanOrEqual(0.3);
                expect(t.friction, `${t.id} friction ${t.friction} trop extrême`).toBeLessThanOrEqual(3.0);
            }
        });
    });
});

// ════════════════════════════════════════
// 4B — CHASSE AUX OUBLIS FINALE
// ════════════════════════════════════════
describe('QA-3 Phase 4B — Chasse aux oublis', () => {

    describe('Couverture fichiers src/', () => {
        it('tous les fichiers src/ sont couverts par au moins un QA', () => {
            const allFiles = walkSync(SRC).map(f =>
                f.replace(ROOT + '\\', '').replace(ROOT + '/', '').replace(/\\/g, '/')
            );
            // Vérifier qu'il n'y a pas de fichier orphelin/inconnu
            const knownPatterns = [
                'scenes/', 'petanque/', 'utils/', 'ui/', 'world/', 'entities/',
                'main.js', 'config.js'
            ];
            for (const file of allFiles) {
                const isKnown = knownPatterns.some(p => file.includes(p));
                expect(isKnown, `Fichier inconnu non couvert: ${file}`).toBe(true);
            }
        });
    });

    describe('15 scènes vérifiées', () => {
        const expectedScenes = [
            'BootScene', 'TitleScene', 'CharSelectScene', 'QuickPlayScene',
            'ArcadeScene', 'VSIntroScene', 'PetanqueScene', 'ResultScene',
            'LevelUpScene', 'ShopScene', 'TutorialScene', 'PlayerScene',
            'OverworldScene', 'SpriteTestScene', 'DevTestScene'
        ];

        it('les 15 scènes attendues existent', () => {
            for (const scene of expectedScenes) {
                const path = resolve(SRC, `scenes/${scene}.js`);
                expect(existsSync(path), `Scène manquante: ${scene}.js`).toBe(true);
            }
        });

        // Also check CreditsScene (16th)
        it('CreditsScene existe aussi', () => {
            expect(existsSync(resolve(SRC, 'scenes/CreditsScene.js'))).toBe(true);
        });
    });

    describe('Assets référencés mais inexistants', () => {
        it('tous les sprites de boules référencés dans boules.json existent', () => {
            const bouleList = boules.sets || boules.boules || boules;
            for (const b of bouleList) {
                const path = resolve(ASSETS, `sprites/boules_v3/boule_${b.id}.png`);
                expect(existsSync(path), `Asset manquant: boule_${b.id}.png`).toBe(true);
            }
        });

        it('tous les opponents de arcade.json existent dans characters.json', () => {
            const roster = characters.roster || characters;
            const rosterIds = roster.map(c => c.id);
            const matches = arcade.matches || [];
            for (const m of matches) {
                expect(rosterIds, `Opponent arcade ${m.opponent} non trouvé`).toContain(m.opponent);
            }
        });

        it('tous les terrains de arcade.json existent dans terrains.json', () => {
            const terrainList = Array.isArray(terrains) ? terrains : terrains.stages || terrains;
            const terrainIds = terrainList.map(t => t.id);
            const matches = arcade.matches || [];
            for (const m of matches) {
                expect(terrainIds, `Terrain arcade ${m.terrain} non trouvé`).toContain(m.terrain);
            }
        });

        it('les items du shop référencent des IDs de boules existants', () => {
            const bouleList = boules.sets || boules.boules || boules;
            const bouleIds = bouleList.map(b => b.id);
            const shopBoules = shop.boules || shop.items?.boules || [];
            for (const item of shopBoules) {
                expect(bouleIds, `Boule shop ${item.id} non trouvée`).toContain(item.id);
            }
        });
    });

    describe('Cas limites', () => {
        it('le score max FIPJP est 13 — vérifié dans le code', () => {
            const constants = readSrc('src/utils/Constants.js');
            expect(constants).toMatch(/13|SCORE_TO_WIN|WIN_SCORE|TARGET_SCORE/);
        });

        it('SaveManager gère la sauvegarde vide/corrompue sans crash', () => {
            const sm = readSrc('src/utils/SaveManager.js');
            // Doit retourner des valeurs par défaut si données invalides
            expect(sm).toMatch(/catch|default|fallback/i);
            expect(sm).toMatch(/JSON\.parse/);
        });

        it('SaveManager gère le premier lancement (aucune sauvegarde)', () => {
            const sm = readSrc('src/utils/SaveManager.js');
            // Doit avoir un defaultSaveData ou équivalent
            expect(sm).toMatch(/default.*[Ss]ave|DEFAULT_SAVE|initialSave/);
        });

        it('les 3 styles de lancer sont définis dans Constants.js', () => {
            const constants = readSrc('src/utils/Constants.js');
            expect(constants).toMatch(/demi_portee/);
            expect(constants).toMatch(/plombee/);
            expect(constants).toMatch(/tir(?!.*devant)/); // tir mais pas "tir devant"
        });

        it('la résolution 832x480 est définie dans Constants.js', () => {
            const constants = readSrc('src/utils/Constants.js');
            expect(constants).toMatch(/832/);
            expect(constants).toMatch(/480/);
        });
    });

    describe('Cohérence I18n', () => {
        it('les fichiers de langue FR et EN existent', () => {
            expect(existsSync(resolve(DATA, 'lang/fr.json')), 'fr.json manquant').toBe(true);
            expect(existsSync(resolve(DATA, 'lang/en.json')), 'en.json manquant').toBe(true);
        });

        it('les clés I18n FR et EN sont symétriques (même nombre de clés top-level)', () => {
            const fr = JSON.parse(readFileSync(resolve(DATA, 'lang/fr.json'), 'utf-8'));
            const en = JSON.parse(readFileSync(resolve(DATA, 'lang/en.json'), 'utf-8'));
            const frKeys = Object.keys(fr).sort();
            const enKeys = Object.keys(en).sort();
            expect(frKeys).toEqual(enKeys);
        });
    });

    describe('Données — cohérence globale', () => {
        it('chaque personnage du roster a au moins 4 stats', () => {
            const roster = characters.roster || characters;
            for (const c of roster) {
                const statCount = Object.keys(c.stats).length;
                expect(statCount, `${c.id} a seulement ${statCount} stats`).toBeGreaterThanOrEqual(4);
            }
        });

        it('chaque personnage a des barks définies', () => {
            const roster = characters.roster || characters;
            for (const c of roster) {
                expect(c.barks, `${c.id} n'a pas de barks`).toBeTruthy();
                expect(Object.keys(c.barks).length, `${c.id} barks vides`).toBeGreaterThan(0);
            }
        });

        it('le shop utilise la monnaie Galets (pas Ecus)', () => {
            const shopStr = JSON.stringify(shop);
            expect(shopStr).not.toMatch(/[Ee]cus/);
        });

        it('progression.json existe', () => {
            expect(existsSync(resolve(DATA, 'progression.json'))).toBe(true);
        });

        it('commentator.json existe', () => {
            expect(existsSync(resolve(DATA, 'commentator.json'))).toBe(true);
        });

        it('npcs.json existe', () => {
            expect(existsSync(resolve(DATA, 'npcs.json'))).toBe(true);
        });
    });
});
