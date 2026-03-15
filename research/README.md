# Research - Petanque Master

Base de connaissances complete pour le developpement du jeu.
Chaque fichier est autonome et peut etre lu independamment.

**POUR DEMARRER UNE SESSION** : lire `00_synthese_etat_projet.md` en premier.

---

## Synthese
| # | Fichier | Contenu |
|---|---------|---------|
| 00 | [00_synthese_etat_projet.md](00_synthese_etat_projet.md) | **LIRE EN PREMIER** : etat du projet, priorites, guide de lecture research |

## Index par theme

### Fondations techniques (Sprint 0)
| # | Fichier | Contenu |
|---|---------|---------|
| 01 | [01_frameworks_comparison.md](01_frameworks_comparison.md) | Comparaison Phaser 3 vs PixiJS vs Kaboom vs Excalibur. Pourquoi Phaser 3. |
| 02 | [02_tilemaps_assets.md](02_tilemaps_assets.md) | Tiled Map Editor, formats, workflow tilemap, architecture maps |
| 03 | [03_tools_mcp_libs.md](03_tools_mcp_libs.md) | MCP servers (PixelLab, ElevenLabs), libs npm, pipeline assets IA |
| 08 | [08_vite_phaser_setup.md](08_vite_phaser_setup.md) | Setup Vite + Phaser 3, assetsInlineLimit, config optimale |
| 12 | [12_deployment_ci_cd.md](12_deployment_ci_cd.md) | GitHub Pages, GitHub Actions, workflow CI/CD |

### Petanque : regles et physique (Sprint 1)
| # | Fichier | Contenu |
|---|---------|---------|
| 04 | [04_petanque_physics.md](04_petanque_physics.md) | Physique des boules, friction, collisions, modele mathematique |
| 09 | [09_petanque_rules_formal.md](09_petanque_rules_formal.md) | Regles FIPJP completes, scoring, mene morte, cas speciaux |

### Architecture et UX (Sprint 2-3)
| # | Fichier | Contenu |
|---|---------|---------|
| 05 | [05_pokemon_architecture.md](05_pokemon_architecture.md) | Architecture Pokemon GBA, scenes, state machine, progression |
| 06 | [06_ux_polish.md](06_ux_polish.md) | UX jeux retro, dialogues, camera, transitions, feedback |
| 07 | [07_cross_analysis.md](07_cross_analysis.md) | Synthese croisee de toutes les recherches, decisions finales |

### Assets et outils IA (Sprint 2-4)
| # | Fichier | Contenu |
|---|---------|---------|
| 10 | [10_ai_pixel_art_tools.md](10_ai_pixel_art_tools.md) | PixelLab, Retro Diffusion, Aseprite, pipeline sprites IA |
| 11 | [11_mcp_servers_gamedev.md](11_mcp_servers_gamedev.md) | Serveurs MCP pour game dev, ElevenLabs audio, integration |

### Gameplay et polish (Sprint 3.5-4)
| # | Fichier | Contenu |
|---|---------|---------|
| 13 | [13_gameplay_petanque_game_design.md](13_gameplay_petanque_game_design.md) | Game design petanque : game feel, techniques, strategie, IA, erreurs a eviter |
| 14 | [14_phaser3_polish_techniques.md](14_phaser3_polish_techniques.md) | Polish Phaser 3 : camera, particules, tweens, performance, checklist |
| 15 | [15_implementation_verification.md](15_implementation_verification.md) | Verification faisabilite de chaque feature Sprint 3.5 |

### Migration 32x32 (15 mars 2026)
| # | Fichier | Contenu |
|---|---------|---------|
| 16 | [16_migration_32x32.md](16_migration_32x32.md) | Analyse d'impact migration 16x16 → 32x32, fichiers a modifier |
| 17 | [17_pixellab_spritesheet_workflow.md](17_pixellab_spritesheet_workflow.md) | Workflow PixelLab API : generate, rotate, animate, downscale, cout |

### Scene petanque et lore (15 mars 2026)
| # | Fichier | Contenu |
|---|---------|---------|
| 18 | [18_scene_petanque_visuelle.md](18_scene_petanque_visuelle.md) | Disposition terrain, atmosphere visuelle, jeux existants, techniques rendu |
| 19 | [19_legendes_petanque.md](19_legendes_petanque.md) | Legendes : Quintais, Suchaud, Lacroix, Foyot, Fazzino, Rocher (faits verifies) |
| 20 | [20_plan_amelioration_scene_petanque.md](20_plan_amelioration_scene_petanque.md) | Plan 6 priorites pour ameliorer la scene petanque |
| 21 | [21_petanque_international.md](21_petanque_international.md) | Petanque mondiale : Thailande, Madagascar, 67 pays medailles |
| 22 | [22_faisabilite_ameliorations_phaser3.md](22_faisabilite_ameliorations_phaser3.md) | Verification faisabilite : 7/7 features confirmees (gradient, camera, slow-mo, etc.) |

### Game design et addiction (15 mars 2026)
| # | Fichier | Contenu |
|---|---------|---------|
| 23 | [23_addictive_game_design.md](23_addictive_game_design.md) | Boucle addiction Pokemon, game feel Celeste/Stardew, courbe difficulte, UX mobile, art direction |

---

## Comment utiliser cette base

1. **Avant de coder une feature** : lire le fichier de recherche correspondant
2. **Pour les decisions techniques** : 07 (cross analysis) + 15 (verification)
3. **Pour le gameplay petanque** : 13 (game design) + 18 (scene visuelle) + 20 (plan amelioration)
4. **Pour le polish** : 14 (techniques Phaser) avec snippets prets a l'emploi
5. **Pour les regles** : 09 (FIPJP formel) = la reference
6. **Pour l'histoire/lore** : 19 (legendes) + 21 (international) + LORE_PETANQUE.md (racine)

## Historique
- Session 1 (debut projet) : fichiers 01-12
- Session 2 (14 mars 2026) : fichiers 13-15
- Session 3 (15 mars 2026) : fichiers 16-23, migration 32x32, game feel, recherche approfondie
