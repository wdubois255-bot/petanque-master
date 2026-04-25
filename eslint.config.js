import js from '@eslint/js';

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                window: 'readonly',
                document: 'readonly',
                console: 'readonly',
                localStorage: 'readonly',
                navigator: 'readonly',
                screen: 'readonly',
                location: 'readonly',
                history: 'readonly',
                performance: 'readonly',
                fetch: 'readonly',
                URL: 'readonly',
                URLSearchParams: 'readonly',
                Blob: 'readonly',
                FileReader: 'readonly',
                Image: 'readonly',
                Audio: 'readonly',
                AudioContext: 'readonly',
                webkitAudioContext: 'readonly',
                CustomEvent: 'readonly',
                Event: 'readonly',
                MutationObserver: 'readonly',
                ResizeObserver: 'readonly',
                IntersectionObserver: 'readonly',
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                cancelAnimationFrame: 'readonly',
                Phaser: 'readonly',
                globalThis: 'readonly',
                // Vite-injected build constants
                __PLATFORM__: 'readonly',
                __APP_VERSION__: 'readonly'
            }
        },
        rules: {
            // Empty catch pattern toleré (silent fallback idiomatique : .catch(_ => {}))
            'no-empty': ['error', { allowEmptyCatch: true }],
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'eqeqeq': ['warn', 'smart'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-duplicate-imports': 'error',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'warn',
            'no-constant-binary-expression': 'error',
            // Production hygiene (CLAUDE.md: pas de console.log en prod) — warn pour ne pas bloquer
            'no-console': ['warn', { allow: ['warn', 'error'] }],
            'no-debugger': 'error',
            'no-alert': 'warn',
            // Code smell guards (warn — dette technique a resorber progressivement)
            'complexity': ['warn', 20],
            'max-depth': ['warn', 5],
            'max-lines-per-function': ['warn', { max: 250, skipBlankLines: true, skipComments: true }],
            'max-params': ['warn', 6],
            // Defensif
            'no-implicit-coercion': ['warn', { boolean: false }],
            'no-throw-literal': 'error',
            'prefer-promise-reject-errors': 'warn'
        }
    },
    {
        // Tests : assoupli (Vitest globals + setups longs autorises)
        files: ['tests/**/*.js', '**/*.test.js', '**/*.spec.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                vi: 'readonly'
            }
        },
        rules: {
            'max-lines-per-function': 'off',
            'no-console': 'off'
        }
    },
    {
        // Scripts utilitaires (Node.js, generation assets) : globals Node + console autorise
        files: ['scripts/**/*.{js,mjs,cjs}', 'eslint.config.js', 'vite.config.js', 'vitest.config.js', 'playwright.config.js'],
        languageOptions: {
            globals: {
                process: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                Buffer: 'readonly',
                require: 'readonly',
                module: 'readonly',
                exports: 'readonly'
            }
        },
        rules: {
            'no-console': 'off',
            'max-lines-per-function': 'off',
            'complexity': 'off'
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'assets/**', 'public/assets/**', 'research/**', 'dev-tools/**', 'pub/**', 'playwright-report/**', 'test-results/**']
    }
];
