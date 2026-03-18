# Stratégie Commerciale Complète — Petanque Master
## Recherche exhaustive (17 mars 2026)

> Synthèse de 5 recherches indépendantes : Steam, Mobile, Browser, Desktop Wrappers, Légal/Business France.
> Ce document est la base de décision pour la stratégie de lancement et de monétisation.

---

## 1. ÉTAT DU MARCHÉ

### Concurrence
- **Zéro concurrent sérieux** en pétanque browser ou mobile
- "Power of Petanque" (Steam, 2024) : ~20 reviews, payant, magie/druidique, très niche
- Le créneau "sport casual compétitif à personnages" (Windjammers, Lethal League, Dodgeball Academia) a prouvé sa viabilité

### Tendances 2026
- Pixel art = 35-50% des sorties indie, marché rétro $3.8B → $8.5B d'ici 2033
- HTML5 games en plein renouveau via portails (Poki 100M/mois, CrazyGames 30M/mois)
- Short-form video (TikTok/Reels) = canal #1 de découverte pour les jeux indie
- Les joueurs choisissent "simplicité + authenticité" > graphismes réalistes

---

## 2. PLATEFORMES DE DISTRIBUTION

### Steam (Desktop via Electron)

| Aspect | Données |
|--------|---------|
| Audience | 130M+ utilisateurs actifs |
| Revenue share | 70% dev / 30% Valve |
| Frais d'entrée | $100 (remboursable après $1000 de ventes) |
| Revenue médiane indie | ~$1,000 lifetime (brutal) |
| Revenue 80ème percentile | ~$34,000 lifetime |
| Revenue 90ème percentile | ~$198,000 lifetime |
| Revenue top 4% | $100,000+ |
| Prix recommandé | $7.99-$9.99 |

**Wishlists nécessaires :**
- < 2,000 : invisible
- 7,000-15,000 : lancement correct
- 15,000-30,000 : bon lancement
- Conversion wishlist → achat jour 1 : ~5%
- Conversion wishlist → achat année 1 : ~60%

**Steam Next Fest** : 3 éditions/an (février, juin, octobre). Gain médian avec démo : 462 wishlists/semaine. Les meilleurs : 2,000-10,000+.

**Early Access : NON recommandé** pour un jeu sport/casual. Le format nécessite une impression "fini" dès le premier contact.

### Mobile (iOS + Android via Capacitor)

| Aspect | Données |
|--------|---------|
| Wrapper recommandé | **Capacitor** (tutoriel officiel Phaser) |
| Coût Apple | $99/an |
| Coût Google | $25 one-time |
| Commission | 15% (< $1M/an Small Business Program) puis 30% |
| Bundle size | ~10-15 MB |
| Performance attendue | 55-60 FPS sur téléphones 2020+ |
| Temps browser → stores | 4-8 semaines |

**Modèle mobile recommandé :** Hybrid gratuit (ads rewarded + IAP cosmétiques + "Remove Ads" $3.99)

**Revenue réaliste mobile :**
- Pessimiste (pas de marketing) : $60-$600/an
- Modéré (social media + ASO) : $1,200-$6,000/an
- Optimiste (viral/featuring) : $12,000-$60,000/an

**Point clé mobile :** La pétanque est un sport casual avec mécaniques touch (drag-and-release = comme Angry Birds). Le jeu est PLUS naturel sur mobile que sur desktop.

### Browser (Web)

| Plateforme | Modèle | Audience |
|------------|--------|----------|
| itch.io | Pay-what-you-want (download) ou gratuit (browser) | Indie, niche |
| Poki | Revenue share ads | 100M/mois |
| CrazyGames | Revenue share ads (+50% exclu 2 mois) | 30M/mois |
| Newgrounds | Gratuit + ad revenue share | Communauté pixel art |
| Propre site | Paywall Stripe/PayPal | Trafic organique |

**itch.io ne supporte PAS le paywall sur les jeux browser embeddés.** On peut vendre le jeu en téléchargement .zip uniquement.

**Poki :** Des studios passent de $50K/an à $1M/an. Un dev solo (Loic Blumgi) a atteint 100M joueurs en 2 ans. MAIS modèle 100% ads, pas compatible avec un jeu payant.

### Desktop Wrapper : Electron recommandé

