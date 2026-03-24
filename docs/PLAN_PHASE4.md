# PLAN PHASE 4 — LA Reference Petanque

> **Vision** : Faire de Petanque Master LE jeu de petanque de reference, avec des heures de contenu solo,
> un multi solide, et une rejouabilite qui ramene les joueurs chaque jour.
> **Prerequis** : PLAN_PHASE3 ✅ (273 tests, 6 axes completes)
> **Organisation** : 3 tiers par urgence, 15 axes (G-U), executables par Sonnet 4.6

---

## CONSTAT POST-AUDIT

L'arcade actuel est **narrativement excellent mais fondamentalement superficiel** :
- 2h de contenu puis plus rien
- Rookie force (12 personnages inutilises en arcade)
- Zero rejouabilite apres la 1ere completion
- Pas de multi, pas de defis quotidiens, pas de mode competitif

**Ce plan transforme un proto en jeu complet.**

---

# TIER 1 — PUBLICATION QUALITY (Bloquant)

> Sans ca, le jeu n'est pas publiable sur CrazyGames/Poki.

## AXE G — SPRITES & ANIMATIONS MANQUANTS (~4h)

### G1. Throw animations : papi_rene, fazzino, rizzi
- `src/utils/Constants.js` : CHAR_THROW_MAP — 3 entrees manquantes
- Generer via `/sprite` ou creer 2-frame manuellement (bras leve → bras etendu)
- Charger dans `src/scenes/BootScene.js`

### G2. Greeting animations : 3 manquantes
- Identifier dans BootScene section greeting anims
- Meme approche : 2-frame ou PixelLab

### G3. Marcel sprite a regenerer
- Qualite insuffisante (documente dans memoire)
- Regenerer avec memes parametres que le reste du roster

### G4. Portraits 128x128 (optionnel)
- 12 portraits dedies pour CharSelect, boutique, VS screen
- Impact visuel fort pour peu d'effort

---

## AXE H — TUTORIEL MIS A JOUR (~3h)

### H1. Phase 4 : Modes de tir (apres 3e mene)
- "6 techniques disponibles ! Pointer ou Tirer, a toi de choisir."
- Auto-ferme quand joueur selectionne un nouveau mode

### H2. Phase 5 : Effets (apres 5e mene si jamais utilise)
- "[E] = spin lateral, [R] = retro. Plus ton Effet est eleve, plus c'est fort."

### H3. Hints contextuels one-shot
- Premier tir au fer : "Essaie la Rafle [4] !"
- Premier match Plage : "Le sable ralentit. La Plombee est ideale."
- Premier match Docks : "Les murs rebondissent !"

---

## AXE I — LOCALISATION ANGLAIS ✅ COMPLET (UI + data + shop tabs + conformite CLAUDE.md)

### I1. Systeme i18n ✅
- `src/utils/I18n.js` : singleton 68 lignes, `t()` / `ta()` / `detect()` / `setLocale()`, fallback FR

### I2. Extraction textes FR → public/data/lang/fr.json ✅ (UI uniquement)
- BootScene (tips, loading), TitleScene (menus, slots, settings), InGameTutorial (4 phases),
  EngineRenderer (aim hint), ScorePanel (score/mene/labels), terrain hints

### I3. Traduction EN → public/data/lang/en.json ✅ (UI uniquement)
- Jack/End/Iron Shot/Rolling/Half-Lob/Lob/Skim Shot/Front Shot/Composure
- Galets et Carreau conservés (couleur locale)

### I4. Detection langue + toggle ✅
- `detect()` : SaveManager.loadSave().lang → navigator.language → 'en' (session 13 : migré de localStorage vers SaveManager)
- Toggle `[FR|en]` dans TitleScene (bas-droite), restart scène sans rechargement page

### I5. Sprint F — JSON data ✅ (session 12)
- [x] characters.json : noms abilities, descriptions, barks _en (12 persos)
- [x] arcade.json : textes narratifs intro/ending _en
- [x] shop.json : noms et descriptions items _en
- [x] commentator.json : phrases commentateur _en

### I6. Conformite CLAUDE.md + shop tabs ✅ (session 13)
- [x] I18n.js : supprime console.warn, remplace localStorage par SaveManager
- [x] SaveManager : champ lang:'fr' dans defaultSaveData
- [x] ShopScene : tabs localises (shop.tab_balls/tab_jacks/tab_abilities), controls hint i18n
- [x] fr.json/en.json : +4 cles shop

---

## AXE J — ACCESSIBILITE BASIQUE (~3h)

### J1. Mode daltonien
- 3 palettes alternatives + marqueurs forme sur boules (cercle/losange)

### J2. Options accessibilite
- Toggle screen shake, slow-mo
- Taille texte (Normal/Grand/Tres Grand)
- Persister dans SaveManager

