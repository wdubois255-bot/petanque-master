import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        globals: true,
        setupFiles: ['./tests/setup.js'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html', 'json-summary'],
            include: ['src/**/*.js'],
            // Scenes Phaser et fichiers de rendu : couverts par Playwright e2e, pas Vitest.
            // Inutile de polluer le ratio de couverture avec du code intestable en Node.
            exclude: [
                'src/scenes/**',
                'src/ui/**',
                'src/world/**',
                'src/entities/**',
                'src/petanque/EngineRenderer.js',
                'src/petanque/TerrainRenderer.js',
                'src/petanque/CharacterTextures.js',
                'src/petanque/ModularCharacter.js',
                'src/utils/PortraitGenerator.js',
                'src/utils/SoundManager.js',
                'src/utils/Analytics.js',
                'src/utils/PortalSDK.js',
                'src/utils/ErrorReporter.js',
                'src/main.js',
                'src/config.js'
            ],
            // Floor anti-regression : la couverture ne doit pas baisser sous ces seuils.
            // Mesures actuelles (avril 2026) → seuil = mesure - 2 points pour absorber le bruit.
            // A ratcheter vers le haut quand on ajoute des tests.
            thresholds: {
                lines: 27,
                functions: 23,
                statements: 25,
                branches: 20
            }
        }
    }
});
