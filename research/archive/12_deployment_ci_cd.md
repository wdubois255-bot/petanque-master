# Recherche 12 : Deploiement GitHub Pages / Netlify (Mars 2026)

## 1. GitHub Pages via GitHub Actions

Workflow officiel Vite dans `.github/workflows/deploy.yml`.
- Actions : checkout@v6, setup-node@v6, configure-pages@v5, upload-pages-artifact@v4, deploy-pages@v4
- Config repo : Settings > Pages > Source = "GitHub Actions"
- Limites : 1 GB site, 100 GB bandwidth/mois

## 2. Netlify (alternative)

- `netlify.toml` avec `command = "npm run build"`, `publish = "dist"`
- Cache immutable sur `/assets/*`, no-cache sur `index.html`
- Auto-detecte Vite
- Free tier : 10 GB storage, 100 GB bandwidth/mois, 300 build min/mois

## 3. Gotchas Phaser

- **Audio autoplay** : navigateurs bloquent audio avant interaction. TitleScene avec "Press to Start" = solution.
- **Assets dans `public/`** : Phaser charge via son propre loader (pas via import JS). Tout dans `public/assets/`.
- **`import.meta.env.BASE_URL`** : Vite injecte automatiquement selon `base` dans vite.config.js. L'utiliser pour tous les chemins Phaser.
- **CORS** : pas de probleme si tout est sur le meme domaine.
- **MIME types** : GitHub Pages et Netlify servent .json, .ogg, .mp3 correctement.

## 4. vite.config.js pour GitHub Pages

```js
export default defineConfig({
    base: '/petanque-master/',  // nom du repo GitHub
    build: { assetsInlineLimit: 0 }
});
```
Pour custom domain : `base: '/'`.

## 5. Cache busting

- Assets dans `src/` (importes) : Vite ajoute un hash automatiquement -> cache immutable.
- Assets dans `public/` (runtime Phaser) : PAS de hash. Utiliser query string avec git SHA :
```js
const VERSION = import.meta.env.VITE_BUILD_VERSION || Date.now();
this.load.image('player', `${BASE}assets/sprites/player.png?v=${VERSION}`);
```

## 6. Budget taille

| Type | Estimation |
|------|-----------|
| JS bundle (Phaser + code) | ~1-2 MB (300-500 KB gzip) |
| Sprites/tilesets PNG | ~2-5 MB |
| Maps JSON | ~500 KB - 2 MB |
| Audio (OGG+MP3, chiptune) | ~5-15 MB |
| Data JSON | ~50 KB |
| **TOTAL** | **~10-25 MB** |

Bien sous les limites des deux plateformes.
