# Infrastructure Serveur et Scalabilite

Recherche effectuee le 17 mars 2026. Objectif : gerer 1000+ joueurs simultanes.

---

## 1. BACKEND GAME SERVER

### Colyseus — RECOMMANDE

Framework game server **Node.js**, open source (MIT).

**Fonctionnalites :**
- Matchmaking integre
- Room management (1 room = 1 match de petanque)
- Synchronisation d'etat binaire (performant)
- SDK JavaScript natif → integration Phaser directe
- WebSocket natif

**Cout :**
- Self-hosted : gratuit (MIT)
- Colyseus Cloud (manage) : a partir de 15 $/mois

**Pourquoi c'est ideal pour Petanque Master :**
- 1 match = 1 room avec 2 joueurs (ou 4/6 en doublette/triplette)
- Matchmaking 1v1 integre
- Le serveur peut valider la physique (anti-triche)
- Meme langage (JavaScript) que le client Phaser

**Architecture type :**
```
Client Phaser 3 ←→ WebSocket ←→ Colyseus Server
                                     ↓
                              [Room: Match #1234]
                              - Player 1
                              - Player 2
                              - Game state
                              - Physics validation
```

### Nakama — Alternative (plus complet)

Framework game server en **Go** (open source Apache 2.0).

**Fonctionnalites :**
- Tout Colyseus + leaderboards, economie, social, guildes
- Prouve a 2M CCU
- Realtime + request-response

**Inconvenients :**
- Plus lourd et complexe
- Go (pas JavaScript)
- Overkill pour un debut

### PlayFab (Microsoft) — Managed (most features)

**Fonctionnalites :**
- Auth, matchmaking, leaderboards, analytics, anti-cheat, GDPR/COPPA
- Plan gratuit genereux (100k MAU)

**Inconvenients :**
- Vendor lock-in fort
- Concu pour Unity/Unreal (SDK JS moins maintenu)
- Peu adapte a notre stack

### Firebase / Supabase — Pour les donnees, PAS le temps reel

**Bon pour :**
- User accounts (Auth)
- Leaderboards (Firestore/PostgreSQL)
- Match history
- Cloud functions

**Pas bon pour :**
- Sync d'etat de jeu en temps reel (latence trop haute)
- Game rooms / WebSocket persistant

**Recommandation : Supabase pour l'auth + donnees, Colyseus pour le game server.**

### Cloudflare Durable Objects — Option moderne

- Chaque match = 1 Durable Object avec WebSocket
- Deploiement edge global automatique
- Base 5 $/mois
- Tres scalable mais modele de programmation different

---

## 2. SCALING A 1000+ JOUEURS SIMULTANES

### Architecture horizontale

```
                    [Load Balancer]
                   /       |        \
            [Colyseus 1] [Colyseus 2] [Colyseus 3]
                   \       |        /
                    [Redis Pub/Sub]
                         |
                    [Supabase DB]
```

**Principes :**
- Chaque instance Colyseus gere N rooms (matchs)
- Redis pour la communication inter-instances et le matchmaking global
- Load balancer distribue les nouvelles connexions WebSocket
- Scale horizontal : ajouter des instances Colyseus selon la charge

### Capacite par instance

Pour un jeu de petanque (2-6 joueurs/room, tour par tour, faible frequence de messages) :

| Instance | Rooms simultanees | Joueurs |
|----------|-------------------|---------|
| 1 Hetzner CX22 (2 vCPU, 4 GB) | ~200-500 | ~400-1000 |
| 2 Hetzner CX22 | ~500-1000 | ~1000-2000 |
| 3 Hetzner CX32 (4 vCPU, 8 GB) | ~1500-3000 | ~3000-6000 |

Le jeu de petanque est **ideal pour le scaling** car :
- Tour par tour (pas de tick rate eleve)
- Peu de donnees par message (angle, puissance, loft)
- Rooms petites (2-6 joueurs max)
- Pas de simulation continue cote serveur entre les tours

### Base de donnees

| Usage | Techno | Justification |
|-------|--------|---------------|
| Leaderboards | **Redis Sorted Sets** | O(log N), sub-milliseconde, atomique |
| Profils utilisateurs | **Supabase (PostgreSQL)** | Relationnel, Auth integre, Row Level Security |
| Match history | **Supabase (PostgreSQL)** | Requetes complexes, JSON columns |
| Matchmaking queue | **Redis Lists/Sorted Sets** | Rapide, TTL, Elo range widening |
| Session cache | **Redis** | Ephemere, rapide |

---

## 3. HEBERGEMENT — COMPARATIF

