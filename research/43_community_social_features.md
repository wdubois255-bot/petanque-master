# 43 — Community & Social Features

> A lire quand : on travaille sur le partage, les replays, le social, ou les features communautaires.

---

## 1. POURQUOI LE SOCIAL COMPTE

Les jeux avec des features sociales ont **2-3x plus de retention** que les jeux solo purs. La petanque est un sport **social par nature** — le jeu doit capturer cette essence.

### Impact mesure (benchmarks industrie)

| Feature sociale | Impact retention D30 |
|----------------|---------------------|
| Partage de scores | +15-25% |
| Classement entre amis | +30-40% |
| Replays partageables | +20-30% |
| Defis entre amis | +40-50% |

---

## 2. PARTAGE DE RESULTATS

### 2.1 Screenshot de resultat

Apres chaque match, le joueur peut partager un screenshot stylise :

```
┌──────────────────────────────────┐
│ 🏆 PETANQUE MASTER              │
│                                  │
│   [Portrait]  VS  [Portrait]     │
│   "Le Rookie"    "Marcel"       │
│                                  │
│       13  -  8                   │
│                                  │
│  ★ Meilleur tir : 2cm           │
│  ★ Carreaux : 3                  │
│                                  │
│  petanque-master.com             │
│  #PetanqueMaster                 │
└──────────────────────────────────┘
```

### 2.2 Implementation

```javascript
// Generer un screenshot stylise
function generateShareImage(scene, matchData) {
  // Creer un canvas hors-ecran
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 400;
  const ctx = canvas.getContext('2d');

  // Dessiner le resultat (fond, portraits, score, stats)
  ctx.fillStyle = '#1A1510';
  ctx.fillRect(0, 0, 600, 400);
  // ... dessiner les elements

  return canvas.toDataURL('image/png');
}

// Partager via Web Share API
async function shareResult(imageDataUrl, matchData) {
  const blob = await (await fetch(imageDataUrl)).blob();
  const file = new File([blob], 'petanque-result.png', { type: 'image/png' });

  if (navigator.share) {
    await navigator.share({
      title: 'Petanque Master',
      text: `J'ai gagne ${matchData.scorePlayer}-${matchData.scoreOpponent} ! #PetanqueMaster`,
      files: [file]
    });
  } else {
    // Fallback : telecharger l'image
    const a = document.createElement('a');
    a.href = imageDataUrl;
    a.download = 'petanque-result.png';
    a.click();
  }
}
```

### 2.3 Bouton partage

Position : ecran ResultScene, en bas a droite
- Icone : symbole partage (⎘)
- Mobile : Web Share API (natif iOS/Android)
- Desktop : telechargement de l'image + copie lien

---

## 3. REPLAYS

### 3.1 Concept

Enregistrer chaque lancer d'un match pour le revoir ou le partager.

**Ce qu'on enregistre** (leger, pas de video) :

```javascript
// Structure d'un replay
{
  version: 1,
  date: '2026-03-18T14:30:00Z',
  terrain: 'village',
  players: [
    { name: 'Le Rookie', character: 'rookie', boule: 'acier' },
    { name: 'Marcel', character: 'marcel', boule: 'bronze' }
  ],
  throws: [
    { player: 0, type: 'cochonnet', angle: 0.5, power: 0.6, timestamp: 0 },
    { player: 0, type: 'roulette', angle: 0.3, power: 0.45, loft: 'roulette', timestamp: 4200 },
    { player: 1, type: 'demi_portee', angle: -0.1, power: 0.55, loft: 'demi', timestamp: 12500 },
    // ...
  ],
  result: { winner: 0, scoreA: 13, scoreB: 8 }
}
```

### 3.2 Taille estimee

- Un match = ~20-40 lancers
- Chaque lancer = ~100 bytes
- Total par match = **2-4 KB** (negligeable)
- 100 replays = 400 KB

### 3.3 Lecteur de replays

```
┌──── REPLAY ──────────────────────────┐
│                                       │
│   [Terrain de jeu — vue du dessus]   │
│                                       │
│ ◄◄  ◄  ▶  ►  ►►   Lancer 5/24       │
│                                       │
│ Mene 2 — Score: 3-2                  │
│                                       │
│ [Partager]  [Fermer]                 │
└───────────────────────────────────────┘
```

- **Play** : rejoue tous les lancers avec la physique
- **Avance rapide** : passe au lancer suivant
- **Retour** : retour au lancer precedent
- **Partager** : exporter le replay en JSON compact

### 3.4 Partage de replays

```javascript
// Compresser et encoder en URL
function shareReplay(replay) {
  const json = JSON.stringify(replay);
  const compressed = btoa(json); // Base64 (ou LZString pour plus compact)
  const url = `https://petanque-master.com/replay?d=${compressed}`;

  // Si trop long pour une URL (> 2000 chars), utiliser un shortener ou Supabase
  if (url.length > 2000) {
    // Upload sur Supabase et partager l'ID
    return uploadReplayAndGetUrl(replay);
  }
  return url;
}
```

### 3.5 "Replay du jour"

Feature communautaire : le meilleur lancer du jour est mis en avant sur l'ecran titre.
- Source : les replays uploades avec un flag `highlight`
- Selection : le lancer avec la plus petite distance au cochonnet
- Affichage : mini-replay automatique sur le title screen (loop 10s)

---

## 4. CLASSEMENT ET COMPARAISON

### 4.1 Classement global (Phase 3)

voir `research/42_multiplayer_colyseus_implementation.md` section 7

### 4.2 Classement entre amis

Sans serveur (Phase 2) :
- Le joueur partage un **lien d'invitation** avec un code
- Les amis qui cliquent sont ajoutes a un "cercle"
- Le classement du cercle est base sur les stats locales partagees

Avec serveur (Phase 3) :
- Systeme d'amis via Supabase
- Classement ELO entre amis
- Historique des matchs entre amis

### 4.3 Stats comparatives

```
┌──── COMPARAISON ─────────────────────┐
│                                       │
│ TOI vs TON RECORD                     │
│                                       │
│ Meilleur tir      2cm  (record: 1cm) │
│ Max carreaux/match  3  (record: 4)   │
│ Victoires arcade   12  (record: -)   │
│ Win rate           68%               │
│                                       │
│ [Partager mes stats]                  │
└───────────────────────────────────────┘
```

---

## 5. DEFIS ENTRE AMIS (Phase 2-3)

### 5.1 Concept

Un joueur peut defier un ami en lui envoyant un challenge :

```
"Je t'ai battu 13-4 sur la Colline avec Le Magicien. Fais mieux !"
[Lien du defi]
```

Le defi contient :
- Le terrain
- Le perso adversaire (IA)
- La difficulte IA
- Le score a battre

### 5.2 Implementation

```javascript
// Generer un defi
function createChallenge(matchResult) {
  return {
    terrain: matchResult.terrain,
    opponent: matchResult.opponent,
    difficulty: matchResult.difficulty,
    scoreToBeat: matchResult.scorePlayer,
    challenger: matchResult.playerName,
    created: Date.now()
  };
}

