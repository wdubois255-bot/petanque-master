# PLAN SESSION : Nettoyage et integration v2 complete

> Ce plan est le guide de reference pour la prochaine session.
> Chaque tache est ordonnee par priorite. Tester apres chaque bloc.

## Contexte

La refonte v2 a ete commitee mais **l'integration visuelle est cassee** :
- Plusieurs assets PixelLab sont des **grilles multi-icones** (padlock = 48 cadenas, trophy = 16 trophees, galet = 64 icons, star = 64 icons) mais traites comme des images uniques
- Les panneaux v2 (128x128) sont **etires sans 9-slice**, deformant le pixel art
- Des **personnages supprimes** (marcel, magicien, reyes) sont encore references dans le code
- Des couleurs **noir pur 0x000000** violent les regles CLAUDE.md
- Les **alphas sont trop bas** (0.12-0.15) rendant les overlays invisibles

---

## BLOC 1 — CRITIQUE : Corriger les spritesheets multi-icones (1h)

### 1.1 v2_padlock (48 cadenas en grille)

**Probleme** : L'image 256x256 contient 48 petits cadenas (8 lignes x 6 colonnes). Affichee entiere = grille de cadenas minuscules.

**Fichiers** :
- `src/scenes/BootScene.js` ligne ~124 : chargement
- `src/scenes/CharSelectScene.js` ligne ~166 : affichage

**Fix** : Charger en spritesheet et afficher un seul frame.
```javascript
// BootScene.js — remplacer :
this.load.image('v2_padlock', ...)
// par :
this.load.spritesheet('v2_padlock', ..., { frameWidth: 42, frameHeight: 32 })
// (256/6 ≈ 42px wide, 256/8 = 32px high — verifier dimensions exactes avec l'image)

// CharSelectScene.js — remplacer :
this.add.image(cx, cy + 8, 'v2_padlock').setScale(0.5)
// par :
this.add.sprite(cx, cy + 8, 'v2_padlock', 0).setScale(1.5).setOrigin(0.5)
```

**Verification** : Ouvrir CharSelectScene, verifier que chaque perso verrouille affiche UN SEUL cadenas bien visible.

### 1.2 v2_trophy (16 trophees en grille 4x4)

**Probleme** : Image 256x256 avec 16 trophees differents. Affichee entiere = grille illisible.

**Fichiers** :
- `src/scenes/BootScene.js` ligne ~123 : chargement
- `src/scenes/ResultScene.js` lignes ~48-52 : 2 trophees flanquant le titre

**Fix** :
```javascript
// BootScene.js :
this.load.spritesheet('v2_trophy', ..., { frameWidth: 64, frameHeight: 64 })

// ResultScene.js — ajuster scale :
this.add.sprite(..., 'v2_trophy', 0).setScale(1.0)  // frame 0 = premier trophee
```

**Verification** : Gagner une partie, verifier que 2 beaux trophees encadrent "VICTOIRE !".

### 1.3 v2_icon_galet (64 galets en grille 8x8)

**Fichiers** :
- `src/scenes/BootScene.js` ligne ~116 : chargement comme image
- `src/scenes/ResultScene.js` : icone monnaie
- `src/scenes/ShopScene.js` : icone monnaie

**Fix** :
```javascript
// BootScene.js :
this.load.spritesheet('v2_icon_galet', ..., { frameWidth: 32, frameHeight: 32 })

// ResultScene.js et ShopScene.js :
this.add.sprite(..., 'v2_icon_galet', 0).setScale(0.8)
```

### 1.4 v2_icon_star (64 etoiles en grille 8x8)

**Fichiers** :
- `src/scenes/BootScene.js` ligne ~117 : chargement comme image
- `src/scenes/ResultScene.js` : etoiles victoire

**Fix** :
```javascript
// BootScene.js :
this.load.spritesheet('v2_icon_star', ..., { frameWidth: 32, frameHeight: 32 })

// ResultScene.js _drawStars() :
this.add.sprite(sx, cy, 'v2_icon_star', 0).setScale(1.2)
```

### 1.5 v2_stat_icons (frame dimensions incorrectes)

**Probleme** : Charge avec `frameWidth: 64, frameHeight: 128` mais l'image est 256x256 en grille 4x4.

