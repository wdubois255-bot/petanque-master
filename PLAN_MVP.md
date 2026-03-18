# PLAN MVP v3 — PETANQUE MASTER
## Plan de développement orienté lancement

> **Dernière mise à jour** : 17 mars 2026
> **Statut** : Jeu jouable. Prochaine étape = polish + ship.
> Résultat d'un audit complet (code, docs, marché, distribution).

---

## BILAN — Ce qui est FAIT

| Sprint | Contenu | Statut |
|--------|---------|--------|
| Sprint 0 | Setup Vite + Phaser + MCP + CI/CD | ✅ FAIT |
| Sprint 1 | Moteur pétanque complet (physique, IA, scoring FIPJP) | ✅ FAIT |
| Sprint 2 | Overworld basique (shelved — pivot vers arcade) | ✅ FAIT (shelved) |
| Sprint 3 | Contenu overworld, sauvegardes, dialogue | ✅ FAIT (shelved) |
| Sprint 3.5 | Loft presets, carreau, IA personnalités, prédiction | ✅ FAIT |
| Migration 32x32 | Résolution 832x480, sprites 32x32 | ✅ FAIT |
| Game Feel | SFX, boules HD, terrain rendu, visée mobile | ✅ FAIT |

**Résultat actuel** : jeu fonctionnel avec 6 persos, 5 terrains, arcade + quick play, physique réaliste, IA 3 niveaux, audio, UI propre.

---

## ANALYSE DE MARCHÉ (mars 2026)

### Opportunité
- **Zéro concurrent sérieux** en pétanque browser, mobile ou Steam
- "Power of Petanque" (Steam, 2024) = seul concurrent, ~20 reviews, payant, magie/druidique
- Le créneau "sport casual compétitif à personnages" (Windjammers, Lethal League) a prouvé son potentiel
- Pixel art = 35-50% des sorties indie, marché retro $3.8B → $8.5B d'ici 2033

### Modèle économique : Démo gratuite → Jeu payant

```
GRATUIT (acquisition)              PAYANT (revenue)
─────────────────────              ─────────────────
Browser (itch.io, site, Newgrounds) Steam $9.99 (Electron)
  2-3 persos, 1-2 terrains     →   itch.io $7.99 (download PWYW)
  Quick Play uniquement             Mobile gratuit + IAP/ads
  Pas de progression                Contenu complet
  Lien "Wishlist on Steam!"        Arcade, Versus, Online, Unlocks
```

### Plateformes
| Plateforme | Modèle | Rôle |
|------------|--------|------|
| **Steam** | Payant $9.99 (Electron) | Revenue principale |
| **Mobile iOS/Android** | Freemium (Capacitor) — ads + IAP $3.99 "Remove Ads" | Volume + revenue secondaire |
| **itch.io** (browser) | Démo gratuite | Acquisition, funnel Steam |
| **itch.io** (download) | Payant $7.99 PWYW | Alternative DRM-free |
| **Newgrounds** | Démo gratuite | Communauté pixel art |
| **GitHub Pages** | Démo gratuite | Portfolio, démo directe |

### Plateformes exclues (pour l'instant)
- **Poki, CrazyGames** : modèle 100% ads, pas compatible avec jeu payant. Reconsidérer plus tard si besoin d'acquisition massive.

### Budget prévu
- Steam Direct : $100
- Marketing (paid social, trailer) : $2,000-$5,000
- Apple Developer : $99/an (pour iOS)
- Google Play : $25 (one-time)

### Revenue réaliste
| Scénario | Steam | Mobile/an | Total |
|----------|-------|-----------|-------|
| Pessimiste | $1K-$5K | $60-$600 | ~$2K-$6K |
| **Réaliste** | **$10K-$50K** | **$1K-$6K** | **$12K-$56K** |
| Optimiste | $50K-$200K | $12K-$60K | $60K-$260K |

---

## DÉCISIONS TECHNIQUES (VALIDÉES)

