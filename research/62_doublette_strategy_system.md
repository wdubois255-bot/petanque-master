# 62 — Systeme Doublette avec Strategie d'Equipe

## Resume

En mode 2v2, le joueur choisit avant chaque tour de son partenaire si celui-ci doit
**Pointer** (se rapprocher du cochonnet) ou **Tirer** (deloger une boule adverse).
Ca ajoute une couche strategique unique au gameplay.

## Regles FIPJP Doublette

- 2 joueurs par equipe
- 3 boules par joueur (6 total par equipe)
- Victoire a 13 points
- L'equipe qui perd la mene rejoue (cochonnet + premiere boule)
- Alternance : l'equipe la plus loin rejoue jusqu'a reprendre le point

## Changements moteur

### PetanqueEngine.js

Nouveau state dans la FSM :
```
STRATEGY_DECISION — avant le tour du partenaire IA, popup choix Pointer/Tirer
```

Nouvelles proprietes :
```js
this.teamPlayers = config.teamPlayers || null;  // { player: [{id, ai}], opponent: [{id, ai}] }
this.currentPlayerIndex = 0;                      // index dans l'equipe courante
this._partnerStrategyOverride = null;             // 'pointer' | 'tirer' | null
```

Helper :
```js
_isTeamMode() { return this.format === 'doublette' || this.format === 'triplette'; }
_nextPlayerIsTeammate() { ... }
```

### Fix existant : ballsPerPlayer

Ajouter 'doublette' dans le switch :
```js
this.ballsPerPlayer = this.format === 'doublette' ? 3 : ...
```

### PetanqueAI.js

Accepter roleOverride :
```js
constructor(..., roleOverride = null) { this._roleOverride = roleOverride; }
```

Dans _chooseTarget() : si override = 'tirer', forcer mode tir.
Si override = 'pointer', forcer mode pointage.

## UI Decision

Popup centre 300x150 avec :
- Nom du partenaire + question ("Marcel : Tu fais quoi ?")
- 2 boutons : POINTER (bleu) / TIRER (rouge)
- Contexte : score, boules restantes, distance cochonnet
- Auto-close 5s → default pointer

## Interaction avec archetypes

| Archetype | Force Pointer | Force Tirer |
|-----------|-------------|------------|
| Pointeur | Naturel ✓✓✓ | Maladroit ✗ (puissance basse) |
| Tireur | Maladroit ✗ | Naturel ✓✓✓ |
| Equilibre | OK ✓ | OK ✓ |
| Complet | OK ✓ | OK ✓ |

Afficher indicateur de confiance : vert (naturel) / jaune (OK) / rouge (maladroit).

## Effort estime

| Composant | LOC | Heures |
|-----------|-----|--------|
| PetanqueEngine (state + helpers) | 50 | 3 |
| PetanqueAI (override) | 30 | 2 |
| StrategyUIPanel.js (nouveau) | 150 | 4 |
| PetanqueScene integration | 80 | 2 |
| Tests | 60 | 3 |
| **Total** | **370** | **14** |

## Tests

1. Doublette ballsPerPlayer = 3
2. STRATEGY_DECISION state se declenche avant tour partenaire
3. Override 'tirer' force PetanqueAI en mode tir
4. Override 'pointer' force PetanqueAI en mode pointage
5. Auto-close 5s → default pointer
6. 1v1 classique non affecte (pas de STRATEGY_DECISION)