**Fix** :
```javascript
// BootScene.js ligne ~126 :
this.load.spritesheet('v2_stat_icons', ..., { frameWidth: 64, frameHeight: 64 })
```

**TEST BLOC 1** : `npm run build && npx playwright test tests/e2e/game.pw.js --reporter=list`

---

## BLOC 2 — HAUTE PRIORITE : Corriger les panneaux etires (1h)

### 2.1 Probleme global des panneaux

Les 4 panneaux (panel_simple, panel_ornate, panel_bolted, panel_elegant) sont des images 128x128 **etirees** a des dimensions non-carrees (200x340, 340x130, 560x180). Resultat : pixel art deforme.

### 2.2 Solution : NineSlice ou ratio preserve

**Option A — NineSlice** (meilleure) : Phaser 3.60+ supporte `this.add.nineslice()`.
```javascript
// Exemple pour un panneau 200x340 :
this.add.nineslice(px, py + ph/2, 'v2_panel_ornate', 0, pw, ph, 16, 16, 16, 16)
    .setOrigin(0.5);
// leftWidth=16, rightWidth=16, topHeight=16, bottomHeight=16
```

**Option B — Preserv aspect ratio** : Garder `setDisplaySize` mais avec ratio carre.
```javascript
// Au lieu de setDisplaySize(200, 340) qui deforme :
const size = Math.max(pw, ph);
this.add.image(px, py + ph/2, 'v2_panel_ornate')
    .setDisplaySize(size, size).setAlpha(0.9);
```

**Option C — Fond graphics + panneau decoratif** : Garder le rectangle graphics() pour le fond, poser le panneau v2 par-dessus comme decoration.

**Fichiers a modifier** :
- `CharSelectScene.js` ligne ~240 : `v2_panel_ornate` setDisplaySize(200, 340)
- `QuickPlayScene.js` ligne ~139 : `v2_panel_simple` setDisplaySize(PANEL_W+12, panelH)
- `ArcadeScene.js` ligne ~258 : `v2_panel_bolted` setDisplaySize(560, 180)
- `ResultScene.js` ligne ~130 : `v2_panel_elegant` setDisplaySize(340, 130)

**Pour chaque panneau** :
1. Ouvrir l'image, mesurer le bord decoratif (generalement 12-16px)
2. Appliquer NineSlice avec ces insets
3. Tester visuellement que les bords ne sont pas deformes

**TEST BLOC 2** : Ouvrir chaque scene dans le navigateur et verifier visuellement.

---

## BLOC 3 — HAUTE PRIORITE : Nettoyer les personnages morts (30min)

### 3.1 Supprimer marcel, magicien, reyes du code

Ces 3 personnages n'existent plus dans characters.json ni dans les sprites v2.

**ArcadeScene.js lignes ~354-360** : Remplacer les unlocks par les vrais persos v2.
```javascript
// Remplacer :
case 2: unlockCharacter('marcel'); break;
case 3: unlockCharacter('magicien'); unlockTerrain('docks'); break;
case 4: unlockCharacter('reyes'); break;
// Par les persos v2 du roster arcade (lire arcade.json pour les IDs corrects)
```

**PetanqueScene.js** :
- Ligne ~486 : `const opponentId = this.opponentId || 'marcel'` → `'ley'`
- Lignes ~372-395 : Abilities pour marcel/magicien/reyes → les remplacer par des abilities pour les vrais persos v2 (foyot, rocher, sofia, etc.)
- Lignes ~447-454 : Palette mapping → supprimer marcel/magicien/reyes

**TitleScene.js lignes ~277-283** : Reference a `marcel_animated` → supprimer ou remplacer

**PlayerScene.js ligne ~240** : charNames avec marcel/magicien/reyes → mettre a jour

**PortraitGenerator.js** : Supprimer les definitions de portrait pour magicien et reyes

### 3.2 Supprimer le chargement du sprite statique Rookie

**BootScene.js ligne ~86** : `this.load.image('rookie_static', ...)` → supprimer (plus necessaire)

### 3.3 Nettoyer CHAR_STATIC_SPRITES

**Constants.js ligne ~293** : `CHAR_STATIC_SPRITES = []` est OK mais le code qui le check est du code mort.

