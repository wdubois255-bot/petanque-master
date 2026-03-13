import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        assetsInlineLimit: 0,
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
    optimizeDeps: {
        include: ['phaser3-rex-plugins']
    },
    server: {
        port: 8080
    }
});
