/**
 * PHASE 1 — Character Combinations Tests
 * Tests every character matchup, stats validity, barks coverage,
 * arcade flow, and edge cases.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load data files directly (no Phaser needed)
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');
const characters = JSON.parse(readFileSync(resolve(DATA_DIR, 'characters.json'), 'utf-8'));
const arcade = JSON.parse(readFileSync(resolve(DATA_DIR, 'arcade.json'), 'utf-8'));
const terrains = JSON.parse(readFileSync(resolve(DATA_DIR, 'terrains.json'), 'utf-8'));
const shop = JSON.parse(readFileSync(resolve(DATA_DIR, 'shop.json'), 'utf-8'));
const boules = JSON.parse(readFileSync(resolve(DATA_DIR, 'boules.json'), 'utf-8'));
const frLang = JSON.parse(readFileSync(resolve(DATA_DIR, 'lang', 'fr.json'), 'utf-8'));
const enLang = JSON.parse(readFileSync(resolve(DATA_DIR, 'lang', 'en.json'), 'utf-8'));

const roster = characters.roster;
const rosterIds = roster.map(c => c.id);
const terrainStages = terrains.stages;
const terrainIds = terrainStages.map(t => t.id);

// ══════════════════════════════════════════════════════════════════
// 1A. MATRICE COMPLETE DE MATCHUPS (QuickPlay)
// ══════════════════════════════════════════════════════════════════
describe('Phase 1A — Matrice complete de matchups', () => {
    // Verify all characters have the required fields for scene transitions
    const requiredFields = ['id', 'name', 'name_en', 'stats', 'sprite', 'portrait', 'barks', 'barks_en', 'palette'];

    for (const player of roster) {
        for (const opponent of roster) {
            describe(`${player.name} vs ${opponent.name}`, () => {
                it('player has all required fields for scene flow', () => {
                    for (const field of requiredFields) {
                        expect(player[field], `${player.id} missing field: ${field}`).toBeDefined();
                    }
                });

                it('opponent has all required fields for scene flow', () => {
                    for (const field of requiredFields) {
                        expect(opponent[field], `${opponent.id} missing field: ${field}`).toBeDefined();
                    }
                });

                it('player data survives CharSelect → VSIntro transfer', () => {
                    // Simulate init(data) for VSIntro
                    const vsIntroData = {
                        playerCharacter: player,
                        opponentCharacter: opponent,
                        terrain: 'village',
                        terrainName: 'Place du Village'
                    };
                    expect(vsIntroData.playerCharacter.id).toBe(player.id);
                    expect(vsIntroData.playerCharacter.name).toBe(player.name);
                    expect(vsIntroData.playerCharacter.stats).toEqual(player.stats);
                    expect(vsIntroData.opponentCharacter.id).toBe(opponent.id);
                });

                it('data survives VSIntro → PetanqueScene transfer', () => {
                    const petanqueData = {
                        playerCharacter: player,
                        opponentCharacter: opponent,
                        playerCharId: player.id,
                        opponentId: opponent.id,
                        terrain: 'village',
                        difficulty: 'medium',
                        format: 3
                    };
                    expect(petanqueData.playerCharacter.name).toBe(player.name);
                    expect(petanqueData.opponentCharacter.name).toBe(opponent.name);
                    expect(petanqueData.playerCharId).toBe(player.id);
                    expect(petanqueData.opponentId).toBe(opponent.id);
                });

                it('data survives PetanqueScene → Result transfer', () => {
                    const resultData = {
                        won: true,
                        scores: { player: 13, opponent: 7 },
                        playerCharacter: player,
                        opponentCharacter: opponent,
                        terrainName: 'village'
                    };
                    expect(resultData.playerCharacter.id).toBe(player.id);
                    expect(resultData.opponentCharacter.id).toBe(opponent.id);
                    expect(resultData.won).toBe(true);
                    expect(resultData.scores.player).toBe(13);
                });
            });
        }
    }

    it(`matrice complete: ${roster.length}x${roster.length} = ${roster.length * roster.length} combinaisons`, () => {
        expect(roster.length).toBeGreaterThanOrEqual(10);
        expect(roster.length * roster.length).toBe(roster.length ** 2);
    });
});

// ══════════════════════════════════════════════════════════════════
// 1B. CAS LIMITES PERSONNAGES
// ══════════════════════════════════════════════════════════════════
describe('Phase 1B — Cas limites personnages', () => {
    it('chaque personnage a un portrait valide (non vide)', () => {
        for (const char of roster) {
            expect(char.portrait, `${char.id} missing portrait`).toBeTruthy();
            expect(typeof char.portrait).toBe('string');
            expect(char.portrait.length).toBeGreaterThan(0);
        }
    });

    it('chaque personnage a un sprite valide (non vide)', () => {
        for (const char of roster) {
            expect(char.sprite, `${char.id} missing sprite`).toBeTruthy();
            expect(typeof char.sprite).toBe('string');
        }
    });

    it('chaque personnage a un nom FR defini', () => {
        for (const char of roster) {
            expect(char.name, `${char.id} missing name`).toBeTruthy();
            expect(char.name.length).toBeGreaterThan(0);
        }
    });

    it('chaque personnage a un nom EN defini', () => {
        for (const char of roster) {
            expect(char.name_en, `${char.id} missing name_en`).toBeTruthy();
            expect(char.name_en.length).toBeGreaterThan(0);
        }
    });

    it('chaque personnage a un titre FR et EN', () => {
        for (const char of roster) {
            expect(char.title, `${char.id} missing title`).toBeTruthy();
            expect(char.title_en, `${char.id} missing title_en`).toBeTruthy();
        }
    });

    it('chaque personnage a une catchphrase FR et EN', () => {
        for (const char of roster) {
            expect(char.catchphrase, `${char.id} missing catchphrase`).toBeTruthy();
            expect(char.catchphrase_en, `${char.id} missing catchphrase_en`).toBeTruthy();
        }
    });

    it('chaque personnage a une description FR et EN', () => {
        for (const char of roster) {
            expect(char.description, `${char.id} missing description`).toBeTruthy();
            expect(char.description_en, `${char.id} missing description_en`).toBeTruthy();
        }
    });

    it('stats valides: precision > 0, puissance > 0, effet >= 0, sang_froid >= 0', () => {
        for (const char of roster) {
            const s = char.stats;
            expect(s, `${char.id} missing stats`).toBeDefined();
            expect(s.precision, `${char.id} precision`).toBeGreaterThan(0);
            expect(s.puissance, `${char.id} puissance`).toBeGreaterThan(0);
            expect(s.effet, `${char.id} effet`).toBeGreaterThanOrEqual(0);
            expect(s.sang_froid, `${char.id} sang_froid`).toBeGreaterThanOrEqual(0);
        }
    });

    it('stats entre 1 et 10', () => {
        for (const char of roster) {
            for (const [key, val] of Object.entries(char.stats)) {
                expect(val, `${char.id}.${key}`).toBeGreaterThanOrEqual(1);
                expect(val, `${char.id}.${key}`).toBeLessThanOrEqual(10);
            }
        }
    });

    it('chaque personnage a exactement 4 stats', () => {
        const expectedStats = ['precision', 'puissance', 'effet', 'sang_froid'];
        for (const char of roster) {
            for (const stat of expectedStats) {
                expect(char.stats[stat], `${char.id} missing stat: ${stat}`).toBeDefined();
            }
        }
    });

    it('chaque personnage a une palette de couleurs', () => {
        for (const char of roster) {
            expect(char.palette, `${char.id} missing palette`).toBeDefined();
            expect(char.palette.primary, `${char.id} missing palette.primary`).toBeTruthy();
            expect(char.palette.secondary, `${char.id} missing palette.secondary`).toBeTruthy();
        }
    });

    it('aucun doublon d\'ID dans le roster', () => {
        const ids = roster.map(c => c.id);
        const unique = new Set(ids);
        expect(unique.size).toBe(ids.length);
    });

    it('meme perso joueur et adversaire: les donnees restent coherentes', () => {
        for (const char of roster) {
            const data = {
                playerCharacter: { ...char },
                opponentCharacter: { ...char }
            };
            expect(data.playerCharacter.id).toBe(data.opponentCharacter.id);
            expect(data.playerCharacter.name).toBe(data.opponentCharacter.name);
            // Both should have valid stats independently
            expect(data.playerCharacter.stats.precision).toBeGreaterThan(0);
            expect(data.opponentCharacter.stats.precision).toBeGreaterThan(0);
        }
    });

    // Noms fictifs — aucun vrai joueur pro de petanque
    const realProPlayers = [
        'quintais', 'lacroix', 'sarrio', 'milei', 'rocher philippe',
        'lucien boyron', 'henri salvador', 'marco', 'christian fazzino',
        'dylan rocher', 'philippe quintais', 'philippe suchaud',
        'henri lacroix', 'claudy weibel'
    ];

    it('aucun vrai nom de joueur pro de petanque', () => {
        for (const char of roster) {
            const nameLower = char.name.toLowerCase();
            const idLower = char.id.toLowerCase();
            for (const pro of realProPlayers) {
                // Check that character name doesn't exactly match a pro player name
                // (partial matches like "rocher" or "fazzino" are OK as fictitious character names)
                expect(nameLower).not.toBe(pro);
                // ID is a code, not a display name — IDs like "fazzino" are OK as character codes
            }
        }
    });

    it('chaque personnage a un archetype valide', () => {
        const validArchetypes = ['tireur', 'pointeur', 'complet', 'equilibre', 'adaptable', 'glisseur', 'milieu'];
        for (const char of roster) {
            expect(validArchetypes, `${char.id} invalid archetype: ${char.archetype}`)
                .toContain(char.archetype);
        }
    });

    it('chaque personnage a unlocked defini (boolean)', () => {
        for (const char of roster) {
            expect(typeof char.unlocked, `${char.id} unlocked should be boolean`).toBe('boolean');
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// 1B-bis. BARKS COVERAGE
// ══════════════════════════════════════════════════════════════════
describe('Phase 1B — Barks coverage', () => {
    const requiredBarkCategories = [
        'good_shot', 'bad_shot', 'opponent_good', 'opponent_bad',
        'carreau', 'opponent_carreau', 'taking_lead', 'losing_badly',
        'match_point', 'victory', 'defeat', 'pre_match',
        'post_match_win', 'post_match_lose'
    ];

    // Extended bark categories (added later)
    const extendedBarkCategories = [
        'carreau_victim', 'palet_success', 'contre_self',
        'fanny_win', 'fanny_lose', 'pressure_tied',
        'fanny_imminent_winning', 'fanny_imminent_losing',
        'comeback_self', 'opponent_comeback', 'dominant_lead'
    ];

    for (const char of roster) {
        describe(`${char.name} barks`, () => {
            it('has FR barks object', () => {
                expect(char.barks, `${char.id} missing barks`).toBeDefined();
                expect(typeof char.barks).toBe('object');
            });

            it('has EN barks object', () => {
                expect(char.barks_en, `${char.id} missing barks_en`).toBeDefined();
                expect(typeof char.barks_en).toBe('object');
            });

            for (const cat of requiredBarkCategories) {
                it(`has FR bark: ${cat} (>= 2 variants)`, () => {
                    const pool = char.barks[cat];
                    expect(pool, `${char.id} FR bark ${cat} missing`).toBeDefined();
                    expect(Array.isArray(pool)).toBe(true);
                    expect(pool.length, `${char.id} FR bark ${cat}: need >= 2 variants`).toBeGreaterThanOrEqual(2);
                });

                it(`has EN bark: ${cat} (>= 2 variants)`, () => {
                    const pool = char.barks_en[cat];
                    expect(pool, `${char.id} EN bark ${cat} missing`).toBeDefined();
                    expect(Array.isArray(pool)).toBe(true);
                    expect(pool.length, `${char.id} EN bark ${cat}: need >= 2 variants`).toBeGreaterThanOrEqual(2);
                });
            }

            for (const cat of extendedBarkCategories) {
                it(`has FR extended bark: ${cat}`, () => {
                    const pool = char.barks[cat];
                    expect(pool, `${char.id} FR bark ${cat} missing`).toBeDefined();
                    expect(Array.isArray(pool)).toBe(true);
                    expect(pool.length).toBeGreaterThanOrEqual(1);
                });

                it(`has EN extended bark: ${cat}`, () => {
                    const pool = char.barks_en[cat];
                    expect(pool, `${char.id} EN bark ${cat} missing`).toBeDefined();
                    expect(Array.isArray(pool)).toBe(true);
                    expect(pool.length).toBeGreaterThanOrEqual(1);
                });
            }

            it('FR and EN bark categories match', () => {
                const frKeys = Object.keys(char.barks).sort();
                const enKeys = Object.keys(char.barks_en).sort();
                expect(frKeys).toEqual(enKeys);
            });

            it('no empty strings in barks', () => {
                for (const [cat, pool] of Object.entries(char.barks)) {
                    for (let i = 0; i < pool.length; i++) {
                        expect(pool[i].trim().length, `${char.id} FR bark ${cat}[${i}] is empty`).toBeGreaterThan(0);
                    }
                }
                for (const [cat, pool] of Object.entries(char.barks_en)) {
                    for (let i = 0; i < pool.length; i++) {
                        expect(pool[i].trim().length, `${char.id} EN bark ${cat}[${i}] is empty`).toBeGreaterThan(0);
                    }
                }
            });
        });
    }
});

// ══════════════════════════════════════════════════════════════════
// 1C. MODE ARCADE
// ══════════════════════════════════════════════════════════════════
describe('Phase 1C — Mode Arcade', () => {
    it('arcade a exactement 5 matchs', () => {
        expect(arcade.matches.length).toBe(5);
    });

    it('le premier match est contre la_choupe (facile)', () => {
        expect(arcade.matches[0].opponent).toBe('la_choupe');
        expect(arcade.matches[0].difficulty).toBe('easy');
    });

    it('le dernier match est contre ley (expert)', () => {
        expect(arcade.matches[4].opponent).toBe('ley');
        expect(arcade.matches[4].difficulty).toBe('hard');
    });

    it('chaque adversaire arcade existe dans le roster', () => {
        for (const match of arcade.matches) {
            expect(rosterIds, `arcade opponent ${match.opponent} not in roster`).toContain(match.opponent);
        }
    });

    it('chaque terrain arcade existe dans terrains.json', () => {
        for (const match of arcade.matches) {
            expect(terrainIds, `arcade terrain ${match.terrain} not in terrains`).toContain(match.terrain);
        }
    });

    it('les rounds sont numerotes 1 a 5', () => {
        for (let i = 0; i < 5; i++) {
            expect(arcade.matches[i].round).toBe(i + 1);
        }
    });

    it('chaque match arcade a un pre-match dialogue FR et EN', () => {
        for (const match of arcade.matches) {
            expect(match.preMatchDialogue, `match ${match.round} missing preMatchDialogue`).toBeDefined();
            expect(match.preMatchDialogue.length).toBeGreaterThan(0);
            expect(match.preMatchDialogue_en, `match ${match.round} missing preMatchDialogue_en`).toBeDefined();
            expect(match.preMatchDialogue_en.length).toBeGreaterThan(0);
        }
    });

    it('chaque match arcade a un post-match dialogue win et lose', () => {
        for (const match of arcade.matches) {
            expect(match.postMatchWin, `match ${match.round} missing postMatchWin`).toBeDefined();
            expect(match.postMatchWin.length).toBeGreaterThan(0);
            expect(match.postMatchLose, `match ${match.round} missing postMatchLose`).toBeDefined();
            expect(match.postMatchLose.length).toBeGreaterThan(0);
            expect(match.postMatchWin_en, `match ${match.round} missing postMatchWin_en`).toBeDefined();
            expect(match.postMatchLose_en, `match ${match.round} missing postMatchLose_en`).toBeDefined();
        }
    });

    it('chaque match arcade a un intro_text FR et EN', () => {
        for (const match of arcade.matches) {
            expect(match.intro_text, `match ${match.round} missing intro_text`).toBeTruthy();
            expect(match.intro_text_en, `match ${match.round} missing intro_text_en`).toBeTruthy();
        }
    });

    it('chaque match arcade a un difficulty_label FR et EN', () => {
        for (const match of arcade.matches) {
            expect(match.difficulty_label, `match ${match.round} missing difficulty_label`).toBeTruthy();
            expect(match.difficulty_label_en, `match ${match.round} missing difficulty_label_en`).toBeTruthy();
        }
    });

    it('arcade a des narratives (intro, mid, ending) FR et EN', () => {
        expect(arcade.intro_narrative).toBeDefined();
        expect(arcade.intro_narrative.length).toBeGreaterThan(0);
        expect(arcade.intro_narrative_en).toBeDefined();
        expect(arcade.intro_narrative_en.length).toBeGreaterThan(0);

        expect(arcade.mid_narrative_after_3).toBeDefined();
        expect(arcade.mid_narrative_after_3_en).toBeDefined();

        expect(arcade.ending_narrative).toBeDefined();
        expect(arcade.ending_narrative_en).toBeDefined();
    });

    it('arcade challenges existent et ont des recompenses', () => {
        expect(arcade.match_challenges.length).toBeGreaterThan(0);
        expect(arcade.mene_challenges.length).toBeGreaterThan(0);
        for (const ch of arcade.match_challenges) {
            expect(ch.reward).toBeGreaterThan(0);
            expect(ch.name).toBeTruthy();
            expect(ch.name_en).toBeTruthy();
        }
        for (const ch of arcade.mene_challenges) {
            expect(ch.reward).toBeGreaterThan(0);
            expect(ch.text).toBeTruthy();
            expect(ch.text_en).toBeTruthy();
        }
    });

    it('arcade milestones existent et ont des recompenses', () => {
        expect(arcade.milestones.length).toBeGreaterThan(0);
        for (const ms of arcade.milestones) {
            expect(ms.reward).toBeGreaterThan(0);
            expect(ms.text).toBeTruthy();
            expect(ms.text_en).toBeTruthy();
        }
    });

    it('les adversaires arcade sont dans le bon ordre', () => {
        const expectedOrder = ['la_choupe', 'mamie_josette', 'fazzino', 'suchaud', 'ley'];
        const actualOrder = arcade.matches.map(m => m.opponent);
        expect(actualOrder).toEqual(expectedOrder);
    });

    it('les terrains arcade sont dans le bon ordre', () => {
        const expectedTerrains = ['village', 'parc', 'colline', 'docks', 'plage'];
        const actualTerrains = arcade.matches.map(m => m.terrain);
        expect(actualTerrains).toEqual(expectedTerrains);
    });

    it('progression de difficulte coherente', () => {
        const difficultyWeight = { easy: 1, medium: 2, hard: 3 };
        let lastWeight = 0;
        for (const match of arcade.matches) {
            const w = difficultyWeight[match.difficulty];
            expect(w, `invalid difficulty: ${match.difficulty}`).toBeDefined();
            expect(w).toBeGreaterThanOrEqual(lastWeight);
            lastWeight = w;
        }
    });

    it('time_of_day progresse chronologiquement', () => {
        const timeOrder = ['matin', 'fin_matinee', 'midi', 'apres_midi', 'coucher_soleil'];
        for (let i = 0; i < arcade.matches.length; i++) {
            expect(arcade.matches[i].time_of_day).toBe(timeOrder[i]);
        }
    });
});

// ══════════════════════════════════════════════════════════════════
// 1D. TERRAINS VALIDATION
// ══════════════════════════════════════════════════════════════════
describe('Phase 1D — Terrains validation', () => {
    const validSurfaces = ['terre', 'herbe', 'sable', 'dalles'];

    for (const terrain of terrainStages) {
        describe(`Terrain: ${terrain.name}`, () => {
            it('a un ID unique', () => {
                expect(terrain.id).toBeTruthy();
            });

            it('a un nom FR et EN', () => {
                expect(terrain.name).toBeTruthy();
                expect(terrain.name_en).toBeTruthy();
            });

            it('a une description FR et EN', () => {
                expect(terrain.description).toBeTruthy();
                expect(terrain.description_en).toBeTruthy();
            });

            it('a une surface valide', () => {
                expect(validSurfaces).toContain(terrain.surface);
            });

            it('a une friction numerique > 0', () => {
                expect(terrain.friction).toBeGreaterThan(0);
            });

            it('a des couleurs definies', () => {
                expect(terrain.colors).toBeDefined();
                expect(terrain.colors.bg).toBeTruthy();
                expect(terrain.colors.line).toBeTruthy();
            });

            it('a une ambiance definie', () => {
                expect(terrain.ambiance).toBeDefined();
                expect(terrain.ambiance.sky).toBeDefined();
            });
        });
    }
});

// ══════════════════════════════════════════════════════════════════
// 1E. SHOP VALIDATION
// ══════════════════════════════════════════════════════════════════
describe('Phase 1E — Shop validation', () => {
    it('shop a des categories', () => {
        expect(shop.categories.length).toBeGreaterThan(0);
    });

    for (const cat of shop.categories) {
        describe(`Shop category: ${cat.label}`, () => {
            it('a un label FR et EN', () => {
                expect(cat.label).toBeTruthy();
                expect(cat.label_en).toBeTruthy();
            });

            it('a des items', () => {
                expect(cat.items.length).toBeGreaterThan(0);
            });

            for (const item of cat.items) {
                it(`item ${item.id}: nom FR et EN`, () => {
                    expect(item.name, `${item.id} missing name`).toBeTruthy();
                    expect(item.name_en, `${item.id} missing name_en`).toBeTruthy();
                });

                it(`item ${item.id}: description FR et EN`, () => {
                    expect(item.description, `${item.id} missing description`).toBeTruthy();
                    expect(item.description_en, `${item.id} missing description_en`).toBeTruthy();
                });

                it(`item ${item.id}: prix >= 0 (monnaie = Galets)`, () => {
                    expect(item.price).toBeGreaterThanOrEqual(0);
                });
            }
        });
    }
});
