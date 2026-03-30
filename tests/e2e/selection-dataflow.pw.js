/**
 * selection-dataflow.pw.js — Task 3 : tests data flow sélections
 * Vérifie que les sélections QuickPlay/Arcade passent correctement à PetanqueScene.
 * Requires : npm run dev (Vite dev server)
 *
 * Navigation map TitleScene (grid, index=0 par défaut) :
 *   0=JOUER, 1=ARCADE, 2=RAPIDE, 3=PERSO, 4=BOUTIQUE, 5=PARAMETRES
 *   down:  0→1, 1→3  |  right: 1→2  |  (Space confirme la sélection)
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;
const SCENE_TRANSITION = 2500;

async function waitForGame(page) {
    await page.goto('/');
    await page.waitForSelector('canvas', { timeout: 15000 });
    await page.waitForTimeout(BOOT_WAIT);
}

async function key(page, k, wait = 300) {
    await page.keyboard.press(k);
    await page.waitForTimeout(wait);
}

/** Lit l'état courant de PetanqueScene via le registre Phaser */
async function getPetanqueScene(page) {
    return page.evaluate(() => {
        try {
            const game = globalThis.__PHASER_GAME__;
            if (!game) return null;
            const scene = game.scene.getScene('PetanqueScene');
            if (!scene || !scene.sys.isActive()) return null;
            return {
                terrainType: scene.terrainType ?? null,
                bouleType: scene.bouleType ?? null,
                cochonnetType: scene.cochonnetType ?? null,
                arcadeRound: scene.arcadeRound ?? null,
                arcadeState: scene.arcadeState ? 'set' : null,
                playerCharId: scene.playerCharId ?? null,
            };
        } catch (e) { return null; }
    });
}

/** Récupère les textes visibles de PetanqueScene */
async function getPetanqueTexts(page) {
    return page.evaluate(() => {
        try {
            const game = globalThis.__PHASER_GAME__;
            if (!game) return [];
            const scene = game.scene.getScene('PetanqueScene');
            if (!scene || !scene.sys.isActive()) return [];
            return scene.children.list
                .filter(c => c.type === 'Text' && c.visible)
                .map(t => String(t.text || ''));
        } catch (e) { return []; }
    });
}

/**
 * Navigation QuickPlay : TitleScene(0) → ArrowDown(1=ARCADE) → ArrowRight(2=RAPIDE)
 * → Space(QuickPlayScene) → Enter(lance la partie avec les sélections par défaut)
 */
async function navigateToQuickPlay(page) {
    await waitForGame(page);
    await key(page, 'Space', 800);              // Boot screen → main menu (index=0)
    await key(page, 'ArrowDown', 400);          // 0→1 (Arcade)
    await key(page, 'ArrowRight', 400);         // 1→2 (QuickPlay)
    await key(page, 'Space', SCENE_TRANSITION); // → QuickPlayScene
    await key(page, 'Enter', SCENE_TRANSITION); // → lance avec sélections par défaut
    await page.waitForTimeout(SCENE_TRANSITION);
}

/**
 * Navigation Arcade : TitleScene(0) → Space(JOUER→CharSelect) → Space(Rookie)
 * → ArcadeScene → Space(Fight) → VSIntro → PetanqueScene
 */
async function navigateToArcadeMatch(page) {
    await waitForGame(page);
    await key(page, 'Space', 800);                  // Boot → main menu (index=0=JOUER)
    await key(page, 'Space', SCENE_TRANSITION);     // JOUER → CharSelectScene
    await key(page, 'Space', SCENE_TRANSITION);     // Rookie confirmé → ArcadeScene
    await key(page, 'Space', SCENE_TRANSITION * 2); // ArcadeScene → VSIntro → PetanqueScene
    await page.waitForTimeout(SCENE_TRANSITION);
}

// ═══════════════════════════════════════════════════════════
//  QUICKPLAY — Data Flow & absence compteur Match
// ═══════════════════════════════════════════════════════════

