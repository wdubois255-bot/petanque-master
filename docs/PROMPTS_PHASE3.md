# Prompts Sonnet 4.6 — Phase 3

> Copier-coller chaque prompt dans une session Sonnet 4.6 separee.
> Chaque axe est autonome (~3-4h).
> Toujours dans le meme dossier projet.

---

## PROMPT AXE A — Techniques de tir & ciblage

```
Tu es le developpeur principal de Petanque Master. Lis CLAUDE.md (regles, interdictions) puis docs/PLAN_PHASE3.md (AXE A uniquement).

=== CONTEXTE ===
Le jeu n'a qu'un seul type de tir (tir au fer). On ajoute le tir a la rafle, on expose le tir devant (deja en Constants.js), le ciblage cochonnet, ET le spin lateral (stat Effet enfin utile).

=== ETAPES ===

1. Lis ces fichiers dans l'ordre :
   - CLAUDE.md
   - docs/PLAN_PHASE3.md (section AXE A, taches A1-A5)
   - src/utils/Constants.js (section LOFT_PRESETS)
   - src/petanque/AimingSystem.js (methodes _buildModeSelector, _onModeSelect)
   - src/petanque/PetanqueEngine.js (methode throwBall)
   - src/petanque/Ball.js (physique, retro)
   - src/petanque/PetanqueAI.js (utilisation effet)
   - research/30_techniques_petanque_exhaustif.md (section tirs + effets)
   - tests/Gameplay.test.js + tests/PetanqueEngine.test.js

2. Implemente dans cet ordre :
   a. Constants.js : ajouter LOFT_PRESETS.RAFLE (landingFactor: 0.20, arcHeight: -5, flyDurationMult: 0.3, rollEfficiency: 0.85, retro: false)
   b. Constants.js : ajouter LATERAL_SPIN_FORCE (0.08) et LATERAL_SPIN_FRAMES (25)
   c. AimingSystem.js : reorganiser _buildModeSelector en 2 rangees (Pointer: Roulette/Demi/Plombee, Tirer: Rafle/Fer/Devant)
   d. AimingSystem.js : ajouter toggle [B] pour ciblage cochonnet (meme pattern que toggle [R] retro)
   e. AimingSystem.js : ajouter toggle [E] pour spin lateral (off → gauche → droit → off, indicateur fleche)
   f. Ball.js : implementer spin lateral post-atterrissage (force perpendiculaire, proportionnelle a effetStat/10, decroit sur LATERAL_SPIN_FRAMES)
   g. PetanqueEngine.js : dans throwBall(), si targetCochonnet flag, orienter vers this.cochonnet
   h. PetanqueAI.js : l'IA utilise la rafle (terrain friction < 1.5) + spin lateral si effet >= 6

3. Tests :
   - Gameplay.test.js : ajouter 10 tests (rafle landing/roll, tir devant landing, 6 presets valides, spin lateral gauche/droit, intensite proportionnelle, spin off = 0)
   - PetanqueEngine.test.js : ajouter 3 tests (computeThrowParams avec rafle, avec targetCochonnet, validation 6 presets)

4. Verifie : `npx vitest run` (tous les tests passent), `npm run build` (pas d'erreur)

5. Commit : "feat(gameplay): AXE A — rafle, tir devant, ciblage cochonnet, spin lateral (#phase3)"

=== REGLES ===
- Pas de Matter.js, pas de TypeScript, pas de console.log
- Toutes les valeurs dans Constants.js
- Ne casse rien de l'existant (tir au fer, roulette, demi, plombee, retro)
- Teste dans le navigateur (npm run dev) que les 6 modes + toggle E sont fonctionnels
- Le spin lateral doit etre SUBTIL (pas de virages a 90 degres)
- Lire research/55_spin_lateral_mechanics.md pour les specs detaillees du spin
- Lire research/58_keybindings_reference.md pour la carte des touches
```

---

## PROMPT AXE B — Feedback & resultats de tir

