# Synthese : Etat du projet et plan d'action

> Document de synthese qui centralise TOUT ce qu'il faut savoir pour avancer.
> Mis a jour : **18 mars 2026**.

---

## CE QUI EST FAIT

| Sprint | Statut | Resume |
|--------|--------|--------|
| Sprint 0 | COMPLET | Vite + Phaser + MCP + CI/CD + GitHub Pages |
| Sprint 1 | COMPLET | Moteur petanque FIPJP, physique COR 0.62, IA, scoring, carreau |
| Sprint 2 | COMPLET | Monde ouvert, tiles 32x32, sprites canvas, 3 maps, NPC |
| Sprint 3 | COMPLET | Sauvegarde, titre, intro, badges, gates, 13 PNJ |
| Sprint 3.5 | COMPLET | Loft, prediction trajectoire, carreau, indicateur BEST, IA personnalites |
| Migration 32x32 | COMPLET | Resolution 832x480, tout double, tests PASS |
| Game Feel | COMPLET | SFX, particules, zoom camera, stats boules, UI combinee |
| Sprint 4 | COMPLET | 5 persos (Ley, Magicien, Choupe, Marcel, Reyes), Focus/Respire, capacites uniques |
| Sprint 4+ | COMPLET | 10 boules, 8 cochonnets, 5 terrains, confettis, musique terrain, arcade 3 rounds |

### Personnages (6 : Rookie + 5 adversaires)
| Perso | Archetype | Stats (P/Pu/E/SF) | Capacite | Sprite |
|-------|-----------|-------------------|----------|--------|
| Rookie | adaptable | 3/3/2/2 (10/40) | Evolutif (3 paliers: 18/26/34 pts) | — |
| Ley | tireur | 8/9/9/5 (31) | Carreau Instinct | char_ley |
| Le Magicien | pointeur | 10/4/7/9 (30) | Lecture du Terrain | char_le_magicien |
| La Choupe | tireur | 5/10/3/6 (24) | Coup de Canon | char_la_choupe |
| Marcel | equilibre | 8/5/5/8 (26) | Vieux Renard | char_marcel |
| Reyes | complet | 8/8/7/9 (32) | Le Mur | char_reyes |

### Systemes en place
- Physique custom (Ball.js, 380 lignes) : friction, pente, zones, rebonds
- IA (PetanqueAI.js) : 3 niveaux, personnalites, momentum
- Visee (AimingSystem.js) : drag, loft, retro, Focus, capacites, wobble, tremblement
- Moteur (PetanqueEngine.js) : state machine complet, regles FIPJP
- Audio : 14 SFX + 2 musiques + ambiance terrain
- Scenes : Boot, Title, CharSelect, QuickPlay, Arcade, VSIntro, Petanque, Result, LevelUp, Shop, Tutorial

---

## CE QUI RESTE — SPRINT FINAL

> Detail complet : **SPRINT_FINAL.md**
> Cahier des charges strict : **CAHIER_DES_CHARGES.md**

### Phase 1 : Le Rookie + Progression
- Le Rookie : perso starter, 10/40 pts, stats customisables
- +4 pts par victoire Arcade, +2 par victoire Quick Play
- LevelUpScene : ecran repartition des points
- Capacites debloquables : L'Instinct (18pts), Determination (26pts), Le Naturel (34pts)
- En Arcade : seul le Rookie est jouable
- **Fichiers a modifier** : characters.json, SaveManager.js, ArcadeScene.js, Constants.js

### Phase 2 : Ecus + Boutique
- Monnaie in-game (Ecus), gagnee par victoire/carreaux/bonus
- ShopScene : achat boules, cochonnets, capacites
- **Fichiers a creer** : ShopScene.js, shop.json

### Phase 3 : Deblocages
- Battre un adversaire en Arcade = le debloquer en Quick Play
- Arcade complete = Reyes + Badge
- Progression cumulee : victoires → cochonnets, boules, titres

### Phase 4 : Refonte cosmetique
- TitleScene : background provencal, particules, logo pixel art
- CharSelectScene : portraits HD, verrous, stats animees
- PetanqueScene : slow-mo (implemente), traces d'impact (a verifier)
- **Reference** : research/20 + research/22

### Phase 5 : Tests
- Playwright : navigation, arcade, progression, boutique, gameplay
- Process : chaque feature → test associe

---

## DOSSIER RESEARCH — GUIDE DE LECTURE

### Je veux coder / polir la scene petanque
1. **research/20** : Plan en 6 etapes (background → boules 3D → camera → joueurs → traces → ambiance)
2. **research/22** : Faisabilite Phaser 3 (7/7 OK, API exactes, gotchas)
3. **research/18** : Vision visuelle (positions joueurs, atmosphere, palette provencale)
4. **research/14** : Techniques polish (camera shake, hitstop, tweens, easing)
5. **research/13** : Game design (moments dramatiques, juice, erreurs a eviter)

### Je veux travailler sur la physique
6. **research/04** : Modele physique complet (friction, collisions, 3 phases lancer)
7. **research/25_cahier_des_charges_realisme** : Donnees reelles (vitesses, masses, COR)
8. **research/25_techniques_lancer_reference** : 6 techniques avec parametres

### Je veux travailler sur les regles
9. **research/09** : Regles FIPJP formelles (scoring, mene morte, cas speciaux)
10. **research/31** : Gap analysis (implemente vs manquant)

### Je veux creer des sprites
11. Memoire `feedback_sprite_workflow.md` : Pixflux pour generation, Bitforge pour upscale
12. Memoire `reference_pixellab_api.md` : API complete + parametres optimaux
13. **research/24** : Guide qualite pixel art (10 regles, palette, silhouettes)
14. **research/17** : Workflow spritesheet (cout, directions, priorite)
15. **research/26** : Pixelorama vs Aseprite (retouche manuelle)

