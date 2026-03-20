# SPRINT FINAL — Plan d'implementation complet
> Derniere mise a jour : 18 mars 2026
> Objectif : Jeu complet, presentable, avec boucle de progression addictive
> Decisions validees par l'utilisateur le 18 mars 2026

---

## VUE D'ENSEMBLE

Le jeu est **jouable et stable**. Ce sprint final ajoute :
1. **Game Feel** : slow-mo, son de roulement continu, pause dramatique
2. **Progression** : Le Rookie + Ecus + deblocages + LevelUpScene
3. **Boutique** : ShopScene avec UI propre
4. **Audio** : sons manquants, ambiance par terrain, reactions foule
5. **UI/UX** : VSIntro Tekken, tutoriel, arcade 5 matchs + boss
6. **Tests visuels** : boules 3D (comparaison), traces d'impact

### Decisions explicites (refusees)
- ❌ Camera follow / pan / mouvements de camera
- ❌ "Ohhh" crowd crescendo
- ❌ Tir devant / Tir a la rafle (techniques supplementaires)

---

## 1. LE ROOKIE — Personnage de depart

### 1.1 Concept
- **Nom** : "Le Rookie" (ou "Le P'tit Nouveau")
- **Titre** : "L'Apprenti du Boulodrome"
- **Archetype** : neutre (ni tireur ni pointeur, adaptable)
- **Stats de depart** : 10/40 points → precision 3, puissance 3, effet 2, sang_froid 2
- **Capacite** : aucune au depart, deblocable a 18/26/34 pts (voir 1.4)
- **Sprite** : a creer via PixelLab (jeune joueur, casquette, look decontracte)

### 1.2 Progression XP
| Source | Points gagnes | Condition |
|--------|---------------|-----------|
| Victoire Arcade | **+4 pts** | Joue avec le Rookie uniquement |
| Victoire Quick Play | **+2 pts** | Joue avec le Rookie uniquement |
| Defaite | 0 pts | Pas de XP si defaite |
| Quick Play avec autre perso | 0 pts | Pas de XP |

- **Repartition libre** : le joueur choisit quelle stat augmenter (+1 par point)
- **Cap par stat** : 10 (identique aux persos normaux)
- **Total max** : 40 points = perso le plus polyvalent possible
- **De 10 → 40** : ~8 victoires arcade (~2 runs) ou ~10 victoires mixtes
- Le Rookie est **persistant** : ses stats sont sauvegardees en localStorage

### 1.3 Ecran de repartition des points
- Apres chaque victoire avec le Rookie : ecran "Amelioration"
- 4 barres de stat avec boutons [+]
- Points disponibles affiches en haut
- Preview des stats avant/apres
- Bouton "Confirmer" pour valider
- **Fichier** : `src/scenes/LevelUpScene.js` (nouvelle scene)

### 1.4 Capacites debloquables du Rookie (3 paliers)
| Palier | Capacite | Type | Description |
|--------|----------|------|-------------|
| 18/40 pts | "L'Instinct" | Actif (1 charge) | Slow-mo 2s pendant la visee (0.4x). Vignette + aura. |
| 26/40 pts | "Determination" | Passif auto | Apres mene perdue, -50% wobble au prochain lancer. |
| 34/40 pts | "Le Naturel" | Actif (1 charge) | Throw quasi-parfait (wobble ~0). Aura doree + son cristallin. |

