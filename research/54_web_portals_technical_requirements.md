# Exigences Techniques des Portails Web (CrazyGames, Poki, itch.io)

Recherche effectuee le 20 mars 2026. Sources verifiees.

---

## 1. CRAZYGAMES

### 1.1 SDK Integration (HTML5 v2)

**Installation :**
```html
<script src="https://sdk.crazygames.com/crazygames-sdk-v2.js"></script>
```

**Pas d'initialisation manuelle** -- le SDK s'auto-initialise. Accessible via `window.CrazyGames.SDK`.

**Detection d'environnement :**
```javascript
const env = await window.CrazyGames.SDK.getEnvironment();
// 'local' (localhost, ads test), 'crazygames' (prod), 'disabled' (autre domaine)
```

**Modules disponibles :**
- `ad` -- video ads + detection adblock
- `banner` -- banniere in-game
- `game` -- evenements gameplay (start/stop)
- `user` -- integration compte utilisateur (username, avatar)
- `data` -- sauvegarde progression cloud

**Niveaux d'integration :**
- **Basic** : evenement `gameplayStart()` obligatoire, pas de pub
- **Full** (requis pour Full Launch) : gameplay start/stop, Data module, User module, load start/stop optionnel

### 1.2 Regles de publicite

**Types de pubs :**
1. **Midgame (interstitiel)** -- entre niveaux, transitions naturelles
2. **Rewarded** -- le joueur choisit de regarder pour une recompense
3. **Banniere in-game** -- statique sur ecrans ouverts >5 sec

**Midgame ads :**
```javascript
const callbacks = {
    adFinished: () => console.log("Ad done"),
    adError: (error) => console.log("Error:", error),
    adStarted: () => console.log("Ad started"),
};
window.CrazyGames.SDK.ad.requestAd("midgame", callbacks);
```
- Frequence max automatique : **1 toutes les 3 minutes**
- JAMAIS pendant le gameplay actif
- Seulement aux transitions logiques (fin de manche, mort, changement de terrain)

**Rewarded ads :**
```javascript
window.CrazyGames.SDK.ad.requestAd("rewarded", callbacks);
```
- NE PAS proposer a chaque mort -- seulement en opportunite speciale
- NE PAS enchainer plusieurs pubs pour une seule recompense
- INTERDIT : combiner midgame + rewarded entre les memes niveaux
- Le bouton doit avoir une icone video claire, pas etre trompeur
- Un bouton "Skip/Close" aussi visible que le bouton pub
- Si pas de pub dispo : encourager a reessayer plus tard

**Banniere :**
```javascript
window.CrazyGames.SDK.banner.requestBanner({
    id: "banner-container", width: 300, height: 250,
});
```
- Sur ecrans ouverts minimum 5 secondes en moyenne
- Ne doit PAS obstruer l'UI du jeu
- INTERDIT pendant le gameplay actif

**Adblock :** Ne JAMAIS bloquer les joueurs. On peut desactiver des features specifiques avec notice.

**Obligations pendant les pubs :**
- Pause du jeu
- Mute audio in-game
- Bloquer UI jusqu'a fin/erreur
- Ne PAS donner de recompense sur `adError`

### 1.3 Exigences techniques

| Critere | Valeur |
|---------|--------|
| Taille totale max | 250 MB, 1500 fichiers max |
| Download initial | <= 50 MB (desktop), <= 20 MB (mobile homepage) |
| Temps de chargement | <= 20 secondes jusqu'au gameplay |
| Chemins fichiers | Relatifs uniquement |
| Navigateurs | Chrome + Edge obligatoires |
| Chromebook | Doit tourner sur 4 GB RAM |
| Resolution minimum lisible | 907x510 (desktop), 800x450 (mobile) |
| Refresh rate | Physique consistante a 60, 144, 165 Hz |
| Langue | Anglais obligatoire (detection langue via SDK) |
| Age rating | PEGI 12 (audience 13+) |
| Fullscreen | Fourni par CrazyGames, pas de bouton custom |
| Cross-promo | Interdite (liens externes interdits) |
| Onboarding | Max 1 clic pour commencer a jouer |

**Mobile specifique :**
- CSS anti-selection : `"-webkit-user-select: none"` + equivalents
- Orientation configurable a la soumission
- DPR gere par la plateforme (DPR=1 pour iOS/low-memory Android)

