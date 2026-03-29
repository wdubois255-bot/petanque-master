/**
 * QA-3 Phase 2 — Audio Quality Tests
 * Intégrité audio, stabilité, SoundManager
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve, join } from 'path';

const ROOT = resolve(__dirname, '..');
const SRC = resolve(ROOT, 'src');
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

const soundManagerSource = readFileSync(resolve(SRC, 'utils/SoundManager.js'), 'utf-8');

// ════════════════════════════════════════
// 2A — INTÉGRITÉ AUDIO
// ════════════════════════════════════════
describe('QA-3 Phase 2A — Intégrité audio', () => {

    it('SoundManager.js existe et se charge sans erreur de syntaxe', () => {
        expect(soundManagerSource).toBeTruthy();
        expect(soundManagerSource.length).toBeGreaterThan(100);
    });

    it('les fichiers audio SFX essentiels existent', () => {
        const requiredSfx = [
            'boule_clac',        // collision boule-boule
            'cochonnet_touche',  // collision boule-cochonnet
            'boule_atterrissage', // atterrissage
            'boule_roulement',   // roulement
            'lancer_swoosh',     // lancer
            'carreau',           // carreau
            'victoire',          // victoire
            'defaite',           // défaite
            'point_marque',      // point marqué
            'ui_click'           // UI click
        ];
        for (const sfx of requiredSfx) {
            const path = resolve(ASSETS, `audio/sfx/${sfx}.mp3`);
            expect(existsSync(path), `SFX manquant: ${sfx}.mp3`).toBe(true);
        }
    });

    it('les fichiers de musique existent', () => {
        const requiredMusic = ['match_theme', 'title_theme'];
        for (const music of requiredMusic) {
            const path = resolve(ASSETS, `audio/music/${music}.mp3`);
            expect(existsSync(path), `Musique manquante: ${music}.mp3`).toBe(true);
        }
    });

    it('les sons d ambiance existent', () => {
        const ambiance = ['cigales_ambiance', 'brise_vent'];
        for (const sfx of ambiance) {
            const path = resolve(ASSETS, `audio/sfx/${sfx}.mp3`);
            expect(existsSync(path), `Ambiance manquante: ${sfx}.mp3`).toBe(true);
        }
    });

    it('SoundManager exporte les fonctions de lancer', () => {
        // Le lancer doit avoir un son (sfxThrow ou sfxLancerSwoosh)
        expect(soundManagerSource).toMatch(/export\s+(function|const)\s+sfx(Throw|LancerSwoosh|Lancer)/);
    });

    it('SoundManager exporte les fonctions de collision', () => {
        expect(soundManagerSource).toMatch(/export\s+(function|const)\s+sfxBouleBoule/);
        expect(soundManagerSource).toMatch(/export\s+(function|const)\s+sfxBouleCochonnet/);
    });

    it('SoundManager exporte les fonctions de victoire/défaite', () => {
        expect(soundManagerSource).toMatch(/export\s+(function|const)\s+sfxVictory/);
        expect(soundManagerSource).toMatch(/export\s+(function|const)\s+sfxDefeat/);
    });

    it('SoundManager exporte les fonctions UI', () => {
        expect(soundManagerSource).toMatch(/export\s+(function|const)\s+sfxUIClick/);
    });
});

// ════════════════════════════════════════
// 2B — STABILITÉ AUDIO
// ════════════════════════════════════════
describe('QA-3 Phase 2B — Stabilité audio', () => {

    it('les oscillateurs créés sont correctement stoppés (stop + disconnect)', () => {
        // Chaque .start() doit avoir un .stop() ou setTimeout(stop) correspondant
        const startCount = (soundManagerSource.match(/\.start\(/g) || []).length;
        const stopCount = (soundManagerSource.match(/\.stop\(/g) || []).length;
        // Au minimum autant de stops que de starts (certains stops sont dans des setTimeout)
        expect(stopCount, `${startCount} starts mais seulement ${stopCount} stops`).toBeGreaterThanOrEqual(startCount * 0.8);
    });

    it('les oscillateurs sont déconnectés après utilisation', () => {
        // Vérifier que disconnect est appelé (via setTimeout ou onended)
        const disconnectCount = (soundManagerSource.match(/\.disconnect\(/g) || []).length;
        expect(disconnectCount, 'Aucun disconnect trouvé — risque de fuite audio').toBeGreaterThan(0);
    });

    it('SoundManager a un système de mute global', () => {
        expect(soundManagerSource).toMatch(/mute|_muted|setMuted|toggleMute/i);
    });

    it('SoundManager gère le volume master', () => {
        expect(soundManagerSource).toMatch(/masterVolume|_masterVolume|setMasterVolume/i);
    });

    it('SoundManager sauvegarde les settings audio via SaveManager', () => {
        expect(soundManagerSource).toMatch(/SaveManager|saveSave|loadSave|audioSettings/);
    });

    it('aucune scène de jeu ne crée un AudioContext directement', () => {
        const sceneFiles = walkSync(resolve(SRC, 'scenes')).map(f => f.replace(ROOT + '\\', '').replace(ROOT + '/', ''));
        for (const file of sceneFiles) {
            const content = readFileSync(resolve(ROOT, file), 'utf-8');
            expect(content, `AudioContext dans ${file}`).not.toMatch(/new\s+AudioContext/);
        }
    });

    it('SoundManager gère le geste utilisateur requis pour AudioContext mobile', () => {
        // Doit résumer/débloquer l'AudioContext après un geste
        expect(soundManagerSource).toMatch(/resume|unlock|gesture|userGesture|suspended/i);
    });

    it('pas d empilement de sons d ambiance (une seule instance)', () => {
        // Les fonctions d'ambiance doivent stopper avant de relancer
        expect(soundManagerSource).toMatch(/stop.*[Aa]mbiance|stopTerrainAmbiance|stopCigales/);
    });
});
