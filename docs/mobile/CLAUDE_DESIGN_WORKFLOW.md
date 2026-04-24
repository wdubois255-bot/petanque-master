# Étoffer Claude Design pour Petanque Master

Claude Design (Anthropic Labs, avril 2026) est conçu pour des apps web/mobile classiques (React, Next.js). Pour un **jeu Phaser 4**, il faut l'étendre via un **bridge** entre la sortie Claude Design et le code Phaser. Ce document décrit 4 extensions concrètes pour maximiser l'utilité de l'outil sur notre projet.

## 1. Bridge « Design spec → Constants Phaser »

**Problème** : Claude Design exporte des positions CSS (px, %, flex). Phaser utilise `scene.add.image(x, y, key)` avec des coords absolues. Pas d'équivalent direct.

**Solution** : écrire un parser qui convertit une spec JSON Claude Design vers une mise à jour `Layout.js` et `Constants.js`.

**Format pivot** (JSON) — chaque scène exporte :
```json
{
  "scene": "TitleScene",
  "mode": "portrait",
  "anchors": {
    "logo":       { "x": 240, "y": 150, "origin": [0.5, 0] },
    "menuPrimary": { "x": 240, "y": 420, "w": 340, "h": 66 },
    "menuStack":  { "step": 80, "count": 4 },
    "footer":     { "x": 240, "y": 930 }
  },
  "components": {
    "primaryButton": { "width": 340, "height": 66, "fillFrom": "#C4854A", "fillTo": "#9A6636", "borderRadius": 8 }
  }
}
```

**Script bridge** à créer (`scripts/design-to-phaser.js`) :
- Lit le JSON
- Génère un diff pour `src/utils/Layout.js` (nouvelles ancres)
- Génère les dimensions pour `Constants.js`
- Affiche le diff pour validation humaine

Gain : 1 round-trip Claude Design → copie JSON → `node scripts/design-to-phaser.js` → 30 min au lieu de 3h de coding coord-par-coord.

## 2. Preview live Phaser dans iframe

**Problème** : Claude Design a un preview HTML/CSS. Il ne peut pas preview le rendu **réel Phaser** (sprites pixel art, physique custom).

**Solution** : un petit serveur Vite preview en mode "designer mode" qui :
- Accepte un JSON de specs via API POST
- Regenère la scène courante avec ces ancres
- Rafraîchit en hot reload dans l'iframe du side-panel Claude Design

Implementation :
```
scripts/preview-server.js
  → Express sur port 8090
  → POST /spec accepte JSON
  → Écrit dans tmp/design-override.json
  → Layout.js le lit en dev mode (if devOverride) et applique les ancres
  → Vite HMR re-render la scène
```

Gain : fermeture de la boucle « je change une ancre → je vois le rendu Phaser réel instantanément » sans build manuel.

## 3. Import assets PixelLab vers Claude Design

**Problème** : Claude Design peut importer des images mais ne sait pas les traiter en "sprites pixel art" avec les bons settings (image-rendering: pixelated, scaling nearest neighbor).

**Solution** : script `scripts/export-sprites-for-design.js` :
- Parcourt `public/assets/sprites/v2_new/`
- Pour chaque spritesheet (128×128 chars), extrait les frames clés (idle, throw, greeting)
- Upscale × 4 en nearest-neighbor (pour que Claude Design affiche du beau pixel art)
- Génère un zip `claude-design-assets.zip` contenant :
  - 1 PNG par personnage (idle frame upscaled 512×512)
  - 1 PNG par boule (64×64 upscaled 256×256)
  - 1 PNG par terrain background
  - Un `palette.json` avec les couleurs exactes
  - Un `design-tokens.json` avec les constants UI (TOUCH_BUTTON_SIZE, SHADOW_TEXT, etc.)

Usage : tu drag ce zip dans Claude Design → il construit son design system automatiquement à partir de ton art réel.

## 4. Export « animation timeline » Claude Design → Phaser tweens

**Problème** : Claude Design fait des animations CSS (`@keyframes`, `transition`). Phaser utilise `scene.tweens.add({...})` avec des durations en ms, easings nommés (`Sine.easeInOut`).

**Solution** : format JSON intermédiaire + parser :

```json
{
  "target": "logo",
  "from": { "alpha": 0, "scale": 0.8, "y": 100 },
  "to": { "alpha": 1, "scale": 1, "y": 150 },
  "duration": 800,
  "ease": "Back.easeOut",
  "delay": 200
}
```

→ script génère le code Phaser équivalent :
```js
scene.tweens.add({
    targets: this._logo,
    alpha: { from: 0, to: 1 },
    scale: { from: 0.8, to: 1 },
    y: { from: 100, to: 150 },
    duration: 800,
    ease: 'Back.easeOut',
    delay: 200
});
```

Gain : Claude Design décrit l'intention en animation visuelle, le bridge génère le code Phaser exact. Plus d'approximation « est-ce que 800ms est le bon timing ? ».

## Roadmap d'implémentation des 4 extensions

| Extension | Coût dev | Valeur | Priorité |
|---|---|---|---|
| 1. Bridge spec → Constants | 1 session Sonnet | ★★★★★ | **Haute — à faire avant Phase 2 polish** |
| 2. Preview live Phaser | 2-3 sessions | ★★★★☆ | Moyenne — si itérations nombreuses |
| 3. Export assets PixelLab | 1 session | ★★★★☆ | Haute — pour tout nouveau redesign |
| 4. Animation timeline | 2 sessions | ★★★☆☆ | Basse — après Phase 2 terminée |

**Quick win recommandé** : commencer par **(1) Bridge** + **(3) Export assets**.
Avec ces 2 extensions, Claude Design devient productif pour notre stack Phaser 4 en moins de 2 sessions Sonnet de mise en place, et fait gagner ensuite 3-5x plus sur toutes les phases de polish à venir (Phase 2, Phase D Overworld, v2 refresh).

## Alternative pragmatique (sans coder les bridges)

Si ces 4 extensions sont trop lourdes à implémenter maintenant, workflow minimal :

1. **Toi** : conversation avec Claude Design → exporter screenshots PNG haute def de chaque scène
2. **Claude Code (moi)** : reçoit les PNG, mesure les positions à l'œil (outil `pixel ruler`), traduit en `Layout.js` ancres
3. **Preview** : F5 dans DevTools mobile pour valider
4. **Itération** : Claude Design ajuste, on rebouscle

Pas aussi efficient que les bridges automatisés, mais **zéro code d'infra à écrire** — tu commences immédiatement.