**Sitelock recommande :** Whitelister les domaines CrazyGames.

### 1.4 Revenue Share

**Non publiquement divulgue.** Le modele est base sur le revenu publicitaire genere par le jeu. Plusieurs facteurs influencent le montant (trafic, engagement, type de pub). Pas de pourcentage fixe annonce. Paiement via Tipalti.

### 1.5 Processus de soumission

1. Creer un compte sur developer.crazygames.com
2. Soumettre le jeu (ZIP avec fichiers HTML5)
3. Review par l'equipe CrazyGames
4. Si selectionne : integration SDK Basic pour Soft Launch
5. Si performance OK : integration Full SDK pour Full Launch

---

## 2. POKI

### 2.1 SDK Integration

**Installation :**
```html
<script src="https://game-cdn.poki.com/scripts/v2/poki-sdk.js"></script>
```

**Initialisation obligatoire :**
```javascript
PokiSDK.init().then(() => {
    console.log("Poki SDK initialized");
    // demarrer le jeu
}).catch(() => {
    console.log("SDK error, load game anyway");
    // demarrer quand meme
});
```

**Fin de chargement :**
```javascript
PokiSDK.gameLoadingFinished();
```

**Evenements gameplay :**
```javascript
PokiSDK.gameplayStart();  // debut de partie/niveau, unpause
PokiSDK.gameplayStop();   // fin de partie, pause, game over
```

### 2.2 Publicites

**Commercial Break (interstitiel) :**
```javascript
PokiSDK.commercialBreak(() => {
    // pause audio/musique
}).then(() => {
    // reprendre audio, continuer le jeu
});
```
- Appeler avant chaque `gameplayStart()`
- Le SDK decide si une pub est montree ou non (pas toujours)
- Placer aux pauses naturelles du jeu

**Rewarded Break :**
```javascript
PokiSDK.rewardedBreak({
    size: 'medium',  // small, medium, large
    onStart: () => {}
}).then((success) => {
    if (success) { /* donner recompense */ }
    else { /* pas de recompense */ }
});
```

**URL partageable :**
```javascript
const url = PokiSDK.shareableURL({ level: 5 });
const level = PokiSDK.getURLParam('level');
```

**Obligations pendant les pubs :**
- Desactiver audio ET input clavier
- Re-activer apres completion

### 2.3 Exigences techniques

| Critere | Valeur |
|---------|--------|
| Taille download initiale | ~5-8 MB recommande |
| Mobile/tablette | **OBLIGATOIRE** |
| Aspect ratio | 16:9 obligatoire |
| Resolutions recommandees | 640x360, 836x470, 1031x580 |
| Plein ecran | Doit couvrir tout le canvas |
| Mode incognito | Doit fonctionner (try/catch sur localStorage) |
| Requetes externes | **BLOQUEES par defaut** |
| Google Fonts, CDN externes | INTERDITS (tout en local) |
| Splash screen / logos dev | INTERDITS (integrer dans ecran de chargement) |
| Liens sortants | INTERDITS |
| Pubs tierces | INTERDITES (Poki SDK uniquement) |
| Adblock | Le jeu doit rester jouable |

**IMPORTANT pour Petanque Master :**
- La resolution 832x480 n'est PAS en 16:9 (c'est ~1.73:1 au lieu de 1.78:1). Il faudra adapter a 836x470 ou implementer un scaling dynamique.
- Toutes les requetes externes doivent etre supprimees (Google Fonts, analytics, etc.)
- Le try/catch sur localStorage est deja requis pour SaveManager.js.

### 2.4 Revenue Share

- **50/50** quand le trafic vient de Poki.com ou marketing Poki
- **100% pour le dev** quand le trafic vient de bookmarks, moteurs de recherche, reseaux sociaux, liens directs
- Top developpeurs : $50,000 a $1,000,000/an
- Web exclusivite requise (mais libre de publier sur Steam/mobile)
- 100M+ joueurs mensuels, 1 milliard de parties/mois (juin 2025)

### 2.5 Processus de soumission

1. Postuler sur developers.poki.com
2. Soumettre fichiers HTML5 + description + screenshots + trailer gameplay optionnel
3. Review qualite par l'equipe Poki
4. Si approuve : integration SDK + optimisation avec l'equipe Poki
5. Publication + marketing par Poki

