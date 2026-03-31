/**
 * Capture automatique des assets itch.io :
 * - 5 screenshots marketing (832x480 @2x = 1664x960)
 * - 1 vidéo WebM pour conversion GIF
 *
 * Stratégie : utilise page.evaluate() pour naviguer directement aux scènes
 * via l'API Phaser, en contournant le tutoriel et les dialogues.
 *
 * Usage : node scripts/capture-itch-assets.mjs
 * Sortie : docs/lancement/assets/screenshots/ + docs/lancement/assets/gif carreau/
 */

import { chromium } from 'playwright';
import { spawn, execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SCREENSHOTS_DIR = path.join(ROOT, 'docs', 'lancement', 'assets', 'screenshots');
const GIF_DIR = path.join(ROOT, 'docs', 'lancement', 'assets', 'gif carreau');
const PORT = 5997;

[SCREENSHOTS_DIR, GIF_DIR].forEach(d => {
    if (!existsSync(d)) mkdirSync(d, { recursive: true });
});

function log(msg) {
    console.log(`[itch-assets] ${msg}`);
}

async function startDevServer() {
    return new Promise((resolve, reject) => {
        const server = spawn('npx', ['vite', '--port', String(PORT), '--strictPort'], {
            cwd: ROOT,
            shell: true,
            stdio: ['ignore', 'pipe', 'pipe'],
        });
        let resolved = false;
        const timeout = setTimeout(() => {
            if (!resolved) { resolved = true; resolve(server); }
        }, 15000);
        const onData = (data) => {
            const str = data.toString();
            if (str.includes('Local:') || str.includes('localhost') || str.includes('ready')) {
                if (!resolved) {
                    resolved = true;
                    clearTimeout(timeout);
                    setTimeout(() => resolve(server), 1000);
                }
            }
        };
        server.stdout.on('data', onData);
        server.stderr.on('data', onData);
        server.on('error', (err) => {
            if (!resolved) { resolved = true; clearTimeout(timeout); reject(err); }
        });
    });
}

function killServer(server) {
    if (!server) return;
    try {
        if (process.platform === 'win32') {
            execSync(`taskkill /pid ${server.pid} /T /F`, { stdio: 'ignore' });
        } else {
            server.kill('SIGTERM');
        }
    } catch (e) { /* ignore */ }
}

async function waitForGame(page) {
    await page.goto(`http://localhost:${PORT}`, {
        waitUntil: 'domcontentloaded',
        timeout: 15000,
    });
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(4000); // Phaser boot complete
}

/** Inject save into localStorage BEFORE page.goto() via addInitScript.
 *  version:2 is always forced so SaveManager doesn't call migrateV1() and discard our values. */
async function preinjectSave(page, saveData) {
    await page.addInitScript((data) => {
        const key = 'petanque_master_save';
        const existing = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({ ...existing, ...data }));
    }, { version: 2, ...saveData });
}

async function snap(page, name) {
    const filepath = path.join(SCREENSHOTS_DIR, `${name}.png`);
    await page.locator('canvas').screenshot({ path: filepath });
    log(`  ✓ ${name}.png`);
}

// ─── Direct scene injection via Phaser API ───

/** Get the active Phaser scene */
async function getActiveScene(page) {
    return page.evaluate(() => {
        const game = window.game || window.__PHASER_GAME__;
        if (!game) return null;
        const active = game.scene.scenes.find(s => s.scene?.isActive());
        return active ? active.constructor.name : null;
    });
}

/** Force-start a scene with data, stopping all others */
async function forceScene(page, sceneName, data = {}) {
    await page.evaluate(({ sceneName, data }) => {
        const game = window.game || window.__PHASER_GAME__;
        if (!game) return;
        // Stop all active scenes
        game.scene.scenes.forEach(s => {
            if (s.scene?.isActive()) s.scene.stop();
        });
        game.scene.start(sceneName, data);
    }, { sceneName, data });
}

