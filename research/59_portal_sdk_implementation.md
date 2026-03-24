# 59 — Portal SDK Implementation Checklist

> A lire quand : on prepare la publication sur CrazyGames, Poki ou itch.io.
> Prerequis : research/54 (exigences techniques), docs/PLAN_PHASE3.md (AXE F)
> Fichier cible : `src/utils/PortalSDK.js` (nouveau)

---

## 1. CRAZYGAMES SDK v2

### 1.1 Installation

**Script tag** dans `index.html` (conditionnel via Vite) :

```html
<!-- Injecter uniquement pour le build CrazyGames -->
<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>
```

**Vite config** — ajouter dans `vite.config.js` :

```js
// Injecter le script SDK selon la variable d'environnement
const portalScripts = {
  crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>',
  poki: '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
  standalone: ''
};
// Utiliser transformIndexHtml pour injecter dans le <head>
```

**Pas d'initialisation manuelle** : le SDK s'auto-initialise, accessible via `window.CrazyGames.SDK`.

**Detection d'environnement** :

```js
const env = await window.CrazyGames.SDK.getEnvironment();
// 'local' | 'crazygames' | 'disabled'
```

### 1.2 Gameplay Events

| Evenement | Quand l'appeler | Scene source |
|-----------|----------------|-------------|
| `gameplayStart()` | PetanqueScene.create() — debut de chaque mene | PetanqueScene |
| `gameplayStop()` | PetanqueScene.shutdown() — fin du match | PetanqueScene |
| `gameplayStop()` | Pause menu ouvert (si implementee) | PetanqueScene |
| `gameplayStart()` | Resume apres pause | PetanqueScene |

**Implementation dans PetanqueScene.js** :

```js
import PortalSDK from '../utils/PortalSDK.js';

create(data) {
    // ... existing code ...
    PortalSDK.gameplayStart();
}

shutdown() {
    PortalSDK.gameplayStop();
    // ... existing cleanup ...
}
```

### 1.3 happyTime Events

`window.CrazyGames.SDK.game.happyTime()` — Signal que le joueur vit un moment positif. CrazyGames l'utilise pour mesurer la qualite de l'experience.

| Moment | Intensite | Code |
|--------|-----------|------|
| Victoire arcade (match gagne) | 0.5 | `ResultScene` quand victoire |
| Carreau reussi | 0.4 | `PetanqueEngine._detectShotResult()` quand carreau |
| Ciseau reussi | 0.5 | `PetanqueEngine._detectShotResult()` quand ciseau |
| Badge debloque | 0.3 | `LevelUpScene` ou systeme de badges |
| Arcade complete (5 victoires) | 1.0 | `ArcadeScene` quand arcade terminee |
| Fanny infligee (13-0) | 0.8 | `ResultScene` quand fanny |

```js
// Intensite de 0.0 a 1.0
PortalSDK.happyTime(0.5);
```

### 1.4 Midgame Ads (Interstitiels)

**Placement** : entre les matchs du mode Arcade, pendant la transition `ResultScene -> match suivant`.

**Timing exact** :

```
ResultScene affiche score final
  -> Joueur clique "Match suivant"
  -> PortalSDK.showInterstitial()
  -> [PUB ou skip si cooldown pas ecoule]
  -> VSIntroScene du match suivant
```

**Regles** :
- Frequence max : 1 toutes les 3 minutes (geree automatiquement par le SDK)
- JAMAIS pendant le gameplay actif (mene en cours)
- Seulement aux transitions naturelles
- Ne PAS combiner midgame + rewarded au meme moment

**Obligations pendant la pub** :
- [ ] Pause du jeu (deja naturel car entre scenes)
- [ ] Mute audio in-game via `SoundManager.setMuted(true)` temporairement
- [ ] Bloquer l'UI jusqu'a `adFinished` ou `adError`
- [ ] Ne PAS donner de recompense sur `adError`

### 1.5 Banner Ads (Bannieres)

**Placements safe** :

| Scene | Position | Taille | Condition |
|-------|----------|--------|-----------|
| TitleScene | Bas centre, sous les boutons | 728x90 | Ecran affiche > 5 secondes |
| ShopScene | Sidebar droite ou bas | 300x250 | Ecran affiche > 5 secondes |