| Wrapper | Steam Overlay | Steamworks.js | Bundle Size | Recommandé ? |
|---------|---------------|---------------|-------------|--------------|
| **Electron** | ✅ (avec workaround) | ✅ | ~80 MB | **OUI** |
| NW.js | ✅ | ✅ | ~80 MB | Viable |
| Tauri | ❌ CASSÉ | ❌ | ~5 MB | NON pour Steam |
| Neutralinojs | ❌ | ❌ | ~3 MB | NON |

**Electron** : tutoriel officiel Phaser, meilleur tooling (electron-builder), plus grande communauté. Setup estimé : 3-4 jours pour pipeline complète (wrapper + Steam + CI/CD multi-plateforme).

---

## 3. MODÈLE ÉCONOMIQUE RECOMMANDÉ

### La stratégie qui fonctionne : Démo gratuite → Jeu payant

C'est le modèle dominant et prouvé pour les jeux indie browser-origin :

```
BROWSER (gratuit)                    PAYANT
┌─────────────────┐                 ┌──────────────────────────┐
│ Démo gratuite    │  ──── CTA ──→  │ Version complète         │
│ 2-3 persos       │                │ 6+ persos                │
│ 1-2 terrains     │                │ 5+ terrains              │
│ Quick Play seul  │                │ Arcade + Versus + Online │
│ Pas de sauvegarde│                │ Progression + Unlocks    │
│                  │                │ Achievements Steam       │
│ itch.io (web)    │                │ Steam $9.99              │
│ Propre site (web)│                │ itch.io $7.99 (download) │
│ Newgrounds (web) │                │ Mobile $4.99             │
└─────────────────┘                 └──────────────────────────┘
```

### Pricing multi-plateforme

| Plateforme | Prix | Modèle | Justification |
|------------|------|--------|---------------|
| Browser (itch.io/site) | Gratuit | Démo limitée | Acquisition, marketing |
| Steam | $9.99 | Payant | Marché principal, wishlists, Next Fest |
| itch.io (download) | $7.99 (PWYW) | Payant DRM-free | Alternative à Steam, 90-100% rev |
| Mobile | Gratuit + IAP | Hybrid (ads + "Remove Ads" $3.99) | Mobile = volume, pas premium |

### Pourquoi PAS un modèle unique ?

Les marchés sont **distincts** avec des attentes différentes :
- **Steam** : les joueurs paient pour du contenu complet, pas d'ads
- **Mobile** : les joueurs s'attendent au gratuit, monétisation ads/IAP
- **Browser** : acquisition gratuite, funnel vers payant
- **itch.io** : communauté indie, PWYW fonctionne bien

### Anti-cannibalisation

