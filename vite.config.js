import { defineConfig } from 'vite';

// Injection conditionnelle du SDK portail selon VITE_PLATFORM
// Usage :
//   npm run build                          → standalone (itch.io, localhost)
//   VITE_PLATFORM=crazygames npm run build → build CrazyGames (injecte SDK CrazyGames)
//   VITE_PLATFORM=poki npm run build       → build Poki (injecte SDK Poki)
const PORTAL_SCRIPTS = {
    crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>',
    poki:       '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
    standalone: ''
};

// CSP overrides per platform (script-src + connect-src additions)
const PORTAL_CSP = {
    crazygames: { scriptSrc: 'https://sdk.crazygames.com', connectSrc: 'https://sdk.crazygames.com https://script.google.com' },
    poki:       { scriptSrc: 'https://game-cdn.poki.com', connectSrc: 'https://game-cdn.poki.com https://script.google.com' },
    standalone: { scriptSrc: '', connectSrc: '' }
};

export default defineConfig(({ mode }) => {
    const platform = process.env.VITE_PLATFORM || 'standalone';

    return {
        base: './',
        define: {
            // Expose la plateforme au code JS (optionnel, PortalSDK.detect() suffit)
            __PLATFORM__: JSON.stringify(platform)
        },
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
        },
        plugins: [
            {
                name: 'inject-portal-sdk',
                transformIndexHtml(html) {
                    const script = PORTAL_SCRIPTS[platform] || '';
                    const csp = PORTAL_CSP[platform] || PORTAL_CSP.standalone;

                    // Inject portal SDK script
                    if (script) {
                        html = html.replace('</head>', `${script}\n</head>`);
                    }

                    // Extend CSP for portal SDKs
                    if (csp.scriptSrc) {
                        html = html.replace(
                            "script-src 'self' 'wasm-unsafe-eval'",
                            `script-src 'self' 'wasm-unsafe-eval' ${csp.scriptSrc}`
                        );
                    }
                    if (csp.connectSrc) {
                        html = html.replace(
                            /connect-src 'self'[^;]*/,
                            `connect-src 'self' ${csp.connectSrc}`
                        );
                    }

                    return html;
                }
            }
        ]
    };
});
