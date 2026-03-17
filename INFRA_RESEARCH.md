# Infrastructure & Scalability Research - Petanque Master
## Comprehensive Analysis for 1000+ Concurrent Users
*Research date: March 17, 2026*

---

## 1. Backend Infrastructure Options

### 1.1 The Need for a Backend
Currently Petanque Master is 100% client-side on GitHub Pages. To support multiplayer, leaderboards, user accounts, and anti-cheat, a backend is required. The key decisions are:

- **Real-time vs async**: Petanque is turn-based, so pure WebSocket real-time is not strictly required. Async HTTP + polling or short-lived WebSocket sessions suffice.
- **Authoritative server**: For competitive integrity, the server must validate all game actions (throw parameters, scoring). Client sends inputs, server computes results.
- **State persistence**: Leaderboards, user accounts, match history need a database.

### 1.2 Node.js + Socket.io

**What**: The classic stack for real-time web games. Socket.io provides WebSocket with automatic fallback to HTTP long-polling.

**Scaling**: Socket.io supports horizontal scaling via adapters (Redis, MongoDB, PostgreSQL, AWS SQS, Google Cloud Pub/Sub). Sticky sessions are required when using multiple servers with HTTP long-polling fallback.

**Pros**:
- Massive ecosystem, tons of tutorials
- Works perfectly with Phaser 3 (both JavaScript)
- Full control over server logic
- Free and open source

**Cons**:
- You build everything yourself (matchmaking, rooms, state sync)
- Scaling requires manual setup (Redis adapter, load balancer, sticky sessions)
- No built-in state synchronization

**Best for**: Teams that want full control and have backend experience.

### 1.3 Colyseus (RECOMMENDED for this project)

**What**: Open-source Node.js framework purpose-built for multiplayer games. MIT licensed.

**Key features**:
- Automatic binary state synchronization (no manual serialization)
- Built-in matchmaking and room management
- Authoritative server architecture (clients send inputs, server decides)
- JavaScript/TypeScript SDK works directly with Phaser 3
- Scales from 10 to 10,000+ CCU
- Distributes rooms across multiple processes/machines

**Pricing**:
- Self-hosted: FREE (MIT license, no CCU pricing)
- Colyseus Cloud (managed): Starting at $15/month, 32 global locations

**Why it fits Petanque Master**:
- Room-based architecture maps perfectly to petanque matches (1v1, 2v2)
- Built-in matchmaking handles skill-based pairing
- State sync handles score updates, ball positions in real-time
- Same language (JS) as the game client
- No vendor lock-in: standard Node.js, deploy anywhere

### 1.4 Nakama (Open Source Game Server)

**What**: Full-featured open-source game server by Heroic Labs. Written in Go, Apache 2.0 license.

**Key features**:
- Real-time multiplayer, matchmaking, leaderboards, tournaments
- Friend system, groups/clans, persistent chat
- Virtual wallets and in-game economy
- Server logic in Go, TypeScript/JavaScript, or Lua
- Proven at scale: 500k+ developers, 1 billion+ players, tested at 2M CCU

**Pricing**:
- Self-hosted: FREE (Apache 2.0)
- Heroic Cloud (managed): Fixed pricing, dedicated resources, GCP or AWS, multi-region

**Pros**: Feature-complete out of the box (leaderboards, matchmaking, economy, social). Massively battle-tested.

**Cons**: Heavier than needed for a petanque game. Go server (not JS). More complex setup. Heroic Cloud pricing not publicly listed (contact sales).

**Best for**: Games that need social features, economy, tournaments out of the box.

### 1.5 PlayFab (Microsoft/Azure)

**What**: Complete managed backend platform by Microsoft. Powers 5,000+ games, 2.5B+ player accounts.

**Key features**:
- Authentication (cross-platform, frictionless)
- Matchmaking (Xbox-proven)
- Leaderboards and tournaments
- Economy (virtual currency, stores, catalogs)
- LiveOps (A/B testing, segmentation, scheduled tasks)
- Analytics and real-time event streams
- Cheat prevention built-in
- GDPR and COPPA compliant
- DDoS protection and 24/7 monitoring

