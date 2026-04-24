# Handoff — nouvelle session Claude Code (mobile polish)

Colle ce fichier dans le premier message au nouveau Claude, ou fais `@docs/mobile/HANDOFF_NEXT_SESSION.md`.

---

## Contexte

Projet **Petanque Master** (Phaser 4, Vite, pixel art). Publié sur itch.io en desktop paysage.
Session précédente (24 avril 2026) : **portage mobile portrait** complet.

30 commits livrés du `8559fed` au `0ead9ef`.

### Phases livrées
- **Phase 0** Infrastructure Layout ([src/utils/Layout.js](../../src/utils/Layout.js))
- **Phase 1** PetanqueScene portrait (terrain scale 2.1, distance métrique préservée)
- **Phase 2** 13 scènes menu basculent sur Layout.W/H
- **Phase 3** Bouton Retour WCAG 56×56 tactile
- **Phase 4** Audio iOS (user gesture + visibilitychange)
- **Phase 5** Safe areas iOS (env(safe-area-inset-*))
- **Phase 6** Tests Playwright mobile 3 devices (Pixel 5 / iPhone SE / iPhone 14) + CI `.github/workflows/mobile.yml`
- **Phase 7** Manifest PWA + icons 192/512/180
- **Tier S polish** (5 patterns) : juicy tap, floating text, match progress bar, power meter circulaire Golf Clash, confettis 60 particules
- **Tier A polish** (5 patterns) : rarity system 5 niveaux, CharSelect cards rarity, Shop grid 2-cols, Shop featured deal countdown, Title bottom nav 5 icônes

### Décisions cadre (figées, **ne pas changer**)
- **Desktop paysage 832×480** : strictement inchangé (itch.io publié). Tout changement doit être conditionné `Layout.isPortrait` ou `Layout.isMobile`.
- **Mobile portrait 480×960** (ratio 1:2)
- **TERRAIN_SCALE=2.1, VELOCITY_SCALE=1.6, FRICTION_SCALE=1.22** dans `src/utils/Constants.js` — découplage math dérivé pour préserver distance métrique 14.9m identique desktop/mobile
- Web-only (pas Capacitor/TWA)
- PWA manifest OUI, service worker NON

### Fichiers de référence à lire
1. [CLAUDE.md](../../CLAUDE.md) — conventions (PAS de Matter.js, PAS hardcoded, PAS localStorage direct, reset `init()` scene reuse)
2. [docs/mobile/PLAN.md](PLAN.md) — plan maître des phases
3. [docs/mobile/UX_INSPIRATIONS.md](UX_INSPIRATIONS.md) — patterns Tier S/A/B
4. [docs/mobile/DESIGN_MOCKUPS.html](DESIGN_MOCKUPS.html) + [DESIGN_MOCKUPS_V3.html](DESIGN_MOCKUPS_V3.html) — référence visuelle
5. [src/utils/Layout.js](../../src/utils/Layout.js) — API : `Layout.W`, `Layout.H`, `Layout.isMobile`, `Layout.isPortrait`, `Layout.safe`, `Layout.anchor()`
6. [src/utils/Constants.js](../../src/utils/Constants.js) — palette COLORS, `RARITY_COLORS`, physique

### Validation (à lancer à chaque étape)
- `npx vitest run` → **3167/3167 OK** avant chaque commit
- `npm run build` → OK < 15s
- `npx playwright test tests/e2e/mobile-smoke.pw.js --project="Pixel 5"` → non-régression mobile

---

## Mission nouvelle session

**L'utilisateur a identifié des soucis** en testant sur son téléphone via Vite LAN (`http://192.168.1.16:8080`, QR dans `docs/mobile/qr-phone.png`).

### Mode d'emploi avec l'utilisateur

1. Demande-lui de **lister chaque bug / souci** avec screenshot si possible (scène concernée, comportement attendu vs observé).
2. Pour chaque bug, **reproduis avant de fixer** :
   - Via Playwright Pixel 5 si possible (`tests/e2e/mobile-screenshots.pw.js` comme base)
   - Via dev server + DevTools mobile sinon
3. **Un bug = un commit atomique** avec message `fix: mobile — <description>`.
4. Vitest 3167/3167 après chaque fix.
5. **Non-régression desktop** : si un fix touche du code partagé, ajouter un guard `Layout.isPortrait` / `Layout.isMobile`.

### Patterns Tier B à garder en tête (si l'utilisateur veut enchaîner après les fixes)

Du doc UX_INSPIRATIONS.md :
- Daily Challenge card Title
- Wind indicator match
- Share button Result
- Compare mode Shop
- Move highlights replay Result

### Gotchas / pièges connus

- **Vitest flake occasionnel** : 1ère exécution après edit Constants.js peut renvoyer « 0 tests ». Relance une 2e fois → OK. Pas un bug applicatif.
- **WebKit iPhone keyboard** : le test mobile-smoke sur iPhone WebKit est flaky (keyboard Space binding). Non-régression app, juste fragilité test.
- **PetanqueScene physique** : ne JAMAIS toucher à Ball.js / PetanqueEngine.js / Cochonnet.js — la physique est validée par 570 tests Vitest.
- **Layout dans Constants.js** : ne PAS importer Layout depuis Constants (circular). Utiliser la détection UA locale `_IS_PORTRAIT_DEVICE` déjà présente.
- **Sprites persos/boules/cochonnets** : PNG existants dans `public/assets/sprites/v2_new/`. Ne pas régénérer, utiliser tel quel. Pour nouveaux sprites, PixelLab (via mcp).

### Workflow commits

```
git commit -m "fix: mobile — <description courte>

<détail ce qui a changé et pourquoi>

Co-Authored-By: Claude <model-id> <noreply@anthropic.com>"
```

### Outils disponibles

- [scripts/design-to-phaser.mjs](../../scripts/design-to-phaser.mjs) — bridge pour traduire un JSON Claude Design en ancres Layout.js
- [tests/e2e/mobile-screenshots.pw.js](../../tests/e2e/mobile-screenshots.pw.js) — capture screenshots toutes scènes mobile
- [tests/e2e/mobile-phase1.pw.js](../../tests/e2e/mobile-phase1.pw.js) — smoke test desktop + portrait
- `.github/workflows/mobile.yml` — CI tests mobile

### Mémoire projet (claude memory)
- `project_mobile_strategy.md` contient les décisions cadre (portrait, web-only, dual desktop/mobile)
- `feedback_phaser_scene_reuse.md` : **CRITIQUE** — toujours reset flags dans `init()` des scènes
- `feedback_always_commit.md` : toujours commiter après chaque feature validée

---

## Premier prompt à envoyer

> Lis `docs/mobile/HANDOFF_NEXT_SESSION.md` pour le contexte complet. Le portage mobile portrait est livré (phases 0-7 + Tier S + Tier A, 30 commits). J'ai testé sur mon téléphone via `http://192.168.1.16:8080` et j'ai repéré ces soucis : [LISTE TES BUGS ICI]. Corrige-les un par un (commit atomique chaque fix), valide Vitest 3167/3167 à chaque étape, non-régression desktop stricte.