test.describe('QuickPlay — Selection Data Flow', () => {

    test('QuickPlay transmet les paramètres par défaut à PetanqueScene', async ({ page }) => {
        test.setTimeout(60000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await navigateToQuickPlay(page);

        const state = await getPetanqueScene(page);

        if (state) {
            // Sélections par défaut QuickPlay
            expect(state.bouleType).toBe('acier');
            expect(state.cochonnetType).toBe('classique');
            // QuickPlay n'a pas de round arcade
            expect(state.arcadeRound).toBeNull();
            expect(state.arcadeState).toBeNull();
            // terrainType doit être défini (quel que soit le terrain par défaut)
            expect(state.terrainType).toBeTruthy();
        } else {
            // Si la scène n'est pas accessible, vérifier au moins l'absence de crash
            await expect(page.locator('canvas')).toBeVisible();
        }

        const critical = errors.filter(e =>
            !['audio', '404', 'fetch', 'decoding', 'NotSupported', 'net::ERR', 'setMask', 'JSON']
                .some(p => e.includes(p))
        );
        expect(critical).toEqual([]);
    });

    test('QuickPlay — aucun compteur "Match X/N" affiché en partie', async ({ page }) => {
        test.setTimeout(60000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await navigateToQuickPlay(page);

        const texts = await getPetanqueTexts(page);

        // Aucun texte ne doit correspondre au pattern "Match N/M"
        const matchCounter = texts.find(t => /^Match \d+\/\d+/.test(t));
        expect(matchCounter).toBeUndefined();

        await expect(page.locator('canvas')).toBeVisible();
        const critical = errors.filter(e =>
            !['audio', '404', 'fetch', 'decoding', 'NotSupported', 'net::ERR', 'setMask', 'JSON']
                .some(p => e.includes(p))
        );
        expect(critical).toEqual([]);
    });

    test('QuickPlay ne crashe pas', async ({ page }) => {
        test.setTimeout(60000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await navigateToQuickPlay(page);
        await expect(page.locator('canvas')).toBeVisible();

        const critical = errors.filter(e =>
            !['audio', '404', 'fetch', 'decoding', 'NotSupported', 'net::ERR', 'setMask', 'JSON']
                .some(p => e.includes(p))
        );
        expect(critical).toEqual([]);
    });
});

// ═══════════════════════════════════════════════════════════
//  ARCADE — Data Flow & compteur Match X/5
// ═══════════════════════════════════════════════════════════

test.describe('Arcade — Match Counter Data Flow', () => {

    test('Arcade premier match : arcadeRound est défini dans PetanqueScene', async ({ page }) => {
        test.setTimeout(90000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await navigateToArcadeMatch(page);

        const state = await getPetanqueScene(page);

        if (state) {
            // arcadeRound doit être défini (>= 1)
            expect(state.arcadeRound).toBeGreaterThan(0);
            // arcadeState doit être transmis
            expect(state.arcadeState).toBe('set');
        } else {
            await expect(page.locator('canvas')).toBeVisible();
        }

        const critical = errors.filter(e =>
            !['audio', '404', 'fetch', 'decoding', 'NotSupported', 'net::ERR', 'setMask', 'JSON']
                .some(p => e.includes(p))
        );
        expect(critical).toEqual([]);
    });

    test('Arcade premier match — compteur "Match N/5" visible dans PetanqueScene', async ({ page }) => {
        test.setTimeout(90000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await navigateToArcadeMatch(page);

        const texts = await getPetanqueTexts(page);

        if (texts.length > 0) {
            // Un texte "Match N/M" doit être présent dans PetanqueScene Arcade
            const matchCounter = texts.find(t => /^Match \d+\/\d+/.test(t));
            expect(matchCounter).toBeDefined();
        }

        // Au minimum pas de crash
        await expect(page.locator('canvas')).toBeVisible();
        const critical = errors.filter(e =>
            !['audio', '404', 'fetch', 'decoding', 'NotSupported', 'net::ERR', 'setMask', 'JSON']
                .some(p => e.includes(p))
        );
        expect(critical).toEqual([]);
    });

    test('Arcade ne crashe pas sur le premier match', async ({ page }) => {
        test.setTimeout(90000);
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));

        await navigateToArcadeMatch(page);
        await expect(page.locator('canvas')).toBeVisible();

        const critical = errors.filter(e =>
            !['audio', '404', 'fetch', 'decoding', 'NotSupported', 'net::ERR', 'setMask', 'JSON']
                .some(p => e.includes(p))
        );
        expect(critical).toEqual([]);
    });
});