**Decision** : Garder l'array vide et les checks (pas de regression) OU supprimer tous les checks `CHAR_STATIC_SPRITES.includes()` dans 8 fichiers. Le plus sur est de garder (backward compatible si on ajoute un perso statique plus tard).

**TEST BLOC 3** : `npx vitest run` + `npm run build` + jouer un match Arcade complet

---

## BLOC 4 — MOYEN : Corriger les alphas et couleurs (20min)

### 4.1 Alphas trop bas

| Asset | Fichier | Ligne | Actuel | Cible |
|-------|---------|-------|--------|-------|
| v2_dialog_bg | ArcadeScene.js | ~127 | 0.15 | **0.30** |
| v2_terrain_terre | TerrainRenderer.js | ~586 | 0.12 | **0.25** |
| v2_bar_decorative | CharSelectScene.js | ~280 | 0.5 | **0.65** |

### 4.2 Noir pur 0x000000 → remplacer

| Fichier | Ligne | Ancien | Nouveau |
|---------|-------|--------|---------|
| TerrainRenderer.js | ~544 | `0x000000, 0.20` | `0x1A1510, 0.25` |
| TerrainRenderer.js | ~546 | `0x000000, 0.08` | `0x1A1510, 0.10` |
| TerrainRenderer.js | ~1543 | `'#000000'` | `'#1A1510'` |
| EngineRenderer.js | ~153 | `0x000000, 0.15` | `0x3A2E28, 0.18` |
| UIFactory.js | ~332 | `0x000000, 0.6` | `0x1A1510, 0.65` |
| LevelUpScene.js | ~71 | `0x000000, 0.7` | `0x1A1510, 0.75` |

**TEST BLOC 4** : Jouer une partie, verifier les terrains (pas de noir pur visible)

---

## BLOC 5 — MOYEN : Corriger v2_bar_power et v2_button (30min)

### 5.1 v2_bar_power (344x192 etiree a 128x20)

**Probleme** : Ratio original 1.79:1 etiree a 6.4:1 = barre ultra-fine deformee.

**AimingSystem.js lignes ~1234-1235** :
```javascript
// Actuel : setDisplaySize(128, 20) — trop fin
// Fix : setDisplaySize(140, 40) — preserv ratio approx
```

### 5.2 v2_button / v2_button_pressed (dimensions incompatibles)

**Probleme** : v2_button = 256x256 (carre), v2_button_pressed = 344x192 (rectangle). Quand on swap, le bouton change de forme.

**Fix** : Soit regenerer v2_button_pressed en 256x256, soit ne pas swapper et utiliser un tint/alpha a la place :
```javascript
// QuickPlayScene.js _updateDisplay() — remplacer le swap par un tint :
if (this._jouerBtnImg) {
    this._jouerBtnImg.setTint(jouerSelected ? 0xFFD700 : 0xFFFFFF);
    this._jouerBtnImg.setAlpha(jouerSelected ? 1.0 : 0.8);
}
```

---

## BLOC 6 — BAS : Ameliorations finales (30min)

### 6.1 characters.json : aligner le champ "sprite"

Le champ `sprite` dans characters.json dit `"char_la_choupe"` etc. mais le code utilise `CHAR_SPRITE_MAP`. Mettre a jour pour coherence :
```json
"sprite": "la_choupe_animated"  // au lieu de "char_la_choupe"
```

### 6.2 arcade.json : verifier que les opponents IDs correspondent aux vrais persos

Lire `public/data/arcade.json` et verifier que chaque `match.opponent` est un ID present dans characters.json.

### 6.3 DevTestScene : ajouter un test visuel des problemes corriges

Ajouter un 4eme onglet "AUDIT" qui affiche :
- Chaque asset UI a sa taille reelle avec son nom
- Un cadenas seul vs la grille (avant/apres)
- Les 4 panneaux avec et sans NineSlice

---

## BLOC 7 — TESTS FINAUX (30min)

### 7.1 Tests automatises
```bash
npx vitest run                    # 138 tests unit
npm run build                     # Build production
npx playwright test tests/e2e/    # TOUS les tests E2E (pas juste game.pw.js)
```

### 7.2 Tests visuels manuels (checklist)

Ouvrir `npm run dev` et verifier chaque scene :

