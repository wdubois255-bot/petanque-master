# Handoff — nouvelle session Claude Code (mobile polish suite)

Ce fichier est destiné à être collé en premier message dans une nouvelle conversation Claude Sonnet pour reprendre le travail. Chargement auto : `@docs/mobile/HANDOFF_SESSION_75.md`.

---

## Contexte projet

Projet **Petanque Master** (Phaser 4, Vite, pixel art). Publié sur itch.io en desktop paysage 832×480.
Mobile portrait **480×960** en cours de polish — 16 commits livrés dans la session précédente (2026-04-24/25) sur la refonte mobile-first.

## Ce qui est fait (vague « mobile-first » session 75)

### Infrastructure
- **Design system mobile** dans [src/utils/Constants.js](../../src/utils/Constants.js#L350-L400) — `UI.TITLE_SIZE`/`MENU_SIZE`/`HERO_H`/`PRIMARY_H`… scale automatiquement portrait vs desktop via `_IS_PORTRAIT_DEVICE` (détection UA)
- **Ancres UI orientation-aware** : `UI.BACK_X`/`BACK_Y`/`GALETS_X`/`GALETS_Y` (étaient fixées desktop → hors-écran en portrait)
- **UIFactory** : `addBackButton` pilule 72×40 avec flèche mobile / texte desktop ; `addControlsHint` masqué en portrait (pas de clavier mobile)

### Scènes refondues (branches `Layout.isPortrait`, desktop strictement inchangé)

| Scène | Change majeur |
|-------|---------------|
| [TitleScene](../../src/scenes/TitleScene.js#L497) | Hero JOUER 440×88 + 2×2 cards 192×88, icônes scale 2.4×, tap-to-start « TOUCHEZ POUR COMMENCER » |
| [ShopScene](../../src/scenes/ShopScene.js#L20) | Preview compact 240px (vs 330), cartes verticales 132px icône centrée top, ACHETER 220×44 blanc sur vert, onglets 52px |
| [CharSelectScene](../../src/scenes/CharSelectScene.js#L105) | Grid 3×4, preview panel pleine largeur bas (pw=460, ph=400), stats bars 160×14, titre 20px |
| [ArcadeScene](../../src/scenes/ArcadeScene.js#L310) | Chips 60px, NODE_POSITIONS rescalés [60..420] (vs [130..700]), stats 220×8 1-col, COMBATTRE 400×64 font 26px bold |
| [ResultScene](../../src/scenes/ResultScene.js#L82) | VICTOIRE 46px, score 36px, main button W-60×68 font 26px bold |
| [PlayerScene](../../src/scenes/PlayerScene.js#L12) (MON PERSO) | Bandeau haut 340px full-width (sprite + nom + stats + XP + abilities + équipement), tabs 52px, content full-width |
| [QuickPlayScene](../../src/scenes/QuickPlayScene.js#L43) (PARTIE RAPIDE) | Banner 2 lignes, 4 tabs 120×56, preview J1/VS/J2 bandeau haut greeting animé, grille 4×3 cellules 104×96, P1/P2 empilés vertical pleine largeur, JOUER 420×72 |

### Tests mobile
[tests/e2e/mobile-screenshots.pw.js](../../tests/e2e/mobile-screenshots.pw.js) — 9 captures Pixel 5 :
- 01 title / 02 title-menu / 03 charselect / 04 quickplay-old / 05 match / 06 shop / 07 arcade / 08 player / 09 quickplay-new

## État technique

- **Vitest 3167/3167** ✓
- **Build** : `npm run build` → ~12s OK
- **Non-régression** : `mobile-phase1.pw.js` desktop + portrait OK
- **104 commits d'avance sur `origin/master`** — à pusher si tout est validé

Pour retester :
```bash
npx vitest run                                                              # 3167 pass
npm run build                                                               # <15s
npx playwright test tests/e2e/mobile-screenshots.pw.js --project="Pixel 5"  # captures dans docs/mobile/screenshots/
npx playwright test tests/e2e/mobile-phase1.pw.js                           # smoke desktop + portrait
```

Dev server LAN pour test sur téléphone :
```bash
npm run dev
# ouvrir http://192.168.1.16:8080 sur le phone (QR dans docs/mobile/qr-phone.png)
```

## Règles cadre (à ne JAMAIS violer)

- **Physique intouchable** : `src/petanque/Ball.js`, `PetanqueEngine.js`, `Cochonnet.js` — validés par 570 tests Vitest
- **Desktop 832×480 inchangé** : itch.io publié. Tout nouveau changement doit être conditionné `Layout.isPortrait`
- **Constants.js source unique** : pas de valeurs hardcodées ailleurs
- **Phaser scene reuse** : toujours reset les flags dans `init()` (Phaser réutilise les instances)
- **SaveManager** : jamais de `localStorage` direct
- **Commits atomiques** : un commit = un fix/feat, préfixé `feat: mobile — ...` ou `fix: mobile — ...`

## Scènes non encore refondues mobile-first (priorités à discuter)

1. **PetanqueScene** (match en cours) — HUD power meter, score panel, aim indicator. La physique est intouchable mais l'UI peut être améliorée pour mobile
2. **VSIntroScene** — transition avant match, 2s environ, mineur
3. **LevelUpScene** — à auditer
4. **TutorialScene** — à auditer
5. **CreditsScene** — peu visible
6. **OverworldScene** — future (V2 village)

## Premier prompt à envoyer au nouveau Claude Sonnet

> Lis `docs/mobile/HANDOFF_SESSION_75.md` pour le contexte complet.
>
> État : 16 commits de refonte mobile-first portrait livrés (design system UI + 7 scènes majeures refondues), Vitest 3167/3167, build OK, non-régression desktop OK.
>
> Je vais tester les builds actuels sur mon téléphone (QR `docs/mobile/qr-phone.png` + `http://192.168.1.16:8080`). Je te dirai scène par scène ce qui reste à améliorer.
>
> Règles :
> - Commit atomique par fix (`fix: mobile — ...` ou `feat: mobile — ...`)
> - Vitest 3167/3167 après chaque commit
> - Non-régression desktop stricte (branche `Layout.isPortrait` pour tout changement)
> - PAS toucher à la physique (Ball.js / PetanqueEngine.js / Cochonnet.js)
> - Reproduis chaque souci via Playwright Pixel 5 ou DevTools mobile avant de fixer

## Mémoire projet utile

Voir `C:\Users\wdubo\.claude\projects\c--Users-wdubo-...\memory\MEMORY.md` :
- `project_mobile_strategy.md` — décisions cadre portrait
- `feedback_phaser_scene_reuse.md` — CRITIQUE reset init()
- `feedback_always_commit.md` — toujours commiter
- `project_state.md` — état technique verifié
