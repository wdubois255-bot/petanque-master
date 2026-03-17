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
                setTimeout: 'readonly',
                clearTimeout: 'readonly',
                setInterval: 'readonly',
                clearInterval: 'readonly',
                requestAnimationFrame: 'readonly',
                Phaser: 'readonly',
                globalThis: 'readonly'
            }
        },
        rules: {
            'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
            'no-undef': 'error',
            'eqeqeq': ['warn', 'smart'],
            'no-var': 'error',
            'prefer-const': 'warn',
            'no-duplicate-imports': 'error',
            'no-self-compare': 'error',
            'no-template-curly-in-string': 'warn',
            'no-constant-binary-expression': 'error'
        }
    },
    {
        ignores: ['dist/**', 'node_modules/**', 'assets/**', 'public/assets/**', 'research/**']
    }
];
