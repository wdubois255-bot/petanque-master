# 42 — Multiplayer : Implementation Colyseus Detaillee

> A lire quand : on implemente le mode versus en ligne (Phase 3), ou qu'on prepare l'architecture serveur.

---

## 1. RAPPEL ARCHITECTURE

```
┌─────────────┐     WebSocket      ┌──────────────────┐     ┌───────────┐
│ Client      │ ◄──────────────► │ Colyseus Server   │ ◄──► │ Supabase  │
│ (Phaser 3)  │                    │ (Node.js)         │     │ (DB/Auth) │
│ Browser/App │                    │ Hetzner CX22      │     │ (Cloud)   │
└─────────────┘                    └──────────────────┘     └───────────┘
```

- **Colyseus** : serveur de jeu temps reel (rooms, state sync)
- **Supabase** : base de donnees (profils, classement, historique)
- **Redis** : cache et presence (optionnel, pour > 500 CCU)

---

## 2. COLYSEUS — CONCEPTS CLES

### 2.1 Rooms

Une **room** = une instance de match. Chaque room contient :
- L'etat du jeu (positions boules, score, tour)
- Les 2 joueurs connectes
- La logique de validation cote serveur

```javascript
// server/rooms/PetanqueRoom.js
import { Room } from '@colyseus/core';
import { PetanqueState } from './PetanqueState';

export class PetanqueRoom extends Room {
  maxClients = 2;

  onCreate(options) {
    this.setState(new PetanqueState());
    this.state.terrain = options.terrain || 'village';
    this.state.format = options.format || '1v1';

    // Ecouter les actions des joueurs
    this.onMessage('throw', (client, data) => {
      this.handleThrow(client, data);
    });

    this.onMessage('select_loft', (client, data) => {
      this.state.players[client.sessionId].loftType = data.loft;
    });
  }

  onJoin(client, options) {
    const playerIndex = this.state.players.size;
    this.state.players.set(client.sessionId, {
      id: client.sessionId,
      name: options.name || `Joueur ${playerIndex + 1}`,
      character: options.character,
      bouleType: options.boule,
      index: playerIndex,
      boules: [],
      score: 0
    });

    if (this.state.players.size === 2) {
      this.startMatch();
    }
  }

  handleThrow(client, data) {
    // VALIDATION COTE SERVEUR (anti-triche)
    if (this.state.currentPlayer !== client.sessionId) return;
    if (data.power < 0 || data.power > 1) return;
    if (data.angle < -Math.PI || data.angle > Math.PI) return;

    // Simuler la physique cote serveur
    const result = this.simulateThrow(data.angle, data.power, data.loft);

    // Broadcast le resultat a tous les clients
    this.broadcast('throw_result', {
      playerId: client.sessionId,
      trajectory: result.trajectory,
      finalPosition: result.finalPosition,
      collisions: result.collisions
    });

    // Mettre a jour l'etat
    this.state.updateAfterThrow(client.sessionId, result);
  }

  simulateThrow(angle, power, loft) {
    // Meme physique que Ball.js mais executee cote serveur
    // Identique au client pour la coherence
    // ...
  }

  startMatch() {
    this.state.phase = 'cochonnet';
    this.state.currentPlayer = [...this.state.players.keys()][0];
    this.broadcast('match_start', { terrain: this.state.terrain });
  }

  onLeave(client, consented) {
    if (!consented) {
      // Deconnexion inattendue — attendre 30s pour reconnexion
      this.allowReconnection(client, 30);
    } else {
      // Le joueur a quitte volontairement
      this.broadcast('opponent_left', {});
      // Victoire par forfait pour l'autre joueur
      this.state.phase = 'forfeit';
    }
  }
}
```

### 2.2 State Schema

```javascript
// server/rooms/PetanqueState.js
import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';

class BallState extends Schema {
  @type('number') x = 0;
  @type('number') y = 0;
  @type('boolean') isDead = false;
  @type('string') owner = '';
}

class PlayerState extends Schema {
  @type('string') id = '';
  @type('string') name = '';
  @type('string') character = '';
  @type('number') score = 0;
  @type('number') boulesRemaining = 3;
  @type('string') loftType = 'roulette';
}

class PetanqueState extends Schema {
  @type('string') phase = 'waiting'; // waiting, cochonnet, playing, mene_end, match_end
  @type('string') currentPlayer = '';
  @type('string') terrain = 'village';
  @type('number') mene = 1;
  @type({ map: PlayerState }) players = new MapSchema();
  @type([BallState]) boules = new ArraySchema();
  @type('number') cochonnetX = 0;
  @type('number') cochonnetY = 0;
}
```