**Placements INTERDITS** :
- PetanqueScene (gameplay actif)
- VSIntroScene (transition rapide, < 5 sec)
- ResultScene (transition rapide)
- CharSelectScene (interaction dense)

```js
// Creer un div container dans le HTML
// <div id="banner-bottom" style="position:absolute;bottom:0;left:50%;transform:translateX(-50%)"></div>

PortalSDK.showBanner('banner-bottom', 728, 90);
PortalSDK.hideBanner('banner-bottom');
```

### 1.6 Data Module (Sauvegarde Cloud — Phase D optionnel)

Synchroniser la progression joueur avec les serveurs CrazyGames.

```js
// Sauvegarder
await window.CrazyGames.SDK.data.save(JSON.stringify(saveData));

// Charger
const raw = await window.CrazyGames.SDK.data.load();
const saveData = JSON.parse(raw);
```

**Integration avec SaveManager.js** :
- `SaveManager.saveSave()` appelle aussi `PortalSDK.cloudSave(data)` si disponible
- `SaveManager.loadSave()` tente d'abord `PortalSDK.cloudLoad()` puis fallback localStorage
- Merge strategy : le save le plus recent gagne (comparer `lastSaved` timestamp)

### 1.7 Quality Requirements CrazyGames

| Critere | Status PM | Action |
|---------|-----------|--------|
| 60 FPS stable | A verifier avec throttle CPU 4x | Pooling objets (AXE C7) |
| Pas de console.log | CLAUDE.md l'interdit deja | Grep + supprimer avant build |
| Responsive (907x510 min) | 832x480 OK | Tester a 907x510 |
| Chromebook 4GB RAM | A tester | Profiler memoire |
| 1 clic pour jouer | TitleScene -> QuickPlay = 2 clics | Ajouter bouton "Jouer" direct |
| Anglais | Pas encore localise | Ajouter i18n (Phase D) |
| Pas de fullscreen custom | Verifier | Supprimer si present |
| Chemins relatifs | Vite le gere | Verifier avec `base: './'` |
| CSS anti-selection | A ajouter | `* { user-select: none; }` |
| Prevention scroll | A ajouter | `wheel` + `keydown` listeners |
| Physique consistante 60/144/165Hz | Delta-based dans Ball.js | A valider |

---

## 2. POKI SDK v2

### 2.1 Installation & Init

**Script tag** dans `index.html` (conditionnel) :

```html
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
```

**Initialisation obligatoire** dans `BootScene.js` :

```js
async create() {
    await PortalSDK.init();
    // ... reste du boot
}
```

Le wrapper PortalSDK appellera :

```js
PokiSDK.init().then(() => {
    // SDK ready
}).catch(() => {
    // SDK error, continuer quand meme
});
```

### 2.2 Loading Events

| Evenement | Quand | Scene |
|-----------|-------|-------|
| `gameLoadingStart()` | Non necessaire (auto) | - |
| `gameLoadingFinished()` | Fin de BootScene.create() | BootScene |

```js
// Dans BootScene.js, apres le chargement de tous les assets initiaux
PortalSDK.loadingFinished();
```

### 2.3 commercialBreak (Interstitiels)

**Meme timing que CrazyGames** : entre les matchs Arcade.

```js
// Le SDK decide s'il montre une pub ou non
PokiSDK.commercialBreak(() => {
    // Muter audio
    SoundManager.setMuted(true);
}).then(() => {
    // Reprendre audio
    SoundManager.setMuted(false);
});
```

**Appeler AVANT chaque `gameplayStart()`** (exigence Poki).

**Sequence exacte** :

```
ResultScene -> "Match suivant" clic
  -> PortalSDK.showInterstitial()     // appelle commercialBreak
  -> [Poki decide si pub ou non]
  -> PortalSDK.gameplayStart()         // appelle PokiSDK.gameplayStart()
  -> VSIntroScene
```

### 2.4 rewardedBreak (Pubs Recompensees)

**Placement optionnel** : regarder une pub pour gagner des Galets bonus.