### J3. Audio unlock mobile
- AudioContext.resume() au premier input

---

## AXE K — EQUILIBRAGE & ARCADE ENRICHI (~5h)

> L'arcade actuel = 5 matchs fixes avec Rookie force. On le transforme.

### K1. Selection de personnage en Arcade
- **Apres la 1ere completion**, debloquer la selection de personnage en Arcade
- Chaque personnage = run differente (Ley arcade ≠ Rookie arcade)
- Impact immediat : 12x rejouabilite

### K2. Choix de difficulte
- Facile / Normal / Difficile (scale les stats adverses de -2 / 0 / +2)
- Visible sur l'ecran Arcade

### K3. Mode Difficile (debloque apres perfect run)
- Memes 5 adversaires mais +3 stats, ordre aleatoire, terrains aleatoires
- Recompense : titre "Champion des Champions" + 500 Galets

### K4. Stats Rookie sur l'ecran hub
- Afficher portrait + stats + abilities sur l'ecran de progression Arcade
- Le joueur voit son evolution

### K5. Audit balance matchups
- Verifier que Round 1 = 80% winrate, Round 5 = 20%
- Ajuster si necessaire dans characters.json
- Produire research/61_character_balance_audit.md

---

## AXE L — POLISH VISUEL (~4h)

### L1. Transitions fade entre scenes
- fadeOut(300) avant chaque scene.start(), fadeIn(300) dans create()

### L2. Score bounce + confettis victoire
- ScorePanel : tween scale 1.3x quand score change
- ResultScene : 40 particules palette provencale si victoire

### L3. Loading bar (BootScene)
- this.load.on('progress', value => { barre + pourcentage })

### L4. Charges d'abilities visibles en match
- HUD coin : "[Instinct: 1/1]" avec keybind

---

## AXE N — LEGAL & CREDITS (~2h)

### N1. Scene Credits (developpeur, outils, licences, inspirations)
### N2. public/privacy.html (localStorage, pas de cookies, pas de tracking)
### N3. LICENSE a la racine

---

# TIER 2 — MULTIJOUEUR & REJOUABILITE (Gros impact)

> Transforme un jeu solo en experience sociale.

## AXE O — MULTIJOUEUR LOCAL 1v1 (~6h)

### O1. Mode Versus Local (hot-seat)
- QuickPlayScene : ajouter option "VS Local" (2 joueurs alternent)
- Tour par tour : "Joueur 1, a toi !" → cache l'ecran → "Joueur 2, a toi !"
- Score et mene sur ecran partage

### O2. Selection personnage pour les 2 joueurs
- Chaque joueur choisit son personnage + boule + cochonnet

### O3. Stats head-to-head
- SaveManager : tracker les matchs locaux (victoires par joueur)
- Afficher historique dans PlayerScene

---

## AXE P — DOUBLETTE 2v2 AVEC STRATEGIE (~8h)

> Le joueur choisit si son partenaire doit pointer ou tirer. Couche strategique unique.

### P1. Support format doublette dans PetanqueEngine
- Fix : ajouter 'doublette' dans ballsPerPlayer (3 boules/joueur, 6 total/equipe)
- Nouveau state STRATEGY_DECISION dans la FSM

### P2. UI decision strategique
- Popup avant chaque tour du partenaire : "Marcel : Pointer ou Tirer ?"
- Boutons larges, auto-close 5s, son de confirmation
- Afficher contexte (score, boules restantes, distance cochonnet)

### P3. AI role override
- PetanqueAI accepte roleOverride ('pointer'|'tirer')
- Force la strategie du partenaire selon le choix du joueur

### P4. Selection equipe
- QuickPlayScene : choisir son partenaire + 2 adversaires
- Synergie : tireur + pointeur = equipe equilibree

**Ref technique** : research/62_doublette_strategy_system.md (a creer)

---

## AXE Q — DEFIS QUOTIDIENS & ASYNC (~5h)

### Q1. Defis quotidiens (seed date)
- SaveManager.getDailyState() existe deja
- generateDailyChallenge(seed) → { character, terrain, constraint }
- Bouton "Defi du jour" dans TitleScene (visible apres 1er arcade win)
- Recompense : 75 Galets, non-rejouable

### Q2. Challenge async entre amis
- Apres un match : bouton "Defier un ami"
- Generer URL avec config match compressée (LZString + btoa)
- L'ami charge l'URL, joue la meme config, compare les scores
- Zero backend, 100% client-side

### Q3. Boss Rush
- Debloque apres arcade complete
- 5 adversaires difficulte max, pas de LevelUp entre
- Recompense : titre + 500 Galets

---

## AXE R — SYSTEME D'ACHIEVEMENTS (~4h)