---

## 3. ITCH.IO

### 3.1 Upload HTML5

**Format :** ZIP contenant tous les fichiers avec un `index.html` comme point d'entree.

**Affichage :**
- Jeu embarque dans un iframe sur la page du projet
- Taille d'iframe configurable
- Bouton fullscreen genere automatiquement (overlay en bas a droite)
- Sur mobile : "Click to launch in fullscreen" automatique

**Pas de SDK requis** -- itch.io n'a pas de SDK a integrer.

### 3.2 Bonnes pratiques pour la visibilite

**Tags recommandes pour Petanque Master :**
- Genre : `Sports`, `Casual`, `Strategy`
- Tags : `petanque`, `bowling`, `ball`, `pixel-art`, `multiplayer`, `arcade`, `french`, `competitive`
- Plateforme : `HTML5`, `play-in-browser`

**SEO et presentation :**
- Mettre le contenu le plus excitant en haut (GIF/video de gameplay)
- Inclure le genre dans la description pour le SEO
- Etre explicite sur ce qu'offre le jeu (demo gratuite, jeu complet, etc.)
- Les screenshots/GIFs sont le facteur #1 de conversion

**Indexation :**
- itch.io a son propre systeme d'indexation (search & browse)
- Les projets doivent etre "Published" ET "Public" pour etre indexes
- Les tags sont le moyen principal de decouverte

**Realite du marche :** Le plus grand obstacle n'est pas la visibilite mais l'**interet**. La plupart des joueurs voient les jeux mais ne cliquent pas. Il faut que le jeu donne envie en 2 secondes de screenshot.

### 3.3 Strategies de prix

| Strategie | Avantages | Inconvenients |
|-----------|-----------|---------------|
| **Gratuit** | Max de joueurs, feedback rapide | Pas de revenu direct |
| **Pay-what-you-want ($0 min)** | Revenus possibles, pas de barriere | En moyenne +30% au-dessus du minimum |
| **Prix minimum ($1-5)** | Revenu garanti par vente | Moins de joueurs |
| **Gratuit + DLC/Tip jar** | Meilleur des deux mondes | Plus complexe a gerer |

**Revenue sharing itch.io :** Open Revenue Sharing -- le vendeur decide lui-meme quel pourcentage donner a itch.io (souvent 10%).

**Recommandation pour Petanque Master :** Commencer en **gratuit** ou **pay-what-you-want ($0 min)** pour maximiser le feedback et construire une audience. Migrer vers un prix minimum si le jeu gagne en traction.

### 3.4 Note : HTML5 payant sur itch.io

Actuellement, les jeux HTML5 payants sur itch.io fonctionnent via le type "Downloadable" -- le joueur paie puis accede au jeu en ligne. Ce n'est pas optimal. Pour monetiser un jeu HTML5 sur itch.io, mieux vaut le gratuit + donations/tip jar.

---

## 4. OPTIMISATION PHASER 3 POUR PORTAILS WEB

### 4.1 Compression des assets

**Images :**
- Utiliser des **texture atlases** (TexturePacker format Phaser 3) au lieu d'images individuelles
- WebGL ne bind la texture qu'une fois par atlas = meilleur FPS
- Compresser les PNG avec pngquant/optipng (reduction 50-70%)
- Pour les gros assets : considerer WebP (support quasi-universel en 2026)

**Audio :**
- Fournir **MP3 + OGG** pour compatibilite maximale
- MP3 suffit dans la plupart des cas (support universel)
- Compresser a 96-128 kbps pour les SFX, 128-192 kbps pour la musique
- Les fichiers audio courts (<2s) en WAV/PCM sont OK pour les SFX critiques

**Taille cible pour portails :**
- CrazyGames : <= 50 MB initial (20 MB pour mobile)
- Poki : ~5-8 MB initial recommande
- itch.io : Pas de limite stricte, mais le chargement rapide est crucial

### 4.2 Lazy loading

```javascript
// Dans BootScene : charger uniquement les assets du menu
this.load.image('logo', 'assets/logo.png');
this.load.audio('menu_music', 'assets/audio/menu.mp3');

// Dans PetanqueScene.preload() : charger les assets de jeu
this.load.atlas('balls', 'assets/sprites/balls.png', 'assets/sprites/balls.json');
this.load.image('terrain_terre', 'assets/tilesets/terre.png');
```

