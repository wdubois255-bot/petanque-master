# Tests mobile — Playwright

Phase 6 du portage mobile : couverture E2E sur 3 devices émulés Playwright.

## Devices couverts

| Device | Viewport approx. | UA |
|--------|------------------|----|
| iPhone SE    | 375×667 portrait | iOS Safari 13 descriptor Playwright |
| iPhone 14    | 390×844 portrait | iOS Safari descriptor Playwright |
| Pixel 5      | 393×851 portrait | Android Chrome descriptor Playwright |

Définis via `devices[...]` dans `playwright.config.js`. Pour la liste complète des devices Playwright : https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json

## Stratégie de filtrage

- Project `desktop` utilise `grepInvert: /@mobile/` → skip tous les tests mobile, garde l'intégralité de la suite existante à 1664×960.
- Projects `iPhone SE`, `iPhone 14`, `Pixel 5` utilisent `grep: /@mobile/` → ne lancent QUE les tests dont le titre contient `@mobile`.

Les baselines existantes (desktop) restent donc intactes.

## Commandes

```bash
# Lancer uniquement les tests mobile sur les 3 devices
npm run test:e2e:mobile

# Régénérer les baselines (premier run ou après changements UI)
npm run test:e2e:mobile:update

# Lancer un seul device
npx playwright test --project="iPhone SE" --grep @mobile

# Debug interactif
npx playwright test --grep @mobile --ui
```

## Fichiers de tests mobile

| Fichier | Contenu |
|---------|---------|
| `tests/e2e/mobile-phase1.pw.js` | Smoke legacy phase 1 (desktop + UA mobile) |
| `tests/e2e/mobile-smoke.pw.js`  | Navigation Title → PetanqueScene, canvas portrait, zéro erreur |
| `tests/e2e/mobile-visual.pw.js` | Visual regression Title / QuickPlay / PetanqueScene |

## Ajouter un nouveau device

1. Trouver le nom exact dans le catalogue Playwright (ex. `'Galaxy S9+'`).
2. Dans `playwright.config.js`, ajouter un project :
   ```js
   { name: 'Galaxy S9+', use: { ...devices['Galaxy S9+'] }, grep: /@mobile/ },
   ```
3. Lancer `npm run test:e2e:mobile:update` pour générer les baselines visuelles du device.
4. Commit avec les nouvelles PNG dans `tests/e2e/snapshots/mobile-visual.pw.js/`.

## Ajouter un nouveau test mobile

- Le titre du test OU son describe DOIT contenir `@mobile`.
- Pour isoler les snapshots par device, utiliser `testInfo.project.name` dans le nom du PNG :
  ```js
  await expect(page.locator('canvas'))
      .toHaveScreenshot(`${testInfo.project.name.replace(/\s+/g, '-')}-mon-test.png`);
  ```
- Préférer la navigation clavier (`Space`, `ArrowDown`) — stable cross-device tant que la phase 3/4 input tactile n'est pas finie.

## Troubleshooting

- **"Screenshot does not match baseline"** après changement UI volontaire : lancer `npm run test:e2e:mobile:update`, vérifier visuellement les PNG, commit.
- **Flakiness sur PetanqueScene** : augmenter le `maxDiffPixelRatio` du test concerné (particles / tweens).
- **Tests mobile lancés sur desktop par erreur** : vérifier que `grepInvert` est bien présent sur le project `desktop` dans `playwright.config.js`.

## CI

Pas de workflow GitHub Actions dédié mobile pour l'instant (cf. plan phase 6).
Ajouter `.github/workflows/mobile.yml` si besoin d'automatiser :

```yaml
- run: npm ci
- run: npx playwright install --with-deps chromium
- run: npm run test:e2e:mobile
```
