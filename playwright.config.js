import { defineConfig } from '@playwright/test';

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
        viewport: { width: 1664, height: 960 },

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

    expect: {
        toHaveScreenshot: {
            maxDiffPixelRatio: 0.06,  // 6% tolerance (game has tweens, animations, procedural elements)
            threshold: 0.3,            // Color sensitivity (0=strict, 1=loose)
            animations: 'disabled',
        },
        timeout: 10000,
    },

    // Snapshot storage
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