/** Disable tutorial for a clean gameplay screenshot */
async function disableTutorial(page) {
    await page.evaluate(() => {
        // Mark tutorial as already seen in localStorage
        const save = JSON.parse(localStorage.getItem('petanque_master_save') || '{}');
        save.tutorialComplete = true;
        save.tutorialPhase = 99;
        if (!save.stats) save.stats = {};
        save.stats.totalMatchesPlayed = 10; // Pretend we've played before
        localStorage.setItem('petanque_master_save', JSON.stringify(save));
    });
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════

async function main() {
    log('Lancement du serveur dev...');
    const server = await startDevServer();

    try {
        const browser = await chromium.launch({
            headless: true,
            args: ['--use-gl=swiftshader', '--disable-gpu-sandbox', '--no-sandbox'],
        });

        // ─── SCREENSHOT 1: TitleScene (ambiance) ───────────────
        log('Screenshot 1: TitleScene (ambiance)');
        {
            const ctx = await browser.newContext({
                viewport: { width: 832, height: 480 },
                deviceScaleFactor: 2,
            });
            const page = await ctx.newPage();
            await preinjectSave(page, { version: 2, lang: 'en' }); // English UI
            await waitForGame(page);
            await page.waitForTimeout(2000); // Full intro animation
            await snap(page, '01-title-ambiance');
            await ctx.close();
        }

        // ─── SCREENSHOT 2: PetanqueScene Village (gameplay) ────
        log('Screenshot 2: PetanqueScene Village (gameplay)');
        {
            const ctx = await browser.newContext({
                viewport: { width: 832, height: 480 },
                deviceScaleFactor: 2,
            });
            const page = await ctx.newPage();
            await preinjectSave(page, {
                tutorialComplete: true,
                tutorialPhasesDone: [0, 1, 2],
                tutorialInGameSeen: true,
                lang: 'en',
                stats: { totalMatchesPlayed: 10 },
            });
            await waitForGame(page);

            // Force VSIntro → PetanqueScene with Village terrain
            await forceScene(page, 'VSIntroScene', {
                playerCharacter: { id: 'rookie', name: 'Rookie' },
                opponentCharacter: { id: 'papi_rene', name: 'Papi René' },
                terrain: 'terre',
                terrainName: 'Place du Village',
                matchData: {
                    difficulty: 'medium',
                    format: 'tete_a_tete',
                    returnScene: 'TitleScene',
                },
            });
            await page.waitForTimeout(4000); // VSIntro plays
            // Now in PetanqueScene
            await page.waitForTimeout(4000); // Scene fully renders
            await snap(page, '02-gameplay-village');
            await ctx.close();
        }

        // ─── SCREENSHOT 3: PetanqueScene Plage (variété) ──────
        log('Screenshot 3: PetanqueScene Plage (variété)');
        {
            const ctx = await browser.newContext({
                viewport: { width: 832, height: 480 },
                deviceScaleFactor: 2,
            });
            const page = await ctx.newPage();
            await preinjectSave(page, {
                tutorialComplete: true,
                tutorialPhasesDone: [0, 1, 2],
                tutorialInGameSeen: true,
                lang: 'en',
                stats: { totalMatchesPlayed: 10 },
            });
            await waitForGame(page);

            await forceScene(page, 'VSIntroScene', {
                playerCharacter: { id: 'rookie', name: 'Rookie' },
                opponentCharacter: { id: 'mamie_josette', name: 'Mamie Josette' },
                terrain: 'sable',
                terrainName: 'La Plage',
                matchData: {
                    difficulty: 'medium',
                    format: 'tete_a_tete',
                    returnScene: 'TitleScene',
                },
            });
            await page.waitForTimeout(4000); // VSIntro
            await page.waitForTimeout(2000); // PetanqueScene renders — court pour éviter le tooltip terrain
            await snap(page, '03-gameplay-plage');
            await ctx.close();
        }

        // ─── SCREENSHOT 4: VSIntro (personnages) ──────────────
        log('Screenshot 4: VSIntro (personnages)');
        {
            const ctx = await browser.newContext({
                viewport: { width: 832, height: 480 },
                deviceScaleFactor: 2,
            });
            const page = await ctx.newPage();
            await waitForGame(page);

            // Force VSIntro but capture DURING the animation (before it transitions)
            await forceScene(page, 'VSIntroScene', {
                playerCharacter: { id: 'rookie', name: 'Rookie' },
                opponentCharacter: { id: 'papi_rene', name: 'Papi René' },
                terrain: 'terre',
                terrainName: 'Place du Village',
                matchData: {
                    difficulty: 'hard',
                    format: 'tete_a_tete',
                    returnScene: 'TitleScene',
                },
            });
            // Capture at peak VS animation: all elements visible 1600-2550ms (new timing)
            await page.waitForTimeout(2000);
            await snap(page, '04-vsintro-personnages');
            await ctx.close();
        }

        // ─── SCREENSHOT 5: Shop (profondeur) ──────────────────
        log('Screenshot 5: ShopScene (profondeur)');
        {
            const ctx = await browser.newContext({
                viewport: { width: 832, height: 480 },
                deviceScaleFactor: 2,
            });
            const page = await ctx.newPage();
            // Inject BEFORE page.goto so SaveManager reads it at boot
            await preinjectSave(page, {
                galets: 250,
                tutorialComplete: true,
                tutorialPhasesDone: [0, 1, 2],
                tutorialInGameSeen: true,
                stats: { totalMatchesPlayed: 10 },
            });
            await waitForGame(page);

            await forceScene(page, 'ShopScene');
            await page.waitForTimeout(2000); // Shop renders
            await snap(page, '05-shop-profondeur');
            await ctx.close();
        }

        // ─── VIDEO: Gameplay for GIF ──────────────────────────
        log('Video capture for GIF...');
        {
            const ctx = await browser.newContext({
                viewport: { width: 832, height: 480 },
                deviceScaleFactor: 1,
                recordVideo: {
                    dir: GIF_DIR,
                    size: { width: 832, height: 480 },
                },
            });
            const page = await ctx.newPage();
            await preinjectSave(page, {
                tutorialComplete: true,
                tutorialPhasesDone: [0, 1, 2],
                tutorialInGameSeen: true,
                stats: { totalMatchesPlayed: 10 },
            });
            await waitForGame(page);

            // Start a match directly — capture the VSIntro + beginning of gameplay
            await forceScene(page, 'VSIntroScene', {
                playerCharacter: { id: 'rookie', name: 'Rookie' },
                opponentCharacter: { id: 'papi_rene', name: 'Papi René' },
                terrain: 'terre',
                terrainName: 'Place du Village',
                matchData: {
                    difficulty: 'medium',
                    format: 'tete_a_tete',
                    returnScene: 'TitleScene',
                },
            });
            await page.waitForTimeout(4500); // VSIntro animation (now 3750ms) + buffer
            await page.waitForTimeout(4500); // PetanqueScene fully loaded + cochonnet placed

            // === LANCER 1 : Demi-portée vers le cochonnet ===
            // Objectif : placer notre boule près du cochonnet → l'IA doit répondre
            // Cela crée une cible pour le Tir au Fer qui suit
            await page.keyboard.press('1'); // Sélectionner Demi-portée
            await page.waitForTimeout(300);
            await page.mouse.move(416, 370);
            await page.waitForTimeout(300);
            await page.mouse.down();
            await page.waitForTimeout(300);
            await page.mouse.move(416, 215, { steps: 20 }); // Puissance modérée, centre terrain
            await page.waitForTimeout(200);
            await page.mouse.up();
            await page.waitForTimeout(7000); // Vol + atterrissage + l'IA joue sa boule

            // === LANCER 2 : Tir au Fer — LE CARREAU ===
            // La boule de l'IA est maintenant sur le terrain (près du cochonnet, centre-haut)
            // On vise là avec puissance maximale
            await page.keyboard.press('3'); // Sélectionner Tir au Fer
            await page.waitForTimeout(400);
            await page.mouse.move(416, 370);
            await page.waitForTimeout(300);
            await page.mouse.down();
            await page.waitForTimeout(300);
            await page.mouse.move(416, 50, { steps: 15 }); // Puissance max → centre-haut du terrain
            await page.waitForTimeout(200);
            await page.mouse.up();
            await page.waitForTimeout(8000); // Impact + slow-mo + aftermath

            await ctx.close();
            log('  ✓ Video WebM saved');
            log('  → Pour le GIF carreau : couper à partir de ~17s dans la vidéo');
            log('    ffmpeg -y -ss 17 -t 5 -i *.webm -vf "fps=12,scale=832:480:flags=neighbor,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=none" -loop 0 header.gif');
        }

        await browser.close();
        log('');
        log('=== Toutes les captures terminées ! ===');
        log(`Screenshots : ${SCREENSHOTS_DIR}`);
        log(`Video GIF   : ${GIF_DIR}`);
        log('');
        log('Pour convertir la vidéo en GIF :');
        log('  cd "docs/lancement/assets/gif carreau"');
        log('  ffmpeg -y -ss 5 -t 5 -i *.webm -vf "fps=12,scale=832:480:flags=neighbor,split[s0][s1];[s0]palettegen=max_colors=96[p];[s1][p]paletteuse=dither=bayer:bayer_scale=3" -loop 0 header.gif');

    } finally {
        killServer(server);
    }
}

main().catch((err) => {
    console.error('[itch-assets] Erreur:', err.message);
    process.exit(1);
});
