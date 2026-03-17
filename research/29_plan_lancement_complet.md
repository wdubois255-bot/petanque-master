# Plan de Lancement Complet — Petanque Master

Recherche effectuee le 17 mars 2026. Plan en 5 phases.

---

## SYNTHESE

Petanque Master (Phaser 3) peut etre deploye sur :
- **Web** : PWA, itch.io, CrazyGames/Poki (gratuit)
- **Mobile** : Capacitor 8 → App Store + Google Play
- **Desktop** : Electron → Steam

Budget minimum : ~500 EUR. Scalable a 10 000+ joueurs simultanes pour ~300 EUR/mois.

---

## PHASE 1 — WEB (Maintenant, 0 EUR)

### Actions
1. Publier sur **itch.io** (upload HTML5, jouable dans le navigateur)
2. Soumettre a **CrazyGames** et/ou **Poki** (revenue share pub ~50-70%)
3. Ajouter support **PWA** au projet :
   - `manifest.json` dans `/public`
   - Service worker basique (cache offline)
   - Icones multi-tailles (192x192, 512x512)
4. Optimiser le SEO du site GitHub Pages

### Objectifs
- Valider le gameplay aupres de vrais joueurs
- Collecter du feedback
- Mesurer la retention (combien de joueurs reviennent ?)
- Construire une audience initiale

### Metriques a suivre
- Sessions/jour
- Duree moyenne de session
- Taux de completion d'un match
- Retour J1, J7, J30

---

## PHASE 2 — ANDROID (1-2 mois apres Phase 1, ~25 EUR)

### Pre-requis
- Auto-entrepreneur cree (gratuit, en ligne)
- Compte Google Play Developer (25 USD)

### Actions techniques
1. `npm install @capacitor/core @capacitor/cli`
2. `npx cap init "Petanque Master" "com.petanquemaster.app" --web-dir dist`
3. `npx cap add android`
4. Adapter les controles tactiles :
   - Le drag-and-release fonctionne naturellement au tactile
   - Ajouter des zones de touch plus grandes pour les boutons UI
   - Gerer le mode paysage force
5. Ajouter des touches natives :
   - `@capacitor/haptics` : vibration au lancer
   - `@capacitor/splash-screen` : ecran natif au demarrage
   - `@capacitor/status-bar` : immersive mode
6. Creer les assets store :
   - Icone 512x512 (Google Play)
   - Feature graphic 1024x500
   - 4-8 screenshots gameplay
   - Video courte (30s)
7. Remplir le questionnaire IARC (classification age)
8. Rediger description + mots-cles ASO
9. `npm run build && npx cap sync && npx cap open android`
10. Signer l'APK/AAB dans Android Studio
11. Publier sur Google Play

### Documents juridiques requis
- CGU
- Politique de confidentialite (URL accessible)
- Mentions legales

---

## PHASE 3 — BACKEND MULTIJOUEUR (~50 EUR/mois)

### Architecture
```
Cloudflare Pages (client) → Colyseus (Hetzner) → Redis + Supabase
```

### Actions techniques
1. **Serveur Colyseus** sur Hetzner CX22 (4,50 EUR/mois)
   - Rooms de match (1v1, 2v2, 3v3)
   - Validation serveur de la physique (anti-triche)
   - Matchmaking integre
2. **Supabase** (free tier)
   - Auth : UUID anonyme par defaut, liaison email/Google optionnelle
   - Profils utilisateurs : Elo, wins/losses, personnage favori
   - Match history
3. **Redis** (sur le meme serveur Hetzner)
   - Leaderboards (Sorted Sets)
   - File de matchmaking (Elo-based)
   - Cache sessions
4. **Modes de jeu en ligne** :
   - Quick Play en ligne (matchmaking Elo)
   - Versus en ligne (invitation par code)
   - Classement global