- Chaque palier : notification "Nouvelle capacite debloquee !" dans LevelUpScene
- Les capacites coexistent (le Rookie a 34 pts a L'Instinct + Determination + Le Naturel)
- Implementation : AimingSystem.js (slowMotionFactor, wobbleMultiplier, flag passif)

### 1.5 Donnees JSON (ajout a characters.json)
```json
{
  "id": "rookie",
  "name": "Le Rookie",
  "title": "L'Apprenti du Boulodrome",
  "catchphrase": "J'apprends vite.",
  "archetype": "adaptable",
  "stats": { "precision": 3, "puissance": 3, "effet": 2, "sang_froid": 2 },
  "isRookie": true,
  "maxStatPoints": 40,
  "abilities_unlock": [
    { "threshold": 18, "ability": { "name": "L'Instinct", "charges": 1, "type": "active", "description": "Slow-mo 2s pendant la visee" } },
    { "threshold": 26, "ability": { "name": "Determination", "charges": 0, "type": "passive", "description": "Apres mene perdue, -50% wobble" } },
    { "threshold": 34, "ability": { "name": "Le Naturel", "charges": 1, "type": "active", "description": "Throw quasi-parfait, wobble ~0" } }
  ],
  "unlocked": true
}
```

---

## 2. SYSTEME DE MONNAIE — Les Ecus

### 2.1 Concept
- **Monnaie** : "Ecus" (piece provencale)
- Gagnes en jouant, depenses dans la boutique
- Pas de microtransactions reelles (monnaie in-game uniquement)

### 2.2 Sources d'Ecus
| Source | Montant | Notes |
|--------|---------|-------|
| Victoire Arcade | 50 Ecus | Par match gagne |
| Victoire Quick Play | 20 Ecus | Avec n'importe quel perso |
| Carreau en match | +10 Ecus (bonus) | Cumule avec victoire |
| Run Arcade complete (5/5) | +100 Ecus (bonus) | En plus des 250 des victoires |
| Run parfaite (5/5 sans defaite) | +200 Ecus (bonus) | Remplace le bonus 100 |
| Premier lancement du jeu | 50 Ecus | Cadeau de bienvenue (1 seule fois par save) |

### 2.3 Boutique
- Accessible depuis le menu principal (bouton "Boutique")
- **UI** : grille de cards avec onglets, suivant research/46
- Categories :

**Boules** (cosmetique + bonus stats)
| Item | Prix | Effet |
|------|------|-------|
| Boule Bronze | 100 Ecus | Puissance +5%, Precision -5% |
| Boule Chrome | 100 Ecus | Precision +5%, Puissance -5% |
| Boule Doree | 300 Ecus | Prestige, +2% toutes stats |
| Boule Noire | 200 Ecus | Intimidation visuelle, neutre |
| Boule Titane | 500 Ecus | +3% precision, +3% puissance |

**Cochonnets** (cosmetique pur)
| Item | Prix |
|------|------|
| Cochonnet Bleu | 50 Ecus |
| Cochonnet Vert | 50 Ecus |
| Cochonnet Dore | 150 Ecus |
| Cochonnet Noir | 100 Ecus |

**Capacites supplementaires** (pour le Rookie)
| Item | Prix | Effet |
|------|------|-------|
| Focus +1 charge | 200 Ecus | 6 charges Focus au lieu de 5 |
| Charge de capacite +1 | 300 Ecus | +1 charge capacite unique |

### 2.4 Fichiers impactes
- `public/data/shop.json` (nouveau) : catalogue boutique
- `src/scenes/ShopScene.js` (nouveau) : scene de boutique
- `src/utils/SaveManager.js` : ajouter `ecus`, `purchases[]`, `rookieStats`
- `src/utils/Constants.js` : ECU_REWARDS config
- `src/scenes/ResultScene.js` : afficher les Ecus gagnes

---

## 3. DEBLOCAGES & ARCADE — "Le Tournoi de La Ciotat"

### 3.1 Arcade : 5 matchs + boss final
L'arcade raconte l'histoire du Rookie qui arrive au boulodrome de La Ciotat et doit gravir les echelons. Chaque adversaire est plus fort, chaque terrain plus technique.

| Round | Adversaire | Terrain | Difficulte | Histoire |
|-------|-----------|---------|------------|----------|
| 1 | La Choupe | Village | Facile | Le bourrin du coin. Il tire fort mais vise mal. Premier test. |
| 2 | Marcel | Parc | Moyen | Le vieux renard. Il pointe bien et connait les zones mixtes. |
| 3 | Le Magicien | Colline | Difficile | Precision diabolique + pente. Chaque boule compte. |
| 4 | Reyes | Docks | Tres difficile | Le Mur. Sur dalles glissantes avec rebonds, il est imprenable. |
| 5 (Boss) | Ley | Plage | Expert | Le tireur legendaire. Sable lourd + carreaux devastateurs. Le boss final. |

**Narratif :**
- **Intro** : Le Rookie debarque au boulodrome de La Ciotat. Cinq joueurs reguliers se retrouvent chaque dimanche. Aujourd'hui, c'est le Tournoi annuel. Pour gagner sa place, il devra tous les battre.
- **Apres R3** : "Plus qu'un match avant la finale... Mais le prochain adversaire joue sur son terrain."
- **Avant R5** : "Ley. Le tireur. Celui que personne n'a battu depuis l'ete dernier. Il vous attend sur la plage."
- **Ending victoire** : "Le Rookie a fait ce que personne n'avait fait : battre les cinq. Le boulodrome a un nouveau champion. A dimanche prochain !"

### 3.2 Deblocages par progression
| Evenement | Deblocage |
|-----------|-----------|
| Victoire Round 1 (Choupe) | Perso La Choupe jouable en Quick Play |
| Victoire Round 2 (Marcel) | Perso Marcel jouable en Quick Play |
| Victoire Round 3 (Magicien) | Perso Le Magicien + terrain Docks en Quick Play |
| Victoire Round 4 (Reyes) | Perso Reyes jouable en Quick Play |
| Victoire Round 5 - Boss (Ley) | Perso Ley + terrain Plage + badge "Champion de La Ciotat" |
| 5 victoires totales | Cochonnet bleu |
| 10 victoires totales | Boule Chrome gratuite |
| 20 victoires totales | Titre "L'Artilleur" |
| 3 carreaux en 1 match | Badge "Le Tireur" |
| 50 victoires totales | Cochonnet Dore + titre "Maitre Bouliste" |

### 3.3 Personnages disponibles par mode
| Personnage | Quick Play | Arcade |
|------------|-----------|--------|
| Le Rookie | Toujours | Toujours (seul perso jouable) |
| La Choupe | Apres victoire R1 | Non (adversaire) |
| Marcel | Apres victoire R2 | Non (adversaire) |
| Le Magicien | Apres victoire R3 | Non (adversaire) |
| Reyes | Apres victoire R4 | Non (adversaire) |
| Ley | Apres victoire R5 (Boss) | Non (adversaire) |

Note : en Quick Play, tous les persos debloqués sont jouables **mais le Rookie est le seul qui gagne de l'XP**.

### 3.4 Terrains disponibles
| Terrain | Quick Play | Arcade |
|---------|-----------|--------|
| Village | Toujours | R1 |
| Parc | Toujours | R2 |
| Colline | Toujours | R3 |
| Docks | Apres victoire R3 | R4 |
| Plage | Apres victoire R5 | R5 |

---

## 4. GAME FEEL — Slow-mo, Son, Pause dramatique

### 4.1 Slow-motion pres du cochonnet
- **Quand** : boule en mouvement, distance < 40px du cochonnet ET vitesse < 2 px/frame
- **Effet** : timeScale passe a 0.3x (physique custom → on multiplie delta par 0.3)
- **Duree** : tant que les conditions sont remplies, puis retour a 1.0x progressif
- **Visuel** : leger vignettage (assombrissement des bords) pendant le slow-mo
- **Fichiers** : `src/petanque/PetanqueEngine.js` (dans update loop)
- **PAS de camera follow/pan** (decision explicite)

### 4.2 Son de roulement continu
- **Principe** : boucle audio continue dont le volume et le pitch changent avec la vitesse de la boule
- **Implementation** : Web Audio API — boucle de bruit rose filtre passe-bas, volume proportionnel a la vitesse, pitch (playbackRate) augmente avec la vitesse
- **Quand** : des qu'une boule roule (vitesse > SPEED_THRESHOLD), s'arrete quand toutes immobiles
- **Fichier** : `src/utils/SoundManager.js` (nouvelles fonctions startRollingSound/updateRollingSound/stopRollingSound)
- **Reference** : les meilleurs jeux de bowling/bocce utilisent un son de roulement continu qui cree la tension

### 4.3 Pause dramatique avant mesure des distances
- **Quand** : toutes les boules immobiles, avant le calcul de score de la mene
- **Duree** : 1.5s de silence (arreter musique temporairement, baisser ambiance)
- **Visuel** : rien de special, juste le silence qui cree la tension
- **Puis** : le score s'affiche avec animation + SFX
- **Fichier** : `src/petanque/PetanqueEngine.js` (dans scoreMene, ajouter delai)

---

## 5. AUDIO — Sons manquants, ambiance, foule

### 5.1 Sons a generer/ameliorer (ElevenLabs MCP ou jsfxr)
| Son | Frequence | Duree | Priorite |
|-----|-----------|-------|----------|
| Clac boule-boule (signature, 2-4kHz) | Metalique sec | 150-300ms | EXISTE (ameliorer si besoin) |
| Toc cochonnet (mat, 800Hz-2kHz) | Bois sur acier | 100-200ms | EXISTE |
| Atterrissage lourd plombee (100-500Hz) | Grave + reverb | 200-400ms | A GENERER |
| Carreau epique (plus resonant) | 2-5kHz | 300-500ms | EXISTE (ameliorer) |
| Whoosh lancer (1-4kHz passe-haut) | Rapide | 100-200ms | EXISTE |
| Roulement continu (bruit rose) | 500-3000Hz | Boucle | A IMPLEMENTER (procedural) |
| Applaudissements foule | Naturel | 3-5s | A GENERER |
| "Ouais !" / exclamation foule | Enthousiaste | 1-2s | A GENERER |
| Groan/soupir (mauvais tir) | Decu | 1-2s | A GENERER |

### 5.2 Ambiance par terrain (uniquement terrains appropries)
| Terrain | Ambiance principale | Volume | Notes |
|---------|-------------------|--------|-------|
| Village | Cigales + brise legere | 15% + 8% | Deja implemente, verifier volumes |
| Plage | Vagues + mouettes | 20% + 5% | Specifique mer |
| Parc | Oiseaux + enfants au loin | 10% + 5% | Nature tranquille |
| Colline | Vent + cigales | 12% + 10% | Altitude, vent plus fort |
| Docks | Industriel + eau | 10% + 8% | Ambiance portuaire |

**Implementation** : dans PetanqueScene.create(), lancer l'ambiance correspondant au terrain au lieu de toujours lancer les cigales.

### 5.3 Reactions foule (audio uniquement)
- **Applaudissements** : apres un bon tir (distance < 25px du cochonnet)
- **"Ouais !"** : sur un carreau
- **Soupir/groan** : sur un tres mauvais tir (distance > 90px)
- **Probabilite** : 60% chance de reaction (pas a chaque tir)
- **Volume** : 30-40% (pas dominant, en arriere-plan)
- **Fichier** : `src/utils/SoundManager.js` (sfxCrowdApplause, sfxCrowdCheer, sfxCrowdGroan)

---

## 6. UI/UX POLISH

### 6.1 VSIntroScene — Style Tekken 7
L'ecran VS actuel est fonctionnel mais manque de punch. Polish :
- **"VS" slam** : Bounce elastic (pas juste Back.easeOut), shake 3px + flash blanc
- **"MATCH !"** : apres le VS, texte "MATCH !" en elastic bounce, delay 800ms, puis transition
- **Catchphrases** : typewriter effect (30ms/char) pour les barks des deux joueurs
- **Timeline totale** : ~2.5s (slides 0.5s + VS 0.3s + pause 0.5s + MATCH 0.5s + transition 0.7s)
- **Fichier** : `src/scenes/VSIntroScene.js`

### 6.2 Onboarding — Onglet Tuto dans le menu principal
Au lieu de l'overlay actuel dans PetanqueScene :
- **Bouton "Tuto"** dans TitleScene (menu principal), accessible a tout moment
- **Contenu** : 4-5 ecrans avec illustrations simples
  1. **Objectif** : Placez vos boules le plus pres du cochonnet
  2. **Comment lancer** : Glissez et relachez (schema direction + force)
  3. **Techniques** : Roulette/Demi-portee/Plombee/Tir (avec schema visuel)
  4. **Score** : Comment les points sont comptes (boules plus proches = points)
  5. **Astuces** : Focus (Respire), Retro, Capacites
- **Navigation** : fleches gauche/droite ou swipe, bouton "J'ai compris" a la fin
- **Drapeau** : une fois vu, ne re-propose plus (localStorage)
- **Supprime** l'overlay tutoriel actuel dans PetanqueScene._checkTutorial()
- **Fichier** : `src/scenes/TutorialScene.js` (nouveau) ou integre dans TitleScene

### 6.3 Shop UI — Patterns research/46
- **Layout** : grille 3x2 de cards (6 items visibles, scroll si plus)
- **Card** : icone boule/cochonnet, nom, prix en Ecus, bouton "ACHETER" ou badge "POSSEDE"
- **Onglets** : Boules | Cochonnets | Capacites (3 tabs en haut)
- **Solde Ecus** : affiche permanent en haut-droite avec icone piece
- **Animation achat** : prix flash, piece qui tombe, item qui brille → "Debloque !"
- **Preview** : au survol d'un item, afficher un apercu agrandi + description
- **Fichier** : `src/scenes/ShopScene.js` (nouveau)

### 6.4 Background provencal & bordures
- **Verifier** que TerrainRenderer utilise bien les textures generees (terrain_tex_*.png)
- **Verifier** que les bordures 9-slice (border_wood_9slice.png, border_stone_9slice.png) sont integrees
- **Verifier** que les decors (pin, olivier, banc, fontaine) sont places

---

## 7. TESTS VISUELS (A/B)

### 7.1 Boules 3D — Comparaison visuelle
- **Generer** dans un dossier `comparison/boules_3d/` :
  - `current_ingame.png` : capture de la boule actuelle (sprite PNG) en jeu
  - `canvas3d_ingame.png` : capture de la boule CanvasTexture (radial gradient) en jeu
  - `current_selection.png` : capture de la boule dans le menu selection
  - `canvas3d_selection.png` : capture de la boule CanvasTexture dans le menu selection
- **Methode** : creer les deux rendus, faire des screenshots, les mettre cote a cote
- **Decision** : l'utilisateur choisit visuellement lequel garder

### 7.2 Traces d'impact
- **Deja code** : `this.impactLayer` existe dans PetanqueScene (RenderTexture, depth 8, alpha 0.5)
- **A faire** : verifier que les impacts sont dessines dessus lors des atterrissages
- **Tester** visuellement : est-ce que ca rend bien ou pas ?

---

## 8. MODIFICATIONS DU SAVEMANAGER

### 8.1 Nouveau schema de sauvegarde (v2)
```javascript
{
  version: 2,
  // Progression Rookie
  rookie: {
    stats: { precision: 3, puissance: 3, effet: 2, sang_froid: 2 },
    totalPoints: 10,
    abilitiesUnlocked: [],   // ["instinct", "determination", "naturel"]
  },
  // Monnaie
  ecus: 50,
  purchases: [],             // ["boule_bronze", "cochonnet_bleu"]
  // Deblocages
  unlockedCharacters: ["rookie"],  // seul le Rookie au depart
  unlockedTerrains: ["village", "parc", "colline"],
  unlockedBoules: ["acier"],
  unlockedCochonnets: ["classique"],
  badges: [],
  titles: [],
  // Stats globales
  totalWins: 0,
  totalLosses: 0,
  totalCarreaux: 0,
  arcadeProgress: 0,        // dernier round gagne (0 a 5)
  arcadePerfect: false,      // 5/5 sans defaite
  // Preferences
  selectedBoule: "acier",
  selectedCochonnet: "classique",
  // Meta
  tutorialSeen: false,
  playtime: 0,
  timestamp: Date.now()
}
```

### 8.2 Migration v1 → v2
- Detecter `version: 1` (ou absence de version) et migrer automatiquement
- Conserver les anciennes donnees et ajouter les nouvelles avec valeurs par defaut
- Fichier : `src/utils/SaveManager.js`

---

## 9. FICHIERS A CREER / MODIFIER

### Nouveaux fichiers
| Fichier | Description |
|---------|-------------|
| `src/scenes/LevelUpScene.js` | Ecran repartition des points du Rookie |
| `src/scenes/ShopScene.js` | Boutique avec onglets et cards |
| `src/scenes/TutorialScene.js` | Tutoriel accessible depuis le menu |
| `public/data/shop.json` | Catalogue boutique avec prix |
| `comparison/boules_3d/` | Dossier comparaison visuelle boules |

### Fichiers a modifier
| Fichier | Modifications |
|---------|---------------|
| `src/utils/SaveManager.js` | Schema v2, migration, ecus, rookie stats |
| `src/utils/Constants.js` | ECU_REWARDS, ROOKIE_*, SLOWMO_*, CROWD_* constantes |
| `src/utils/SoundManager.js` | Rolling sound continu, reactions foule, ambiance terrain |
| `src/petanque/PetanqueEngine.js` | Slow-mo, pause dramatique, hook reactions foule |
| `src/petanque/AimingSystem.js` | Capacites Rookie |
| `src/scenes/PetanqueScene.js` | Ambiance par terrain (pas cigales partout), slow-mo visuel |
| `src/scenes/ArcadeScene.js` | 5 matchs, forcer Rookie, deblocages post-victoire |
| `src/scenes/CharSelectScene.js` | Afficher verrous, Rookie en premier |
| `src/scenes/ResultScene.js` | Afficher Ecus + XP gagnes, transition LevelUpScene |
| `src/scenes/VSIntroScene.js` | Polish Tekken (MATCH!, bounce, typewriter) |
| `src/scenes/TitleScene.js` | Bouton Boutique + Tuto dans le menu |
| `src/config.js` | Enregistrer LevelUpScene, ShopScene, TutorialScene |
| `public/data/characters.json` | Ajouter le Rookie, marquer les autres locked |
| `public/data/arcade.json` | 5 matchs + narratif complet |
| `public/data/terrains.json` | Verifier coherence avec deblocages |

---

## 10. ORDRE D'IMPLEMENTATION

### Phase 1 : Corrections & Fondations (priorite critique)
1. **arcade.json** — 5 matchs + boss Ley + narratif complet
2. **characters.json** — Ajouter Rookie, marquer les 5 autres `unlocked: false`
3. **SaveManager v2** — Nouveau schema + migration v1→v2
4. **Constants.js** — Nouvelles constantes (ECU, ROOKIE, SLOWMO, CROWD)
5. **config.js** — Enregistrer les 3 nouvelles scenes

### Phase 2 : Game Feel (priorite haute, impact maximal)
6. **Slow-mo** pres du cochonnet (PetanqueEngine.js)
7. **Son de roulement continu** dynamique (SoundManager.js + PetanqueEngine.js)
8. **Pause dramatique** avant mesure (PetanqueEngine.js)
9. **Ambiance par terrain** (PetanqueScene.js — remplacer cigales systematiques)
10. **Reactions foule audio** (SoundManager.js + PetanqueScene.js)

### Phase 3 : Progression (priorite haute)
11. **ArcadeScene** — 5 matchs, forcer Rookie, deblocages post-victoire
12. **CharSelectScene** — Verrous, Rookie en premier
13. **LevelUpScene** — Ecran repartition des points
14. **ResultScene** — Afficher Ecus + XP, transition LevelUp
15. **Capacites Rookie** — L'Instinct + Determination + Le Naturel (AimingSystem.js)

### Phase 4 : Boutique & UI (priorite moyenne)
16. **shop.json** — Catalogue avec prix
17. **ShopScene** — Interface boutique complete avec onglets
18. **TitleScene** — Boutons Boutique + Tuto dans le menu
19. **TutorialScene** — 5 ecrans illustres, navigation, drapeau localStorage
20. **VSIntroScene** — Polish Tekken (MATCH!, elastic bounce, typewriter)

### Phase 5 : Tests visuels (priorite moyenne)
21. **Boules 3D** — Generer comparaison dans dossier comparison/
22. **Traces d'impact** — Verifier et tester visuellement
23. **Bordures/textures** — Verifier integration assets existants

### Phase 6 : Audio generation (si ElevenLabs dispo)
24. **Generer** atterrissage lourd plombee
25. **Generer** applaudissements foule
26. **Generer** "Ouais !" exclamation
27. **Generer** soupir/groan

---

## 11. VISION LONG TERME

Le Rookie est **le personnage du joueur pour toujours**. Il evolue :
- Sprint Final : stats customisables + capacites debloquables
- Phase B : skin alternatifs achetables en boutique
- Phase C (online) : le Rookie represente le joueur en multijoueur
- Phase D (aventure) : le Rookie est le heros du mode histoire

Les persos existants (Ley, Magicien, Choupe, Marcel, Reyes) sont les **rivaux/adversaires** en arcade et les **persos fun** en Quick Play. Seul le Rookie progresse.

---

## REFERENCES CROISEES

| Sujet | Fichier de reference |
|-------|---------------------|
| Physique boules | `research/04_petanque_physics.md` + `src/utils/Constants.js` |
| Techniques de lancer | `research/25_techniques_lancer_reference.md` |
| IA adversaire | `research/13_gameplay_petanque_game_design.md` |
| Polish visuel Phaser 3 | `research/14_phaser3_polish_techniques.md` + `research/22_faisabilite_ameliorations_phaser3.md` |
| Plan amelioration scene | `research/20_plan_amelioration_scene_petanque.md` |
| Camera & slow-mo 2D | `research/47_camera_slowmo_2d_sports.md` |
| Audio design | `research/35_audio_design_complet.md` + `research/49_sound_design_impact_sports.md` |
| UI/UX fighting game | `research/34_ui_ux_fighting_game_patterns.md` |
| Onboarding | `research/36_onboarding_tutorial_design.md` |
| Shop UI | `research/46_shop_ui_patterns_indie.md` |
| Retention | `research/38_player_retention_engagement.md` + `research/45_progression_systems_sport_games.md` |
| Sprites workflow | Memoire `feedback_sprite_workflow.md` |
| Distribution | `research/29_plan_lancement_complet.md` |
| Commercial | `research/32_strategie_commerciale_complete.md` |
| Roster personnages | `public/data/characters.json` |
| Stats et regles | `GAME_DESIGN.md` |
| Architecture code | `CLAUDE.md` |
| Ce plan | `SPRINT_FINAL.md` (ce fichier) |
