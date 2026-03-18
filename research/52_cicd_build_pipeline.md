# 52 — CI/CD & Build Pipeline

> A lire quand : on automatise les tests, le deploiement, ou qu'on prepare des builds pour differentes plateformes.
> Complementaire a : research/40 (performance), research/27 (app stores), research/29 (plan lancement)

---

## 1. ARCHITECTURE CI/CD

```
 Developer (local)
      │
      ├── git push ──────────────────────────────────────┐
      │                                                   │
      ▼                                                   ▼
┌──────────────┐    ┌────────────────────────────────────────────┐
│ GitHub Repo  │    │ GitHub Actions                              │
│ main branch  │    │                                            │
│              │    │ ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│              │    │ │  Lint    │→│  Test    │→│  Build   │  │
│              │    │ │ (ESLint) │  │(Playwright)│ │ (Vite)  │  │
│              │    │ └──────────┘  └──────────┘  └────┬─────┘  │
│              │    │                                    │        │
│              │    │              ┌────────────────────┼────┐   │
│              │    │              │                    │    │   │
│              │    │              ▼                    ▼    ▼   │
│              │    │         GitHub Pages         Artifacts     │
│              │    │         (web deploy)     (Capacitor APK)   │
│              │    └────────────────────────────────────────────┘
└──────────────┘
```

---

## 2. GITHUB ACTIONS — WORKFLOWS

### 2.1 Workflow principal : CI (chaque push)

```yaml
# .github/workflows/ci.yml
name: CI — Lint, Test, Build

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx eslint src/ --ext .js --max-warnings 0

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test
        env:
          CI: true
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
```

### 2.2 Workflow deploy : GitHub Pages (sur tag)

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    tags: ['v*']

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

### 2.3 Workflow build mobile : Capacitor (manuel)

```yaml
# .github/workflows/build-android.yml
name: Build Android APK

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version (e.g. 1.0.0)'
        required: true

jobs:
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: 17

      - run: npm ci
      - run: npm run build

      # Capacitor sync
      - run: npx cap sync android

      # Build APK
      - name: Build APK
        working-directory: android
        run: ./gradlew assembleRelease

      - uses: actions/upload-artifact@v4
        with:
          name: petanque-master-${{ github.event.inputs.version }}.apk
          path: android/app/build/outputs/apk/release/app-release.apk
```

---

## 3. TESTS AUTOMATISES

### 3.1 Structure des tests

```
/tests/
  navigation.spec.js        # Boot → Title → tous les ecrans
  arcade-flow.spec.js       # Arcade complet avec Rookie
  petanque-gameplay.spec.js  # Lancer, score, mene, victoire
  progression.spec.js       # XP, stats, deblocages
  shop.spec.js              # Achat, solde, inventaire
  balance.spec.js           # Win rates, durees, equilibrage
  visual-regression.spec.js # Screenshots de reference
```

### 3.2 Configuration Playwright

```javascript
// playwright.config.js
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,        // 1 min par test (les matchs prennent du temps)
  retries: 1,            // 1 retry pour les tests flaky
  workers: 1,            // Sequentiel (le jeu ne supporte pas le parallele)
  use: {
    baseURL: 'http://localhost:4173', // Vite preview
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3.3 Exemple de test gameplay

```javascript
// tests/petanque-gameplay.spec.js
import { test, expect } from '@playwright/test';

