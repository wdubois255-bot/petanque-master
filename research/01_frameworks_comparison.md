# Recherche Agent 1 : Comparaison Frameworks & Faisabilite

## Comparaison des 4 frameworks

### Phaser 3 - RECOMMANDE
- Bundle: ~1MB min (~300KB gzip), custom builds possible ~500KB min
- Tiled natif: `this.load.tilemapTiledJSON()`, charge .json directement
- Scene manager: lifecycle preload/create/update, scenes paralleles
- Sprites: `this.anims.create()` avec frame ranges, repeat, frameRate
- Camera: `camera.startFollow()`, bounds, zoom, shake, fade
- 2 moteurs physique: Arcade (AABB leger) et Matter.js (rigid body complet)
- Drag input: `this.input.setDraggable()` + pointer events
- Communaute massive, 1600+ exemples officiels, docs completes
- TypeScript definitions incluses
- Actif en dev (3.60+ pipeline unifie, 3.70+, 3.80)

### Pure Canvas API - ELIMINE
- 0KB de deps
- MAIS : faut tout construire (game loop, sprites, tilemap, camera, input, scenes, physique, UI)
- Estimation : 2000-4000 lignes de code moteur avant la moindre logique de jeu
- Bug-prone, chronophage, difficile a maintenir
- Verdict: viable uniquement pour apprendre, pas pour un vrai projet

### Pixi.js - ELIMINE
- ~500KB min (~150KB gzip), modulaire
- Meilleur renderer WebGL 2D (batch draw calls)
- MAIS: PAS de physique, PAS de tilemap, PAS de scene manager, PAS de game loop, PAS de camera, PAS d'input, PAS d'audio
- Il faudrait reconstruire la moitie d'un moteur de jeu par-dessus
- Verdict: overkill en rendering pour du pixel art, sous-equipe en features

### Kaboom.js / Kaplay - ELIMINE
- ~200-300KB min (~70-100KB gzip)
- API simple, entity-component
- Physique basique, collision basique, sprites, scenes, input
- MAIS: pas d'import Tiled natif, physique AABB uniquement, camera simple, pas de dialogue
- Transition Kaboom->Kaplay incertaine en maintenance
- Verdict: bon pour game jams, insuffisant pour exploration + physique + dialogues

## Tableau comparatif detaille

| Feature | Phaser 3 | Canvas | Pixi.js | Kaboom |
|---------|----------|--------|---------|--------|
| Tile maps + camera | Excellent natif | A construire | Pas de tilemap | Basique |
| Sprite animation | Excellent AnimationManager | A construire | Bon sprites, pas d'anim manager | Bon, components |
| Physique boules | Arcade ou Matter.js | A construire | Rien | Tres basique |
| Drag input | Built-in drag events | A construire | Pointer events basiques | Basique |
| Dialogues | Pas built-in mais facile avec BitmapText + Scenes | A construire | Rien | Rien |
| Scene management | Excellent SceneManager parallele/stack | A construire | Rien | Built-in simple |
| Performance | Tres bon (WebGL default) | Variable | Meilleur rendering brut | Bon |
| Bundle gzip | ~300KB | 0KB | ~150KB | ~80KB |
| Tiled compat | Import JSON natif | Parse manuel | Plugin necessaire | Parse manuel |

## Decision physique petanque : Custom vs Matter.js

### Ce qu'il faut simuler
- Boule lancee avec vecteur vitesse (angle + puissance du drag)
- Boule roule au sol avec deceleration par friction
- Collisions boule-boule (cercle-cercle) + boule-cochonnet
- Boules qui poussent les autres
- Detection "toutes les boules arretees" pour fin de tour
- Friction differente par terrain (terre, herbe, sable)

### Matter.js (inclus dans Phaser) - PAS RECOMMANDE
- Pros: collisions cercle-cercle automatiques, friction/restitution built-in
- Cons: concu pour gravite laterale (platformer), en top-down il faut gravity=(0,0) et simuler la friction via frictionAir
- `friction` dans Matter = friction de contact surface, pas "friction sol top-down"
- Overkill: bulldozer pour planter une fleur
- Sleep/waking system peut etre imprevisible
- Plus dur d'obtenir le bon "game feel" car trop realiste

### Custom physics - RECOMMANDE
- Core loop ultra simple:
  ```
  Pour chaque boule:
    1. position += velocity
    2. velocity *= frictionCoefficient (par terrain)
    3. if speed < epsilon: stop
    4. Check collisions cercle-cercle
    5. Si collision: resolution elastique
  ```
- Total: ~100-150 lignes de code
- Controle total sur le game feel
- Facile a debugger (visu des vecteurs vitesse)
- Deterministe et previsible
- Friction par terrain: juste changer le coefficient

### Collision cercle-cercle elastique
- Algorithme standard bien connu, ~20 lignes
- Formule: reflechir les vitesses selon la normale de collision, appliquer coefficient de restitution

## Architecture recommandee

| Composant | Technologie |
|-----------|-------------|
| Framework | Phaser 3 (3.60+ stable) |
| Rendering | WebGL Phaser (Canvas fallback auto) |
| Map editor | Tiled, export JSON |
| Physique exploration | Phaser Arcade Physics (AABB) |
| Physique petanque | Custom (~100-150 lignes) |
| Sprites | Spritesheets + Phaser AnimationManager |
| Dialogues | Custom UI scene + BitmapText + 9-slice panels |
| Scenes | Boot -> Menu -> Exploration -> Petanque -> Results |
| Input petanque | Pointer events (pointerdown -> pointermove -> pointerup) |
| Audio | Phaser built-in audio |

## Verdict faisabilite
**100% faisable.** Phaser 3 couvre nativement chaque besoin majeur sauf la physique petanque (simple a custom-build) et les dialogues (pattern commun avec exemples communautaires). Le jeu Flash original de TF1 etait en Flash — HTML5 Canvas via Phaser 3 peut facilement egaler et surpasser ce niveau de qualite.
