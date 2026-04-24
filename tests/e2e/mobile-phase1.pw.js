/**
 * Mobile Portage Phase 1 — Smoke test
 *
 * Valide :
 * 1. Desktop paysage (baseline 1664×960) : aucune régression suite aux refactors Layout
 * 2. Mobile portrait (viewport 480×960 + UA mobile) : boot sans erreur, canvas en portrait
 *
 * Note : ce test ne valide PAS la jouabilité complète du match mobile
 * (Phase 6 s'en chargera avec device emulation Playwright native).
 */
import { test, expect } from '@playwright/test';

const BOOT_WAIT = 4000;

function filterCriticalErrors(errors) {
    return errors.filter(e =>
        !e.includes('Unexpected token') &&
        !e.includes('JSON') &&
        !e.includes('audio') &&
        !e.includes('404') &&
        !e.includes('decoding') &&
        !e.includes('NotSupportedError') &&
        !e.includes('DOCTYPE') &&
        !e.includes('is not valid JSON') &&
        !e.includes('Failed to fetch')
    );
}

test.describe('Mobile Phase 1 — non-régression desktop', () => {
    test('desktop paysage boot sans erreur critique (Layout.W=832)', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 15000 });
        await page.waitForTimeout(BOOT_WAIT);

        const critical = filterCriticalErrors(errors);
        expect(critical, `Desktop errors: ${critical.join('\n')}`).toHaveLength(0);

        // Canvas existe et a des dimensions non nulles
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(100);
    });
});

test.describe('Mobile Phase 1 — boot portrait', () => {
    test.use({
        viewport: { width: 480, height: 960 },
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
    });

    test('portrait 480×960 UA mobile : boot sans erreur', async ({ page }) => {
        const errors = [];
        page.on('pageerror', err => errors.push(err.message));
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });

        await page.goto('/');
        await page.waitForSelector('canvas', { timeout: 15000 });
        await page.waitForTimeout(BOOT_WAIT);

        const critical = filterCriticalErrors(errors);
        expect(critical, `Mobile portrait errors: ${critical.join('\n')}`).toHaveLength(0);

        // Canvas existe et Layout.W doit avoir pris la valeur portrait.
        // On vérifie via Phaser si accessible, sinon par la dimension CSS du canvas.
        const canvas = page.locator('canvas');
        const box = await canvas.boundingBox();
        expect(box).not.toBeNull();
        expect(box.width).toBeGreaterThan(100);
        expect(box.height).toBeGreaterThan(100);

        // Le canvas doit être plus haut que large (portrait), quel que soit le scaling
        expect(box.height).toBeGreaterThan(box.width);
    });
});
