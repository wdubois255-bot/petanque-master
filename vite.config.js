import { defineConfig, loadEnv } from 'vite';
import { readFileSync } from 'node:fs';

// Lit la version package.json au build pour la stamper dans les bundles.
// Permet aux rapports d'erreurs (ErrorReporter) et au feedback de tracer
// quel build a produit l'erreur.
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

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
    crazygames: { scriptSrc: 'https://sdk.crazygames.com', connectSrc: 'https://sdk.crazygames.com' },
    poki:       { scriptSrc: 'https://game-cdn.poki.com', connectSrc: 'https://game-cdn.poki.com' },
    standalone: { scriptSrc: '', connectSrc: '' }
};

// Extrait l'origine d'une URL pour l'ajouter en CSP (script-src/connect-src).
// Renvoie '' si l'URL est invalide → analytics simplement non chargee.
function originOf(url) {
    try { return new URL(url).origin; } catch { return ''; }
}

export default defineConfig(({ mode }) => {
    const platform = process.env.VITE_PLATFORM || 'standalone';
    // loadEnv lit .env / .env.local / .env.[mode] selon les conventions Vite.
    // On extrait uniquement les vars VITE_UMAMI_* (prefixe expose au client).
    const env = loadEnv(mode, process.cwd(), 'VITE_');
    const umamiUrl = env.VITE_UMAMI_SCRIPT_URL || '';
    const umamiId = env.VITE_UMAMI_WEBSITE_ID || '';
    const umamiOrigin = originOf(umamiUrl);

    return {
        base: './',
        define: {
            // Expose la plateforme au code JS (optionnel, PortalSDK.detect() suffit)
            __PLATFORM__: JSON.stringify(platform),
            // Release tag pour ErrorReporter (visible dans les rapports feedback)
            __APP_VERSION__: JSON.stringify(`${pkg.version}-${platform}`)
        },
        build: {
            assetsInlineLimit: 0,
            // es2022 requis pour top-level await (utilise dans config.js pour les
            // dynamic imports DEV-only). Supporte par Chrome 89+, Firefox 89+, Safari 15+.
            target: 'es2022',
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
            port: 8080,
            host: true
        },
        plugins: [
            {
                name: 'inject-html-extras',
                transformIndexHtml(html) {
                    // 1. Umami : remplace le placeholder par le tag script si configure.
                    //    Sinon, supprime la ligne placeholder pour propreté.
                    if (umamiUrl && umamiId) {
                        const tag = `<script defer src="${umamiUrl}" data-website-id="${umamiId}"></script>`;
                        html = html.replace('<!-- @umami-placeholder -->', tag);
                    } else {
                        html = html.replace(/\s*<!-- @umami-placeholder -->\s*/, '');
                    }

                    // 2. Portal SDK (CrazyGames / Poki / standalone)
                    const script = PORTAL_SCRIPTS[platform] || '';
                    if (script) {
                        html = html.replace('</head>', `${script}\n</head>`);
                    }

                    // 3. Extend CSP : portails + Umami origin (uniquement si configure)
                    const csp = PORTAL_CSP[platform] || PORTAL_CSP.standalone;
                    const scriptSrcAdd = [csp.scriptSrc, umamiOrigin].filter(Boolean).join(' ');
                    const connectSrcAdd = [csp.connectSrc, umamiOrigin].filter(Boolean).join(' ');

                    if (scriptSrcAdd) {
                        html = html.replace(
                            /(script-src [^;]*?)(;)/,
                            `$1 ${scriptSrcAdd}$2`
                        );
                    }
                    if (connectSrcAdd) {
                        html = html.replace(
                            /(connect-src [^;]*?)(;)/,
                            `$1 ${connectSrcAdd}$2`
                        );
                    }

                    return html;
                }
            }
        ]
    };
});