test('Un match complet se deroule sans erreur', async ({ page }) => {
  await page.goto('/');

  // Attendre le titre
  await page.waitForTimeout(2000);

  // Cliquer "Quick Play"
  await page.click('canvas', { position: { x: 416, y: 280 } });
  await page.waitForTimeout(500);

  // Verifier qu'on est sur la scene de config
  // ... (les tests de jeu canvas sont bases sur les positions)

  // Surveiller les erreurs console
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });

  // Jouer pendant 2 minutes (simulation de clics)
  // ...

  expect(errors).toHaveLength(0);
});
```

### 3.4 Tests de non-regression visuelle

```javascript
// tests/visual-regression.spec.js
test('Ecran titre correspond au screenshot de reference', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(3000); // Attendre le chargement complet

  await expect(page).toHaveScreenshot('title-screen.png', {
    maxDiffPixels: 100, // Tolerance pour les particules aleatoires
  });
});
```

---

## 4. LINTING ET QUALITE DE CODE

### 4.1 ESLint configuration

```javascript
// .eslintrc.js
module.exports = {
  env: { browser: true, es2021: true },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-debugger': 'error',
    'eqeqeq': 'error',
    'no-var': 'error',
    'prefer-const': 'warn',
  },
  globals: {
    Phaser: 'readonly',
  }
};
```

### 4.2 Pre-commit hooks (Husky)

```bash
# Installation
npm install --save-dev husky lint-staged
npx husky init
```

```javascript
// package.json
{
  "lint-staged": {
    "src/**/*.js": ["eslint --fix", "git add"]
  }
}
```

```bash
# .husky/pre-commit
npx lint-staged
```

---

## 5. VERSIONING ET RELEASES

### 5.1 Schema de version

```
v1.0.0 — Premiere release publique (Sprint Final termine)
v1.1.0 — Ajout de features (nouvelle boule, terrain, etc.)
v1.1.1 — Bugfix
v1.2.0 — Feature majeure (boutique, online)
v2.0.0 — Changement majeur (refonte, multiplayer)
```

**Semantic versioning** : `MAJOR.MINOR.PATCH`
- **MAJOR** : changement qui casse la save (migration necessaire)
- **MINOR** : nouvelle feature
- **PATCH** : bugfix

### 5.2 Process de release

```bash
# 1. Verifier que tous les tests passent
npm test

# 2. Mettre a jour la version dans package.json
npm version minor  # ou major / patch

# 3. Creer le tag et pusher
git push && git push --tags

# 4. GitHub Actions deploie automatiquement sur Pages
# 5. Creer une release GitHub avec changelog
gh release create v1.1.0 --generate-notes
```

### 5.3 Changelog automatique

```yaml
# Dans le workflow deploy
- name: Generate changelog
  run: |
    echo "## What's Changed" > CHANGELOG.md
    git log $(git describe --tags --abbrev=0 HEAD~1)..HEAD --oneline >> CHANGELOG.md
```

---

## 6. BUILDS PAR PLATEFORME

### 6.1 Matrice des builds

| Plateforme | Outil | Output | Taille cible | Automatise ? |
|-----------|-------|--------|-------------|-------------|
| **Web (GitHub Pages)** | Vite | dist/ (HTML/JS/CSS) | < 10MB | ✅ Oui (CD) |
| **Web (itch.io)** | Vite | zip de dist/ | < 10MB | Manuel (upload) |
| **Android (APK)** | Capacitor + Gradle | .apk | < 50MB | ✅ Oui (CI) |
| **Android (AAB)** | Capacitor + Gradle | .aab (Play Store) | < 50MB | ✅ Oui (CI) |
| **iOS (IPA)** | Capacitor + Xcode | .ipa | < 50MB | ❌ Mac requis |
| **Desktop (Electron)** | Electron Builder | .exe / .dmg / .AppImage | < 150MB | ✅ Oui (CI) |
| **Steam** | Electron + Steamworks | Steam depot | < 150MB | Semi-auto |

### 6.2 Build web (principal)

```bash
# Build de production
npm run build

# Le resultat est dans dist/
# Deploye automatiquement sur GitHub Pages via CI
```

### 6.3 Build Capacitor (mobile)

```bash
# Setup initial (une fois)
npm install @capacitor/core @capacitor/cli
npx cap init "Petanque Master" "com.petanquemaster.app"
npx cap add android
# npx cap add ios  # (Mac uniquement)

# Build + sync
npm run build
npx cap sync

