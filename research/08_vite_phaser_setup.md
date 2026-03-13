# Recherche Agent 7 : Setup Concret Vite + Phaser 3

## 1. Version Phaser 3
- Derniere stable (mai 2025) : **3.88.x**
- Verifier avec `npm view phaser version`
- Phaser 4 en dev mais Phaser 3 reste la ref production

## 2. Template officiel Phaser + Vite
- **Repo** : `phaserjs/template-vite` (GitHub)
- **TypeScript** : `phaserjs/template-vite-ts`
- **CLI** : `npx @phaserjs/create-game@latest` (interactif, choix Vite)
- Ou cloner directement :
```bash
git clone https://github.com/phaserjs/template-vite.git my-game
cd my-game && npm install && npm run dev
```

## 3. vite.config.js recommande
```js
import { defineConfig } from 'vite';

export default defineConfig({
    base: './',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
    },
    server: {
        port: 8080
    }
});
```
- `base: './'` : assets OK en sous-dossier
- `manualChunks` : Phaser (~1MB) dans son propre chunk = cache independant
- Pas de plugin Vite special necessaire

## 4. Import Phaser ES Modules
```js
import Phaser from 'phaser';  // Recommande (default export)
// OU
import * as Phaser from 'phaser';  // Aussi valide
```
Phaser a un champ `"module"` dans package.json pour ESM.

## 5. Rex Plugins avec Vite

### Installation
```bash
npm install phaser3-rex-plugins
```

### Import individuel (RECOMMANDE avec Vite - plus leger)
```js
import RexUIPlugin from 'phaser3-rex-plugins/templates/ui/ui-plugin.js';

const config = {
    plugins: {
        scene: [{
            key: 'rexUI',
            plugin: RexUIPlugin,
            mapping: 'rexUI'
        }]
    }
};
```

### Fix Vite pre-bundling
```js
// vite.config.js
export default defineConfig({
    optimizeDeps: {
        include: ['phaser3-rex-plugins']
    }
});
```

### Compatibilite version
Rex plugins version liee a Phaser version : phaser 3.88.x -> rex-plugins 1.88.x

## 6. package.json recommande
```json
{
    "name": "petanque-master",
    "version": "0.1.0",
    "private": true,
    "type": "module",
    "scripts": {
        "dev": "vite",
        "build": "vite build",
        "preview": "vite preview"
    },
    "dependencies": {
        "phaser": "^3.88.0",
        "phaser3-rex-plugins": "^1.88.0"
    },
    "devDependencies": {
        "vite": "^6.0.0"
    }
}
```
- `"type": "module"` pour ESM dans configs
- Phaser en `dependencies` (runtime)
- Pas de plugin Vite necessaire
