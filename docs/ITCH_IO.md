# Petanque Master — Plan de lancement complet

> **Date** : 25 mars 2026
> **Objectif** : Publication itch.io → CrazyGames → Poki
> **Statut** : Pre-launch (98% pret, 3 fichiers bloquants)

---

## 1. ETAT DE PUBLICATION

### Ce qui est PRET

| Element | Statut | Detail |
|---|---|---|
| Moteur petanque | OK | Physique custom 500 LOC, 6 techniques, 5 terrains |
| Gameplay loop | OK | Arcade (5 matchs) + QuickPlay + Shop + Progression |
| Personnages | OK | 12 persos, stats, barks, sprites (11/12 complets) |
| Terrains | OK | 5 terrains avec physique distincte |
| Localisation | OK | FR 95% + EN 95% |
| Audio | OK | 14 SFX, 2 musiques, ambiance, commentateur 55 phrases |
| SDK Portails | OK | CrazyGames + Poki SDK integres via VITE_PLATFORM |
| Tests | OK | 440 tests (344 unit + 96 E2E) |
| CI/CD | OK | GitHub Pages deploy + QA pipeline |
| Build | OK | ~1.6 MB total (424KB jeu + 1237KB Phaser) |
| Mobile | OK | Touch 56px, rotation portrait overlay |

### Ce qui BLOQUE (3h de travail)

| Tache | Fichier | Temps | Bloquant pour |
|---|---|---|---|
| Scene Credits | `src/scenes/CreditsScene.js` | 1h | Tous les portails |
| Privacy Policy | `public/privacy.html` | 30min | CrazyGames, Poki, RGPD |
| Licence | `LICENSE` (racine) | 10min | Standard pro |
| Meta og:tags | `index.html` | 20min | Social sharing |
| Version bump | `package.json` → 1.0.0 | 5min | Coherence |
| Screenshots (5) | Captures manuelles | 30min | Fiche itch.io |
| Cover art 630x500 | Montage pixel art | 30min | Thumbnail itch.io |
| GIF header (3-5s) | Capture d'un carreau slow-mo | 20min | Conversion clics |

---

## 2. FICHE ITCH.IO

### Infos de la page

| Parametre | Valeur |
|---|---|
| **Titre** | Petanque Master |
| **Sous-titre** | Provencal Bocce Ball in Pixel Art |
| **Type** | HTML5 |
| **Genre** | Sports, Strategy, Arcade |
| **Dimensions** | 832 x 480 |
| **Fullscreen** | Oui |
| **Mobile friendly** | Oui |
| **Prix** | Gratuit (PAS de "pay what you want") |
| **Release status** | Released |
| **Communaute** | Commentaires actives |
| **Devlog** | Active |

### Tags (les 8 premiers comptent le plus)

```
petanque, pixel-art, sports, arcade, casual, french, bocce, turn-based,
singleplayer, strategy, cozy, retro, provence
```

Note : "bocce" est essentiel pour la discovery anglophone. "petanque" seul ne veut rien dire pour 80% de l'audience.

### Description courte (sous le titre)

```
The first serious petanque game — with pixel art charm, provencal humor, and satisfying physics.
```

### Description longue (corps de la fiche, EN)

```markdown
# Petanque Master

**A provencal bocce ball game with RPG progression, 12 characters, and custom physics.**

6 realistic throwing techniques (lob, roll, strike...)
12 characters with unique stats & personalities
5 terrains with distinct physics (sand, grass, stone, hills, docks)
Shop with 15+ cosmetic items
RPG-lite progression — your Rookie evolves
Dynamic commentator (55 contextual lines)
Playable in French & English

## How to play
Drag to aim → Choose your loft → Release to throw.
Get closer to the jack than your opponent. First to 13 wins.

## Game modes
- **Arcade**: Face 5 legendary opponents with escalating difficulty.
  Earn Galets, level up your Rookie, unlock characters.
- **Quick Play**: Any opponent, any terrain, any boule. Your sandbox.

## Characters
12 playable characters, each with unique stats
(Precision, Power, Spin, Composure) and a special ability:
Papi Rene the calm veteran, La Choupe the dock enforcer,
Mamie Josette who shakes your aim, Sofia the perfectionist,
Fazzino the spin artist... and more!

## Terrains
- Village: Classic packed earth, baseline physics
- Park: Mixed grass and gravel — watch the zones!
- Hill: Natural slope, compensate your aim
- Beach: Soft sand, balls slow down fast
- Docks: Hard tiles, balls bounce off walls

## Controls
- Mouse/Touch: Drag and release to aim and set power
- 1-6: Select throwing technique
- E/R: Add spin (lateral/retro)
- SPACE: Focus (stabilize aim)
- TAB (hold): View ball distance ranking
- P: Pause

## FIPJP Rules
1v1, 3 balls each. Team furthest from jack replays.
Score = balls closer than opponent's best. First to 13 wins!

Made with Phaser 4 and a deep love for petanque.
```

