# Recherche Agent 5 : Architecture RPG Pokemon-like en Web

## 1. Projets open-source de reference

### Directement pertinents
- **RPG-JS** (`RSamaium/RPG-JS`) : Framework complet pour RPG Pokemon-like en web. Tiled natif, events, battles, dialogs. LE plus pertinent.
- **Pokemon Showdown** (`smogon/pokemon-showdown`) : Simulateur de combat. Architecture battle engine (state machine tour par tour). Reference pour systeme de combat.
- **pokeclicker** (`pokeclicker/pokeclicker`) : TypeScript + Knockout.js. Excellent pour progression/gating (routes, badges, regions).
- **PokemonGame (divers)** : Multiples repos Phaser 3. Pattern commun: scenes pour Overworld/Battle/Menu/Dialog.
- **Kaetram** : MMO HTML5 top-down, architecture complete.

### Patterns communs
- Phaser 3 + Scene-based architecture (le plus courant)
- PixiJS + custom (moins courant)
- RPG-JS (framework dedie)

## 2. Game State Management

### FSM (Finite State Machine) - LE pattern standard
```
States: EXPLORATION | DIALOG | BATTLE | MENU | CUTSCENE | TRANSITION
```

### Implementation avec Phaser 3 Scenes
- Chaque etat majeur = une Phaser.Scene
- Scenes peuvent tourner en parallele (HUD overlay sur exploration)
- `this.scene.start('BattleScene', { enemy: trainerData })` -> transition
- `this.scene.launch('DialogScene', { text: '...' })` -> overlay sans stopper le monde
- `this.scene.pause('OverworldScene')` -> freeze pendant combat

### Sub-states dans une scene (ex: BattleScene)
```javascript
class StateMachine {
  constructor() { this.states = {}; this.currentState = null; }
  addState(name, { onEnter, onUpdate, onExit }) { ... }
  transition(newState, params) {
    this.currentState.onExit();
    this.currentState = this.states[newState];
    this.currentState.onEnter(params);
  }
}
```
Pattern utilise dans quasi tous les tutos et projets open-source.

### Transition Overworld -> Combat
1. Joueur touche trigger (rencontre / line of sight dresseur)
2. Animation transition: `this.cameras.main.flash()` ou `this.cameras.main.fade()`
3. `this.scene.start('BattleScene', data)`
4. BattleScene charge, joue anims intro, entre dans FSM combat
5. Fin combat: fade out, `this.scene.start('OverworldScene', { returnPosition })`

**Detail cle** : persister l'etat overworld. Soit garder la scene en sleep (`scene.sleep`/`scene.wake`), soit serialiser l'etat et le repasser.

## 3. Systeme de Dialogue

### Architecture
- **DialogScene** : scene Phaser separee, lancee par-dessus l'overworld
- **TextBox UI** : rectangle borde en bas de l'ecran (9-slice ou dessine)
- **File de texte** : array de pages. Touche action pour avancer.

### Typewriter Effect
```javascript
this.timerEvent = this.time.addEvent({
  delay: 30,  // ms par caractere
  callback: () => {
    this.displayedText += this.fullText[this.charIndex];
    this.textObject.setText(this.displayedText);
    this.charIndex++;
    if (this.charIndex >= this.fullText.length) {
      this.timerEvent.destroy();
      this.showAdvanceIndicator();  // fleche clignotante
    }
  },
  loop: true
});
```
Appuyer pendant typewriter : (a) complete le texte instantanement, ou (b) avance a la page suivante si deja complet.

### Choix / Branches
- **Simple** : 2-4 options apres le texte, selection fleches, callback par option
- **Complexe** : Yarn Spinner (yarn-bound) ou Ink (inkjs) pour narratif branche
- Pour un jeu style Pokemon : choix simples suffisent (Oui/Non, selection items)

## 4. NPC AI et Triggers