La démo browser ne cannibalise PAS les ventes Steam car :
1. Les audiences sont largement distinctes (joueurs browser ≠ joueurs Steam)
2. Le contenu est limité (30% du jeu)
3. Les features sont gatées (pas d'arcade, pas de versus, pas de progression)
4. Chaque play de la démo est un point de contact marketing gratuit

---

## 4. MOBILE : STRATÉGIE DÉTAILLÉE

### Pourquoi mobile ?
- Le drag-and-release est NATIF au touch (comme Angry Birds)
- "Pétanque" en recherche App Store/Play Store = quasi zéro concurrence
- Coût marginal faible si le jeu browser fonctionne déjà
- Le mobile est la plateforme NATURELLE pour un jeu casual sport

### Tech : Capacitor
- Recommandé officiellement par Phaser
- `npm install @capacitor/core @capacitor/cli` → build iOS + Android
- Plugins pour AdMob, IAP, push notifications, haptics
- Performance : 55-60 FPS sur téléphones modernes

### Monétisation mobile (hybrid gratuit)
1. **Rewarded video ads** : regarder pour gagner coins, débloquer cosmétiques plus vite
2. **Interstitials** : entre les matchs uniquement (max 1 toutes les 2-3 parties)
3. **IAP "Remove Ads"** : $3.99 one-time
4. **IAP cosmétiques** : boules skins $0.99-$2.99, persos premium $1.99
5. **JAMAIS** de pay-to-win (intégrité compétitive)

### Timeline : browser → stores
| Phase | Durée |
|-------|-------|
| Optimisation touch + responsive | 1-2 semaines |
| Intégration Capacitor | 2-3 jours |
| Polish natif (splash, icône, safe areas) | 1 semaine |
| Monétisation (AdMob + IAP) | 1-2 semaines |
| Tests sur vrais appareils | 1-2 semaines |
| Assets stores + soumission | 3-5 jours |
| Review Apple/Google | 1-7 jours |
| **Total** | **4-8 semaines** |

### Prérequis
- Un Mac (obligatoire pour iOS builds) — Mac Mini ~$800-1500, ou cloud ~$50/mois
- Apple Developer Program ($99/an)
- Google Play ($25 one-time)
- Vrais appareils de test iOS + Android

---

## 5. STEAM : STRATÉGIE DÉTAILLÉE

### Timeline recommandée

1. **Maintenant** : Créer la page Steam, commencer les wishlists
2. **+1 mois** : Démo browser sur itch.io avec lien Steam
3. **+3 mois** : Participer au Steam Next Fest (juin ou octobre 2026)
4. **+6-12 mois** : Lancement 1.0 (2-3 semaines APRÈS une grosse solde Steam)
5. **Continu** : 3-5 clips courts/semaine (TikTok, YouTube Shorts)

### Budget minimum

| Poste | Coût |
|-------|------|
| Steam Direct | $100 |
| Marketing (paid social amplification) | $2,000-$3,000 |
| Trailer (DIY ou freelance) | $0-$1,000 |
| Code signing Windows (EV certificate) | $200-$400/an |
| Apple Developer (si Mac build) | $99/an |
| **Total minimum** | **~$2,500-$5,000** |

### Revenue réaliste

| Scénario | Wishlists | Revenue lifetime |
|----------|-----------|-----------------|
| Pessimiste | < 2,000 | $1,000-$5,000 |
| Réaliste (bon marketing) | 7,000-15,000 | $10,000-$50,000 |
| Optimiste (viral) | 15,000-30,000 | $50,000-$200,000 |
| Exceptionnel | 30,000+ | $200,000+ |

### Tags Steam recommandés
Sports, Casual, Local Multiplayer, Pixel Art, Competitive, Arcade, 2D, PvP, Retro, Funny, Turn-Based, Indie, Colorful, Family Friendly

---

## 6. LÉGAL / BUSINESS FRANCE

### Structure recommandée

| Revenue annuel | Structure | Pourquoi |
|----------------|-----------|----------|
| 0-37,500 € | **Auto-entrepreneur** | Zéro admin, pas de TVA, charges 21.2% |
| 37,500-77,700 € | Auto-entrepreneur + TVA | TVA obligatoire mais structure simple |
| 77,700-150K € | EURL (IS) | Déduction charges, responsabilité limitée |
| 150K+ € | SASU | Optimisation salaire + dividendes |

### Coût pour commencer

| Poste | Coût |
|-------|------|
| Auto-entrepreneur (inscription) | **0 €** |
| Steam Direct | ~93 € ($100) |
| Google Play | ~23 € ($25) |
| Apple Developer | ~93 € ($99) |
| RC Pro (optionnel, recommandé) | 100-500 €/an |
| Marque INPI (optionnel) | 190 € |
| **Total minimum** | **~93 €** (Steam seul) |
| **Total confortable** | **~500-700 €** |

### TVA
- Franchise en base < 37,500 €/an : pas de TVA
- **Steam, Apple, Google gèrent la TVA pour toi** — tu reçois ta part nette
- itch.io : partiel (dépend du modèle de paiement choisi)
- Vente directe (ton site) : TU gères la TVA → utiliser un Merchant of Record (Paddle, Lemon Squeezy)

### Charges sociales auto-entrepreneur (BIC services)
- 21.2% du CA brut
- + versement libératoire IR : 1.7% (si éligible, revenu fiscal < 29,315 €/part)
- **Total : ~23% du CA** → tu gardes ~77%

### Exemples concrets

| CA annuel | Charges sociales | IR (vers. lib.) | Tu gardes |
|-----------|-----------------|-----------------|-----------|
| 5,000 € | 1,060 € | 85 € | **3,855 €** |
| 20,000 € | 4,240 € | 340 € | **15,420 €** |
| 50,000 € | 10,600 € | 850 € | **38,550 €** |

### PEGI / Age Rating
- **Gratuit et automatique** via IARC sur Steam, Apple, Google
- Petanque Master = probablement **PEGI 3** (pas de violence, pas de contenu sexuel)

### RGPD
- Privacy policy obligatoire
- Si jeu 100% localStorage (pas de serveur) : obligations minimales
- Dès qu'il y a online (leaderboards, multiplayer) : consentement cookies, droit à l'effacement, politique de confidentialité complète
- Âge du consentement numérique en France : **15 ans**

### Assets IA (PixelLab, ElevenLabs)
- Les œuvres purement IA ne sont probablement **pas protégeable par le droit d'auteur** en France/UE
- MAIS : si tu modifies significativement les outputs (retouche Aseprite, sélection, arrangement), tu renforces ta protection
- La **compilation** du jeu (sélection et arrangement des éléments) est protégeable
- Vérifier que les CGU de PixelLab et ElevenLabs autorisent l'usage commercial
- Documenter ton processus créatif (captures, itérations, modifications)

### Aides fiscales
- **CIJV** (Crédit d'Impôt Jeux Vidéo) : 30% des dépenses, MAIS minimum 100,000 € de dépenses + être à l'IS → **pas réaliste pour un solo indie**
- **JEI** (Jeune Entreprise Innovante) : possible si R&D ≥ 20% des charges, mais exclut les auto-entrepreneurs
- **CIR** : rarement applicable au dev de jeux standard

---

## 7. STRATÉGIE DE LANCEMENT COMPLÈTE

### Phase 0 — Préparation (maintenant)
- [ ] S'inscrire auto-entrepreneur (gratuit, immédiat)
- [ ] Créer la page Steam (page "Coming Soon" + wishlist)
- [ ] Mettre la démo browser sur itch.io
- [ ] Créer un Discord pour la communauté
- [ ] Commencer les clips courts (TikTok/Reels, 2-3/semaine)

### Phase A — Polish & Ship (démo + wishlists)
- [ ] Intégrer les assets terrain
- [ ] Transitions, camera, particules
- [ ] Mode Versus local
- [ ] Mobile responsive (touch)
- [ ] Mini-tutoriel
- [ ] Publier la démo mise à jour sur itch.io + Newgrounds
- [ ] S'inscrire au Steam Next Fest (juin ou octobre 2026)

### Phase B — Contenu payant
- [ ] Système de progression (unlocks persos, boules, terrains)
- [ ] Statistiques et records
- [ ] Portraits HD
- [ ] Personnages supplémentaires (roster 8-10)
- [ ] Daily challenge
- [ ] Wrapper Electron + intégration Steamworks (achievements, overlay)

### Phase C — Lancement multi-plateforme
- [ ] Lancer sur Steam ($9.99)
- [ ] Lancer sur itch.io en téléchargement ($7.99 PWYW)
- [ ] Wrapper Capacitor → iOS + Android
- [ ] Intégrer AdMob + IAP mobile
- [ ] Soumettre aux stores
- [ ] Campagne marketing (clips, streamers, Reddit)

### Phase D — Post-lancement
- [ ] Itérer selon retours joueurs
- [ ] Online async multiplayer
- [ ] Leaderboards
- [ ] Contenu saisonnier
- [ ] Évaluer si Poki/CrazyGames a du sens pour une version démo gratuite séparée

---

## 8. QUESTIONS OUVERTES (à décider)

1. **Poki/CrazyGames** : Est-ce qu'on maintient une version démo gratuite sur ces portails pour l'acquisition, ou on se concentre sur itch.io + Steam ?
   - Pro : volume massif (130M joueurs/mois combinés)
   - Con : modèle ads, pas compatible avec "jeu payant", dilution de marque

2. **Mobile : payant ou freemium ?**
   - Payant ($4.99) = simple, moins de downloads mais joueurs plus engagés
   - Freemium (ads + IAP) = plus de downloads, plus de revenus potentiels mais plus complexe

3. **Budget marketing** : combien es-tu prêt à investir ?
   - $0 = possible mais lent (6+ mois de contenu organique)
   - $2,000-$5,000 = recommandé minimum pour Steam

4. **Mac** : en as-tu un ? (obligatoire pour builds iOS et recommandé pour Mac build Steam)

5. **Timeline** : quand veux-tu lancer ? Prochain Next Fest = juin ou octobre 2026

6. **Trademark** : veux-tu protéger "Petanque Master" à l'INPI (190€) ou EUIPO (850€) ?

---

## SOURCES

Toutes les données de ce document proviennent de recherches web datées de mars 2026. Sources principales :
- Steam/Valve GDC 2026, VG Insights, How To Market A Game, GameDiscoverCo
- Phaser.io tutorials (Electron, Capacitor)
- Steamworks.js, electron-builder documentation
- URSSAF, impots.gouv.fr, CNIL, CNC, INPI
- Poki/CrazyGames developer portals
- Multiple indie dev postmortems et case studies
