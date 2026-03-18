# Research — Petanque Master

**LIRE EN PREMIER** : `00_synthese_etat_projet.md`

> 51 documents actifs (+ 8 en archive) couvrant tous les axes du projet.
> Derniere reorganisation : 18 mars 2026.

---

## NAVIGATION PAR BESOIN

### 🎯 Coeur du jeu — Petanque

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 04 | [04_petanque_physics.md](04_petanque_physics.md) | On touche a la physique (Ball.js, friction, collisions) |
| 04b | [04b_physique_petanque_v2.md](04b_physique_petanque_v2.md) | Physique avancee : nouvelles features (micro-rebonds, spin, tir devant) |
| 04c | [04c_physique_audit_specifications.md](04c_physique_audit_specifications.md) | Physique avancee : audit du code actuel + specs de correction |
| 09 | [09_petanque_rules_formal.md](09_petanque_rules_formal.md) | On touche aux regles (PetanqueEngine, scoring, mene morte) |
| 13 | [13_gameplay_petanque_game_design.md](13_gameplay_petanque_game_design.md) | On ameliore le game feel (moments dramatiques, juice) |
| 25c | [25_cahier_des_charges_realisme.md](25_cahier_des_charges_realisme.md) | On verifie le realisme (COR, techniques, donnees reelles) |
| 25t | [25_techniques_lancer_reference.md](25_techniques_lancer_reference.md) | On code un type de lancer (roulette, plombee, tir) |
| 30 | [30_techniques_petanque_exhaustif.md](30_techniques_petanque_exhaustif.md) | On veut le catalogue complet des techniques |
| 31 | [31_cahier_des_charges_techniques_petanque.md](31_cahier_des_charges_techniques_petanque.md) | On cherche les gaps entre reel et implemente |

### 🎮 Experience joueur — UX, UI, Onboarding

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 34 | [34_ui_ux_fighting_game_patterns.md](34_ui_ux_fighting_game_patterns.md) | On travaille sur les menus, HUD, transitions, fighting-game feel |
| 36 | [36_onboarding_tutorial_design.md](36_onboarding_tutorial_design.md) | On cree le tutoriel ou l'experience premiere partie |
| 38 | [38_player_retention_engagement.md](38_player_retention_engagement.md) | On travaille sur la progression, les deblocages, la boucle de jeu |
| 39 | [39_accessibility_inclusivity.md](39_accessibility_inclusivity.md) | On ajoute des options d'accessibilite (daltonisme, controles) |
| 45 | [45_progression_systems_sport_games.md](45_progression_systems_sport_games.md) | On calibre le Rookie, les stats, le rythme de progression |
| 46 | [46_shop_ui_patterns_indie.md](46_shop_ui_patterns_indie.md) | On cree la ShopScene, les prix, l'economie des Ecus |
| 50 | [50_cosmetic_overhaul_checklist.md](50_cosmetic_overhaul_checklist.md) | On fait le polish final, checklist "pret pour le public" |
| 51 | [51_balancing_playtesting.md](51_balancing_playtesting.md) | On equilibre les stats, les prix, la difficulte, on organise des playtests |

### 🎨 Visuel — Pixel art, sprites, terrains

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 18 | [18_scene_petanque_visuelle.md](18_scene_petanque_visuelle.md) | On ameliore le visuel de la scene petanque |
| 24 | [24_pixellab_sprite_quality_guide.md](24_pixellab_sprite_quality_guide.md) | On genere ou retouche des sprites pixel art |
| 26 | [26_pixelorama_aseprite_pixel_art.md](26_pixelorama_aseprite_pixel_art.md) | On utilise Pixelorama/Aseprite pour le polish |
| 17 | [17_pixellab_spritesheet_workflow.md](17_pixellab_spritesheet_workflow.md) | On genere des spritesheets via PixelLab MCP |
| 02 | [02_tilemaps_assets.md](02_tilemaps_assets.md) | On cree des maps Tiled |
| 48 | [48_pixel_art_character_design_32x32.md](48_pixel_art_character_design_32x32.md) | On designe un personnage (silhouette, palette, idle, poses) |

### 🔧 Technique — Architecture, Phaser 3, Performance

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 05 | [05_pokemon_architecture.md](05_pokemon_architecture.md) | On refactore l'architecture des scenes |
| 07 | [07_cross_analysis.md](07_cross_analysis.md) | On prend une decision technique importante |
| 14 | [14_phaser3_polish_techniques.md](14_phaser3_polish_techniques.md) | On ajoute du juice (camera, particules, tweens) |
| 15 | [15_implementation_verification.md](15_implementation_verification.md) | On verifie la faisabilite d'une feature |
| 22 | [22_faisabilite_ameliorations_phaser3.md](22_faisabilite_ameliorations_phaser3.md) | On code le polish visuel (gradient, slow-mo) |
| 20 | [20_plan_amelioration_scene_petanque.md](20_plan_amelioration_scene_petanque.md) | On planifie les ameliorations visuelles (6 etapes) |
| 40 | [40_performance_optimization_web.md](40_performance_optimization_web.md) | On optimise le chargement, les FPS, la memoire |
| 47 | [47_camera_slowmo_2d_sports.md](47_camera_slowmo_2d_sports.md) | On code le slow-mo, hitstop, camera follow, zoom dynamique |
| 52 | [52_cicd_build_pipeline.md](52_cicd_build_pipeline.md) | On automatise les tests, le deploy, les builds multi-plateforme |