| Moment | Recompense | Bouton |
|--------|-----------|--------|
| ResultScene (victoire) | +50 Galets bonus | "Doubler les Galets (pub)" |
| ShopScene | Gagner 100 Galets | "Galets gratuits (pub)" |

```js
const success = await PortalSDK.showRewarded();
if (success) {
    // Donner la recompense
    save.currency += bonusGalets;
} else {
    // Pas de recompense (pub pas vue ou erreur)
}
```

**Regles** :
- Le bouton doit avoir une icone video claire (triangle play)
- Un bouton "Non merci" / fermer aussi visible que le bouton pub
- Ne pas proposer a chaque ecran — 1 opportunite par session max
- Si pas de pub disponible : masquer le bouton silencieusement

### 2.5 Gameplay Events

Identiques a CrazyGames :

```js
PokiSDK.gameplayStart();   // debut de mene
PokiSDK.gameplayStop();    // fin de match, pause
```

### 2.6 URL Partageable (bonus)

```js
// Generer une URL avec le score
const url = PokiSDK.shareableURL({ score: 42, mode: 'arcade' });

// Lire les params au chargement
const sharedScore = PokiSDK.getURLParam('score');
```

Afficher un bouton "Partager" dans ResultScene si sur Poki.

### 2.7 Quality Requirements Poki

| Critere | Status PM | Action |
|---------|-----------|--------|
| Mobile obligatoire | Non mobile-ready | AXE F (touch areas, responsive) |
| 16:9 obligatoire | 832x480 = 1.73:1 | Adapter a 836x470 ou scaling dynamique |
| 5-8 MB download initial | A mesurer (build ~384KB + Phaser ~1238KB) | Probablement OK |
| Mode incognito (try/catch localStorage) | SaveManager a verifier | Ajouter try/catch |
| Pas de requetes externes | Pas de CDN utilise | Verifier (Google Fonts ?) |
| Pas de splash screen dev | Boot direct | OK |
| Pas de liens sortants | Aucun lien externe | OK |
| Fonctionne avec adblock | Le jeu tourne sans pub | A verifier |
| CSS anti-selection | A ajouter | Comme CrazyGames |