### R1. 30 achievements en 5 categories
- **Histoire** : "Chapitre 1", "Champion du Carreau d'Or"
- **Technique** : "Sniper" (<1cm), "Carreau Master" (3+/match), "Ciseau !"
- **Collection** : "Tous les personnages", "Tous les terrains"
- **Streaks** : "5 victoires", "Mardi imbattable"
- **Cache** : "Battre le Rookie avec le Rookie"

### R2. SaveManager + toasts
- achievementsUnlocked: { sniper: true, ... }
- Toast notification visuel sur unlock

### R3. Scene Achievements (grille de badges)
- Accessible depuis TitleScene ou PlayerScene

---

# TIER 3 — AMBITION (Differenciateurs)

> Ce qui fait passer le jeu de "bon" a "reference".

## AXE S — REPLAYS & PARTAGE (~6h)

### S1. Enregistrement
- Pendant PetanqueScene : logger chaque throw (angle, power, loft, boule, result)
- Structure legere (JSON ~2KB par match)

### S2. Lecteur de replay
- Scene ReplayScene : auto-simule le match avec le moteur physique
- Slow-mo sur les meilleurs coups

### S3. Partage URL
- Compresser replay → LZString → URL partageable
- "Regarde ce carreau !" → viral sur les reseaux

---

## AXE T — MODE ROGUELITE "GAUNTLET" (~8h)

### T1. Structure
- 7 adversaires aleatoires, difficulte escalade
- Entre chaque match : choisir 1 bonus parmi 3
  - "+1 Precision pour le run"
  - "Debloquer la Rafle"
  - "Objet maudit : +2 Puissance, -2 Sang-froid"
- 1 vie : perd = run termine

### T2. Meta-progression
- Debloquer des items permanents (cosmetiques, titres) selon distance parcourue
- Leaderboard local : "Meilleur run avec Rookie : 5 victoires"

### T3. Chaos modifiers (optionnel)
- Chaque match a un modifier aleatoire : "vent", "nuit", "boules geantes"

---

## AXE U — METEO & MODES FUN (~4h)

### U1. Systeme meteo
- Constants.js : WEATHER_MODIFIERS (vent = force laterale, pluie = friction+, chaleur = friction-)
- Activer aleatoirement dans les defis quotidiens
- VFX : particules vent/pluie

### U2. Mode Party (QuickPlay option)
- Boules speciales : Explosive (COR+0.3), Magnetique, Rebondissante
- Desactive les leaderboards (mode fun uniquement)

---

# ORDRE D'EXECUTION

```
DEMAIN — Tier 1 (publication quality) :
  Session 1 (Sonnet) : G (sprites) + H (tutorial)
  Session 2 (Sonnet) : I (i18n) — gros morceau
  Session 3 (Sonnet) : K (equilibrage + arcade enrichi)
  Session 4 (Sonnet) : L (polish) + J (accessibilite) + N (legal)

SEMAINE 2 — Tier 2 (multi + rejouabilite) :
  Session 5 (Sonnet) : O (local 1v1)
  Session 6 (Sonnet) : P (doublette 2v2 strategie)
  Session 7 (Sonnet) : Q (defis + async + boss rush) + R (achievements)

SEMAINE 3 — Tier 3 (ambition) :
  Session 8 (Sonnet) : S (replays)
  Session 9 (Sonnet) : T (roguelite gauntlet)
  Session 10 (Sonnet) : U (meteo + party mode)
```

**Parallelisable** :
- G + H (sprites + tutorial : fichiers differents)
- L + J + N (polish + accessibilite + legal : fichiers differents)
- Q + R (defis + achievements : fichiers differents)

---

# METRIQUES DE SUCCES

| Metrique | Avant Phase 4 | Apres Tier 1 | Apres Tier 2 | Apres Tier 3 |
|----------|--------------|-------------|-------------|-------------|
| Contenu solo | ~2h | ~5h | ~10h | ~20h+ |
| Modes de jeu | 2 (Arcade, QuickPlay) | 4 (+Hard, +Daily) | 7 (+Local, +2v2, +Boss, +Async) | 10 (+Gauntlet, +Party, +Challenges) |
| Personnages jouables arcade | 1 (Rookie) | 12 | 12 | 12 |
| Rejouabilite quotidienne | 0 | 1 (daily) | 3 (daily + async + boss) | 5+ |
| Langues | FR | FR + EN | FR + EN | FR + EN |
| Tests | 273 | ~310 | ~350 | ~400 |

---

*Plan cree le 24 mars 2026 par Claude Opus 4.6.*
*Basé sur audit complet : arcade, controles, transitions, research, brainstorm.*
*References : Windjammers 2, Golf Story, Slay the Spire, Rocket League.*
