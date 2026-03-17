# Wrapper Technologies : Phaser 3 vers App Stores

Recherche effectuee le 17 mars 2026.

---

## 1. CAPACITOR 8 (Ionic) — RECOMMANDE POUR MOBILE

### Principe
Capacitor emballe le build Vite (`dist/`) dans un WebView natif :
- **iOS** : WKWebView
- **Android** : Chromium WebView (mis a jour via Play Store)

### Integration avec le projet Petanque Master
```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Petanque Master" "com.petanquemaster.app" --web-dir dist
npm run build
npx cap add android && npx cap add ios
npx cap sync
# Ouvrir dans Android Studio / Xcode pour build + signature
```

### Avantages
- **Officiellement recommande par Phaser** : page dediee dans la doc Capacitor (`capacitorjs.com/docs/guides/games`)
- ~1 million de telechargements npm/semaine (Capacitor 8, decembre 2025)
- Acces aux APIs natives via plugins (haptics, push notifications, filesystem, camera...)
- Supporte les plugins Cordova en fallback
- Swift Package Manager sur iOS (Capacitor 8)
- Fonctionne directement avec Vite (notre setup actuel)
- Communaute tres active

### Inconvenients
- Tourne dans un WebView → plafond de performance inferieur au natif pur
- iOS necessite un Mac + Xcode pour builder
- Debug natif plus complexe pour un dev web

### Plugins utiles pour Petanque Master
- `@capacitor/haptics` : vibration au lancer de boule
- `@capacitor/splash-screen` : ecran de demarrage natif
- `@capacitor/status-bar` : gestion barre de statut
- `@capacitor/keyboard` : gestion clavier (si chat multijoueur)
- `cordova-plugin-purchase` ou RevenueCat : achats in-app
- `@nickytonline/capacitor-admob` : publicites

---

## 2. CORDOVA / PHONEGAP — LEGACY, NE PAS UTILISER

- PhoneGap officiellement abandonne par Adobe
- Cordova encore maintenu mais Capacitor l'a remplace
- Capacitor supporte les plugins Cordova en retro-compatibilite
- **Verdict : ne pas demarrer un nouveau projet sur Cordova**

---

## 3. ELECTRON — DESKTOP (STEAM)

### Principe
Bundle Chromium + Node.js en executable desktop natif.

### Avantages
- Battle-tested (VS Code, Discord, Slack)
- Chromium complet = meilleure compatibilite WebGL/WebView
- Integration Steamworks SDK via `greenworks` ou `steamworks.js`
- Cross-platform : Windows, macOS, Linux
- Large ecosysteme de plugins

### Inconvenients
- Bundle lourd (~150-200 MB minimum, Chromium inclus)
- Consommation memoire plus elevee
- Percu comme "bloated" par certains joueurs

### Pour Steam
C'est la methode la plus courante pour publier des jeux HTML5 sur Steam. Integration Steamworks pour achievements, leaderboards, cloud saves, DLC.

---

## 4. TAURI — DESKTOP (ALTERNATIVE LEGERE)

### Principe
Utilise le WebView natif de l'OS (WebView2 Windows, WebKit macOS/Linux). Backend en Rust.

### Avantages
- Bundles ultra-legers (600 KB vs 150 MB pour Electron)
- Empreinte memoire faible
- Meilleur modele de securite (Rust)
- Supporte iOS et Android depuis Tauri 2.0 (stable)
- Cross-platform complet

### Inconvenients
- Comportement WebView variable selon l'OS (differences de rendu possibles)
- Ecosysteme plus petit qu'Electron
- Connaissance Rust utile pour personnalisation avancee
- Support mobile plus recent et moins eprouve que Capacitor
- Integration Steamworks moins documentee

---

## 5. PWA (Progressive Web App)

### Principe
Ajouter `manifest.json` + service worker pour rendre le jeu installable depuis le navigateur.

### Avantages
- Zero cout de distribution, zero commission
- Mises a jour instantanees (pas de review process)
- Fonctionne sur toutes les plateformes
- Deja un build web en place