**Pricing**: Free tier available (details require account creation). Pay-as-you-go scaling.

**Pros**: Most feature-complete managed solution. No server code needed for most features. Xbox-grade matchmaking. Built-in anti-cheat and compliance.

**Cons**: Vendor lock-in (Azure). Overkill for a simple petanque game. Less control over real-time game logic. SDKs primarily target Unity/Unreal (JavaScript SDK available but less mature).

### 1.6 Firebase (Realtime Database / Firestore)

**What**: Google's BaaS with real-time sync capabilities.

**Key features**:
- Realtime Database: JSON tree, real-time sync across clients
- Firestore: Document database with real-time listeners
- Authentication (Google, email, anonymous, etc.)
- Cloud Functions for server-side logic
- Offline support built-in

**Pricing** (Spark free tier):
- Realtime DB: 100 simultaneous connections, 1GB storage, 10GB/month transfer
- Firestore: 50K reads/day, 20K writes/day, 1GB storage
- Auth: 10K verifications/month

**Pricing** (Blaze pay-as-you-go):
- Realtime DB: $5/GB stored, $1/GB transferred
- Firestore: $0.06/100K reads, $0.18/100K writes
- No hard CCU limits (but costs scale)

**Pros**: Very fast to prototype. Good for leaderboards, user profiles, match results. Auth is excellent.

**Cons**: Not designed for real-time game state sync (too slow for ball physics). No built-in matchmaking. 100 free concurrent connections is very limiting. Costs can spike unpredictably at scale.

**Best for**: User accounts, leaderboards, match history (NOT real-time gameplay).

### 1.7 Supabase

**What**: Open-source Firebase alternative with PostgreSQL backend.

**Key features**:
- Realtime: Broadcast (low-latency messaging), Presence (user state), Postgres Changes
- PostgreSQL for structured data
- Row Level Security for fine-grained access
- Auth with social providers
- Edge Functions (Deno-based)

**Pricing**:
- Free: 500MB database, 2GB bandwidth, 50K monthly active users
- Pro: $25/month, 8GB database, 250GB bandwidth
- Team: $599/month

**Pros**: Open source, PostgreSQL (great for leaderboards with complex queries), real-time multiplayer listed as use case.

**Cons**: Real-time features are newer and less battle-tested for games. Not purpose-built for game servers.

**Best for**: User accounts, leaderboards, match data. Could complement a Colyseus game server.

### 1.8 Serverless Options (AWS Lambda, Cloudflare Workers)

**AWS Lambda**: Good for REST APIs (user accounts, leaderboards, match results). NOT suitable for persistent WebSocket connections (max 15 min timeout). Use API Gateway WebSocket for short sessions.

**Cloudflare Workers + Durable Objects**:
- Workers: Serverless compute at edge, 100K requests/day free
- Durable Objects: Stateful serverless -- each object has compute + storage, globally unique ID
- WebSocket Hibernation: Manages many WebSocket connections efficiently
- Pricing: $5/month base, 1M Durable Object requests included
- Perfect for turn-based games: each match = one Durable Object
- Global edge deployment = low latency everywhere

**This is a compelling modern option for Petanque Master**: each petanque match could be a Durable Object with WebSocket, handling turns and state. Very cost-effective at scale.

---

## 2. Scaling to 1000+ Concurrent Users

### 2.1 Architecture Patterns

**For a turn-based game like petanque, scaling is simpler than for action games**:

```
                    [CDN: Cloudflare/Vercel]
                           |
                    [Static Assets]
                    (HTML, JS, sprites)
                           |
        [Load Balancer (nginx/HAProxy/cloud LB)]
               /           |           \
     [Game Server 1]  [Game Server 2]  [Game Server N]
     (Colyseus/Node)  (Colyseus/Node)  (Colyseus/Node)
               \           |           /
              [Redis] -- [PostgreSQL]
              (pub/sub,   (users,
               sessions)   scores,
                           matches)
```

