import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        assetsInlineLimit: 0,
        target: 'es2020',
        minify: 'terser',
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules/phaser')) {
                        return 'phaser';
                    }
                }
            }
        }
    },
    server: {
        port: 8080
    }
});
