# Dossier Lancement — Petanque Master

> **Derniere MAJ** : 28 mars 2026 (Session 42)
> **Statut** : Pret pour publication — tous les fichiers techniques OK, ne reste que les assets visuels humains

---

## CE QUE TU DOIS FAIRE (toi, humain)

### Avant le playtest (10 min)

1. **Creer un Google Sheet** pour recevoir les feedbacks automatiquement :
   - Creer un Sheet vierge (https://sheets.new)
   - Extensions → Apps Script
   - Copier le code de `scripts/feedback-sheets-setup.js` dans l'editeur
   - Deployer → Nouveau deploiement → Application Web → Tout le monde
   - Copier l'URL du deploiement

2. **Coller l'URL** dans `src/utils/Constants.js` ligne 495 :
   ```javascript
   export const FEEDBACK_URL = 'https://script.google.com/macros/s/TON_ID/exec';
   ```

3. **Envoyer le lien du jeu a 5-10 testeurs** (amis, famille, Discord indie)

> **Note** : meme sans cette etape, les feedbacks sont stockes en local sur la machine du joueur.
> Pour les recuperer : console F12 → `copy(JSON.stringify(FeedbackWidget.getLocalFeedback(), null, 2))`

### Pour analyser les feedbacks

```bash
# Depuis Google Sheets : Fichier → Telecharger → CSV
npm run feedback -- feedback.csv

# Depuis la console du navigateur (copier/coller le JSON)
npm run feedback -- feedback.json
```

Le script affiche : ratings, devices, commentaires, erreurs, recommandations.

### Avant itch.io (2-3h de travail manuel)

| Tache | Temps | Comment |
|-------|-------|---------|
| **GIF header** (3-5s) | 30 min | ScreenToGif → capturer un carreau slow-mo. 832px large, <3MB, 15 FPS |
| **5 screenshots** | 20 min | F12 dans le navigateur, ou ScreenToGif frame unique |
| **Cover art** (630x500) | 30 min | Montage dans Pixelorama : logo + Rookie + La Choupe + terrain village |
| **Description itch.io** | 15 min | Copier depuis `ITCH_IO.md` section 2, ajuster les 2 premieres lignes |
| **Creer la page itch.io** | 30 min | Suivre `ITCH_IO.md` section 4 (parametres exacts) |
| **Build + ZIP + upload** | 10 min | `npm run build` puis zipper le contenu de `dist/` |

### Ce qui est DEJA fait (par Claude)

| Element | Fichier | Statut |
|---------|---------|--------|
| Pause auto quand l'onglet perd le focus | `PetanqueScene.js` | OK |
| Explication "c'est quoi la petanque" pour nouveaux | `InGameTutorial.js` Phase 0 | OK |
| Widget feedback in-game (3 scenes) | `FeedbackWidget.js` | OK |
| Error handler global + toast visuel | `main.js` | OK |
| Erreurs auto-incluses dans les rapports feedback | `FeedbackWidget._collectContext()` | OK |
| CreditsScene | `CreditsScene.js` | OK |
| Privacy policy | `public/privacy.html` | OK |
| LICENSE | `LICENSE` | OK |
| og:tags | `index.html` | OK |
| Version 1.0.0 | `package.json` | OK |
| SDK portails (CrazyGames + Poki) | `PortalSDK.js` | OK |
| I18n FR + EN | `public/data/lang/` | OK |
| 3089 tests | Vitest | OK |

---

## FICHIERS DE CE DOSSIER

| Fichier | Contenu | Quand le lire |
|---------|---------|---------------|
| [LANCEMENT_ITCH_FINAL.md](LANCEMENT_ITCH_FINAL.md) | **Checklist maitre** — 9 phases de J-7 a J+30 | AVANT de commencer la publication |
| [ITCH_IO.md](ITCH_IO.md) | Fiche itch.io complete (tags, description, parametres, builds) | Quand tu crees la page itch.io |
| [ITCH_IO_quickwins_revenus.md](ITCH_IO_quickwins_revenus.md) | Quick wins monetisation post-lancement | APRES le lancement, quand tu vises CrazyGames |

## REFERENCES AILLEURS DANS LE PROJET

| Fichier | Contenu |
|---------|---------|
| `research/PUBLISHING_GUIDE.md` | Legal complet (auto-entrepreneur, RGPD, PEGI, marque INPI, licences) |
| `research/29_plan_lancement_complet.md` | Roadmap 5 phases : Web → Android → Backend → iOS → Steam |
| `research/32_strategie_commerciale_complete.md` | Analyse marche 2026, revenus par plateforme, modele eco |
| `research/41_analytics_player_data.md` | Framework analytics (events, KPIs, implementation localStorage → Plausible) |
| `research/59_portal_sdk_implementation.md` | Integration SDK CrazyGames/Poki (happyTime, ads, gameplay events) |
| `docs/VISION_V2.md` | Direction post-V1 (village hub, narrative, multijoueur) |
| `docs/PLAN_PHASE4.md` | Exigences qualite publication (Tier 1/2/3) |

---

## METRIQUES CIBLES

### Playtest (5-10 personnes)

| Signal | Bon signe | Alerte |
|--------|-----------|--------|
| Joueur finit le tuto | > 80% | < 50% → tuto confus |
| Joueur finit 1 match Arcade | > 60% | < 30% → onboarding rate |
| "J'ai envie de rejouer" | > 50% | 0% → boucle cassee |
| Bug bloquant signale | 0 | 1+ → fix avant itch.io |

### itch.io (1er mois)

| Metrique | Moyen | Bon | Tres bon |
|----------|-------|-----|----------|
| Vues page | 100-300 | 500-1000 | 2000+ |
| Parties lancees | 30-80 | 150-300 | 500+ |
| Session moyenne | 2-5 min | 5-15 min | 15+ min |
| Commentaires | 0-2 | 5-10 | 15+ |

### Seuils d'alerte

| Metrique | Cible | Si en dessous | Action |
|----------|-------|---------------|--------|
| Conversion vues → plays | > 30% | < 20% | Refaire GIF/description/screenshots |
| Session moyenne | > 5 min | < 3 min | Revoir onboarding |
| D1 retention | > 10% | < 5% | Ajouter Daily Challenge |

---

## CALENDRIER TYPE

```
J-3  Creer Google Form + remplacer FEEDBACK_URL
J-2  GIF + screenshots + cover art
J-1  Creer page itch.io (DRAFT) + build + upload + test
J-0  Playtest prive (5-10 personnes)
J+3  Corriger bugs remontes
J+5  Publier sur itch.io (public)
J+5  Devlog #1 + Reddit r/WebGames + r/indiegames + r/petanque
J+7  Game Jam inscription + r/gamedev Feedback Friday
J+14 Devlog #2 avec metriques reelles
J+21 Bilan — decision CrazyGames ou iterer
```

---

## POST-LANCEMENT : PROCHAINES ETAPES

1. **Si bonnes metriques itch.io** → soumission CrazyGames (voir `ITCH_IO.md` section 5)
2. **Quick wins revenus** → voir `ITCH_IO_quickwins_revenus.md` (rewarded ads, Mode Blitz, Daily Challenge)
3. **Si invite Poki** → adapter Quick Play en sessions < 5 min
4. **V2 long terme** → voir `docs/VISION_V2.md` (village hub)

---

## FEEDBACK IN-GAME : COMMENT CA MARCHE

Le widget feedback (`src/ui/FeedbackWidget.js`) est accessible depuis :
- **Menu Pause** pendant un match (bouton lavande)
- **Parametres** sur l'ecran titre
- **Ecran Resultat** apres chaque match (lien discret en haut a droite)

Chaque feedback collecte automatiquement :
- Rating (bon/ok/mauvais) + commentaire libre
- Scene active, terrain, score, adversaire, mene en cours
- Device (mobile/desktop), resolution, langue
- Progression du joueur (arcade, matchs, playtime)
- 5 dernieres erreurs JS (si il y en a)

Stockage : `localStorage` (`petanque_feedback`, max 50) + webhook POST vers FEEDBACK_URL.

Pour lire les feedbacks stockes en local : `FeedbackWidget.getLocalFeedback()` dans la console.