**Key principles**:
1. **Stateless where possible**: REST APIs for non-real-time features
2. **Room-based sharding**: Each game room lives on one server; rooms are distributed across servers
3. **Redis for coordination**: Pub/sub between servers, session storage, leaderboard cache
4. **PostgreSQL for persistence**: User accounts, match history, permanent leaderboards
5. **CDN for assets**: Static files served from edge, never hit game servers

### 2.2 Horizontal Scaling Strategy

| Component | 100 CCU | 1,000 CCU | 10,000 CCU |
|-----------|---------|-----------|------------|
| Game servers | 1 (2 vCPU, 2GB) | 2-3 servers | 10-15 servers |
| Redis | 1 small instance | 1 instance (2GB) | Redis Cluster |
| PostgreSQL | 1 small instance | 1 instance + read replica | Managed DB cluster |
| Load balancer | Basic | Managed LB | Managed LB + geo |

### 2.3 Database Choices

**Redis** (for leaderboards + real-time data):
- Sorted Sets: O(log N) insert/update, pre-sorted retrieval -- perfect for leaderboards
- `ZADD` to add/update scores, `ZREVRANGE` for top N, `ZREVRANK` for player rank
- Sub-millisecond latency
- Also handles pub/sub between game servers, session cache, rate limiting
- Cost: ~$15/month (managed, e.g., Redis Cloud free tier: 30MB)

**PostgreSQL** (for persistent data):
- User accounts, match history, statistics, progression
- Complex queries (win rate by terrain, opponent, etc.)
- ACID compliance for transactions (purchases, unlocks)
- Full-text search for player names
- Cost: ~$15/month (managed, e.g., Supabase, Neon, or Railway)

**MongoDB**: Not recommended over PostgreSQL for this use case. PostgreSQL handles both relational (users, matches) and JSON (game state snapshots) well.

### 2.4 CDN for Static Assets

Current GitHub Pages is already CDN-backed. For scaling:
- **Cloudflare Pages** (FREE): Unlimited bandwidth, 500 builds/month, global CDN
- **Cloudflare R2**: Object storage with ZERO egress fees ($0.015/GB-month storage only)
- **Vercel**: Good for static + serverless, but limited for WebSocket game servers
- **Netlify**: Similar limitations to Vercel for persistent connections

### 2.5 Estimated Monthly Costs

| Scale | Infrastructure | Estimated Cost |
|-------|---------------|----------------|
| **100 CCU** | 1 small VPS (Hetzner/DO) + free Redis + free PostgreSQL | **$5-15/month** |
| **1,000 CCU** | 2-3 VPS + managed Redis + managed PostgreSQL + CDN | **$50-150/month** |
| **10,000 CCU** | 10-15 VPS or managed containers + Redis Cluster + DB cluster + CDN | **$500-1,500/month** |

**Budget-optimized path (recommended)**:
- 100 CCU: Hetzner CX22 ($4.50/month) + Supabase free + Redis Cloud free = **~$5/month**
- 1,000 CCU: 2x Hetzner CX32 ($2x8/month) + Supabase Pro ($25) + Redis ($15) = **~$55/month**
- Alternative: Colyseus Cloud ($15/month) + Supabase free = **$15/month** (simplest)
- Alternative: Cloudflare Workers + Durable Objects ($5/month) + Supabase free = **$5/month**

---

## 3. Hosting Platforms Comparison

### 3.1 Detailed Comparison Table

| Platform | WebSocket | Min Cost | Scaling | Best For |
|----------|-----------|----------|---------|----------|
| **Hetzner Cloud** | Yes (VPS) | ~$4/month | Manual | Budget, EU-based, GDPR |
| **DigitalOcean** | Yes (VPS) | $6/month | App Platform auto-scale | Simplicity |
| **Fly.io** | Yes (native) | ~$2/month | Auto multi-region | Global low-latency |
| **Railway** | Yes | $5/month (Hobby) | Up to 50 replicas (Pro) | Easy deploy, good DX |
| **Render** | Yes (all plans) | $25/month (persistent) | Manual scaling | Simple WebSocket apps |
| **Cloudflare Workers** | Yes (DO) | $5/month | Auto (edge) | Turn-based, edge compute |
| **AWS EC2/ECS** | Yes | $15+/month | Auto Scaling Groups | Enterprise, full control |
| **AWS GameLift** | Yes | $0.09+/hour | Auto, FlexMatch | Dedicated game servers |
| **Google Cloud** | Yes | $10+/month | GKE, Cloud Run | If using Firebase/Nakama |
| **Vercel** | NO persistent | $0 (Hobby) | Auto (serverless) | Static hosting only |
| **Netlify** | NO persistent | $0 (free) | Auto (serverless) | Static hosting only |