- [ ] **TitleScene** : Logo v2 visible, pas deforme, taille correcte
- [ ] **CharSelectScene** :
  - [ ] Grille : 12 persos visibles, taille correcte (pas minuscules)
  - [ ] Persos verrouilles : UN cadenas visible (pas une grille de 48)
  - [ ] Preview droite : panneau pas deforme, perso en grand
  - [ ] Stats : icones v2 visibles a cote des labels
  - [ ] Barre decorative visible au-dessus des stats
- [ ] **QuickPlayScene** :
  - [ ] Panneau droit pas deforme
  - [ ] Bouton JOUER avec texture bois, etat presse visible
  - [ ] 5 terrains tous accessibles
- [ ] **ArcadeScene** :
  - [ ] Narrative : fond parchemin subtil mais visible
  - [ ] Panneau "PROCHAIN COMBAT" pas deforme
  - [ ] Adversaire en grand (pas minuscule)
- [ ] **VSIntroScene** : Sprites grands (scale 1.2), noms lisibles
- [ ] **PetanqueScene** :
  - [ ] Persos visibles sur le terrain
  - [ ] Jauge puissance visible pendant le lancer
  - [ ] Terrain terre : overlay gravier subtil
  - [ ] Pas de noir pur dans les ombres
- [ ] **ResultScene** :
  - [ ] Trophee : UN beau trophee (pas une grille de 16)
  - [ ] Etoiles : belles etoiles v2 (pas une grille de 64)
  - [ ] Panneau stats pas deforme
  - [ ] Cadre portrait autour du gagnant
  - [ ] Icone galet visible (pas une grille de 64)

### 7.3 Commit final
```bash
git add -A
git commit -m "Cleanup v2 : spritesheets corriges, panneaux NineSlice, code mort supprime, noir pur elimine"
```

---

## RESUME DES FICHIERS A MODIFIER

| Fichier | Modifications |
|---------|--------------|
| `src/scenes/BootScene.js` | Spritesheets : padlock, trophy, galet, star. Supprimer rookie_static. Fix stat_icons frames |
| `src/scenes/CharSelectScene.js` | NineSlice panel, sprite() padlock, stat icons scale, bar_decorative alpha |
| `src/scenes/ResultScene.js` | sprite() trophy/galet/star, NineSlice panel_elegant |
| `src/scenes/QuickPlayScene.js` | NineSlice panel_simple, button tint au lieu de swap |
| `src/scenes/ArcadeScene.js` | NineSlice panel_bolted, dialog_bg alpha, supprimer marcel/magicien/reyes unlocks |
| `src/scenes/ShopScene.js` | sprite() galet |
| `src/scenes/PetanqueScene.js` | Fallback ley, supprimer abilities marcel/magicien/reyes |
| `src/scenes/TitleScene.js` | Supprimer reference marcel_animated |
| `src/scenes/LevelUpScene.js` | 0x000000 → 0x1A1510, NineSlice panel |
| `src/scenes/PlayerScene.js` | Supprimer charNames marcel/magicien/reyes |
| `src/petanque/AimingSystem.js` | bar_power displaySize ajuste |
| `src/petanque/TerrainRenderer.js` | 0x000000 → 0x1A1510, terrain_terre alpha |
| `src/petanque/EngineRenderer.js` | 0x000000 → 0x3A2E28 |
| `src/ui/UIFactory.js` | 0x000000 → 0x1A1510 |
| `src/utils/Constants.js` | (deja OK) |
| `src/utils/PortraitGenerator.js` | Supprimer magicien/reyes portraits |
| `public/data/characters.json` | Aligner champ sprite |
| `public/data/arcade.json` | Verifier opponent IDs |

---

## TEMPS ESTIME : ~3h30

| Bloc | Temps | Priorite |
|------|-------|----------|
| 1 — Spritesheets multi-icones | 1h | CRITIQUE |
| 2 — Panneaux NineSlice | 1h | HAUTE |
| 3 — Code mort (persos) | 30min | HAUTE |
| 4 — Alphas et couleurs | 20min | MOYEN |
| 5 — Bar power et button | 30min | MOYEN |
| 6 — Alignement donnees | 30min | BAS |
| 7 — Tests finaux | 30min | OBLIGATOIRE |