### Detection line-of-sight (dresseurs)
```javascript
function checkTrainerVision(trainer, player) {
  const dx = player.tileX - trainer.tileX;
  const dy = player.tileY - trainer.tileY;
  switch (trainer.facing) {
    case 'down':  return dx === 0 && dy > 0 && dy <= trainer.visionRange;
    case 'up':    return dx === 0 && dy < 0 && Math.abs(dy) <= trainer.visionRange;
    case 'left':  return dy === 0 && dx < 0 && Math.abs(dx) <= trainer.visionRange;
    case 'right': return dy === 0 && dx > 0 && dx <= trainer.visionRange;
  }
}
```
+ Verifier qu'aucun tile solide ne bloque la vue entre dresseur et joueur.

### Sequence detection
1. "!" au-dessus du PNJ (pause breve)
2. PNJ marche vers le joueur (en ligne droite)
3. Dialogue demarre, puis combat

### Event Trigger Zones
- **Tile properties** : proprietes custom dans Tiled (trigger: "battle")
- **Overlap zones** : sprites invisibles Phaser, `this.physics.add.overlap(player, zone, callback)`

### NPC Movement Patterns
- **Stationnaire** : fixe, tourne vers le joueur a l'interaction
- **Route** : array de waypoints `[{x,y,wait}]`, boucle
- **Errance** : toutes les N secondes, pick tile adjacent walkable random
- **Pause** quand dialogue actif ou cutscene (check state machine)

## 5. Systeme de Sauvegarde

### Structure de donnees
```javascript
const saveData = {
  version: 1,
  player: {
    name: "Joueur",
    position: { map: "village_depart", x: 10, y: 15 },
    facing: "down"
  },
  boules: { type: "acier", stats: {...} },
  partners: [
    { id: "mamie_rose", name: "Mamie Rose", skill: 3 }
  ],
  badges: ["marcel", "fanny"],
  flags: {
    "intro_complete": true,
    "route1_trainer_1_defeated": true,
    "received_boules": true
  },
  inventory: { ... },
  playtime: 7200
};

// Save
localStorage.setItem('petanque_master_save_1', JSON.stringify(saveData));
// Load
const loaded = JSON.parse(localStorage.getItem('petanque_master_save_1'));
```

### Decisions cles
- **Event flags** = la partie la plus importante. Objet de booleens pour chaque evenement (dresseur battu, item pris, progression histoire).
- **Slots multiples** : cles localStorage differentes (save_1, save_2, save_3)
- **Versioning** : numero de version. Migration si format change.
- **Auto-save** : sur transitions de map et apres combats
- **Taille** : localStorage ~5MB limite par origine. Un save < 100KB = largement OK.

## 6. Systeme Camera

### Follow smooth avec Phaser 3
```javascript
this.cameras.main.startFollow(player, true, 0.1, 0.1);
this.cameras.main.roundPixels = true;  // evite jitter sub-pixel sur tiles
```
Lerp 0.08-0.15 = bon feeling Pokemon.

### Bounds (ne pas montrer hors map)
```javascript
this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
```

### Transitions entre zones
**Entree batiment (hard transition) :**
1. Joueur sur tile porte
2. `this.cameras.main.fadeOut(300)`
3. `this.scene.start('OverworldScene', { map: 'interieur', spawnPoint: 'door' })`
4. Nouvelle scene: `this.cameras.main.fadeIn(300)`

**Routes connectees (seamless) :**
- Detecter joueur au bord de la map, fade rapide, charger nouvelle map, placer joueur au bord oppose

## 7. Systeme de Progression / Gating

### Architecture : gating par flags
```javascript
// Dans les donnees map/NPC:
{
  type: "roadblock_npc",
  position: { x: 15, y: 8 },
  condition: "!badge_marcel",
  dialog: "La route est dangereuse ! Reviens quand tu auras plus d'experience."
}
```

### Types de gates
1. **NPC roadblocks** : PNJ sur un tile, bouge pas tant que flag pas set
2. **Story gates** : events scriptes dans l'ordre (compteur progression ou flags individuels)
3. **Item gates** : besoin d'un item specifique

### Implementation
```javascript
// Au chargement de la map, filtrer entites selon flags
map.npcs = mapData.npcs.filter(npc => {
  if (!npc.condition) return true;
  return evaluateCondition(npc.condition, gameState.flags);
});
```

### Difficulte progressive
- Chaque zone a un niveau de difficulte pour l'IA petanque
- Dresseurs pre-configures avec difficulte specifique
- Le nombre de badges gate naturellement les zones = progression implicite