### Budget (recommande pour demarrer)

| Plateforme | Specs | Cout/mois | Notes |
|------------|-------|-----------|-------|
| **Hetzner CX22** | 2 vCPU, 4 GB RAM, 40 GB SSD | **4,50 EUR** | 10-12x moins cher qu'AWS |
| **Hetzner CX32** | 4 vCPU, 8 GB RAM, 80 GB SSD | **8,50 EUR** | Scale up |
| **Fly.io** | 1 shared CPU, 256 MB | **~2 USD** | Multi-region, migration auto |
| **Railway** | Usage-based | **5 USD** (hobby) | Meilleure DX, one-click deploy |

### Mid-tier

| Plateforme | Specs | Cout/mois | Notes |
|------------|-------|-----------|-------|
| **DigitalOcean** | 2 vCPU, 4 GB | 24 USD | Bon equilibre prix/support |
| **Render** | 512 MB | 7 USD (starter) | Simple, bon pour Node.js |

### Enterprise (overkill pour debuter)

| Plateforme | Service | Cout/mois | Notes |
|------------|---------|-----------|-------|
| **AWS EC2** | t3.medium | ~30 USD | Flexibilite maximale, complexe |
| **AWS GameLift** | Managed | Variable | FlexMatch, overkill |
| **Google Cloud** | e2-medium | ~25 USD | Bon networking |

### Hebergement statique (client Phaser)

| Plateforme | Cout | Notes |
|------------|------|-------|
| **Cloudflare Pages** | Gratuit | CDN global, illimite |
| **GitHub Pages** | Gratuit | Deja en place |
| **Vercel** | Gratuit (hobby) | Pas de WebSocket server |
| **Netlify** | Gratuit (starter) | Pas de WebSocket server |

**IMPORTANT :** Vercel et Netlify ne peuvent PAS heberger de serveur WebSocket persistant (timeout serverless). Uniquement pour le client statique.

---

## 4. SECURITE

### Anti-triche (CRITIQUE pour HTML5)

Le client est **entierement inspectable** (DevTools, deobfuscation facile). La SEULE approche fiable :

**Server-side validation :**
```
Client envoie : { angle: 45, power: 78, loft: 2 }
Serveur :
  1. Valide les ranges (angle 0-360, power 0-100, loft 0-3)
  2. Simule la physique
  3. Calcule la position finale de la boule
  4. Broadcast le resultat a tous les clients
  5. Les clients affichent l'animation
```

Le client ne fait **jamais** confiance a ses propres calculs de position pour le scoring.

### Rate limiting
- Limiter les messages WebSocket par joueur (ex: 10/seconde)
- Limiter les tentatives de connexion (ex: 5/minute par IP)
- Redis pour le tracking distribue

### DDoS
- **Cloudflare** (gratuit) : 477 Tbps de reseau, 330+ villes
- Proxy les connexions WebSocket via Cloudflare si possible
- Rate limiting au niveau infra

### Authentification
- **Phase 1** : UUID anonyme (localStorage), zero friction
- **Phase 2** : Compte optionnel via Supabase Auth (email, Google, Apple Sign-In)
- JWT tokens pour les sessions WebSocket
- Refresh tokens stockes de maniere securisee

### RGPD
- Serveurs Hetzner en EU (Allemagne/Finlande)
- Supabase : conformite RGPD, Self-hosted ou EU region
- Implementer les endpoints de donnees :
  - `GET /api/user/data` : export de toutes les donnees
  - `DELETE /api/user/data` : suppression complete
  - Log de consentement

---

## 5. ANALYTICS ET MONITORING

### Analytics jeu

| Service | Cout | SDK | Notes |
|---------|------|-----|-------|
| **GameAnalytics** | Gratuit | JavaScript/HTML5 | Metrics jeu (retention, engagement), ISO 27001 |
| **Amplitude** | Gratuit (10M events/mois) | JavaScript | Events custom, funnels |
| **Plausible** | 9 EUR/mois | JavaScript | Privacy-friendly, simple |

### Error tracking

| Service | Cout | Notes |
|---------|------|-------|
| **Sentry** | Gratuit (5k events/mois) | Source maps, breadcrumbs, JavaScript SDK |
| **LogRocket** | Gratuit (1k sessions) | Session replay (utile pour debug UX) |

### Server monitoring

| Service | Cout | Notes |
|---------|------|-------|
| **Grafana + Prometheus** | Gratuit (self-hosted) | Dashboards, alertes |
| **Uptime Kuma** | Gratuit (self-hosted) | Monitoring uptime simple |
| **Better Stack** | Gratuit (tier) | Uptime + logs |