### 📱 Mobile — Touch, Capacitor, Portage

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 37 | [37_mobile_touch_ux.md](37_mobile_touch_ux.md) | On adapte le jeu pour mobile (controles tactiles, safe areas) |
| 27 | [27_app_stores_wrapper_tech.md](27_app_stores_wrapper_tech.md) | On deploie sur les stores (Capacitor, Electron) |

### 🌐 Multijoueur & Social

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 42 | [42_multiplayer_colyseus_implementation.md](42_multiplayer_colyseus_implementation.md) | On implemente le versus en ligne (Colyseus, rooms, state sync) |
| 28 | [28_infrastructure_scalabilite.md](28_infrastructure_scalabilite.md) | On dimensionne l'infrastructure serveur |
| 43 | [43_community_social_features.md](43_community_social_features.md) | On ajoute des features sociales (replays, partage, defis) |

### 🔊 Audio — SFX, Musique, Ambiance

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 35 | [35_audio_design_complet.md](35_audio_design_complet.md) | On planifie l'audio (catalogue SFX, musique, ambiance par terrain) |
| 49 | [49_sound_design_impact_sports.md](49_sound_design_impact_sports.md) | On ameliore le "juice" audio (layering, impacts, musique adaptative) |

### 📊 Data & Analytics

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 41 | [41_analytics_player_data.md](41_analytics_player_data.md) | On met en place le tracking, les KPIs, les funnels |

### 🌍 Localisation

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 44 | [44_localization_i18n.md](44_localization_i18n.md) | On prepare le jeu pour d'autres langues |

### 💼 Business & Distribution

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 32 | [32_strategie_commerciale_complete.md](32_strategie_commerciale_complete.md) | On decide du modele economique, du pricing |
| 33 | [33_competitive_analysis_2026.md](33_competitive_analysis_2026.md) | On etudie la concurrence (spoiler : il n'y en a pas) |
| 29 | [29_plan_lancement_complet.md](29_plan_lancement_complet.md) | On planifie le lancement (web → mobile → Steam) |
| PG | [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md) | On gere le legal (auto-entrepreneur, stores, RGPD) |

### 📖 Lore & Narration

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 19 | [19_legendes_petanque.md](19_legendes_petanque.md) | On ecrit des dialogues, du lore, des easter eggs |
| 25s | [25_story_game_design.md](25_story_game_design.md) | On travaille sur le mode histoire (Phase D) |
| 53 | [53_narrative_design_dialogue_writing.md](53_narrative_design_dialogue_writing.md) | On ecrit les dialogues Arcade, catchphrases, barks, textes boutique |

### 🏗️ Synthese & Decisions strategiques

| # | Fichier | A lire quand... |
|---|---------|-----------------|
| 00 | [00_synthese_etat_projet.md](00_synthese_etat_projet.md) | On demarre une session — TOUJOURS LIRE EN PREMIER |
| 23 | [23_migration_3D_unity_recherche.md](23_migration_3D_unity_recherche.md) | On envisage une migration 3D (reponse : non) |
| 16 | [16_migration_32x32.md](16_migration_32x32.md) | Reference migration 16→32px (COMPLETE) |
| 11 | [11_mcp_servers_gamedev.md](11_mcp_servers_gamedev.md) | On utilise PixelLab, ElevenLabs, ou un autre MCP |

---

## ARCHIVE (8 fichiers)

Fichiers obsoletes, redondants ou trop generiques. Gardes pour reference dans `archive/`.

| Fichier | Raison de l'archivage |
|---------|----------------------|
| 01 | Frameworks comparison — decision faite (Phaser 3) |
| 03 | Tools MCP — fusionne dans 11 |
| 06 | UX polish — remplace par 14 et 34 |
| 08 | Vite setup — fait |
| 10 | Pixel art tools — fusionne dans 11 et 26 |
| 12 | CI/CD — fait |
| 21 | International petanque — trop generique, remplace par 44 |
| 23_addictive | Game design addictif — remplace par 38 |

---

## LEGENDE

- Les documents **P1** (priorite haute) sont essentiels pour le developpement en cours
- Les numeros avec suffixe (25c, 25s, 25t) partagent un theme commun
- Chaque document commence par "A lire quand..." pour le contexte
- Les inter-references entre documents sont indiquees dans le texte