```
Tu es le developpeur principal de Petanque Master. Lis CLAUDE.md puis docs/PLAN_PHASE3.md (AXE B uniquement).

=== CONTEXTE ===
Seul le carreau est detecte et celebre. On ajoute la detection de 7 autres resultats de tir + affichage texte flottant + SFX + barks.

=== ETAPES ===

1. Lis ces fichiers dans l'ordre :
   - CLAUDE.md
   - docs/PLAN_PHASE3.md (section AXE B)
   - src/petanque/PetanqueEngine.js (methode _detectShotResult, ~ligne 1171+)
   - src/petanque/EngineRenderer.js (methode showShotLabel)
   - src/utils/SoundManager.js (methodes sfx existantes)
   - src/utils/Constants.js
   - public/data/characters.json (section barks)
   - research/04c_physique_audit_specifications.md (sections recul, palet)

2. Implemente dans cet ordre :
   a. Constants.js : ajouter SHOT_RESULT_STYLES (texte, couleur, taille, duree pour chaque resultat)
   b. PetanqueEngine.js _detectShotResult() : corriger/completer la detection de chaque resultat :
      - Palet : mesurer distance au point d'impact original (PAS au cochonnet)
      - Casquette : deplacement cible < 8px apres collision
      - Ciseau : compteur de collisions dans le meme throw >= 2
      - Biberon : collision cochonnet quand mode = pointer
      - Contre : team cible = team tireur
      - Trou : aucune collision pendant le throw
      - Recul : dot product direction post-impact < 0 (au lieu de band 0.8-5)
   c. EngineRenderer.js showShotLabel() : utiliser SHOT_RESULT_STYLES pour couleur/taille/duree
   d. SoundManager.js : ajouter sfxPalet(), sfxCasquette(), sfxCiseau(), sfxBiberon(), sfxContre(), sfxTrou()
      Tous en procedural (Web Audio API), meme pattern que sfxCarreau()
   e. characters.json : ajouter barks carreau_victim, palet_success, contre_self, fanny_win, fanny_lose
      pour les 12 personnages (2-3 phrases chacun)

3. Tests :
   - Nouveau tests/ShotResults.test.js : 1 test par resultat (8 tests minimum)
   - TerrainValidation.test.js : verifier que chaque personnage a les nouveaux barks

4. Verifie : `npx vitest run`, `npm run build`

5. Commit : "feat(feedback): AXE B — 8 resultats de tir detectes + SFX + barks (#phase3)"

=== REGLES ===
- Ne modifie PAS la detection carreau existante (elle fonctionne)
- Pas de noir pur #000 dans les couleurs de texte — utiliser la palette provencale
- SFX proceduraux UNIQUEMENT (pas de fichiers audio a charger)
- Tester visuellement dans le navigateur que les labels apparaissent
- Lire research/56_shot_result_detection_thresholds.md pour les seuils EXACTS
- Lire research/60_audio_recipes_phase3.md pour les recettes SFX proceduraux
```

---

## PROMPT AXE C — Nettoyage & robustesse