### 3.2 Platform Details

**Hetzner Cloud** (BEST BUDGET OPTION):
- CX22: 2 vCPU, 4GB RAM, 40GB SSD, 20TB traffic = ~$4.50/month
- CX32: 4 vCPU, 8GB RAM = ~$8/month
- Locations: Germany, Finland, USA (Oregon, Virginia), Singapore
- GDPR compliant, ISO 27001, 99.9% SLA
- 10-12x cheaper than AWS/GCP for equivalent specs
- Full root access, Docker support

**Fly.io** (BEST FOR GLOBAL LOW-LATENCY):
- Shared CPU 1x, 256MB: ~$2/month
- Performance 1x, 2GB: ~$32/month
- Deploy in 30+ regions, auto-migrate VMs close to users
- Native WebSocket support
- Pay per second of compute

**Railway** (BEST DEVELOPER EXPERIENCE):
- Hobby: $5/month minimum, 1 vCPU, 0.5GB RAM/service
- Pro: $20/month, up to 50 replicas, 1TB storage
- One-click deploy from GitHub
- Built-in PostgreSQL, Redis
- Pay for actual compute usage

**Render** (SIMPLE AND SOLID):
- Free: 512MB RAM, 0.1 CPU (spins down after inactivity)
- Standard: $25/month, 2GB RAM, 1 CPU (always on)
- WebSocket supported on all plans
- Built-in PostgreSQL and Redis
- Auto-deploy from Git

**Cloudflare Workers + Durable Objects** (INNOVATIVE OPTION):
- $5/month base
- 10M Worker requests/month included
- 1M Durable Object requests/month included
- Zero egress fees with R2
- Each petanque match = 1 Durable Object (WebSocket + state)
- Global edge = lowest latency possible
- Very cost-effective for turn-based games

**AWS GameLift** (OVERKILL BUT POWERFUL):
- c5.large: $0.109/hour (~$79/month)
- Spot instances: 50-85% cheaper
- FlexMatch matchmaking included
- Auto-scaling based on player demand
- Claims ~$1/user/month at scale
- Best for session-based games with dedicated servers
- Supports 2-200 players per match

**Vercel / Netlify** (NOT SUITABLE for game server):
- No persistent WebSocket connections
- Serverless functions timeout (10s hobby, 60s pro on Vercel)
- Good ONLY for static asset hosting and REST APIs
- Could host the game client while backend runs elsewhere

### 3.3 Recommended Architecture by Budget

**Minimal ($5-15/month) -- up to 500 CCU**:
```
Cloudflare Pages (FREE) --> Static game client
Hetzner CX22 ($4.50) --> Colyseus game server
Supabase Free --> Auth + Database + Leaderboards
```

**Standard ($50-100/month) -- up to 2,000 CCU**:
```
Cloudflare Pages (FREE) --> Static game client
2x Hetzner CX32 ($16) --> Colyseus servers behind LB
Supabase Pro ($25) --> Auth + Database
Redis Cloud ($15) --> Leaderboards + Pub/Sub
Cloudflare (FREE) --> DDoS protection + CDN
```

**Scale ($200-500/month) -- up to 10,000 CCU**:
```
Cloudflare Pages --> Static client
Fly.io (multi-region) --> Colyseus servers
Managed PostgreSQL --> Users + Match history
Redis Cluster --> Leaderboards + Sessions
Cloudflare --> DDoS + CDN + WAF
```

---

## 4. Security Considerations

### 4.1 Anti-Cheat for HTML5 Games