### 2.3 Client-side integration (Phaser)

```javascript
// src/utils/MultiplayerManager.js
import * as Colyseus from 'colyseus.js';

class MultiplayerManager {
  constructor() {
    this.client = new Colyseus.Client('wss://petanque-server.example.com');
    this.room = null;
  }

  async createRoom(options) {
    this.room = await this.client.create('petanque', {
      terrain: options.terrain,
      character: options.character,
      name: options.playerName
    });
    this.setupListeners();
    return this.room.id; // Room code a partager
  }

  async joinRoom(roomId, options) {
    this.room = await this.client.joinById(roomId, {
      character: options.character,
      name: options.playerName
    });
    this.setupListeners();
  }

  setupListeners() {
    this.room.onStateChange((state) => {
      // Synchroniser l'etat Phaser avec l'etat serveur
      this.onStateUpdate?.(state);
    });

    this.room.onMessage('throw_result', (data) => {
      // Animer le lancer de l'adversaire
      this.onThrowResult?.(data);
    });

    this.room.onMessage('match_start', (data) => {
      this.onMatchStart?.(data);
    });

    this.room.onMessage('opponent_left', () => {
      this.onOpponentLeft?.();
    });

    this.room.onError((code, message) => {
      console.error('Room error:', code, message);
    });
  }

  sendThrow(angle, power, loft) {
    this.room.send('throw', { angle, power, loft });
  }

  async disconnect() {
    await this.room?.leave();
  }
}

export default new MultiplayerManager();
```

---

## 3. MODES MULTIJOUEUR

### 3.1 Versus en ligne (temps reel)

```
Joueur A                    Serveur                    Joueur B
   │                          │                          │
   ├── createRoom ──────────► │                          │
   │ ◄── roomId="ABCD" ────── │                          │
   │                          │ ◄── joinRoom("ABCD") ──── │
   │ ◄── match_start ──────── │ ──── match_start ──────► │
   │                          │                          │
   │── throw(angle,power) ──► │                          │
   │                          │── throw_result ─────────► │
   │ ◄── throw_result ─────── │                          │
   │                          │                          │
   │                          │ ◄── throw(angle,power) ── │
   │ ◄── throw_result ─────── │                          │
   │                          │── throw_result ─────────► │
   │                          │                          │
```

### 3.2 Versus asynchrone (tour par tour)

Pour les joueurs qui ne sont pas connectes en meme temps :

```javascript
// Le joueur A joue son tour
// → L'etat est sauvegarde en base (Supabase)
// → Le joueur B recoit une notification
// → Le joueur B charge l'etat, joue son tour
// → Cycle continue

// Supabase table: async_matches
{
  id: 'uuid',
  room_code: 'ABCD',
  player_a: { name, character, boule },
  player_b: { name, character, boule },
  terrain: 'village',
  state: { /* PetanqueState serialise */ },
  current_turn: 'player_a',
  created_at: timestamp,
  last_action: timestamp,
  status: 'active' // active, completed, abandoned
}
```

### 3.3 Matchmaking (Phase 3+)

Pour les joueurs qui veulent un adversaire aleatoire :

```javascript
// Matchmaking simple par skill rating (ELO)
// 1. Le joueur rejoint une queue
// 2. Le serveur match les joueurs de skill similaire (±200 ELO)
// 3. Si pas de match apres 30s, elargir la fourchette
// 4. Creer une room automatiquement

this.room = await this.client.joinOrCreate('petanque_ranked', {
  character: 'rookie',
  elo: 1200 // Calcule cote client depuis le profil
});
```

---

## 4. ANTI-TRICHE

### 4.1 Validation cote serveur