```
Tu es le developpeur principal de Petanque Master. Lis CLAUDE.md puis docs/PLAN_PHASE3.md (AXE C uniquement).

=== CONTEXTE ===
Nettoyage : dead code, memory leaks, duplication, hardcoded values, rollEfficiency hack. Pas de nouvelles features, juste de la stabilite.

=== ETAPES ===

1. Lis ces fichiers dans l'ordre :
   - CLAUDE.md
   - docs/PLAN_PHASE3.md (section AXE C, taches C1-C8)
   - src/scenes/IntroScene.js (dead code)
   - src/scenes/TitleScene.js (~ligne 208, setTimeout)
   - src/petanque/AimingSystem.js (keyboard listeners)
   - src/utils/SaveManager.js (champs dupliques)
   - src/utils/Constants.js (LOFT_PRESETS.TIR rollEfficiency 16.0)
   - src/petanque/PetanqueEngine.js (computeThrowParams)
   - public/data/boules.json (~ligne 188)
   - src/petanque/EngineRenderer.js (pas de pooling)
   - src/config.js (liste des scenes)

2. Implemente dans cet ordre :
   a. Supprimer IntroScene.js + retirer de config.js + retirer references dans TitleScene.js
   b. TitleScene.js : remplacer setTimeout par this.time.delayedCall
   c. AimingSystem.js : creer _removeAllKeyListeners(), appeler dans _onTurnChange() avant d'ajouter les nouveaux
   d. QuickPlayScene.js : ajouter _shutdown() avec input.keyboard.removeAllListeners() + handler ESC
   e. LevelUpScene.js : ESC → this.returnScene au lieu de 'TitleScene' hardcode
   f. ResultScene.js : ajouter timeout 10s securite pour _postDialogDone
   g. SaveManager.js : supprimer totalWins/totalLosses/totalCarreaux du root, migrer vers stats.*, grep et corriger toutes les references
   h. Constants.js LOFT_PRESETS.TIR : remplacer rollEfficiency 16.0 par rollEfficiency 0.3 + flyOnly: true
      PetanqueEngine.js computeThrowParams() : si loft.flyOnly, la balle ne roule presque pas (utiliser rollEfficiency faible, PAS le hack 16.0)
      Ball.js : adapter si necessaire (le hack 16.0 n'est plus la)
   i. boules.json : supprimer l'objet cochonnet orphelin (~ligne 188)
   j. EngineRenderer.js : implementer pool simple pour Graphics (voir plan pour le code)
   k. Constants.js : ajouter les constantes extraites (TYPEWRITER_SPEED si absent, DIFFICULTY_COLORS, STAT_BAR_WIDTH, SHOP_CARD_WIDTH)
   l. Scenes : remplacer les valeurs hardcodees par les nouvelles constantes

3. Tests :
   - Verifier que tous les tests existants passent toujours
   - SceneReuse.test.js : retirer IntroScene des checks
   - SaveManager.test.js : ajouter test migration root→stats

4. Verifie : `npx vitest run`, `npm run build`

5. Commit : "fix(cleanup): AXE C — dead code, leaks, controls, duplication, hardcoded values (#phase3)"

=== REGLES ===
- NE CASSE RIEN. Chaque changement doit etre verifie individuellement.
- Grep le codebase entier avant de supprimer quoi que ce soit
- Le pooling doit etre simple (pas d'over-engineering)
- Pas de console.log
- Lire research/57_scene_flow_map.md et research/58_keybindings_reference.md pour les specs de controles/transitions
```

---

## PROMPT AXE D — Tests critiques

```
Tu es le developpeur principal de Petanque Master. Lis CLAUDE.md puis docs/PLAN_PHASE3.md (AXE D uniquement).

=== CONTEXTE ===
218 tests passent mais des pans critiques ne sont pas testes : slopes, wall bounces, match flow, AimingSystem, scene reuse fonctionnel, collision edge cases.

=== ETAPES ===

1. Lis ces fichiers dans l'ordre :
   - CLAUDE.md
   - docs/PLAN_PHASE3.md (section AXE D)
   - tests/*.test.js (toutes les suites existantes)
   - src/petanque/Ball.js (slopes, walls, collisions)
   - src/petanque/PetanqueEngine.js (match flow, scoring)
   - src/petanque/AimingSystem.js (wobble, pression)
   - public/data/terrains.json (colline slope_zones, docks walls)

2. Implemente dans cet ordre :
   a. tests/Gameplay.test.js : ajouter suite "Slope Physics" (5 tests)
      - Balle accelere en descente
      - Balle ralentit en montee
      - Timeout 120 frames arrete balle sur pente
      - 3 gravity_components differents de colline
      - Transition zone slope → zone plate

   b. tests/Gameplay.test.js : ajouter suite "Wall Rebounds" (4 tests)
      - Rebond mur droit (vx inverse)
      - Rebond mur gauche
      - WALL_RESTITUTION applique
      - Balle morte ne rebondit pas

   c. Nouveau tests/MatchFlow.test.js (6 tests)
      - Placer cochonnet dans les bornes
      - Lancer 1 boule joueur, verifier position
      - Lancer 1 boule IA, verifier position
      - Scoring : plus proche = 1 point
      - Fin de mene quand 6 boules lancees (3+3)
      - Score accumule sur 2 menes

   d. Nouveau tests/AimingSystem.test.js (4 tests)
      - Wobble amplitude proportionnelle a precision
      - Wobble reduit a 0 avec Focus
      - Pression wobble a score >= 10
      - sang_froid reduit pression

   e. tests/SceneReuse.test.js : rendre fonctionnel (4 tests)
      - Importer PetanqueScene, verifier init() reset _gamePaused
      - Importer QuickPlayScene, verifier init() reset _activeTab
      - Importer ShopScene, verifier init() reset _purchasing
      - Verifier que IntroScene n'est plus dans config

   f. tests/Ball.test.js : ajouter edge cases (4 tests)
      - Triple collision (3 boules)
      - Collision boule morte = ignoree
      - Collision a MAX_THROW_SPEED
      - Collision pres du bord

3. Verifie : `npx vitest run` — TOUT doit passer (ancien + nouveau)

4. Commit : "test(coverage): AXE D — slopes, walls, match flow, aiming, scene reuse (#phase3)"

=== REGLES ===
- Tests UNITAIRES uniquement (pas d'integration E2E ici)
- Utiliser les patterns existants des tests (import Ball, import Constants, etc.)
- Pas de mock Phaser scene — utiliser null ou objet minimal comme dans Ball.test.js
- Chaque test doit avoir un nom descriptif en anglais
```