| Aspect | Décision |
|--------|----------|
| Framework | Phaser 3.90.0 "Tsugumi" |
| Bundler | Vite 6.3+ (`assetsInlineLimit: 0`) |
| Physique pétanque | Custom (~300 lignes, COR 0.62) |
| Résolution | 832x480 (26×15 tiles), scale x2 |
| Tiles | 32x32 partout |
| Sprites persos | 64x64 spritesheets (PixelLab → nearest-neighbor) |
| Audio | Phaser built-in + ElevenLabs MCP |
| Desktop wrapper | **Electron** (Steam overlay OK, steamworks.js) |
| Mobile wrapper | **Capacitor** (tutoriel officiel Phaser) |
| Deploy browser | GitHub Pages + itch.io (démo) |
| Deploy Steam | Electron → Steamworks |
| Deploy mobile | Capacitor → App Store + Google Play |
| Sauvegarde | localStorage JSON (+ Steam Cloud en Phase B) |

---

## NOUVEAU PLAN EN 3 PHASES

> Philosophie : **ship fast, iterate with players.**
> Le jeu est jouable. Il faut le polir et le mettre entre les mains des joueurs.

---

### PHASE A — POLISH & SHIP (Objectif : première release publique)
> Durée estimée : ~20h de dev
> Priorité : rendre le jeu **publiable** sur itch.io et soumettable à Poki/CrazyGames.

#### A.1 — Intégrer les assets terrain existants (3h)
Les textures sont générées mais pas encore utilisées par le code.

- [ ] Charger `terrain_tex_terre/herbe/sable/dalles.png` dans BootScene.js
- [ ] Modifier `TerrainRenderer._drawSurface()` : utiliser `tileSprite()` au lieu de Graphics
- [ ] Intégrer bordures 9-slice (`border_wood/stone_9slice.png`) dans `_drawBorders()`
- [ ] Placer décors sprites (pin, olivier, banc, fontaine) dans `_drawBackgroundDecor()`
- [ ] Tester visuellement sur les 5 terrains

#### A.2 — Transitions et camera (3h)
- [ ] Fade-in/out entre toutes les scènes (Phaser `cameras.main.fadeIn/fadeOut`)
- [ ] Camera follow sur la boule pendant le vol (dummy sprite + startFollow lerp 0.08)
- [ ] Camera pan vers cochonnet après chaque lancer (montrer le résultat)
- [ ] Retour camera smooth vers le cercle quand c'est au joueur
- [ ] Slow-motion (0.3x) quand boule < 40px du cochonnet et speed < 2

#### A.3 — Particules et juice (2h)
- [ ] Poussière à l'impact boule (6-10 particules, cone, fade 400ms)
- [ ] Traînée de roulement (1-2 particules toutes les 3 frames)
- [ ] Confettis victoire (fin de match)
- [ ] Flash impact boule-boule (1 frame cercle blanc expand)
- [ ] Screen shake calibré : léger 2px sur impact, fort 4px sur carreau

#### A.4 — Mode Versus Local (4h)
- [ ] Écran sélection 2 joueurs (J1 + J2 sur la grille CharSelect)
- [ ] Gestion des tours 2 joueurs humains dans PetanqueEngine
- [ ] Indication claire "Tour J1" / "Tour J2" avec couleurs
- [ ] Partage du clavier : même aiming system, alternance
- [ ] Écran résultat 2 joueurs