HTML5 games are inherently vulnerable because all code runs in the browser. Key strategies:

**Server-Side Validation (ESSENTIAL)**:
- NEVER trust the client. Server computes all game outcomes.
- Client sends: throw angle, power, loft. Server simulates physics and returns ball trajectory.
- Server validates: is it this player's turn? Are parameters within legal bounds?
- Score is computed server-side only.

**Input Validation**:
- Rate-limit actions (max 1 throw per turn, cooldown between actions)
- Validate ranges: power 0-100, angle -90 to 90, loft within character's stats
- Reject impossible inputs (throwing when it's not your turn)

**Replay Verification**:
- Store all inputs for each match
- Server can replay the entire match deterministically to verify results
- Useful for dispute resolution and tournament verification

**Client-Side Hardening** (defense in depth, not primary defense):
- Obfuscate/minify JavaScript (Vite build already does this)
- Use WebAssembly for critical calculations (physics checksum)
- Detect DevTools open (not reliable, just adds friction)
- Integrity checks on game state

**What NOT to bother with**:
- Client-side anti-cheat software (impossible in browser)
- Encrypted game state in client (adds complexity, doesn't prevent cheating)
- Hardware bans (not possible in web)

### 4.2 Rate Limiting

- **API endpoints**: 60 requests/minute per user for REST APIs
- **WebSocket messages**: Max 10 messages/second per connection
- **Match creation**: Max 5 matches/minute per user
- **Authentication**: Max 5 login attempts/5 minutes, then exponential backoff
- **Implementation**: Redis-based sliding window rate limiter, or Cloudflare Rate Limiting rules

### 4.3 DDoS Protection

**Cloudflare (recommended, free tier available)**:
- 477 Tbps network capacity (23x largest DDoS ever recorded)
- 330+ cities worldwide
- Layer 3/4/7 protection
- "Under Attack" mode: one-click activation
- Free plan includes basic DDoS protection
- Pro ($20/month) adds WAF rules

**Architecture**:
- All traffic through Cloudflare proxy (orange cloud)
- Origin server IP never exposed
- WebSocket connections proxied through Cloudflare
- Rate limiting at edge before hitting origin

### 4.4 Data Privacy (GDPR)

Since the game may have EU players:
- **Data minimization**: Only collect what's needed (username, email, game stats)
- **Consent**: Clear cookie/tracking consent banner
- **Right to deletion**: Implement account deletion endpoint
- **Data portability**: Export user data as JSON
- **Privacy policy**: Required, describe what data is collected and why
- **No third-party tracking** without consent
- **Data storage**: EU servers (Hetzner DE/FI) for EU users preferred
- Both PlayFab and Supabase offer GDPR compliance tools

### 4.5 Authentication

**Recommended approach** (progressive):
1. **Anonymous auth first**: Generate UUID, store in localStorage. Zero friction.
2. **Optional account linking**: Email/password or social login to persist across devices.
3. **Social login**: Google, Discord (gaming community), Apple.
4. **Implementation**: Supabase Auth (free, supports all above) or Firebase Auth.

**Security**:
- JWT tokens with short expiry (1 hour) + refresh tokens
- HTTPS everywhere (Cloudflare provides free SSL)
- Never store passwords client-side
- Rate-limit auth endpoints aggressively

---

## 5. Analytics and Monitoring

### 5.1 Game Analytics Services

**GameAnalytics** (RECOMMENDED):
- Free tier available
- JavaScript/HTML5 SDK (lightweight, minimal performance impact)
- Tracks: acquisition, retention (day-1, day-7, day-30), engagement, monetization
- Player segmentation and LiveOps tools
- ISO 27001, SOC 2, ePrivacy, KidSAFE+ certified
- Integrations: Adjust, AppsFlyer, AdMob, AppLovin
- Competitive benchmarking via MarketIQ

**PostHog** (self-hostable alternative):
- Open source, self-host option
- Product analytics, session replay, feature flags, A/B testing
- Free tier: 1M events/month
- Good for web apps, works well with SPAs

**Mixpanel / Amplitude**: More enterprise-focused, higher cost, not game-specific.

### 5.2 Error Tracking

**Sentry** (RECOMMENDED):
- Developer plan: FREE (1 user, basic features)
- Team plan: $26/month (unlimited users)
- JavaScript SDK, catches unhandled errors + performance data
- Source map support (upload Vite source maps)
- AI debugging agent (Seer) on paid plans
- Real-time alerts via email, Slack, Discord

**Custom events to track**:
- Phaser scene transitions failing
- Asset loading errors
- WebSocket disconnections
- Physics engine anomalies (ball going out of bounds)
- Matchmaking timeouts

### 5.3 Performance Monitoring

**Built into Sentry**: Web Vitals, custom transactions, API latency.

**Grafana + Prometheus** (for server-side):
- Free, self-hosted
- Monitor: CCU, room count, message rate, server CPU/memory
- Alerting on thresholds (>80% CPU, >1000ms latency)
- Dashboards for real-time visibility

**Cloudflare Analytics**: Free, automatic for any site behind Cloudflare. Request volume, bandwidth, attack mitigation stats.

### 5.4 Uptime Monitoring

- **Better Uptime / UptimeRobot**: Free tier, checks every 5 minutes, alerts on downtime
- **Cronitor**: Free for 5 monitors, good for cron jobs and heartbeats

---

## 6. Leaderboards, Matchmaking, User Accounts

### 6.1 Leaderboards

**Redis Sorted Sets approach (recommended for speed)**:
```
ZADD leaderboard:global <score> <playerId>     -- Add/update score
ZREVRANGE leaderboard:global 0 9 WITHSCORES    -- Top 10
ZREVRANK leaderboard:global <playerId>         -- Player's rank
ZINCRBY leaderboard:global <points> <playerId> -- Increment score
```
- O(log N) operations, sub-millisecond with millions of entries
- Multiple leaderboards: global, weekly, by terrain, by character
- Reset weekly boards with RENAME + DEL

**PostgreSQL backup (for persistence and complex queries)**:
```sql
-- All-time stats
SELECT username, elo_rating, wins, losses
FROM players ORDER BY elo_rating DESC LIMIT 100;

-- Win rate by terrain
SELECT terrain_id, COUNT(*) as games,
       SUM(CASE WHEN winner THEN 1 ELSE 0 END)::float / COUNT(*) as win_rate
FROM matches WHERE player_id = ? GROUP BY terrain_id;
```

**Managed alternatives**:
- PlayFab Leaderboards: Zero code, cross-platform, time-limited competitions
- Nakama Leaderboards: Tournaments, seasons, prizes, open source

### 6.2 Matchmaking

**For petanque, matchmaking should consider**:
1. **Skill rating (Elo or Glicko-2)**: Primary factor
2. **Wait time**: Widen skill range as wait time increases (30s: +/- 50 Elo, 60s: +/- 100, 120s: any)
3. **Region/latency**: Prefer same region for lower latency
4. **Character**: Optional filter (avoid mirror matches?)

**Implementation options**:

*Colyseus built-in matchmaking*:
- Room-based: players join/create rooms with filters
- Custom matchmaking logic in room's `onAuth` and `onJoin`
- Simple but effective for 1v1

*Custom matchmaking queue*:
- Redis sorted set: ZADD matchmaking_queue <elo> <playerId>
- Background worker: every 2 seconds, pair closest Elo players
- Create Colyseus room, notify both players
- More control, handles edge cases better

*AWS GameLift FlexMatch*:
- Enterprise-grade, rule-based matchmaking
- Team balancing, backfill support
- Overkill and expensive for this project

*Nakama matchmaking*:
- Built-in, customizable algorithm
- Supports properties-based matching
- Free (self-hosted)

### 6.3 User Accounts

**Progressive approach (recommended)**:

**Phase 1 -- Anonymous (current, keep it)**:
- Generate UUID on first visit
- Store in localStorage
- Zero friction, players can play immediately
- Limitation: data lost if localStorage cleared

**Phase 2 -- Optional account linking**:
- After N games, prompt: "Save your progress? Create an account."
- Supabase Auth: email/password + Google + Discord
- Link anonymous UUID to permanent account
- Sync data to server

**Phase 3 -- Social features**:
- Friend list, challenge friends
- Match history viewable by others
- Profile customization (avatar, title, favorite boule)

**Data model**:
```
users:
  id, username, email, avatar_url, created_at
  elo_rating, wins, losses, draws
  favorite_character, unlocked_characters[]
  unlocked_boules[], unlocked_terrains[]

matches:
  id, player1_id, player2_id, winner_id
  terrain_id, scores[], duration, created_at
  replay_data (JSON blob of all inputs)

leaderboard_entries:
  player_id, period (weekly/monthly/alltime)
  score, rank, updated_at
```

---

## 7. Recommended Architecture for Petanque Master

### Phase 1: MVP Online (target: 100 CCU, cost: ~$5/month)

```
[Cloudflare Pages] -- FREE
     |
     | Static HTML/JS/assets
     |
[Player Browser] <--WebSocket--> [Colyseus on Hetzner CX22]
                                        |
                                  [Supabase Free]
                                  - Auth
                                  - PostgreSQL (users, matches)
                                  - Realtime (leaderboard updates)
```

- Colyseus handles: rooms, matchmaking, game state, turn validation
- Supabase handles: auth, user data, match history, leaderboards
- Cloudflare: CDN, DDoS protection, SSL
- Total: ~$5/month (Hetzner CX22)

### Phase 2: Growth (target: 1,000 CCU, cost: ~$50/month)

Add:
- Second Colyseus server behind load balancer
- Redis (for leaderboard caching + server coordination)
- Sentry for error tracking
- GameAnalytics for player analytics
- Upgrade Supabase to Pro

### Phase 3: Scale (target: 10,000 CCU, cost: ~$300/month)

Add:
- Fly.io multi-region deployment
- Redis Cluster
- PostgreSQL read replicas
- Cloudflare Pro (WAF + advanced DDoS)
- Grafana/Prometheus monitoring

### Alternative: Cloudflare-Native Stack (most cost-effective)

```
[Cloudflare Pages] -- FREE, static assets
[Cloudflare Workers] -- Game API, REST endpoints
[Cloudflare Durable Objects] -- One per match, WebSocket + state
[Cloudflare D1] -- SQLite database (users, matches)
[Cloudflare KV] -- Leaderboard cache
```

Total: $5/month base, scales automatically, zero server management.
This is the most modern and cost-effective approach but requires learning Cloudflare's platform.

---

## 8. Summary: Decision Matrix

| Criteria | Colyseus + Hetzner | Cloudflare DO | Nakama | PlayFab |
|----------|-------------------|---------------|--------|---------|
| Cost (100 CCU) | $5/mo | $5/mo | $5/mo (self-host) | Free |
| Cost (1K CCU) | $50/mo | $10/mo | $50/mo | ~$100/mo |
| Cost (10K CCU) | $300/mo | $50/mo | $300/mo | ~$500/mo |
| Setup complexity | Medium | Medium-High | High | Low |
| JS/Phaser integration | Excellent | Good | Moderate | Moderate |
| Real-time game state | Excellent | Good | Excellent | Limited |
| Leaderboards | DIY (Redis) | DIY (KV/D1) | Built-in | Built-in |
| Matchmaking | Built-in | DIY | Built-in | Built-in |
| Anti-cheat (server auth) | Yes | Yes | Yes | Yes |
| Vendor lock-in | None | Cloudflare | None | Microsoft |
| Community/docs | Good | Growing | Good | Excellent |

### TOP RECOMMENDATION

**Start with Colyseus + Hetzner + Supabase** for the best balance of:
- Cost ($5/month to start)
- Developer experience (all JavaScript)
- Phaser 3 compatibility (official JS SDK)
- Feature completeness (rooms, matchmaking, state sync)
- Scalability path (no rewrite needed to reach 10K CCU)
- No vendor lock-in

**Watch Cloudflare Durable Objects** as an alternative -- it could be even cheaper at scale and requires zero server management, but the programming model is less familiar.