---

## PROMPT AXE E — Audio enrichi

```
Tu es le developpeur principal de Petanque Master. Lis CLAUDE.md puis docs/PLAN_PHASE3.md (AXE E uniquement).

=== CONTEXTE ===
14 SFX seulement, pas de son par resultat, commentateur = coquille vide, ambiance basique.

=== ETAPES ===

1. Lis ces fichiers dans l'ordre :
   - CLAUDE.md
   - docs/PLAN_PHASE3.md (section AXE E)
   - src/utils/SoundManager.js (architecture existante)
   - src/petanque/EngineRenderer.js (appels SFX)
   - src/petanque/PetanqueEngine.js (events)
   - public/data/terrains.json (ambiance field)

2. Implemente dans cet ordre :
   a. SoundManager.js : ajouter ambiances par terrain (Web Audio oscillators + noise)
      - Village : bruit blanc filtre passe-bas (cigales) + sine wave lent (vent)
      - Plage : bruit blanc pulse (vagues) + sine wave aigu (mouettes)
      - Parc : harmoniques oiseaux + bruit distant
      - Colline : bruit blanc filtre (vent) + triangle wave lent (cloches)
      - Docks : bruit brun (eau) + craquements metalliques (random bursts)
      Methodes : startAmbiance(terrainId), stopAmbiance() avec fade 500ms

   b. SoundManager.js : ajouter crowd reactions enrichies
      - sfxCrowdGasp() : bruit blanc court + enveloppe rapide (casquette)
      - sfxCrowdBoo() : sine graves + bruit (contre)
      - sfxCrowdCheer() : bruit blanc + harmoniques (carreau/ciseau)
      - sfxCrowdOoh() : sine montant + decroissant (biberon)

   c. Nouveau public/data/commentator.json :
      30-50 phrases par categorie :
      - mene_start: ["Premier lancer !", "C'est parti !"]
      - close_call: ["C'est serre !", "Quel suspense !"]
      - carreau: ["Magnifique carreau !", "Quel tir !"]
      - pressure: ["La pression monte !", "10 partout, tout se joue !"]
      - match_point: ["Balle de match !", "Un point de la victoire !"]
      - fanny: ["La fanny ! Quelle humiliation !"]

   d. EngineRenderer.js ou nouveau src/ui/Commentator.js :
      Afficher phrase commentateur en haut de l'ecran (texte gold, fond semi-transparent, 3s fade)
      Hooks : onMeneStart, onShotResult('carreau'), onScoreChange(10-10), onMatchPoint

   e. PetanqueScene.js : appeler startAmbiance() dans create(), stopAmbiance() dans shutdown()

3. Tests : pas de tests unitaires audio (Web Audio = runtime). Tester manuellement.

4. Verifie : `npm run build` (pas d'import casse)

5. Commit : "feat(audio): AXE E — ambiances terrain, crowd reactions, commentateur (#phase3)"

=== REGLES ===
- TOUT en procedural Web Audio API (pas de fichiers audio a charger)
- Volume respecte les settings SaveManager (masterVolume * sfxVolume)
- Pas de console.log
- Commentateur = texte seulement (pas de voice synthesis)
- Fade in/out sur changement de scene
- Lire research/60_audio_recipes_phase3.md pour les recettes EXACTES (oscillateurs, filtres, enveloppes)
```