- Charger par scene : menu, selection perso, jeu, resultats
- Pre-charger la prochaine scene pendant le jeu si possible
- Detruire les textures inutilisees : `this.textures.remove('key')`

### 4.3 Object pooling

```javascript
// Au lieu de creer/detruire des particules a chaque lancer
this.dustPool = this.add.group({
    classType: Phaser.GameObjects.Sprite,
    maxSize: 20,
    runChildUpdate: false,
});
// Recycler avec getFirstDead() / killAndHide()
```

### 4.4 Performance mobile

- **Canvas plus petit** = plus rapide. 832x480 est raisonnable.
- **Canvas vs WebGL** : sur vieux appareils, Canvas peut etre **30% plus rapide** que WebGL (contre-intuitif)
- Considerer un fallback Canvas pour les appareils faibles
- **DPR** : forcer `window.devicePixelRatio = 1` pour les jeux pixel art (pas de retina scaling)
- **Phaser 3.60+ Mobile Pipeline** : utilise une seule texture bindee, elimine le sub-data buffering = gains enormes sur mobile

**Refresh rate :** Utiliser `this.time.delta` ou un timestep fixe pour la physique, pas `requestAnimationFrame` brut. Le moteur petanque doit fonctionner de maniere identique a 60, 144 et 165 Hz.

### 4.5 Audio mobile

- Le Web Audio API demarre en etat **suspendu** sur mobile
- Phaser debloque automatiquement au premier input utilisateur
- Fournir un bouton "Tap to start" / ecran titre interactif avant de jouer du son
- Muter l'audio pendant les pubs SDK (CrazyGames/Poki l'exigent)
- `disableWebAudio: true` peut resoudre des bugs sur iOS si necessaire

### 4.6 Anti-patterns courants

