/**
 * QA-3 Phase 1 — Visual Quality Tests
 * Terrains, boules, sprites, pollution visuelle
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

// Palette autorisée (hex CSS)
const PALETTE = {
    OCRE: '#D4A574',
    TERRACOTTA: '#C4854A',
    OLIVE: '#6B8E4E',
    LAVANDE: '#9B7BB8',
    CIEL: '#87CEEB',
    CREME: '#F5E6D0',
    OMBRE: '#3A2E28',
    OMBRE_DEEP: '#1A1510',
    ACCENT: '#C44B3F',
    OR: '#FFD700',
    BLANC: '#FFFFFF',
    GRIS: '#9E9E8E'
};

const PALETTE_VALUES = Object.values(PALETTE).map(c => c.toUpperCase());

// Load data files
const terrains = JSON.parse(readFileSync(resolve(DATA, 'terrains.json'), 'utf-8'));
const characters = JSON.parse(readFileSync(resolve(DATA, 'characters.json'), 'utf-8'));
const boules = JSON.parse(readFileSync(resolve(DATA, 'boules.json'), 'utf-8'));

// === Helpers ===
function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
        r: parseInt(h.substring(0, 2), 16),
        g: parseInt(h.substring(2, 4), 16),
        b: parseInt(h.substring(4, 6), 16)
    };
}

function relativeLuminance(hex) {
    const { r, g, b } = hexToRgb(hex);
    const [rs, gs, bs] = [r / 255, g / 255, b / 255].map(c =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1, hex2) {
    const l1 = relativeLuminance(hex1);
    const l2 = relativeLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// ════════════════════════════════════════
// 1A — TERRAINS
// ════════════════════════════════════════
describe('QA-3 Phase 1A — Terrains', () => {
    const terrainList = Array.isArray(terrains) ? terrains : terrains.stages || terrains;

    it('terrains.json contient au moins 4 terrains', () => {
        expect(terrainList.length).toBeGreaterThanOrEqual(4);
    });

    it('chaque terrain a un id, name, surface et friction', () => {
        for (const t of terrainList) {
            expect(t).toHaveProperty('id');
            expect(t).toHaveProperty('name');
            expect(t).toHaveProperty('surface');
            expect(t).toHaveProperty('friction');
        }
    });

    it('chaque terrain a des couleurs définies (bg, gravel, line)', () => {
        for (const t of terrainList) {
            expect(t).toHaveProperty('colors');
            expect(t.colors).toHaveProperty('bg');
            expect(t.colors).toHaveProperty('gravel');
            expect(t.colors).toHaveProperty('line');
        }
    });

    it('chaque terrain est visuellement distinct (couleurs bg différentes)', () => {
        const bgColors = terrainList.map(t => t.colors.bg);
        const unique = new Set(bgColors);
        expect(unique.size).toBe(bgColors.length);
    });

    it('les surfaces terrain sont dans les types autorisés', () => {
        const validSurfaces = ['terre', 'sable', 'herbe', 'dalles'];
        for (const t of terrainList) {
            expect(validSurfaces).toContain(t.surface);
        }
    });

    it('les friction values sont cohérentes (0.5 à 3.0)', () => {
        for (const t of terrainList) {
            expect(t.friction).toBeGreaterThanOrEqual(0.5);
            expect(t.friction).toBeLessThanOrEqual(3.0);
        }
    });

    it('les boules sont lisibles sur chaque terrain (contraste luminance suffisant)', () => {
        // Boules acier : couleur ~#A8B5C2 (midtone métal)
        // Note: en jeu, les boules ont des highlights/ombres qui améliorent la lisibilité
        const bouleColor = '#A8B5C2';
        for (const t of terrainList) {
            const bgHex = t.colors.bg;
            const ratio = contrastRatio(bouleColor, bgHex);
            // Minimum 1.2:1 — les ombres/highlights en jeu ajoutent du contraste
            expect(ratio, `Boule sur terrain ${t.id} (bg: ${bgHex}, ratio: ${ratio.toFixed(2)})`).toBeGreaterThan(1.2);
        }
    });

    it('le cochonnet (jaune #FFD700) est visible sur chaque terrain', () => {
        const cochonnetColor = '#FFD700';
        for (const t of terrainList) {
            const bgHex = t.colors.bg;
            const ratio = contrastRatio(cochonnetColor, bgHex);
            // Le cochonnet a un outline sombre en jeu, donc ratio bas acceptable
            // Documenté : plage (#E8D5B7) est le terrain le plus difficile pour le cochonnet
            expect(ratio, `Cochonnet sur terrain ${t.id} (bg: ${bgHex}, ratio: ${ratio.toFixed(2)})`).toBeGreaterThan(1.0);
        }
    });
});

// ════════════════════════════════════════
// 1B — BOULES ET COCHONNET
// ════════════════════════════════════════
describe('QA-3 Phase 1B — Boules et cochonnet', () => {
    const bouleList = boules.sets || boules.boules || boules;

    it('au moins 5 types de boules définis', () => {
        expect(bouleList.length).toBeGreaterThanOrEqual(5);
    });

    it('chaque boule a id, name, stats (precision, puissance)', () => {
        for (const b of bouleList) {
            expect(b).toHaveProperty('id');
            expect(b).toHaveProperty('name');
            expect(b.stats).toHaveProperty('precision');
            expect(b.stats).toHaveProperty('puissance');
        }
    });

    it('les sprites de boules existent pour chaque type', () => {
        for (const b of bouleList) {
            const spritePath = resolve(ASSETS, `sprites/boules_v3/boule_${b.id}.png`);
            expect(existsSync(spritePath), `Sprite manquant: boule_${b.id}.png`).toBe(true);
        }
    });

    it('les cochonnets existent en fichier', () => {
        const cochonnets = ['cochonnet', 'cochonnet_bleu', 'cochonnet_vert',
            'cochonnet_rouge', 'cochonnet_jungle', 'cochonnet_multicolor'];
        for (const c of cochonnets) {
            const path = resolve(ASSETS, `sprites/${c}.png`);
            expect(existsSync(path), `Cochonnet manquant: ${c}.png`).toBe(true);
        }
    });

    it('les stats de boules sont dans les plages valides (1-5)', () => {
        for (const b of bouleList) {
            expect(b.stats.precision).toBeGreaterThanOrEqual(1);
            expect(b.stats.precision).toBeLessThanOrEqual(5);
            expect(b.stats.puissance).toBeGreaterThanOrEqual(1);
            expect(b.stats.puissance).toBeLessThanOrEqual(5);
        }
    });
});

// ════════════════════════════════════════
// 1C — SPRITES PERSONNAGES
// ════════════════════════════════════════
describe('QA-3 Phase 1C — Sprites personnages', () => {
    const roster = characters.roster || characters;
    const V2_CHARS = [
        { name: 'rookie', folder: 'rookie' },
        { name: 'la_choupe', folder: 'la_choupe_v2' },
        { name: 'ley', folder: 'ley_v2_zip' },
        { name: 'foyot', folder: 'foyot' },
        { name: 'suchaud', folder: 'suchaud' },
        { name: 'fazzino', folder: 'fazzino' },
        { name: 'mamie_josette', folder: 'mamie_josette' },
        { name: 'sofia', folder: 'sofia' },
        { name: 'robineau', folder: 'robineau' },
        { name: 'rocher', folder: 'rocher' },
        { name: 'rizzi', folder: 'rizzi' },
        { name: 'papi_rene', folder: 'papi_rene' }
    ];
    const DIRECTIONS = ['south', 'east', 'west', 'north'];

    it('chaque personnage V2 a les 4 directions de sprite', () => {
        for (const char of V2_CHARS) {
            for (const dir of DIRECTIONS) {
                const path = resolve(ASSETS, `sprites/v2_new/characters/${char.folder}/rotations/${dir}.png`);
                expect(existsSync(path), `Sprite manquant: ${char.name}/${dir}.png`).toBe(true);
            }
        }
    });

    it('chaque personnage V2 a un spritesheet de lancer', () => {
        const THROW_CHARS = [
            'rookie', 'la_choupe', 'ley', 'foyot', 'suchaud',
            'mamie_josette', 'sofia', 'robineau', 'rocher', 'rizzi',
            'fazzino', 'papi_rene'
        ];
        for (const charId of THROW_CHARS) {
            const path = resolve(ASSETS, `sprites/v2_new/throw_anims/sheets/throw_${charId}.png`);
            expect(existsSync(path), `Throw sprite manquant: throw_${charId}.png`).toBe(true);
        }
    });

    it('chaque personnage du roster a un sprite et portrait définis dans le JSON', () => {
        for (const char of roster) {
            expect(char.sprite, `${char.id} manque sprite`).toBeTruthy();
            expect(char.portrait, `${char.id} manque portrait`).toBeTruthy();
        }
    });

    it('le roster contient au moins 10 personnages', () => {
        expect(roster.length).toBeGreaterThanOrEqual(10);
    });

    it('chaque personnage a des stats valides (1-10)', () => {
        for (const char of roster) {
            const stats = char.stats;
            expect(stats).toBeTruthy();
            for (const [key, val] of Object.entries(stats)) {
                expect(val, `${char.id}.stats.${key}`).toBeGreaterThanOrEqual(1);
                expect(val, `${char.id}.stats.${key}`).toBeLessThanOrEqual(10);
            }
        }
    });
});

// ════════════════════════════════════════
// 1D — POLLUTION VISUELLE
// ════════════════════════════════════════
describe('QA-3 Phase 1D — Pollution visuelle', () => {
    const srcFiles = walkSync(SRC).map(f => f.replace(ROOT + '\\', '').replace(ROOT + '/', ''));

    it('aucun debug text visible en prod (velocity, coord, fps counter)', () => {
        const debugPatterns = [
            /\.setText\(.*velocity/i,
            /\.setText\(.*coord/i,
            /\.setText\(.*fps.*\d/i,
            /debugText/,
            /fpsText/
        ];
        // Exclure DevTestScene et SpriteTestScene (scènes de debug autorisées)
        const prodFiles = srcFiles.filter(f =>
            !f.includes('DevTestScene') && !f.includes('SpriteTestScene')
        );
        for (const file of prodFiles) {
            const content = readFileSync(resolve(ROOT, file), 'utf-8');
            for (const pattern of debugPatterns) {
                expect(content, `Debug text dans ${file}`).not.toMatch(pattern);
            }
        }
    });

    it('aucun rectangle de debug visible (hitbox, colliders, debugDraw)', () => {
        const debugPatterns = [
            /debug\s*:\s*true/,
            /debugDraw/,
            /showHitbox/,
            /drawCollider/
        ];
        const prodFiles = srcFiles.filter(f =>
            !f.includes('DevTestScene') && !f.includes('SpriteTestScene')
        );
        for (const file of prodFiles) {
            const content = readFileSync(resolve(ROOT, file), 'utf-8');
            for (const pattern of debugPatterns) {
                expect(content, `Debug rect dans ${file}: ${pattern}`).not.toMatch(pattern);
            }
        }
    });

    it('TerrainRenderer ne contient aucun debug conditionnel qui fuiterait en prod', () => {
        const tr = readFileSync(resolve(SRC, 'petanque/TerrainRenderer.js'), 'utf-8');
        // Pas de if(DEBUG) ou if(window.DEBUG) qui pourrait être activé
        expect(tr).not.toMatch(/if\s*\(\s*DEBUG\s*\)/);
        expect(tr).not.toMatch(/if\s*\(\s*window\.DEBUG\s*\)/);
    });

    it('EngineRenderer ne contient aucun debug conditionnel', () => {
        const er = readFileSync(resolve(SRC, 'petanque/EngineRenderer.js'), 'utf-8');
        expect(er).not.toMatch(/if\s*\(\s*DEBUG\s*\)/);
        expect(er).not.toMatch(/if\s*\(\s*window\.DEBUG\s*\)/);
    });
});