---

## PROMPT AXE F — Mobile & publication

```
Tu es le developpeur principal de Petanque Master. Lis CLAUDE.md puis docs/PLAN_PHASE3.md (AXE F uniquement).

=== CONTEXTE ===
Le jeu vise CrazyGames/Poki ou 60%+ du trafic est mobile. Il faut optimiser touch, responsive, et preparer les SDK portails.

=== ETAPES ===

1. Lis ces fichiers dans l'ordre :
   - CLAUDE.md
   - docs/PLAN_PHASE3.md (section AXE F)
   - src/config.js (Phaser scale config)
   - src/petanque/AimingSystem.js (input handlers)
   - src/utils/Constants.js
   - index.html
   - vite.config.js
   - docs/ITCH_IO.md

2. Implemente dans cet ordre :
   a. Constants.js : ajouter IS_MOBILE detection + TOUCH_BUTTON_SIZE (56) + TOUCH_PADDING (8)

   b. AimingSystem.js :
      - Agrandir hitArea des boutons mode a TOUCH_BUTTON_SIZE sur mobile
      - Ajouter padding invisible autour de chaque bouton interactif
      - Threshold mouvement minimal (5px) pour eviter false triggers touch
      - Visual feedback agrandi sur mobile (cercle puissance + 20%)

   c. index.html :
      - Ajouter `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">`
      - Ajouter CSS `touch-action: none` sur #game-container
      - Ajouter detection orientation : si portrait, afficher message "Tournez votre ecran"

   d. config.js :
      - Verifier scale mode (FIT + CENTER_BOTH devrait suffire)
      - Ajouter resolution automatique pour petits ecrans

   e. Nouveau src/utils/PortalSDK.js :
      Wrapper leger pour CrazyGames + Poki :
      ```js
      export const Portal = {
        init() { /* detect SDK */ },
        gameplayStart() { /* notify portal */ },
        gameplayStop() { /* notify portal */ },
        happyTime() { /* CrazyGames reward moment */ },
        commercialBreak() { /* Poki ad break */ }
      };
      ```
      Appeler Portal.gameplayStart() dans PetanqueScene.create()
      Appeler Portal.gameplayStop() dans PetanqueScene shutdown/result
      NOTE : ne pas charger les SDK reels — juste le wrapper. Les SDK seront ajoutes au deploiement.

   f. EngineRenderer.js : implementer pooling (si pas fait dans AXE C)
      - Pool max 10 Graphics objects
      - Limiter particules simultanées a 3

3. Tests :
   - Tester manuellement sur Chrome DevTools mode mobile (375x667, 390x844)
   - Verifier que tous les boutons sont cliquables
   - Verifier rotation portrait → message

4. Verifie : `npm run build`

5. Commit : "feat(mobile): AXE F — touch optimization, responsive, portal SDK wrapper (#phase3)"

=== REGLES ===
- NE PAS charger les SDK CrazyGames/Poki reels (juste le wrapper)
- Pas de framework CSS additionnel
- Garder 832x480 comme resolution de reference
- Le jeu doit rester 100% jouable au clavier/souris (pas de regression desktop)
- Pas de console.log
- Lire research/59_portal_sdk_implementation.md pour les specs SDK detaillees
- Lire research/37_mobile_touch_ux.md pour les principes UX mobile
```

---

*Prompts generes le 24 mars 2026 par Claude Opus 4.6.*
*Chaque prompt est autonome et peut etre execute dans n'importe quel ordre (A recommande en premier).*