### Securite
- Physique validee cote serveur (le client n'envoie que angle/puissance/loft)
- Rate limiting WebSocket (10 msg/s max)
- Cloudflare devant pour DDoS
- JWT tokens pour les sessions

### Scaling
- 1 instance Hetzner = ~500 matchs simultanes = ~1000 joueurs
- Ajouter des instances + Redis Pub/Sub pour scale horizontal
- Pas de reecriture necessaire

---

## PHASE 4 — iOS + STEAM (~200 EUR)

### iOS (App Store)
**Pre-requis** : Mac (ou service cloud Mac type MacStadium ~40 EUR/mois) + Apple Developer (99 USD/an)

**Actions :**
1. `npx cap add ios && npx cap sync`
2. Ouvrir dans Xcode
3. Configurer les capabilities (App Groups, Push si besoin)
4. Ajouter les touches natives supplementaires :
   - Apple Sign-In (recommande/obligatoire si autres social logins)
   - App Tracking Transparency (si analytics)
5. Screenshots aux formats requis (6.7", 6.5", 5.5", iPad)
6. Soumettre pour review (24-48h typique)

**Risques Apple :**
- Rejet possible si "juste un WebView" → les touches natives (haptics, splash, offline) attenuent ce risque
- Guideline 4.2 : l'app doit avoir plus de valeur qu'un site web

### Steam
**Pre-requis** : Steamworks account (gratuit) + 100 USD/jeu

**Actions :**
1. Wrapper Electron :
   ```bash
   npm install electron electron-builder
   ```
2. Integrer Steamworks SDK via `steamworks.js`
   - Achievements
   - Leaderboards Steam
   - Cloud saves
3. Builder pour Windows, macOS, Linux
4. Creer la page Steam :
   - Capsule images (header, hero, etc.)
   - Trailer video
   - Description + tags
5. Activer les wishlists (marketing passif)
6. Review Steamworks (~2-5 jours)

---

## PHASE 5 — SCALE ET MONETISATION (si traction)

### Monetisation
| Modele | Plateforme | Implementation |
|--------|-----------|----------------|
| Premium (2-5 EUR) | Mobile/Steam | Achat unique, tout le contenu |
| Free-to-play + IAP | Mobile | Boules cosmetiques, skins, terrains bonus |
| Pubs rewarded | Mobile | Video optionnelle pour bonus |
| Free (web) | itch.io, Poki | Revenue share pub ou donations |

### Scale infrastructure
- Multi-region Fly.io si joueurs internationaux
- Redis Cluster pour leaderboards a haute charge
- Supabase Pro + read replicas
- CDN Cloudflare pour assets statiques

### Marketing
- Trailer video (30-60s, gameplay reel)
- TikTok/Instagram Reels (clips de tirs spectaculaires)
- Reddit r/indiegaming, r/petanque
- Press kit professionnel
- Festivals indie (IndieDevDay, etc.)
- Steam wishlists = meilleur outil marketing gratuit

### Analytics
- GameAnalytics (gratuit, SDK JS, metrics jeu)
- Sentry (erreurs, source maps)
- Grafana + Prometheus (serveur)

---

## BUDGET RECAPITULATIF

### Phase 1 (Web)
| Poste | Cout |
|-------|------|
| Hebergement | 0 EUR (GitHub Pages) |
| Domaine (optionnel) | ~12 EUR/an |
| **Total** | **0-12 EUR** |

### Phase 2 (Android)
| Poste | Cout |
|-------|------|
| Google Play Developer | 25 USD (une fois) |
| Auto-entrepreneur | 0 EUR |
| **Total Phase 2** | **~23 EUR** |

### Phase 3 (Backend)
| Poste | Cout |
|-------|------|
| Hetzner CX22 | 4,50 EUR/mois |
| Supabase Free | 0 EUR |
| Redis (meme serveur) | 0 EUR |
| **Total Phase 3** | **~5 EUR/mois** |

### Phase 4 (iOS + Steam)
| Poste | Cout |
|-------|------|
| Apple Developer | 99 USD/an |
| Steam Direct | 100 USD (une fois) |
| Mac (si pas deja) | Variable |
| **Total Phase 4** | **~200 EUR** |

### Phase 5 (Scale)
| Palier | Cout/mois |
|--------|-----------|
| 100 CCU | ~5 EUR |
| 1 000 CCU | ~50 EUR |
| 10 000 CCU | ~300 EUR |

### Total premiere annee (scenario serieux)
**~700-1 000 EUR** tout compris (web + mobile + Steam + backend + marque)

---

## CHECKLIST PRE-LANCEMENT

### Juridique
- [ ] Creer statut auto-entrepreneur
- [ ] Obtenir SIRET
- [ ] Rediger CGU
- [ ] Rediger politique de confidentialite
- [ ] Mentions legales sur le site
- [ ] Banniere cookies (si analytics)
- [ ] Recherche anteriorite nom "Petanque Master" (INPI)
- [ ] Depot marque INPI (optionnel, 230 EUR)

### Propriete intellectuelle
- [ ] Verifier ToS de PixelLab (usage commercial sprites)
- [ ] Verifier ToS d'ElevenLabs (usage commercial SFX)
- [ ] Retoucher significativement les assets IA dans Aseprite
- [ ] Documenter le processus creatif (screenshots, fichiers sources)
- [ ] Creer fichier CREDITS/LICENSES dans le jeu
- [ ] Inclure notice MIT de Phaser + Rex Plugins

### Technique
- [ ] Build de production optimise (Vite)
- [ ] Tester sur mobile reel (Android + iOS)
- [ ] Adapter UI au tactile
- [ ] Mode paysage force
- [ ] Support offline basique (service worker)
- [ ] Wrapper Capacitor (mobile)
- [ ] Wrapper Electron (desktop, si Steam)
- [ ] IARC classification age

### Store assets
- [ ] Icone app 512x512 / 1024x1024
- [ ] Feature graphic Google Play 1024x500
- [ ] 4-8 screenshots gameplay par store
- [ ] Trailer video 30-60s
- [ ] Descriptions ASO optimisees
- [ ] Privacy policy URL hebergee

### Marketing
- [ ] Page itch.io complete
- [ ] Press kit (logo, screenshots HD, descriptions, trailer)
- [ ] Compte Twitter/X ou TikTok pour le jeu
- [ ] Steam Coming Soon + wishlists (si applicable)

---

## POINTS DE VIGILANCE

1. **Apple peut rejeter un WebView nu** → ajouter haptics, splash, offline, push
2. **Assets IA non protegeables par copyright** → retoucher dans Aseprite, documenter
3. **Anti-triche obligatoire** pour le multijoueur → le serveur simule la physique
4. **Soft launch** sur 1-2 pays avant lancement mondial
5. **Timing** : lancer en ete (saison de la petanque !)
6. **Tester sur vrais appareils** : les emulateurs ne montrent pas les vrais problemes de perf/touch
7. **Vercel/Netlify ne supportent PAS les WebSockets** → Hetzner ou Fly.io pour le serveur
8. **TVA intra-UE** : regime OSS si ventes numeriques dans l'UE (auto-entrepreneur)
9. **Commission stores** : 15% si < 1M$/an (Small Business Program Apple/Google)
10. **Budget marketing** : les meilleurs outils gratuits sont itch.io, Reddit, TikTok, Steam wishlists

---

## DOCUMENTS DE REFERENCE

- [27_app_stores_wrapper_tech.md](27_app_stores_wrapper_tech.md) — Technologies de wrapping detaillees
- [28_infrastructure_scalabilite.md](28_infrastructure_scalabilite.md) — Infrastructure serveur et couts
- [PUBLISHING_GUIDE.md](PUBLISHING_GUIDE.md) — Guide juridique et business complet
- Capacitor Games Guide : capacitorjs.com/docs/guides/games
- Phaser + Capacitor tutorial : capacitorjs.com (Bring your Phaser game to iOS and Android)
- Colyseus docs : docs.colyseus.io
- Supabase docs : supabase.com/docs
