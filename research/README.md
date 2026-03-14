# Research - Petanque Master

Base de connaissances complete pour le developpement du jeu.
Chaque fichier est autonome et peut etre lu independamment.

---

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

### Gameplay et polish (Sprint 3.5-4) — NOUVEAU (14 mars 2026)
| # | Fichier | Contenu |
|---|---------|---------|
| 13 | [13_gameplay_petanque_game_design.md](13_gameplay_petanque_game_design.md) | **Game design petanque** : game feel, techniques reelles (roulette/plombee/carreau), strategie, IA par personnalite, tension/comeback, erreurs a eviter. ~15 sources. |
| 14 | [14_phaser3_polish_techniques.md](14_phaser3_polish_techniques.md) | **Polish Phaser 3** : camera shake/flash/zoom, particules par terrain, tweens/easing, prediction trajectoire, pixel art pro, performance, save system, checklist lancement. |
| 15 | [15_implementation_verification.md](15_implementation_verification.md) | **Verification faisabilite** : audit code-by-code de chaque feature Sprint 3.5 (loft, indicateur point, lisibilite, carreau, IA, prediction). Fichiers/methodes/lignes a modifier, risques, ordre d'implementation. |

---

## Comment utiliser cette base

1. **Avant de coder une feature** : lire le fichier de recherche correspondant
2. **Pour les decisions techniques** : 07 (cross analysis) + 15 (verification)
3. **Pour le gameplay** : 13 (game design) est le fichier le plus important
4. **Pour le polish** : 14 (techniques Phaser) avec les snippets de code prets a l'emploi
5. **Pour les regles** : 09 (FIPJP formel) = la reference

## Historique
- Session 1 (debut projet) : fichiers 01-12
- Session recherche (14 mars 2026) : fichiers 13-15, cet index