// Encoder dans une URL
function challengeUrl(challenge) {
  const encoded = btoa(JSON.stringify(challenge));
  return `https://petanque-master.com/challenge?c=${encoded}`;
}
```

### 5.3 Flow

```
Joueur A : Gagne un match → Ecran resultat → [Defier un ami]
           → Genere un lien → Partage (WhatsApp, SMS, etc.)

Joueur B : Clique le lien → Ouvre le jeu → "Defi de [Joueur A]"
           → Meme config de match → Joue → Resultat compare
           → [Relancer le defi] ou [Partager mon resultat]
```

---

## 6. SPECTATEUR (Phase 3+)

### 6.1 Mode spectateur

Pour les matchs en ligne, permettre a des spectateurs de regarder :

```javascript
// Le spectateur rejoint la room en mode readonly
const room = await client.joinById(roomId, { spectator: true });
// Le serveur envoie les memes events mais n'accepte pas les actions
```

### 6.2 Stream de match

- Max 10 spectateurs par room (pour la perf)
- Le spectateur voit le terrain, les lancers, le score
- Pas d'interaction (sauf emotes de spectateur)
- Utile pour : tournois, streaming, eSport amateur

---

## 7. TOURNOIS (Phase 3+)

### 7.1 Tournoi automatique

```
Inscription (8 joueurs)
    │
    ├── Quart 1 : J1 vs J2
    ├── Quart 2 : J3 vs J4
    ├── Quart 3 : J5 vs J6
    ├── Quart 4 : J7 vs J8
    │
    ├── Demi 1 : Gagnant Q1 vs Gagnant Q2
    ├── Demi 2 : Gagnant Q3 vs Gagnant Q4
    │
    └── Finale : Gagnant D1 vs Gagnant D2