---

## 6. LEADERBOARDS ET MATCHMAKING

### Leaderboards

**Redis Sorted Sets** (meilleure option) :
```
ZADD leaderboard:global <score> <userId>
ZREVRANGE leaderboard:global 0 99  # Top 100
ZREVRANK leaderboard:global <userId>  # Rang du joueur
```
- O(log N) pour insert/query
- Sub-milliseconde
- Mises a jour atomiques
- Support de leaderboards multiples (global, hebdo, par terrain)

### Matchmaking

**Pour Petanque Master (1v1) :**
1. Le joueur rejoint la file avec son Elo
2. Recherche un adversaire dans un range Elo serre (ex: ±50)
3. Si pas de match apres 5s, elargir le range (±100, ±200...)
4. Si pas de match apres 30s, proposer un bot

**Implementation :**
```
Redis Sorted Set : matchmaking_queue
Score = Elo rating
Member = { odId, timestamp, preferences }

Toutes les 2 secondes :
  Pour chaque joueur dans la queue :
    Chercher un adversaire dans [elo-range, elo+range]
    Si trouve → creer une room Colyseus
    Sinon → elargir le range si timeout
```

### User accounts (progression)

**Supabase Auth + PostgreSQL :**
```sql
users : id, email, display_name, created_at
profiles : user_id, elo, wins, losses, favorite_character
match_history : id, player1_id, player2_id, score, terrain, timestamp
achievements : user_id, achievement_id, unlocked_at
```

---

## 7. COUTS ESTIMES PAR PALIER

### 100 joueurs simultanes (~500 MAU)

| Service | Cout/mois |
|---------|-----------|
| Hetzner CX22 (Colyseus) | 4,50 EUR |
| Supabase Free | 0 EUR |
| Redis (sur meme serveur) | 0 EUR |
| Cloudflare Pages (client) | 0 EUR |
| GameAnalytics | 0 EUR |
| Sentry Free | 0 EUR |
| **TOTAL** | **~5 EUR/mois** |

### 1 000 joueurs simultanes (~5 000 MAU)

| Service | Cout/mois |
|---------|-----------|
| 2x Hetzner CX22 (Colyseus) | 9 EUR |
| Supabase Pro | 25 USD |
| Redis (Hetzner dediee ou Upstash) | 5-10 EUR |
| Cloudflare Pages | 0 EUR |
| GameAnalytics | 0 EUR |
| Sentry Team | 26 USD |
| **TOTAL** | **~50-70 EUR/mois** |

### 10 000 joueurs simultanes (~50 000 MAU)

| Service | Cout/mois |
|---------|-----------|
| 5-8 Fly.io instances (multi-region) | 50-100 USD |
| Supabase Pro + read replicas | 50-100 USD |
| Redis Cluster (Upstash ou manage) | 20-50 USD |
| Cloudflare Pro (si besoin) | 20 USD |
| GameAnalytics | 0 EUR |
| Sentry Business | 80 USD |
| **TOTAL** | **~250-350 USD/mois** |

---

## ARCHITECTURE RECOMMANDEE — PETANQUE MASTER

```
┌─────────────────────────────────────────────────────┐
│                    CLIENTS                           │
│  Web (Cloudflare Pages) | Android | iOS | Steam     │
└────────────────────┬────────────────────────────────┘
                     │ WebSocket + HTTPS
                     ▼
┌─────────────────────────────────────────────────────┐
│              CLOUDFLARE (CDN + DDoS)                │
│              Rate limiting, proxy                    │
└────────────────────┬────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ COLYSEUS Server 1│  │ COLYSEUS Server 2│  (Hetzner)
│ - Game rooms     │  │ - Game rooms     │
│ - Physics valid. │  │ - Physics valid. │
│ - Matchmaking    │  │ - Matchmaking    │
└────────┬─────────┘  └────────┬─────────┘
         │                     │
         └──────────┬──────────┘
                    ▼
         ┌──────────────────┐
         │    REDIS          │
         │ - Matchmaking     │
         │ - Leaderboards    │
         │ - Session cache   │
         │ - Pub/Sub inter-  │
         │   instance        │
         └────────┬──────────┘
                  │
                  ▼
         ┌──────────────────┐
         │   SUPABASE        │
         │ - Auth (users)    │
         │ - Profiles (PG)   │
         │ - Match history   │
         │ - Achievements    │
         └──────────────────┘
```

**Cout de depart : ~5 EUR/mois. Scalable a 10 000+ CCU sans reecriture.**