### Description FR (a ajouter en dessous)

```markdown
---

## Version francaise

Petanque Master est un jeu de petanque pixel art inspire du Midi provencal.
Glissez pour viser, relachez pour lancer. Simple a prendre en main, difficile a maitriser.

12 personnages avec stats et personnalites uniques.
5 terrains avec physique distincte (terre, herbe, sable, pente, dalles).
Mode Arcade avec progression + Quick Play libre.
Boutique cosmetique avec 15+ items.

Developpe avec Phaser 4 et une physique 100% custom.
```

---

## 3. ASSETS DE LANCEMENT

### GIF header (LE PLUS IMPORTANT)

Un GIF de 3-5 secondes montrant :
1. Un lancer en arc
2. La boule qui roule vers le cochonnet
3. Le slow-mo quand elle s'approche
4. Le commentaire qui s'affiche
5. Le score qui s'incremente

**Comment capturer :**
```bash
# Option 1 : ScreenToGif (Windows, gratuit, recommande)
# Option 2 : ShareX (capture GIF)
# Option 3 : OBS → ffmpeg
ffmpeg -i recording.mp4 -vf "fps=15,scale=832:-1" -loop 0 header.gif
```
Taille cible : < 3 MB, 832px de large, 15 FPS.

### Screenshots (5 minimum)

| # | Contenu | Pourquoi |
|---|---|---|
| 1 | Ecran titre avec soleil provencal | Ambiance, premiere impression |
| 2 | Match en cours sur Place du Village | Le gameplay core |
| 3 | Match sur Plage ou Docks | Variete visuelle |
| 4 | Ecran VS Intro (Rookie vs Mamie Josette) | Personnages, charme |
| 5 | Shop avec boules et items | Profondeur, progression |

### Cover art (630x500 minimum)

Montage pixel art : logo + 2-3 personnages + terrain + boules.
C'est la thumbnail qui fait cliquer dans les listings itch.io.

---

## 4. DEPLOIEMENT TECHNIQUE

### Build itch.io (standalone, pas de SDK)

```bash
npm run build
```

Le dossier `dist/` contient le jeu complet.

### Build CrazyGames

```bash
# Windows (PowerShell)
$env:VITE_PLATFORM="crazygames"; npm run build

# Linux/Mac
VITE_PLATFORM=crazygames npm run build
```

### Build Poki

```bash
# Windows (PowerShell)
$env:VITE_PLATFORM="poki"; npm run build

# Linux/Mac
VITE_PLATFORM=poki npm run build
```

### Zipper et upload

```bash
# Zipper le CONTENU de dist/ (pas le dossier)
cd dist && zip -r ../petanque-master-v1.0.0.zip .
```

Windows : selectionner tout dans `dist/`, clic droit → Envoyer vers → Dossier compresse.

### Parametres itch.io a l'upload

1. Creer un projet HTML5 sur itch.io
2. Upload le ZIP
3. Cocher "This file will be played in the browser"
4. Dimensions : 832 x 480
5. Activer "Fullscreen button"
6. Activer "Mobile friendly"

---

## 5. ACCEPTATION PAR PLATEFORME

| Plateforme | Verdict | Criteres bloquants | Actions requises |
|---|---|---|---|
| **itch.io** | Accepte | Aucun bloquant technique | Privacy + credits. Fiche optimisee (GIF, description, tags) |
| **CrazyGames** | Conditionnel | SDK OK, mais exige : privacy, GDPR, qualite visuelle pro, D1 > 15% | Privacy, GDPR banner, polish visuel, soumission Developer Portal (review 5-10j) |
| **Poki** | Conditionnel | SDK OK, mais filtre sur : session < 5min ideale, "instantly fun", volume contenu | Quick Play en avant (5-7 min), onboarding "fun in 10s", privacy. Invitation-only. |

