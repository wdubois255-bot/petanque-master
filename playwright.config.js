import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config — Petanque Master
 *
 * Projects :
 *  - desktop (default) : 1664×960 paysage, utilisé par TOUS les tests existants
 *                        (health, game, visual-regression, etc.)
 *  - iPhone SE / iPhone 14 / Pixel 5 : device emulation Playwright native
 *                        Tournent UNIQUEMENT sur tests tagués `@mobile`.
 *
 * Filtering strategy (Phase 6) :
 *  - Les projects mobile utilisent `grep: /@mobile/` — ils ne lancent que
 *    les tests tagués @mobile (via leur titre).
 *  - Le project desktop utilise `grepInvert: /@mobile/` — il skip les tests
 *    @mobile et fait tourner tout le reste à la résolution historique.
 *  - Ainsi `npx playwright test` continue de fonctionner comme avant côté
 *    desktop SANS casser les baselines, et le script `npm run test:e2e:mobile`
 *    cible uniquement les nouveaux tests mobile sur les 3 devices.
 *
 * Le `use` global (baseURL, launchOptions, screenshot, video, trace…) est
 * mergé automatiquement avec le `use` de chaque project.
 */
export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.pw.js',
    timeout: 60000,
    retries: 1,
    workers: 1, // Sequential — game needs exclusive GPU/canvas
    fullyParallel: false,

    use: {
        baseURL: 'http://localhost:8080',
        headless: true,

        // Visual regression
        screenshot: 'only-on-failure',

        // Video recording on failure (WebM)
        video: 'retain-on-failure',

        // Trace for debugging failed tests
        trace: 'retain-on-failure',

        // Consistent rendering across machines (software GPU)
        launchOptions: {
            args: [
                '--use-gl=swiftshader',
                '--disable-gpu-sandbox',
                '--no-sandbox',
            ]
        }
    },

    projects: [
        {
            name: 'desktop',
            use: {
                viewport: { width: 1664, height: 960 },
            },
            grepInvert: /@mobile/,
        },
        {
            name: 'iPhone SE',
            use: { ...devices['iPhone SE'] },
            grep: /@mobile/,
        },
        {
            name: 'iPhone 14',
            use: { ...devices['iPhone 14'] },
            grep: /@mobile/,
        },
        {
            name: 'Pixel 5',
            use: { ...devices['Pixel 5'] },
            grep: /@mobile/,
        },
    ],

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.06,  // 6% tolerance (game has tweens, animations, procedural elements)
            threshold: 0.3,            // Color sensitivity (0=strict, 1=loose)
            animations: 'disabled',
        },
        timeout: 10000,
    },

    // Snapshot storage
    // Template : inclut `{projectName}` pour les tests mobile uniquement
    // (sur desktop, projectName='desktop' serait un breaking change pour les
    // baselines existantes). On ré-encode donc le device dans le NOM du
    // screenshot côté tests mobile : `iPhone-SE-title.png`.
    snapshotDir: './tests/e2e/snapshots',
    snapshotPathTemplate: '{snapshotDir}/{testFilePath}/{arg}{ext}',

    webServer: {
        command: 'npx vite --host --port 8080',
        port: 8080,
        reuseExistingServer: !process.env.CI,
        timeout: 15000,
    },

    // HTML report
    reporter: process.env.CI
        ? [['html', { open: 'never' }], ['github']]
        : [['html', { open: 'on-failure' }]],
});