**Resolution 16:9** — options :
1. Changer `config.js` a 848x477 (conserve l'echelle ~x2)
2. Ajouter des letterbox bars (bandes noires) pour forcer 16:9
3. Scaling dynamique qui detecte le ratio du viewport

Recommandation : option 2 (letterbox) pour le build Poki, resolution native sinon.

---

## 3. ITCH.IO

### 3.1 Pas de SDK

Itch.io n'a pas de SDK a integrer. Le jeu fonctionne tel quel.

### 3.2 Publication

```bash
npm run build          # Genere dist/
cd dist && zip -r petanque-master.zip .
```

Upload le ZIP sur itch.io, configurer :
- Type : HTML5
- Taille iframe : 832x480
- Fullscreen : oui (bouton genere par itch.io)

### 3.3 Checklist itch.io

- [ ] `vite.config.js` : `base: './'` pour chemins relatifs
- [ ] Index.html : pas de CDN externe
- [ ] GIF/video de gameplay en haut de la page
- [ ] Tags : Sports, Casual, petanque, pixel-art, arcade, competitive, French
- [ ] 4-5 screenshots de qualite
- [ ] Prix : pay-what-you-want ($0 min)
- [ ] Devlog initial avec le making-of

---

## 4. WRAPPER PATTERN — PortalSDK.js

### 4.1 Architecture

Creer `src/utils/PortalSDK.js` — singleton qui abstrait les 3 portails.

Toutes les methodes sont des **no-ops** si aucun SDK n'est detecte (standalone / itch.io).

### 4.2 Code Structure

```js
// src/utils/PortalSDK.js
import { setMuted } from './SoundManager.js';

class PortalSDK {
    constructor() {
        this.platform = 'standalone'; // 'crazygames' | 'poki' | 'standalone'
        this._initialized = false;
    }

    // --- DETECTION ---

    detect() {
        if (window.CrazyGames?.SDK) {
            this.platform = 'crazygames';
        } else if (window.PokiSDK) {
            this.platform = 'poki';
        } else {
            this.platform = 'standalone';
        }
        return this.platform;
    }

    // --- INIT ---

    async init() {
        this.detect();
        if (this._initialized) return;

        if (this.platform === 'poki') {
            try {
                await window.PokiSDK.init();
            } catch (e) {
                // SDK error, continue anyway
            }
        }
        // CrazyGames s'auto-initialise, rien a faire

        this._initialized = true;
    }

    // --- LOADING ---

    loadingFinished() {
        if (this.platform === 'poki') {
            window.PokiSDK.gameLoadingFinished();
        }
        // CrazyGames : pas de loading event requis (optionnel)
    }

    // --- GAMEPLAY EVENTS ---

    gameplayStart() {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.game.gameplayStart();
        } else if (this.platform === 'poki') {
            window.PokiSDK.gameplayStart();
        }
    }

    gameplayStop() {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.game.gameplayStop();
        } else if (this.platform === 'poki') {
            window.PokiSDK.gameplayStop();
        }
    }

    // --- HAPPY TIME ---

    happyTime(intensity = 0.5) {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.game.happyTime(intensity);
        }
        // Poki n'a pas d'equivalent
    }

    // --- ADS ---

    async showInterstitial() {
        if (this.platform === 'crazygames') {
            return new Promise((resolve) => {
                window.CrazyGames.SDK.ad.requestAd('midgame', {
                    adStarted: () => this._muteGame(),
                    adFinished: () => { this._unmuteGame(); resolve(true); },
                    adError: (err) => { this._unmuteGame(); resolve(false); }
                });
            });
        } else if (this.platform === 'poki') {
            return window.PokiSDK.commercialBreak(() => {
                this._muteGame();
            }).then(() => {
                this._unmuteGame();
                return true;
            });
        }
        return false; // standalone: pas de pub
    }

    async showRewarded() {
        if (this.platform === 'crazygames') {
            return new Promise((resolve) => {
                window.CrazyGames.SDK.ad.requestAd('rewarded', {
                    adStarted: () => this._muteGame(),
                    adFinished: () => { this._unmuteGame(); resolve(true); },
                    adError: () => { this._unmuteGame(); resolve(false); }
                });
            });
        } else if (this.platform === 'poki') {
            this._muteGame();
            const result = await window.PokiSDK.rewardedBreak({ size: 'medium' });
            this._unmuteGame();
            return result;
        }
        return false;
    }

    // --- BANNERS (CrazyGames only) ---

    showBanner(containerId, width = 728, height = 90) {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.banner.requestBanner({
                id: containerId, width, height
            });
        }
    }

    hideBanner(containerId) {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.banner.requestBanner({
                id: containerId, width: 0, height: 0
            });
        }
    }

    // --- CLOUD SAVE (CrazyGames Data module) ---

    async cloudSave(data) {
        if (this.platform === 'crazygames') {
            try {
                await window.CrazyGames.SDK.data.save(JSON.stringify(data));
                return true;
            } catch { return false; }
        }
        return false;
    }

    async cloudLoad() {
        if (this.platform === 'crazygames') {
            try {
                const raw = await window.CrazyGames.SDK.data.load();
                return raw ? JSON.parse(raw) : null;
            } catch { return null; }
        }
        return null;
    }

    // --- SHAREABLE URL (Poki only) ---

    shareableURL(params = {}) {
        if (this.platform === 'poki') {
            return window.PokiSDK.shareableURL(params);
        }
        return null;
    }

    getURLParam(key) {
        if (this.platform === 'poki') {
            return window.PokiSDK.getURLParam(key);
        }
        return null;
    }

    // --- INTERNAL ---

    _muteGame() {
        setMuted(true);
    }

    _unmuteGame() {
        setMuted(false);
    }
}

export default new PortalSDK();
```

### 4.3 Integration Points (ou appeler quoi)

| Scene | Methode | Quand |
|-------|---------|-------|
| **BootScene** | `PortalSDK.init()` | Debut de `create()` |
| **BootScene** | `PortalSDK.loadingFinished()` | Fin de `create()` |
| **TitleScene** | `PortalSDK.showBanner()` | `create()`, apres 5 sec |
| **TitleScene** | `PortalSDK.hideBanner()` | `shutdown()` |
| **PetanqueScene** | `PortalSDK.gameplayStart()` | `create()` |
| **PetanqueScene** | `PortalSDK.gameplayStop()` | `shutdown()` |
| **PetanqueScene** | `PortalSDK.happyTime(0.4)` | Sur carreau/ciseau detecte |
| **ResultScene** | `PortalSDK.happyTime(0.5)` | Victoire |
| **ResultScene** | `PortalSDK.happyTime(1.0)` | Arcade complete |
| **ResultScene** | `PortalSDK.happyTime(0.8)` | Fanny infligee |
| **ResultScene** | `PortalSDK.showInterstitial()` | Clic "Match suivant" |
| **ResultScene** | `PortalSDK.showRewarded()` | Clic "Doubler Galets (pub)" |
| **ShopScene** | `PortalSDK.showBanner()` | `create()` |
| **ShopScene** | `PortalSDK.showRewarded()` | Clic "Galets gratuits (pub)" |
| **LevelUpScene** | `PortalSDK.happyTime(0.3)` | Badge debloque |

### 4.4 Vite Build Config

```js
// vite.config.js — ajouter/modifier
import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    const platform = process.env.VITE_PLATFORM || 'standalone';

    return {
        base: './',
        assetsInlineLimit: 0,
        build: {
            outDir: `dist-${platform}`,
        },
        define: {
            __PLATFORM__: JSON.stringify(platform)
        }
    };
});
```

**Commandes de build** :

```bash
# Build standalone (itch.io, auto-heberge)
npm run build

# Build CrazyGames
VITE_PLATFORM=crazygames npm run build

# Build Poki
VITE_PLATFORM=poki npm run build
```

Le script SDK est injecte via un plugin Vite `transformIndexHtml` :

```js
{
    name: 'inject-portal-sdk',
    transformIndexHtml(html) {
        const platform = process.env.VITE_PLATFORM || 'standalone';
        const scripts = {
            crazygames: '<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>',
            poki: '<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>',
            standalone: ''
        };
        return html.replace('</head>', `${scripts[platform] || ''}\n</head>`);
    }
}
```

---

## 5. TESTING CHECKLIST

### 5.1 Tests sans deployer

| Test | Comment | Outil |
|------|---------|-------|
| **Detection standalone** | `npm run dev` normal, verifier `PortalSDK.platform === 'standalone'` | DevTools console |
| **Detection CrazyGames** | Ajouter un mock `window.CrazyGames = { SDK: { ... } }` avant le load | DevTools console |
| **Detection Poki** | Ajouter un mock `window.PokiSDK = { init: () => Promise.resolve(), ... }` | DevTools console |
| **No-ops safe** | Appeler toutes les methodes en standalone : aucune erreur | Vitest |
| **Mute/unmute pendant ad** | `showInterstitial()` mute, callback unmute | Vitest mock |
| **happyTime sans SDK** | Appeler `happyTime(1.0)` en standalone : pas d'erreur | DevTools |
| **Banner conteneur absent** | `showBanner('inexistant')` ne crash pas | DevTools |
| **Rewarded retourne false** | En standalone, `showRewarded()` retourne `false` | Vitest |

### 5.2 Tests unitaires (Vitest)

Fichier : `tests/PortalSDK.test.js`

```js
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock window globals before import
beforeEach(() => {
    delete window.CrazyGames;
    delete window.PokiSDK;
});

describe('PortalSDK', () => {
    it('detects standalone when no SDK present', async () => {
        const { default: sdk } = await import('../src/utils/PortalSDK.js');
        sdk.detect();
        expect(sdk.platform).toBe('standalone');
    });

    it('all methods are no-ops in standalone', async () => {
        const { default: sdk } = await import('../src/utils/PortalSDK.js');
        await sdk.init();
        // Aucune de ces methodes ne doit throw
        sdk.gameplayStart();
        sdk.gameplayStop();
        sdk.happyTime(1.0);
        sdk.loadingFinished();
        expect(await sdk.showInterstitial()).toBe(false);
        expect(await sdk.showRewarded()).toBe(false);
        expect(await sdk.cloudSave({ test: 1 })).toBe(false);
        expect(await sdk.cloudLoad()).toBeNull();
        expect(sdk.shareableURL()).toBeNull();
    });

    it('detects CrazyGames when SDK present', async () => {
        window.CrazyGames = { SDK: { game: {}, ad: {}, banner: {}, data: {} } };
        const { default: sdk } = await import('../src/utils/PortalSDK.js');
        sdk.detect();
        expect(sdk.platform).toBe('crazygames');
    });

    it('detects Poki when SDK present', async () => {
        window.PokiSDK = { init: vi.fn().mockResolvedValue(true) };
        const { default: sdk } = await import('../src/utils/PortalSDK.js');
        sdk.detect();
        expect(sdk.platform).toBe('poki');
    });
});
```

### 5.3 Tests manuels sur les portails

| Portail | Comment tester | URL |
|---------|---------------|-----|
| **CrazyGames** | QA Tool local (fournit un environnement simule avec pubs test) | developer.crazygames.com |
| **Poki** | Poki Inspector (extension Chrome) + `PokiSDK.setDebug(true)` | developers.poki.com |
| **itch.io** | Upload du ZIP en mode "Draft" (non publie) | itch.io/dashboard |

### 5.4 Pre-submission Checklist Finale

**CrazyGames** :

- [ ] `gameplayStart()` appele a chaque debut de mene
- [ ] `gameplayStop()` appele a chaque fin de match
- [ ] `happyTime()` appele sur carreau, victoire, fanny, arcade complete
- [ ] Midgame ads entre les matchs arcade (pas pendant le jeu)
- [ ] Audio mute pendant les pubs
- [ ] 60 FPS stable (tester avec CPU throttle 4x)
- [ ] Pas de `console.log` en production
- [ ] Pas de fullscreen button custom
- [ ] Pas de liens externes
- [ ] CSS `user-select: none` + prevention scroll
- [ ] Chemins relatifs (`base: './'`)
- [ ] Texte lisible a 907x510
- [ ] Download initial < 50 MB
- [ ] Physique consistante a 144 Hz / 165 Hz

**Poki** :

- [ ] `PokiSDK.init()` appele au boot
- [ ] `gameLoadingFinished()` appele apres le chargement
- [ ] `gameplayStart()` / `gameplayStop()` a chaque mene
- [ ] `commercialBreak()` avant chaque `gameplayStart()` entre matchs
- [ ] Audio mute pendant les pubs
- [ ] Resolution 16:9 (letterbox ou 848x477)
- [ ] Mobile/tablette fonctionnel (touch, responsive)
- [ ] Pas de requetes externes (CDN, fonts, analytics)
- [ ] Mode incognito OK (try/catch localStorage)
- [ ] Fonctionne avec adblock actif
- [ ] Pas de splash screen dev
- [ ] Download initial ~5-8 MB

**itch.io** :

- [ ] `npm run build` propre
- [ ] ZIP de dist/ avec index.html a la racine
- [ ] Taille iframe configuree a 832x480
- [ ] GIF de gameplay en haut de la page
- [ ] Tags pertinents
- [ ] 4-5 screenshots

---

## 6. ORDRE D'IMPLEMENTATION

```
1. Creer PortalSDK.js avec detect() + init() + no-ops          (30 min)
2. Ajouter gameplayStart/Stop dans PetanqueScene                (15 min)
3. Ajouter happyTime dans ResultScene + PetanqueEngine          (15 min)
4. Ajouter showInterstitial dans ResultScene                    (30 min)
5. Ajouter loadingFinished dans BootScene                       (10 min)
6. Plugin Vite pour injection script SDK                        (30 min)
7. Tests unitaires PortalSDK                                    (30 min)
8. CSS anti-selection + prevention scroll dans index.html       (15 min)
9. Tester avec mocks CrazyGames + Poki                         (30 min)
10. Build + test sur chaque portail                             (1h)
```

**Temps total estime : ~4h**

---

*Document cree le 24 mars 2026. Source de verite : research/54 + docs/PLAN_PHASE3.md AXE F.*