### Notes par plateforme

**itch.io** : Accepte tout ce qui tourne. Zero filtre technique. C'est le terrain de test ideal.

**CrazyGames** : Paie au CPM (revenus pubs partages). Soumission via Developer Portal. Review 5-10 jours. Exige privacy policy, GDPR consent, qualite "professionnelle". Notre SDK est deja integre (ads, happy time, gameplay events).

**Poki** : Le plus selectif. Invitation-only pour nouveaux devs. Deux voies :
1. Performer sur CrazyGames (ils surveillent)
2. Les contacter avec metriques CrazyGames
Session ideale < 5 min (probleme : Arcade fait 30-45 min → pousser Quick Play).

---

## 6. COMMUNICATION & MARKETING

### Devlog #1 — "Why I made a petanque game" (J-3)

Format : court, personnel, avec des GIFs.

1. **Hook** : "Petanque was invented in 1907 because a man with rheumatism couldn't run anymore. His friends let him play standing still. This game is about that spirit."
2. **3 GIFs** : un carreau, un pointage millimetre, une Fanny (13-0)
3. **Le pitch** : "12 characters, 5 terrains, custom physics. No Matter.js. Every ball rolls differently on sand vs stone."
4. **Call to action** : "Launching [DATE]. Follow to get notified."

Objectif : indexation Google + feed itch.io "devlogs recents".

### Reddit (J-1 et Jour J)

| Subreddit | Quand | Format |
|---|---|---|
| r/WebGames (~300k) | Jour J | Lien direct vers itch.io, titre accrocheur |
| r/indiegames (~800k) | Jour J | GIF + "I made a petanque game in pixel art" |
| r/PixelArt (~1.5M) | J-1 | Screenshot terrain + persos, PAS de lien (regles du sub) |
| r/petanque (~15k) | Jour J | "I spent 6 months making the most detailed petanque game ever" |
| r/gamedev (~1.3M) | J+3 | Post-mortem technique (physique custom, pas de Matter.js) |
| r/casualgames | Jour J | Lien + description courte |

**Regle d'or** : NE PAS poster le meme texte partout. Chaque sub a sa culture.

### Twitter/X (J-3 a J+7)

**Thread de lancement (Jour J) :**
```
I just released Petanque Master — a pixel art petanque game
with custom physics, 12 characters, and provencal charm.

It's free. Play it now: [lien]

Thread...
```

Puis 4-5 tweets avec :
- GIF du slow-mo
- GIF d'un carreau
- Screenshot comparatif des 5 terrains
- "This ball physics took me 500 lines of code and zero Matter.js"
- "Every character has their own personality. Mamie Josette judges your throws."

**Hashtags** : `#indiedev #gamedev #pixelart #petanque #webgame #phaser`

**Frequence post-launch** : 1 GIF tous les 2-3 jours pendant 2 semaines.

### Newgrounds

Publier aussi sur Newgrounds — communaute active de joueurs web, bon pour le feedback.

---

## 7. CALENDRIER DE LANCEMENT

### Timing ideal

**Mardi ou mercredi, 14h-16h UTC** (15h-16h CET, 10h-12h EST).
- Mardi/mercredi = meilleurs jours pour posts gaming Reddit/Twitter
- 14h UTC = Europeens encore la + Americains arrivent
- Eviter lundi (noye) et vendredi (personne ne regarde)

### Semaine 1 : itch.io (validation)

```
AUJOURD'HUI — Fichiers bloquants (3h)
[ ] CreditsScene.js + lien depuis Parametres
[ ] public/privacy.html (no cookies, localStorage only)
[ ] LICENSE (racine)
[ ] Version 1.0.0 + meta og:tags dans index.html
[ ] 5 screenshots du jeu
[ ] Cover art 630x500
[ ] GIF header 3-5s (carreau slow-mo)

DEMAIN — Fiche itch.io (2h)
[ ] Creer la page itch.io en DRAFT
[ ] Coller la description EN + FR
[ ] Upload screenshots + cover + GIF
[ ] Configurer parametres (dimensions, fullscreen, mobile, tags)
[ ] Devlog #1 "Why I made a petanque game"

J+2 — Teaser
[ ] Post r/PixelArt (screenshot, pas de lien)

J+3 — JOUR J LANCEMENT
[ ] Build final : npm run build && npm test
[ ] Upload ZIP sur itch.io → Publier
[ ] Verifier desktop + mobile sur la page itch.io
[ ] Post r/WebGames (lien direct)
[ ] Post r/indiegames (GIF + lien)
[ ] Post r/petanque (texte personnel + lien)
[ ] Thread Twitter/X
[ ] Devlog #2 itch.io "It's live!"
[ ] REPONDRE A TOUS LES COMMENTAIRES (6 premieres heures decisives)
```