### Inconvenients
- Pas de presence App Store (probleme de decouverte)
- Acces limite aux APIs natives
- iOS Safari limite les PWAs (stockage, push recents seulement)
- Pas d'achats in-app natifs possibles
- Apple decourage les PWAs monetisees

### Verdict
Bon complement (offrir une version PWA a cote des apps store), mais pas suffisant comme seul canal si on veut une presence store.

---

## 6. PERFORMANCE WEBVIEW SUR MOBILE

### iOS (WKWebView)
- JIT compilation JavaScript = bonnes performances JS
- WebGL 2.0 avec acceleration GPU
- 60 FPS pour les jeux 2D canvas
- Notre jeu pixel art (832x480, peu de draw calls) est largement dans les capacites

### Android (Chromium WebView)
- WebGL 2.0 avec acceleration GPU
- Performances variables selon les appareils (fragmentation Android)
- Globalement bon pour les jeux 2D

### Optimisations pour Phaser 3 mobile
- Renderer WebGL (defaut Phaser) ✓
- `image-rendering: pixelated` ✓ (deja en place)
- Minimiser les draw calls (texture atlases)
- Touch events natifs pour le drag-and-release ✓
- `assetsInlineLimit: 0` dans Vite ✓ (deja configure)
- Pre-render layers statiques ✓ (deja en place)

### Verdict pour Petanque Master
Un jeu de petanque pixel art a 832x480 est une charge **extremement legere** pour les WebViews modernes. Zero probleme de performance prevu sur tout appareil des 5 dernieres annees.

---

## 7. MONETISATION

### Achats in-app (IAP)
- **RevenueCat** (via Capacitor plugin) : API unifiee Apple + Google IAP
- `cordova-plugin-purchase` : alternative compatible Capacitor
- Apple/Google prennent 30% (15% si < 1M$/an via Small Business Program)
- Les biens numeriques DOIVENT utiliser le systeme IAP natif de la plateforme

### Publicite
- **AdMob** (Google) : plugin Capacitor communautaire
- **Unity Ads** : SDK JavaScript
- Interstitiels entre les matchs + rewarded video (bonus) = bon modele pour casual

### Premium
- App payante 1,99-4,99 EUR : simple, bonne UX, revenus moindres
- Modele bien adapte a Steam pour les jeux indie

### Items potentiels pour Petanque Master
- Boules cosmetiques
- Skins de personnages
- Terrains additionnels
- Deblocage "version complete" (free-to-play avec contenu limite)

---

## 8. RISQUE REJET APPLE

### Guideline 4.2 (Minimum Functionality)
Apple peut rejeter les apps qui sont "juste un site web dans un wrapper".

### Mitigation
- Ajouter des fonctionnalites natives via Capacitor :
  - Haptics (vibration au lancer)
  - Splash screen natif
  - Push notifications
  - Mode offline avec service worker
  - Gestion propre de la status bar
- L'app doit "sentir" native, pas web
- Prevoir 1-2 semaines de polish natif avant soumission

---

## TABLEAU COMPARATIF

| Technologie | Cible | Bundle | Performance | Effort | Recommande |
|------------|-------|--------|-------------|--------|------------|
| Capacitor 8 | iOS/Android | Leger | Tres bonne (2D) | Faible | **OUI** |
| Electron | Desktop | Lourd (150 MB) | Excellente | Faible | OUI (Steam) |
| Tauri | Desktop/Mobile | Ultra-leger | Bonne | Moyen | Alternative |
| PWA | Web | Aucun | Native web | Tres faible | Complement |
| Cordova | Mobile | Leger | Bonne | Faible | NON (legacy) |

## STACK RECOMMANDEE

| Cible | Wrapper | Build Tool |
|-------|---------|------------|
| iOS | Capacitor 8 | Xcode |
| Android | Capacitor 8 | Android Studio |
| Windows/macOS/Linux | Electron ou Tauri | electron-builder ou tauri-cli |
| Web | PWA | Vite |