| Triche possible | Prevention |
|-----------------|-----------|
| Modifier la puissance/angle | Valider les ranges cote serveur |
| Envoyer des lancers hors tour | Verifier `currentPlayer === client` |
| Modifier le score | Le score est calcule par le serveur uniquement |
| Speed hack | Le serveur fait la simulation physique |
| Spam de messages | Rate limiter (max 1 throw/s) |

### 4.2 Physique deterministe

**Critique** : la simulation physique doit donner le **meme resultat** sur le client et le serveur.

```javascript
// Utiliser des maths deterministes
// PAS de Math.random() dans la physique multijoueur
// Utiliser un PRNG seed partage
class SeededRandom {
  constructor(seed) { this.seed = seed; }
  next() {
    this.seed = (this.seed * 16807) % 2147483647;
    return (this.seed - 1) / 2147483646;
  }
}
```

### 4.3 Reconciliation

Si le client et le serveur divergent (lag) :
1. Le serveur est **autoritaire** (sa version prevaut)
2. Le client re-simule depuis le dernier etat confirme
3. Interpolation visuelle pour masquer les corrections

---

## 5. GESTION DU LAG

### 5.1 Latence acceptable

| Latence | Experience | Population couverte |
|---------|-----------|-------------------|
| < 50ms | Parfait | Meme continent |
| 50-150ms | Bon | Intercontinental |
| 150-300ms | Jouable (tour par tour) | Partout |
| > 300ms | Problematique | Serveur trop loin |

**Avantage petanque** : le jeu est tour par tour. Le lag n'affecte PAS le gameplay directement (pas de reaction temps reel). Il affecte seulement le temps d'attente entre les tours.

### 5.2 Feedback pendant l'attente

```
"L'adversaire reflechit..."  (avec timer : 2:00, 1:59, 1:58...)
[Animation : adversaire qui frotte sa boule, regarde le terrain]
```

- Timer de 2 minutes par tour
- Si le timer expire : le joueur perd son tour (la boule n'est pas lancee)
- Apres 3 tours expires : forfait automatique

### 5.3 Reconnexion

```javascript
// Client — tenter la reconnexion automatique
async reconnect(roomId, sessionId) {
  try {
    this.room = await this.client.reconnect(roomId, sessionId);
    this.setupListeners();
    console.log('Reconnecte !');
  } catch (e) {
    console.log('Impossible de se reconnecter');
    // Rediriger vers le menu
  }
}
```

---

## 6. ROOM CODES (partage simple)

### 6.1 Generation

```javascript
// Codes lisibles a 4 caracteres (pas de 0/O, I/1 pour eviter la confusion)
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function generateRoomCode() {
  return Array.from({ length: 4 }, () =>
    CHARS[Math.floor(Math.random() * CHARS.length)]
  ).join('');
}
// Exemples : "A3K7", "BXQR", "5MNT"
```

### 6.2 Flow

```
Joueur A : Menu → "Creer une partie" → Code "A3K7" affiche
           "Partage ce code a ton adversaire !"
           [Copier] [Partager]  (API Web Share sur mobile)

Joueur B : Menu → "Rejoindre" → Saisir "A3K7" → Connexion
```

### 6.3 Partage mobile

```javascript
// Web Share API (mobile)
async shareRoomCode(code) {
  if (navigator.share) {
    await navigator.share({
      title: 'Petanque Master',
      text: `Rejoins ma partie ! Code : ${code}`,
      url: `https://petanque-master.com/join?code=${code}`
    });
  } else {
    // Fallback : copier dans le presse-papier
    navigator.clipboard.writeText(code);
  }
}
```

---

## 7. CLASSEMENT EN LIGNE

### 7.1 Systeme ELO simplifie

```javascript
// K-factor = 32 (standard pour les jeux casualsz)
function calculateElo(playerElo, opponentElo, result) {
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  const score = result === 'win' ? 1 : (result === 'draw' ? 0.5 : 0);
  return Math.round(playerElo + 32 * (score - expected));
}

// Exemple :
// Joueur 1200 bat joueur 1400 → 1200 + 32*(1-0.24) = 1224 (+24)
// Joueur 1400 perd → 1400 + 32*(0-0.76) = 1376 (-24)
```

### 7.2 Schema Supabase

```sql
-- Table players
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  elo INTEGER DEFAULT 1200,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table matches
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_a UUID REFERENCES players(id),
  player_b UUID REFERENCES players(id),
  winner UUID REFERENCES players(id),
  score_a INTEGER,
  score_b INTEGER,
  terrain TEXT,
  duration_seconds INTEGER,
  played_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard view
