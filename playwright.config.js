import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests/e2e',
    testMatch: '**/*.pw.js',
    timeout: 30000,
    retries: 1,
    use: {
        baseURL: 'http://localhost:8080',
        headless: true,
        viewport: { width: 1664, height: 960 },
        screenshot: 'only-on-failure',
    },
    webServer: {
        command: 'npx vite --host --port 8080',
        port: 8080,
        reuseExistingServer: true,
        timeout: 15000,
    },
});