# Ouvrir dans Android Studio (pour debug)
npx cap open android
```

```javascript
// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.petanquemaster.app',
  appName: 'Petanque Master',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1A1510'
    },
    ScreenOrientation: {
      orientation: 'landscape'
    }
  }
};

export default config;
```

### 6.4 Build Electron (desktop/Steam)

```bash
# Setup
npm install --save-dev electron electron-builder

# Build
npx electron-builder --win --mac --linux
```

```javascript
// electron/main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1664,  // 832 × 2
    height: 960,  // 480 × 2
    resizable: true,
    fullscreenable: true,
    webPreferences: {
      nodeIntegration: false
    }
  });

  win.loadFile(path.join(__dirname, '../dist/index.html'));
  win.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);
```

---

## 7. ENVIRONNEMENTS

| Environnement | URL | Usage |
|--------------|-----|-------|
| **Local (dev)** | localhost:5173 | Developpement, HMR |
| **Preview** | localhost:4173 | Test du build avant deploy |
| **Staging** | staging.petanque-master.com | Test pre-prod (optionnel) |
| **Production** | petanque-master.com / GitHub Pages | Public |

### 7.1 Variables d'environnement

```bash
# .env.development
VITE_DEBUG=true
VITE_ANALYTICS=false
VITE_VERSION=dev

# .env.production
VITE_DEBUG=false
VITE_ANALYTICS=true
VITE_VERSION=1.0.0
```

```javascript
// Usage dans le code
if (import.meta.env.VITE_DEBUG === 'true') {
  this.debugOverlay.show();
}
```

---

## 8. MONITORING POST-DEPLOY

### 8.1 Verification automatique apres deploy

```yaml
# Dans le workflow deploy, apres le deploiement
- name: Smoke test production
  run: |
    sleep 30  # Attendre la propagation
    STATUS=$(curl -o /dev/null -s -w "%{http_code}" https://petanque-master.com)
    if [ "$STATUS" != "200" ]; then
      echo "ERREUR: Production retourne $STATUS"
      exit 1
    fi
    echo "Production OK (200)"
```

### 8.2 Alertes

| Alerte | Condition | Action |
|--------|----------|--------|
| Deploy echoue | GitHub Actions rouge | Notification email (par defaut) |
| Tests echouent | Playwright fail | PR bloquee (branch protection) |
| Site down | HTTP != 200 | Checker manuellement |

---

## 9. BRANCH STRATEGY

### 9.1 Modele simple (recommande pour solo/petit equipe)

```
main ─────────────────────────────────────────────── (production)
  │
  ├── feature/shop-scene ────── PR ──── merge ──────
  │
  ├── feature/rookie-progression ── PR ── merge ────
  │
  ├── fix/camera-follow-bug ── PR ── merge ─────────
```

- **main** = toujours deployable, toujours stable
- **feature/** = branches de travail, PR obligatoire
- **fix/** = corrections, PR obligatoire
- Pas de branche develop (overhead inutile pour un solo dev)

### 9.2 Protection de branche (GitHub)

```
Settings → Branches → Branch protection rules → main
  ✅ Require status checks to pass (CI)
  ✅ Require pull request reviews (optionnel pour solo)
  ❌ Require linear history (pas necessaire)
```

---

## 10. CHECKLIST CI/CD

### Setup initial

- [ ] `.github/workflows/ci.yml` cree et fonctionnel
- [ ] `.github/workflows/deploy.yml` cree et fonctionnel
- [ ] Playwright installe et configure
- [ ] Au moins 5 tests qui passent
- [ ] ESLint configure (pas d'erreurs)
- [ ] Branch protection sur main
- [ ] GitHub Pages active
- [ ] `npm run build` fonctionne sans erreur

### Avant chaque release

- [ ] Tous les tests passent (vert)
- [ ] Pas de warnings ESLint critiques
- [ ] Build de production < 10MB
- [ ] Version bumped dans package.json
- [ ] Tag git cree
- [ ] Deploy verifie (site accessible)
- [ ] Changelog genere
