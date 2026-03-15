# Synthese : Etat du projet et plan d'action

> Document de synthese qui centralise TOUT ce qu'il faut savoir pour avancer.
> Mis a jour : 15 mars 2026.

## CE QUI EST FAIT (Sprint 0 → 3.5 + Migration + Game Feel)

| Sprint | Statut | Resume |
|--------|--------|--------|
| Sprint 0 | COMPLET | Vite + Phaser + MCP + CI/CD + GitHub Pages |
| Sprint 1 | COMPLET | Moteur petanque FIPJP, physique, IA, scoring, carreau |
| Sprint 2 | COMPLET | Monde ouvert, tiles 32x32, sprites canvas, 3 maps, NPC |
| Sprint 3 | COMPLET | Sauvegarde, titre, intro, badges, gates, 13 PNJ |
| Sprint 3.5 | COMPLET | Loft, prediction trajectoire, carreau, indicateur BEST, IA personnalites |
| Migration 32x32 | COMPLET | Resolution 832x480, tout double, tests PASS |
| Game Feel | COMPLET | SFX proceduraux, particules, zoom camera, stats boules, UI combinee |

## CE QU'IL RESTE A FAIRE (par priorite)

### PRIORITE 1 : Scene petanque belle et immersive
**Plan detaille** : research/20_plan_amelioration_scene_petanque.md
**Faisabilite** : research/22_faisabilite_ameliorations_phaser3.md (7/7 OK)

| Amelioration | Technique Phaser 3 | Impact |
|---|---|---|
| Terrain texture gravier | CanvasTexture + createRadialGradient | +++ |
| Fond ciel + platanes + banc | Sprites statiques, layers | +++ |
| Boules 3D (gradient radial) | CanvasTexture pre-rendues au boot | +++ |
| Camera follow boule en vol | Sprite invisible + startFollow(lerp 0.08) | ++ |
| Slow-mo pres cochonnet | Delta scaling manuel * slowMotionFactor | ++ |
| Joueurs pres cochonnet | Repositionner adversaire accroupi la-bas | ++ |
| Traces au sol permanentes | RenderTexture.draw() | + |
| Camera pan apres lancer | camera.pan() (stopFollow avant) | + |

### PRIORITE 2 : Vrais sprites PixelLab
**Workflow** : research/17_pixellab_spritesheet_workflow.md
- MCP et skills prets, $10 credits
- Generer 64x64, rotate, animate, downscale 2x → 32x32
- 10 personnages a generer

### PRIORITE 3 : Contenu additionnel (Sprint 4)
**Plan** : PLAN_MVP.md, section Sprint 4
- Arenes 2 et 3 (Fanny herbe, Ricardo sable)
- Route 2 et 3
- Arene finale Grand Marius (triplette)
- Musique chiptune + SFX ElevenLabs
- Ambiance cigales

### PRIORITE 4 : Boucle d'addiction
**Recherche** : research/23_addictive_game_design.md
- Matches 3-4 min max
- Collection de boules (rarete variable)
- Carnet du bouliste (adversaires battus)
- Defeat screen encourageant + DDA subtil
- Details vivants (chat sur mur, linge qui seche, dialogues qui changent)

## DOSSIER RESEARCH : GUIDE DE LECTURE

### Pour coder la scene petanque (PRIORITE 1)
1. **research/20** : Plan en 6 etapes, schema de disposition du terrain
2. **research/22** : Comment coder chaque feature (API Phaser exactes, gotchas)
3. **research/18** : Comment ca doit RESSEMBLER (positions joueurs, atmosphere, palette)
4. **research/13** : Game design (moments dramatiques, erreurs a eviter, le "clac" = le juice)
5. **research/14** : Techniques polish Phaser 3 (camera, particules, tweens, easing)

### Pour le lore et les personnages
6. **research/19** : Legendes corrigees (Quintais, Suchaud, Lacroix, Foyot, Rocher, Fazzino)
7. **research/21** : Petanque internationale (Thailande, Madagascar, 67 pays)
8. **LORE_PETANQUE.md** : Mapping personnages du jeu

### Pour la physique et les regles
9. **research/04** : Modele physique (friction, collisions, 3 phases lancer)
10. **research/09** : Regles FIPJP (scoring, mene morte, cas speciaux)

### Pour l'addiction et le game design
11. **research/23** : Boucle Pokemon, game feel, difficulte, UX mobile, art direction

### Pour les assets et outils
12. **research/17** : Workflow PixelLab API
13. **research/10** : Outils IA pixel art (PixelLab, Aseprite, Retro Diffusion)

## FAITS CLES A RETENIR

- **Philippe Quintais** = "Le Roi", 14 titres mondiaux, joueur COMPLET (pas juste tireur)
- **Dream Team** = Lacroix (pointeur) + Quintais (milieu) + Suchaud (tireur)
- **Origines** = Jules Hugues dit "Le Noir", La Ciotat 1907, "pe tanca" = pieds ancres
- **En vrai** les adversaires sont PRES DU COCHONNET, pas loin du terrain
- **Le son = 50% du game feel** d'un jeu de sport
- **Le "clac" metallique est LE son de la petanque** - c'est le juice principal
- **Gradient radial en Phaser 3** = CanvasTexture (pas Graphics)
- **Slow-mo** = multiplier delta manuellement (physique custom)
- **Matches 3-4 min** pour la boucle "just one more"