| Piege | Solution |
|-------|----------|
| Charger TOUS les assets dans BootScene | Lazy load par scene |
| Images individuelles (pas d'atlas) | TexturePacker -> atlas |
| Ne pas detruire les textures entre scenes | `textures.remove()` |
| Physique dependante du framerate | Timestep fixe / delta-based |
| Canvas trop grand sur mobile | Fixer a 832x480 ou moins |
| Pas de pool pour particules/effects | Object pooling |
| Audio qui crash sur iOS | Ecran interactif avant audio |
| Chemins absolus dans les assets | Chemins relatifs uniquement |

### 4.7 Prevention scroll navigateur (requis par CrazyGames et Poki)

```javascript
// Empecher le scroll de la page
window.addEventListener("wheel", (e) => e.preventDefault(), { passive: false });
window.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
        e.preventDefault();
    }
});

// Anti-selection CSS (requis CrazyGames mobile)
// Ajouter dans index.html
// * { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
```

---

## 5. GAME FEEL / JUICE POUR RETENTION

### 5.1 La regle des 30 secondes

- Le joueur doit **lancer une boule** dans les 30 premieres secondes
- Pas de long tutoriel textuel -- apprendre en jouant
- Montrer le "power fantasy" immediatement : un beau lancer, un tir au but satisfaisant
- Mario 1-1 est la reference : chaque element enseigne une mecanique sans texte

### 5.2 Onboarding sans friction

- Clic pour commencer -> directement en jeu (max 1 clic, exigence CrazyGames)
- Tutoriel integre au gameplay (pas un ecran separe)
- Etapes courtes et interactives (< 5 minutes total)
- Sequence : hook narratif -> mecanique de base -> moment "wow" -> incitation a revenir

### 5.3 Techniques de juice pour la petanque

**Visuelles :**
- Trainee de poussiere derriere la boule qui roule
- Particules d'impact boule-boule (etincelles metalliques)
- Shake de camera leger au tir et a l'impact (ATTENTION: pas de camera follow en PetanqueScene)
- Easing sur toutes les animations UI (jamais lineaire)
- Flash/pulse sur le score quand il change
- Slow-motion sur le dernier lancer d'une manche (dramatique)

**Audio :**
- Son de boule metallique a CHAQUE impact (crucial)
- Son de gravier/terre quand la boule roule (varie selon le terrain)
- Jingle court quand on marque des points
- Tons positifs, melodiques, chauds (ambiance provencale)
- Chaque interaction joueur a un feedback audio

**Feedback :**
- Vibration tactile legere sur mobile au lancer et a l'impact
- Indicateur de distance boule-cochonnet en temps reel
- Animation de celebration quand on fait un "carreau" (tir direct)
- Commentaire textuel des PNJ/adversaires ("Beau tir !", "C'est serre...")

### 5.4 Retention web specifique

- **Session courte** : une manche de petanque = 2-5 min (ideal pour le web)
- **Progression visible** : debloquer un perso/boule/terrain a chaque victoire arcade
- **Boucle core satisfaisante** : viser -> lancer -> regarder rouler -> resultat (chaque etape doit etre agreable)
- **Replays rapides** : bouton "Rejouer" immediat apres la defaite
- **Hook social** : "Partager mon score" / URL partageable (Poki SDK le supporte)
- Les joueurs web perdent 80% de leur audience dans les 3 premiers jours -- la premiere session est cruciale

---

## 6. CHECKLIST D'ADAPTATION POUR PETANQUE MASTER

### Pour CrazyGames :
- [ ] Integrer le SDK v2 dans index.html
- [ ] Appeler `gameplayStart()` au debut de chaque manche
- [ ] Appeler `gameplayStop()` a la fin de chaque manche
- [ ] Ajouter midgame ads entre les matchs du mode Arcade
- [ ] Ajouter rewarded ads pour bonus (boule speciale, reessayer)
- [ ] Implementer Data module pour sauvegarde cloud
- [ ] Implementer User module (username/avatar)
- [ ] Verifier physique a 144 Hz / 165 Hz (timestep fixe)
- [ ] Texte lisible a 800x450
- [ ] Localisation anglais
- [ ] CSS anti-selection
- [ ] Prevention scroll
- [ ] Whitelister domaines CrazyGames (sitelock)
- [ ] Supprimer bouton fullscreen custom
- [ ] Supprimer tout lien externe / cross-promo
- [ ] Download initial < 50 MB (< 20 MB pour mobile ideal)

### Pour Poki :
- [ ] Integrer le Poki SDK v2 dans index.html
- [ ] `PokiSDK.init()` au demarrage
- [ ] `PokiSDK.gameLoadingFinished()` apres chargement
- [ ] `gameplayStart()` / `gameplayStop()` a chaque manche
- [ ] `commercialBreak()` entre les matchs (avant gameplayStart)
- [ ] `rewardedBreak()` pour bonus optionnels
- [ ] Adapter resolution a 16:9 (836x470 au lieu de 832x480)
- [ ] Supprimer TOUTES les requetes externes (fonts, CDN, analytics)
- [ ] Supprimer splash screens et logos dev de l'onboarding
- [ ] try/catch sur localStorage (mode incognito)
- [ ] Support mobile/tablette obligatoire
- [ ] Le jeu doit fonctionner avec adblock
- [ ] Taille initiale ~5-8 MB (lazy load le reste)
- [ ] Prevention scroll

### Pour itch.io :
- [ ] Build Vite optimise (npm run build)
- [ ] ZIP du dossier dist/
- [ ] Configurer taille iframe (832x480)
- [ ] GIF/video de gameplay en haut de la page
- [ ] Tags : Sports, Casual, petanque, pixel-art, arcade, competitive, French
- [ ] Description claire avec genre et features
- [ ] Pay-what-you-want ($0 min) pour commencer
- [ ] Screenshots de qualite (4-5 minimum)
- [ ] Devlog regulier pour la visibilite

---

## 7. ARCHITECTURE MULTI-PLATEFORME RECOMMANDEE

Pour supporter les 3 portails sans dupliquer le code :

```javascript
// src/utils/PlatformSDK.js
class PlatformSDK {
    constructor() {
        this.platform = this.detectPlatform();
    }

    detectPlatform() {
        if (window.CrazyGames?.SDK) return 'crazygames';
        if (window.PokiSDK) return 'poki';
        return 'standalone'; // itch.io ou auto-heberge
    }

    async init() {
        if (this.platform === 'poki') {
            await PokiSDK.init();
        }
        // CrazyGames s'auto-initialise
    }

    gameplayStart() {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.game.gameplayStart();
        } else if (this.platform === 'poki') {
            PokiSDK.gameplayStart();
        }
    }

    gameplayStop() {
        if (this.platform === 'crazygames') {
            window.CrazyGames.SDK.game.gameplayStop();
        } else if (this.platform === 'poki') {
            PokiSDK.gameplayStop();
        }
    }

    async showInterstitial() {
        if (this.platform === 'crazygames') {
            return new Promise((resolve) => {
                window.CrazyGames.SDK.ad.requestAd("midgame", {
                    adFinished: resolve,
                    adError: resolve,
                    adStarted: () => this.muteGame(),
                });
            });
        } else if (this.platform === 'poki') {
            return PokiSDK.commercialBreak(() => this.muteGame())
                .then(() => this.unmuteGame());
        }
    }

    async showRewarded() {
        if (this.platform === 'crazygames') {
            return new Promise((resolve) => {
                window.CrazyGames.SDK.ad.requestAd("rewarded", {
                    adFinished: () => resolve(true),
                    adError: () => resolve(false),
                    adStarted: () => this.muteGame(),
                });
            });
        } else if (this.platform === 'poki') {
            return PokiSDK.rewardedBreak({ size: 'medium' });
        }
        return false; // standalone: pas de pub
    }

    muteGame() { /* muter Phaser audio */ }
    unmuteGame() { /* unmuter Phaser audio */ }
}

export default new PlatformSDK();
```

**Builds separees via Vite :**
```javascript
// vite.config.js -- utiliser des variables d'environnement
// VITE_PLATFORM=crazygames -> inclure le script SDK CrazyGames
// VITE_PLATFORM=poki -> inclure le script SDK Poki
// VITE_PLATFORM=standalone -> pas de SDK
```

---

## Sources

- [CrazyGames Documentation](https://docs.crazygames.com/)
- [CrazyGames HTML5 v2 SDK](https://docs.crazygames.com/sdk/html5-v2/intro/)
- [CrazyGames Technical Requirements](https://docs.crazygames.com/requirements/technical/)
- [CrazyGames Gameplay Requirements](https://docs.crazygames.com/requirements/gameplay/)
- [CrazyGames Ad Requirements](https://docs.crazygames.com/requirements/ads/)
- [CrazyGames Developer Portal](https://developer.crazygames.com/)
- [Poki for Developers](https://developers.poki.com/)
- [Poki SDK Documentation](https://sdk.poki.com/)
- [Poki SDK HTML5](https://sdk.poki.com/html5.html)
- [Poki Requirements](https://sdk.poki.com/requirements.html)
- [itch.io HTML5 Upload Guide](https://itch.io/docs/creators/html5)
- [itch.io Getting Indexed](https://itch.io/docs/creators/getting-indexed)
- [itch.io Pricing](https://itch.io/docs/creators/pricing)
- [How I Optimized My Phaser 3 Action Game in 2025](https://phaser.io/news/2025/03/how-i-optimized-my-phaser-3-action-game-in-2025)
- [Phaser 3 Audio Concepts](https://docs.phaser.io/phaser/concepts/audio)
- [Web Audio Best Practices for Phaser 3](https://blog.ourcade.co/posts/2020/phaser-3-web-audio-best-practices-games/)
- [Game Juice Techniques (GameAnalytics)](https://www.gameanalytics.com/blog/squeezing-more-juice-out-of-your-game-design)
- [Making Games Juicy](https://abagames.github.io/joys-of-small-game-development-en/make_game_juicy.html)
- [The $10M Tutorial: Onboarding as Most Profitable Mechanic](https://www.iabdi.com/designblog/2026/1/13/g76gpguel0s6q3c9kfzxwpfegqvm4k)
- [Casual Game Loops (GDevelop)](https://gdevelop.io/blog/casual-game-loops)
- [itch.io Visibility Tips (Medium)](https://medium.com/@alberto.lanata/more-itch-io-visibility-in-one-afternoon-eb4fcfd070c9)
- [itch.io Traffic Benchmarks 2025](https://howtomarketagame.com/2025/05/12/benchmark-itch-io-traffic/)
- [Poki Developer-First Approach (TFN)](https://techfundingnews.com/browser-gaming-website-poki-won-big-at-the-dutch-game-awards-celebrating-hitting-1-billion-monthly-plays/)
- [Navigating Web Gaming Platforms for Indie Devs](https://hology.app/blog/web-gaming-1)