### Je veux comprendre le lore
16. **research/19** : Legendes reelles (Quintais, Dream Team, La Ciotat 1907)
17. **research/25_story_game_design** : Structure narrative 3 actes + finale
18. **STORY.md** : "L'Heritier de la Ciotat" (reserve Phase D)

### Je veux distribuer / monetiser
19. **research/29** : Plan lancement 5 phases (web → Android → backend → iOS → Steam)
20. **research/32** : Strategie commerciale (free demo, Steam $9.99, mobile freemium)
21. **research/33** : Analyse concurrentielle (marche vide, 0 concurrent serieux)
22. **research/PUBLISHING_GUIDE** : Legal (auto-entrepreneur, RGPD, stores)
23. **research/27** : Wrappers (Capacitor mobile, Electron Steam)
24. **research/28** : Infrastructure scalabilite (Colyseus, Redis, Supabase)

### Je veux travailler sur l'UI/UX
25. **research/34** : UI/UX patterns fighting game (menus, HUD, transitions, typographie)
26. **research/36** : Onboarding et tutoriel (premiere partie, tooltips contextuels)
27. **research/39** : Accessibilite (daltonisme, controles alternatifs, options)

### Je veux travailler sur le son
28. **research/35** : Audio design complet (SFX, musique, ambiance, jsfxr, ElevenLabs)
28b. **research/49** : Sound design impacts (layering, musique adaptative, recettes jsfxr avancees)

### Je veux porter sur mobile
29. **research/37** : Touch UX mobile (controles tactiles, safe areas, haptic, perf)

### Je veux comprendre la retention/engagement
30. **research/38** : Retention et engagement (boucles, psychologie, defis, monetisation ethique)
31. **research/41** : Analytics et player data (KPIs, funnels, tracking, RGPD)
32b. **research/45** : Progression dans les jeux de sport (Golf Story, Pyre, starters, rythme XP)
33b. **research/46** : Shop UI patterns (Hollow Knight, Hades, mockup boutique, calibrage prix)

### Je veux l'online / le social
32. **research/42** : Multiplayer Colyseus (rooms, state sync, anti-triche, ELO)
33. **research/43** : Community et social (replays, partage, defis, tournois)

### Je veux localiser / internationaliser
34. **research/44** : Localisation i18n (architecture, traductions, adaptation culturelle)

### Je veux travailler le polish visuel
34b. **research/47** : Camera & slow-mo (hitstop, zoom, lerp, sequences dramatiques, code Phaser 3)
35b. **research/48** : Character design 32x32 (silhouette, idle, poses victoire/defaite, palette Rookie)
36b. **research/50** : Cosmetic overhaul checklist (ecran titre, char select, particules, anti-patterns)

### Architecture, performance et code
37. **CLAUDE.md** : Conventions, stack, structure projet
38. **research/05** : Architecture scenes Pokemon/Phaser
39. **research/15** : Verification faisabilite implementations
40. **research/40** : Performance web et mobile (FPS, memoire, chargement, profiling)

### Je veux equilibrer le jeu / organiser des playtests
41. **research/51** : Balancing et playtesting (win rates, economie, protocole de test, debug overlay)

### Je veux ecrire les dialogues
42. **research/53** : Narrative design et dialogue writing (ton, barks, Arcade cutscenes, Pere Fernand)
43. **research/19** : Legendes petanque (lore reel pour nourrir les textes)

### Je veux automatiser les tests / deployer
44. **research/52** : CI/CD et build pipeline (GitHub Actions, Playwright, Capacitor, Electron)

### Techniques avancees (reference future)
45. **research/30** : Toutes les techniques de petanque (exhaustif)

---

## FICHIERS CLES DU PROJET

| Fichier | Role |
|---------|------|
| `CLAUDE.md` | Instructions projet, conventions, stack |
| `GAME_DESIGN.md` | Bible game design |
| `CAHIER_DES_CHARGES.md` | Reference stricte etat + a faire |
| `SPRINT_FINAL.md` | Plan implementation detaille |
| `STORY.md` | Histoire (reserve Phase D) |
| `public/data/characters.json` | Roster personnages + stats + barks |
| `public/data/terrains.json` | Proprietes terrains |
| `public/data/boules.json` | Stats boules + cochonnets |
| `public/data/arcade.json` | Progression arcade |
| `public/data/progression.json` | Badges et deblocages |
| `src/utils/Constants.js` | Toutes les constantes physique + gameplay |
| `src/utils/SaveManager.js` | Persistance localStorage |
| `src/petanque/PetanqueEngine.js` | Coeur du moteur de jeu |
| `src/petanque/AimingSystem.js` | Systeme de visee |
| `src/petanque/PetanqueAI.js` | Intelligence artificielle |

---

## FAITS CLES

- **Marche** : Aucun concurrent serieux (Power of Petanque = 20 reviews)
- **Le "clac" metallique = LE juice** du jeu de petanque (son = 50% du game feel)
- **Matches 3-4 min** pour la boucle "just one more"
- **Philippe Quintais** = 14 titres mondiaux, inspiration pour Grand Marius
- **Origines** : Jules Hugues "Le Noir", La Ciotat 1907, "pe tanca" = pieds ancres
- **Gradient radial Phaser 3** = CanvasTexture (pas Graphics)
- **Slow-mo** = multiplier delta manuellement (physique custom)
- **Toutes les ameliorations visuelles sont faisables** (7/7 verifiees dans research/22)