```

- Format : elimination simple
- Taille : 4, 8, ou 16 joueurs
- Matchs en 1 set (premier a 13)
- Recompenses : Ecus + badge + titre

### 7.2 Tournoi programme

- Horaires fixes : "Tournoi du dimanche" a 15h
- Inscription ouverte 30 min avant
- 8 joueurs max (premier arrive premier servi)
- Gratuit, recompenses en Ecus

---

## 8. COMMUNAUTE EXTERNE

### 8.1 Presence en ligne

| Plateforme | Usage | Priorite |
|-----------|-------|----------|
| **Discord** | Communaute, feedback, support | P1 |
| **Twitter/X** | Annonces, GIFs de gameplay | P1 |
| **TikTok/Instagram Reels** | Clips courts (carreaux epiques) | P1 |
| **Reddit** (r/indiegaming, r/petanque) | Visibilite, feedback | P2 |
| **itch.io** (devlog) | Transparence dev | P2 |
| **YouTube** | Trailers, devlogs longs | P3 |

### 8.2 Contenu generable par le jeu

| Contenu | Format | Auto-generation |
|---------|--------|----------------|
| Screenshot resultat | PNG 600x400 | Oui (see section 2) |
| GIF d'un carreau | GIF 5s | Phase 2 (MediaRecorder API) |
| Replay partage | URL + viewer web | Phase 2 |
| Stats joueur | Card PNG | Phase 2 |
| Classement | Page web | Phase 3 |

### 8.3 GIF automatique d'un carreau

```javascript
// Quand un carreau se produit, enregistrer les 3 dernieres secondes
// Utiliser MediaRecorder API sur un canvas
async function captureCarreauGIF(canvas, durationMs = 3000) {
  const stream = canvas.captureStream(30); // 30 FPS
  const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
  const chunks = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.start();

  setTimeout(() => {
    recorder.stop();
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      // Convertir en GIF avec une lib (gif.js) ou laisser en webm
      shareVideo(blob);
    };
  }, durationMs);
}
```

---

## 9. NOTIFICATIONS (Mobile, Phase 2)

### 9.1 Types de notifications

| Notification | Quand | Frequence max |
|-------------|-------|---------------|
| "C'est ton tour !" | Adversaire a joue (async) | 1/match |
| "Nouveau defi quotidien !" | Chaque 24h | 1/jour |
| "Ton ami t'a defie !" | Reception d'un defi | Illimite |
| "Tournoi dans 30 min" | Avant un tournoi | 1/event |

### 9.2 Regles strictes

- **Opt-in uniquement** (jamais de notification sans permission)
- **Max 2/jour** (au-dela, le joueur desinstalle)
- **Pertinentes** (pas de "Tu nous manques !" generique)
- **Actionnable** (cliquer → aller directement a l'action)

### 9.3 Implementation Capacitor

```javascript
import { LocalNotifications } from '@capacitor/local-notifications';

// Defi quotidien
await LocalNotifications.schedule({
  notifications: [{
    title: 'Nouveau defi !',
    body: 'Gagne avec La Choupe sur la Plage',
    id: 1,
    schedule: { every: 'day', at: new Date(/* 10h du matin */) }
  }]
});
```

---

## 10. PRIORITE D'IMPLEMENTATION

| Feature | Phase | Effort | Impact |
|---------|-------|--------|--------|
| Screenshot de resultat + partage | MVP | 4h | Fort |
| Records personnels | MVP | 2h | Moyen |
| Replays (enregistrement) | Phase 2 | 8h | Fort |
| Replays (lecteur) | Phase 2 | 8h | Moyen |
| Defis entre amis (URL) | Phase 2 | 6h | Fort |
| Discord communautaire | Phase 2 | 2h | Fort |
| Classement en ligne | Phase 3 | 16h | Fort |
| Spectateur | Phase 3 | 12h | Moyen |
| Tournois | Phase 3+ | 24h | Fort |
| GIF automatique | Phase 3 | 8h | Moyen |