### Semaine 2-3 : CrazyGames (monetisation)

```
J+7 — Bilan & iteration
[ ] Collecter metriques itch.io (views, plays, taux conversion, ratings)
[ ] Devlog #3 "What players taught me in one week"
[ ] Hotfixes si bugs remontes

J+10 — Soumission CrazyGames
[ ] Build : VITE_PLATFORM=crazygames npm run build
[ ] Zip dist/ + upload Developer Portal
[ ] Review CrazyGames (5-10 jours)

J+14-30 — Quick wins post-feedback
[ ] Mode Blitz (best-of-1 mene, 2 min) — hook Poki           [3-4h]
[ ] Daily Challenge visible sur titre (bandeau + countdown)     [2h]
[ ] Renommer sous-titre EN "Bocce Master" pour discovery        [1h]
[ ] 10 achievements avec notification toast                     [3-4h]
[ ] Partage de score post-match (image + lien)                  [2-3h]
```

### Semaine 4+ : Poki (scale)

```
[ ] Attendre metriques CrazyGames
[ ] Si D1 > 15% : contacter Poki avec les chiffres
[ ] Build : VITE_PLATFORM=poki npm run build
[ ] Poki est invitation-only — se faire remarquer via CrazyGames
```

---

## 8. METRIQUES CIBLES

| Metrique | Objectif | Seuil d'alerte |
|---|---|---|
| Taux conversion fiche (views → plays) | > 30% | < 20% = probleme fiche |
| Session length moyenne | 8-12 min | < 3 min = probleme onboarding |
| D1 retention (CrazyGames) | > 15% | < 10% = probleme hooks |
| D7 retention | > 5% | < 3% = pas de profondeur |
| Rating itch.io | > 4/5 | < 3.5 = bugs ou frustration |

### Si les metriques sont mauvaises

- **Conversion < 20%** : Le probleme est la fiche. Changer le GIF, la description, les screenshots.
- **Session < 3 min** : Le probleme est l'onboarding. Les joueurs ne comprennent pas le jeu assez vite.
- **D1 < 10%** : Le probleme est les hooks. Pas de raison de revenir. Implementer Daily + Achievements.
- **Rating < 3.5** : Le probleme est un bug ou la difficulte. Lire les commentaires.

---

## 9. ESTIMATIONS DE REVENUS

| Scenario | Audience | Revenu estime |
|---|---|---|
| **Plancher** (itch.io niche) | 10-30K plays | ~0 EUR (hobby) |
| **Median** (CrazyGames + communaute) | 100-500K plays | 200-1000 EUR/mois (pubs) |
| **Plafond** (Poki + viralite) | 1-5M plays | 2000-8000 EUR/mois |
| **Reve** (hit wholesome, presse) | 10M+ | Premium possible |

Le scenario median est atteignable. Le plafond necessite soit un coup de presse, soit le multi qui cree du bouche-a-oreille.

---

## 10. QUICK WINS POST-LANCEMENT (classes effort/impact)

| # | Amelioration | Effort | Impact | Ratio |
|---|---|---|---|---|
| 1 | **Mode Blitz** (best-of-1, 2 min) — hook Poki | 3-4h | Enorme | Excellent |
| 2 | **Daily Challenge sur titre** — bandeau anime, countdown | 2h | Tres fort | Excellent |
| 3 | **Sous-titre "Bocce Ball" en EN** + meta tags anglais | 1h | Fort | Excellent |
| 4 | **10 achievements** avec toast notification | 3-4h | Fort | Bon |
| 5 | **Partage de score** — bouton Share post-match | 2-3h | Moyen-fort | Bon |
| 6 | **Onboarding instant** — TitleScene avec boule qui roule + slow-mo | 3h | Fort | Bon |
| 7 | **GDPR consent banner** — obligatoire CrazyGames | 1h | Bloquant | Obligatoire |

---

*Derniere mise a jour : 25 mars 2026 — Session 22*
*Prochaine action : implementer les 3 fichiers bloquants puis lancer sur itch.io*