CREATE VIEW leaderboard AS
SELECT name, elo, wins, losses,
       ROUND(wins::numeric / NULLIF(wins + losses, 0) * 100) as win_rate
FROM players
ORDER BY elo DESC
LIMIT 100;
```

### 7.3 Affichage in-game

```
┌──── CLASSEMENT ────────────────────────┐
│  #  Nom            ELO    V/D   Win%   │
│  1  ★ MaitreBouliste  1847   142/38  79% │
│  2  ★ ProPointer      1723   98/32   75% │
│  3  TireurFou       1689   201/89  69% │
│  4  BouleVerte      1654   67/29   70% │
│  5  PetanqueKing    1612   45/23   66% │
│ ...                                     │
│ 42  > Vous <        1234   12/8   60%  │
│                                         │
│ [Retour]                                │
└─────────────────────────────────────────┘
```

---

## 8. INFRASTRUCTURE ET COUTS

### 8.1 Serveur Colyseus

| Fournisseur | Specs | Prix | CCU supporte |
|-------------|-------|------|-------------|
| **Hetzner CX22** | 2 vCPU, 4GB RAM | 4.50€/mo | ~200-500 CCU |
| **Hetzner CX32** | 4 vCPU, 8GB RAM | 8.50€/mo | ~500-1000 CCU |
| **Hetzner CX42** | 8 vCPU, 16GB RAM | 16€/mo | ~1000-2000 CCU |
| Fly.io (starter) | 1 shared CPU, 256MB | Gratuit | ~50 CCU |
| Railway | Auto-scale | ~5-15$/mo | Variable |

### 8.2 Supabase

| Plan | Prix | Limites |
|------|------|---------|
| Free | 0€ | 500MB DB, 50k requests/mo |
| Pro | 25$/mo | 8GB DB, illimite requests |

### 8.3 Budget total Phase 3

```
Colyseus (Hetzner CX22)  : 4.50€/mo
Supabase Free             : 0€
Domaine                   : 10€/an
Cloudflare (CDN)          : 0€ (plan gratuit)
─────────────────────────────────────
Total : ~5€/mo au lancement
Scale : ~30€/mo a 1000 CCU
```

---

## 9. ORDRE D'IMPLEMENTATION

### Etape 1 : Setup serveur (1 jour)
- Colyseus hello world
- Deploy sur Hetzner/Fly.io
- Connexion WebSocket basique depuis le client

### Etape 2 : Room management (2 jours)
- PetanqueRoom : create, join, leave
- Room codes (generation + join by code)
- UI : ecrans "Creer" et "Rejoindre"

### Etape 3 : Game state sync (3 jours)
- PetanqueState schema
- Synchronisation : throw → result → update state
- Physique cote serveur (dupliquer Ball.js)

### Etape 4 : Match complet (2 jours)
- Tour par tour : cochonnet → lancers → mene → score
- Fin de match : resultat + ELO update
- Reconnexion + forfait

### Etape 5 : Polish (2 jours)
- Animations du lancer adverse
- Timer par tour
- Chat simple (emotes predefinies)
- Classement (Supabase)

**Total estime : 10 jours de dev**

---

## 10. EMOTES ET COMMUNICATION

### 10.1 Pas de chat texte libre

Raisons :
- Moderation impossible pour un indie
- Toxicite garantie
- Pas necessaire pour un jeu tour par tour

### 10.2 Emotes predefinies

| Emote | Emoji | Quand l'utiliser |
|-------|-------|-----------------|
| "Beau tir !" | 👏 | Adversaire fait un bon lancer |
| "Oups..." | 😅 | Rater un lancer |
| "Bravo !" | 🎉 | Adversaire gagne la mene |
| "Bien joue" | 🤝 | Fin de match |
| "Go !" | 🔥 | Encouragement |
| "Hmm..." | 🤔 | Reflexion |

### 10.3 Anti-spam

- Cooldown de 3s entre les emotes
- Max 5 emotes par mene
- Option "Muet" pour ignorer les emotes de l'adversaire