#### A.5 — Mobile & Responsive (3h)
- [ ] Scaling integer automatique + letterboxing (#3A2E28)
- [ ] Touch controls : drag-to-aim = pointer events natifs (déjà semi-fonctionnel)
- [ ] Boutons loft adaptés au touch (taille minimum 44px)
- [ ] Page Visibility API : pause + mute quand tab cachée
- [ ] Forcer paysage (Screen Orientation API)
- [ ] Tester Chrome Android, Safari iOS, Chrome Desktop, Firefox

#### A.6 — Mini-tutoriel première partie (2h)
- [ ] Détecter premier lancement (localStorage flag)
- [ ] Overlay tutoriel step-by-step pendant la première mène :
  - "Glissez pour viser" (drag indicator)
  - "Choisissez votre technique" (highlight boutons loft)
  - "Relâchez pour lancer !" (release indicator)
  - "TAB pour voir le classement" (after first throw)
- [ ] Skip possible à tout moment
- [ ] Ne plus afficher après la première partie

#### A.7 — Préparation distribution (5h)
- [ ] **Page Steam** "Coming Soon" : screenshots, description, tags, capsule image
  - Tags : Sports, Casual, Local Multiplayer, Pixel Art, Competitive, Arcade, Retro, Funny
  - Trailer court (30-60s) montrant gameplay + personnages + terrains
  - Commencer à accumuler des wishlists dès maintenant
- [ ] **Page itch.io** : screenshots, description, tags (petanque, pixel-art, competitive, french)
  - Version browser jouable (démo : 2-3 persos, 1-2 terrains, Quick Play)
  - Lien "Wishlist on Steam" visible dans le jeu
- [ ] **Newgrounds** : poster la démo browser
- [ ] Build optimisé : tree-shaking, compression assets, lazy loading par scène
- [ ] Open Graph meta tags (preview quand partagé sur les réseaux)
- [ ] Créer un Discord communautaire
- [ ] S'inscrire auto-entrepreneur (gratuit, immédiat)
- [ ] S'inscrire au prochain Steam Next Fest (juin ou octobre 2026)

**Livrable Phase A** : démo publiée sur itch.io + Newgrounds, page Steam avec wishlists, Discord créé. Jouable desktop + mobile.

---

### PHASE B — RÉTENTION & CONTENU (Objectif : garder les joueurs)
> Durée estimée : ~25h de dev
> Démarrer après les premiers retours joueurs de la Phase A.

#### B.1 — Système de progression (5h)
- [ ] Déblocages : personnages verrouillés au départ (seuls René + Marcel dispos)
- [ ] Débloquer un perso en battant son match arcade correspondant
- [ ] Boules alternatives débloquables (bronze après 3 victoires, chrome après arcade complété)
- [ ] Terrains débloquables (progressif via arcade)
- [ ] Écran Collection (persos, boules, terrains débloqués)
- [ ] Persistance localStorage via SaveManager

#### B.2 — Statistiques et records (3h)
- [ ] Tracker par match : meilleur tir, carreaux, distance moyenne, points marqués
- [ ] Stats globales : parties jouées, victoires, ratio, carreaux totaux
- [ ] Écran Statistiques accessible depuis le menu
- [ ] Meilleur score arcade (time + score)

#### B.3 — Portraits HD pour CharSelect (4h)
- [ ] Générer portraits 128x128 pixel art via PixelLab (pixflux endpoint)
- [ ] Intégrer dans CharSelectScene (panneau preview grand format)
- [ ] Portrait featured 256x256 pour le perso sélectionné
- [ ] Silhouette "???" pour les persos non débloqués

#### B.4 — Personnages supplémentaires (6h)
- [ ] Ajouter 2-4 personnages au roster (total 8-10)
- [ ] Idées : La Mamie (précision extrême, puissance faible), Le Touriste (stats random), Le Kid (effet max)
- [ ] Générer sprites + spritesheets via PixelLab
- [ ] Configurer IA personnalité pour chaque nouveau perso
- [ ] Intégrer dans characters.json + arcade.json

#### B.5 — Daily Challenge (3h)
- [ ] Match quotidien avec contraintes imposées (perso, terrain, conditions)
- [ ] Seed basé sur la date (même challenge pour tous les joueurs)
- [ ] Score à battre + classement (localStorage local, ou leaderboard si Phase C)
- [ ] Récompense cosmétique (boule skin, terrain variant)

#### B.6 — Amélioration sprites personnages (4h)
- [ ] Ajouter bounce animation (1px vertical frames 1 et 3 du walk cycle)
- [ ] Animations supplémentaires : idle breathing, lancer de boule, célébration, défaite
- [ ] Cohérence de style entre les 6 persos (PixelLab bitforge avec style_image)
- [ ] Optionnel : arm swing plus prononcé

#### B.7 — Wrapper Electron + Steam (4h)
- [ ] Setup Electron wrapper (electron-builder)
- [ ] Intégrer steamworks.js (achievements, overlay, cloud saves)
- [ ] Fix Steam overlay (in-process-gpu + transparent canvas redraw)
- [ ] Build multi-plateforme : Windows, Mac, Linux
- [ ] CI/CD GitHub Actions pour builds automatiques
- [ ] Tester achievements, overlay, cloud saves

#### B.8 — Wrapper Capacitor + Mobile (8h)
- [ ] Intégrer Capacitor (`@capacitor/core`, `@capacitor/cli`)
- [ ] Optimisation touch : safe areas, no-bounce, 44px touch targets
- [ ] Intégrer AdMob (rewarded video + interstitials entre matchs)
- [ ] IAP : "Remove Ads" $3.99, boules cosmétiques $0.99-$2.99
- [ ] Splash screen, app icon, status bar natifs
- [ ] Tester sur vrais appareils iOS + Android
- [ ] Soumettre App Store + Google Play

#### B.9 — Lancement Steam + Mobile (3h)
- [ ] Upload build Steam via Steamworks
- [ ] Configurer pricing ($9.99) + regional pricing (défauts Steam)
- [ ] Rédiger Steam devlog d'annonce
- [ ] Coordonner lancement Steam + itch.io download ($7.99) + mobile
- [ ] Campagne clips courts (TikTok/Reels/Shorts, 5-7 clips semaine du lancement)

**Livrable Phase B** : jeu LANCÉ sur Steam ($9.99) + mobile (freemium) + itch.io ($7.99). Progression, unlocks, daily challenge, roster élargi.

---

### PHASE C — ONLINE & CROISSANCE (Objectif : multiplayer + viralité)
> Durée estimée : ~30h de dev
> Démarrer quand la Phase B montre une traction.

#### C.1 — Versus en ligne async (12h)
- [ ] Backend léger : Colyseus ou Supabase Realtime (voir INFRA_RESEARCH.md)
- [ ] Système de room code (4-6 chars, partage par lien)
- [ ] Chaque joueur joue son coup, l'autre reçoit le résultat
- [ ] Replay de l'animation du coup adverse
- [ ] Gestion déconnexion / timeout (auto-forfeit après 24h)
- [ ] Coût estimé : ~$5/mois pour 100 CCU

#### C.2 — Leaderboards (4h)
- [ ] Classement global (Elo/Glicko-2)
- [ ] Classement par personnage
- [ ] Classement daily challenge
- [ ] Backend : Redis sorted sets ou Supabase PostgreSQL

#### C.3 — Social & Viralité (4h)
- [ ] Partage de replay (capture du dernier coup en GIF/vidéo courte)
- [ ] Bouton "Défier un ami" (génère lien room)
- [ ] Open Graph dynamique (score + perso dans la preview)
- [ ] Intégration basique Discord Rich Presence (optionnel)

#### C.4 — Mode Tournoi (5h)
- [ ] Bracket 4 ou 8 joueurs (local ou online)
- [ ] Tirage au sort + progression bracket
- [ ] Écran bracket visuel
- [ ] Format doublette (2v2) avec partenaire IA ou humain

#### C.5 — Formats avancés (5h)
- [ ] Doublette (2v2, 3 boules chacun, 6 total/équipe)
- [ ] Triplette (3v3, 2 boules chacun, 6 total/équipe)
- [ ] IA partenaire avec personnalité configurable
- [ ] Sélection format dans QuickPlay et Versus

**Livrable Phase C** : jeu multijoueur en ligne avec classements et viralité.

---

### PHASE D — MODE AVENTURE (Futur, si traction)
> Réactiver le contenu shelved des Sprints 2-3 si la base joueurs le justifie.

- [ ] Réactiver OverworldScene (exploration village provençal)
- [ ] 7 maps interconnectées (village, routes, arènes)
- [ ] Histoire "L'Héritier de la Ciotat" (STORY.md)
- [ ] Système de badges (4 arènes)
- [ ] PNJ avec dialogues et combats déclenchés
- [ ] Partenaires recrutables (doublettes scénarisées)

---

## STRATÉGIE DE LANCEMENT

### Phase A — Démo + Wishlists (dès maintenant)
1. Créer page Steam "Coming Soon" → accumuler wishlists
2. Publier démo browser sur **itch.io** + **Newgrounds**
3. Poster sur **r/WebGames**, **r/IndieGaming**, **r/PixelArt**
4. Créer Discord communautaire
5. Commencer clips courts (TikTok/Reels, 2-3/semaine)

### Phase A → B — Steam Next Fest (juin ou octobre 2026)
1. Participer avec une démo Steam jouable
2. Objectif : 2,000-10,000 wishlists pendant le festival
3. Amplifier les meilleurs clips avec budget paid ($200-500)

### Phase B — Lancement multi-plateforme
1. Lancer Steam ($9.99) + itch.io download ($7.99) + mobile (freemium)
2. Timing : 2-3 semaines APRÈS une grosse solde Steam
3. Campagne : 5-7 clips/semaine, outreach streamers/créateurs niche
4. Budget marketing : $2,000-$3,000 (paid social + potentiel freelance trailer)

### Contenu social (continu)
1. 3-5 clips courts/semaine (TikTok, YouTube Shorts, Reels)
2. Moments dramatiques : carreaux, slow-mo, réactions IA
3. "Did you know pétanque?" éducatif + gameplay
4. Behind-the-scenes pixel art process / devlogs

---

## MONÉTISATION

| Plateforme | Modèle | Prix |
|------------|--------|------|
| **Steam** | Payant | $9.99 |
| **itch.io download** | Payant PWYW | $7.99 minimum |
| **itch.io browser** | Gratuit (démo) | $0 |
| **Mobile** | Freemium | Gratuit + ads + IAP |
| Mobile IAP | "Remove Ads" | $3.99 |
| Mobile IAP | Boules cosmétiques | $0.99-$2.99 |
| Mobile ads | Rewarded video | Entre les matchs |

**Règles** :
- Jamais de pub PENDANT un match
- Jamais de pay-to-win (intégrité compétitive)
- Mobile : interstitials max 1 toutes les 2-3 parties

---

## LÉGAL (FRANCE)

| Aspect | Décision |
|--------|----------|
| Structure | Auto-entrepreneur (gratuit, immédiat) |
| Charges | ~23% du CA (21.2% sociales + 1.7% IR) |
| TVA | Franchise < 37,500€/an. Steam/Apple/Google gèrent la TVA |
| PEGI | Gratuit via IARC (Steam/Apple/Google) |
| RGPD | Privacy policy. Minimal si localStorage seul |
| Marque | INPI 190€ (à faire quand prêt) |
| Assets IA | Vérifier CGU PixelLab/ElevenLabs. Documenter retouches manuelles |

Détails complets : `research/32_strategie_commerciale_complete.md`

---

## FICHIERS DE RÉFÉRENCE

| Fichier | Rôle |
|---------|------|
| CLAUDE.md | Bible technique (conventions, stack, règles) |
| GAME_DESIGN.md | Bible game design (concept, persos, terrains) |
| HANDOFF.md | État actuel + prochaines étapes concrètes |
| STORY.md | Histoire mode aventure (réservé Phase D) |
| INFRA_RESEARCH.md | Architecture backend pour Phase C |
| LORE_PETANQUE.md | Légendes et histoire vraie de la pétanque |
| research/32_strategie_commerciale_complete.md | **Recherche commerciale complète** |
| research/ | 32+ fichiers de recherche technique |

---

## RÉSUMÉ EXÉCUTIF

```
ÉTAT ACTUEL : Jeu jouable, 6 persos, 5 terrains, arcade + quick play
MARCHÉ : Zéro concurrent. Créneau grand ouvert.
MODÈLE : Démo gratuite browser → Payant Steam $9.99 + Mobile freemium

Phase A (Polish + Démo)     ~20h → Démo itch.io/Newgrounds, page Steam, wishlists
Phase B (Contenu + Launch)  ~40h → Steam $9.99, mobile, progression, roster élargi
Phase C (Online)            ~30h → Multiplayer async, leaderboards, viralité
Phase D (Aventure)          ~40h → Mode histoire (si traction le justifie)

BUDGET : ~$2,500-$5,000 (Steam + marketing + stores)
REVENUE RÉALISTE : $12K-$56K (Steam + mobile combinés)
LÉGAL : Auto-entrepreneur France, ~23% charges, TVA gérée par plateformes
```
