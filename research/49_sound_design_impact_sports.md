# 49 — Sound Design for Impact & Satisfaction in Sports Games

> A lire quand : on ameliore les SFX existants, on cree de nouveaux sons, ou on travaille le "juice" audio.
> Complementaire a : research/35 (catalogue SFX complet), research/47 (camera/slow-mo)

---

## 1. LE SON DES IMPACTS — ANATOMIE

### 1.1 Structure d'un bon son d'impact

Un son d'impact satisfaisant a 3 couches :

```
Volume
  ^
  |  ██                 ← ATTACK (0-5ms) : transient sec, aigu
  |  ██ ████             ← BODY (5-50ms) : resonance, frequence fondamentale
  |  ██ ████ ████████    ← TAIL (50-300ms) : reverb, decay naturel
  |  ██ ████ ████████████
  +──────────────────────→ Time
  0ms   50ms         300ms
```

| Couche | Role | Frequence | Duree |
|--------|------|-----------|-------|
| **Attack** | Le "snap" initial, le moment d'impact | 2-6 kHz | 0-5ms |
| **Body** | La masse, le poids de l'objet | 200-800 Hz | 5-50ms |
| **Tail** | L'environnement, la reverb | 100-400 Hz | 50-500ms |

### 1.2 Le "clac" de la petanque — Deconstruction

Le son d'une collision de boules de petanque dans la realite :
- **Attack** : claquement metallique sec (acier sur acier), ~3-5 kHz
- **Body** : resonance spherique (la boule "sonne" comme une cloche), ~400-800 Hz
- **Tail** : echo court (terrain ouvert, pas de murs), ~200ms

**Ce qui le rend satisfaisant** :
- Le transient est **tres rapide** (< 2ms) → le cerveau recoit un signal de "precision"
- La resonance metallique est **musicale** → harmoniques plaisantes
- La reverb courte signale "plein air" → coherent avec l'ambiance provencale

### 1.3 Wii Sports — Pourquoi c'est si satisfaisant

| Son | Ce qui marche |
|-----|--------------|
| Bowling (impact quilles) | Attack sec + crash de bois + reverb de salle = "destruction" |
| Tennis (raquette) | "Pop" net + rebond + foule = "puissance" |
| Baseball (batte) | CRACK metallique + sifflement balle = "force brute" |

**Secret Wii Sports** : chaque impact est accompagne d'une **reaction de la foule** proportionnelle a la qualite du coup. C'est le son social qui amplifie la satisfaction.

### 1.4 Rocket League — Layering maximal

Le son de but dans Rocket League superpose **5+ couches** :
1. Impact balle/cage (son physique)
2. Explosion (reverb massive)
3. Foule (rugissement)
4. Music stinger (jingle court)
5. UI sound (score +1)

**Lecon** : la superposition de sons cree de la **richesse**. Un carreau dans PM devrait avoir au moins 3 couches.

---

## 2. LAYERING AUDIO — RECETTES PM

### 2.1 Collision boule-boule (normale)

```
Layer 1 : Impact metallique sec (jsfxr, square wave, attack 0ms, freq 700Hz, decay 150ms)
Layer 2 : Resonance basse (jsfxr, sine wave, freq 300Hz, decay 200ms, volume -6dB)
Layer 3 : Rien (c'est une collision normale, pas besoin de plus)
```

### 2.2 CARREAU (moment epique)

```
Layer 1 : Impact metallique FORT (jsfxr, square, attack 0ms, freq 900Hz, decay 300ms, volume +3dB)
Layer 2 : Resonance (sine, freq 400Hz, decay 400ms, volume 0dB)
Layer 3 : Echo/reverb (delay 50ms, 2 repetitions, volume -12dB chaque)
Layer 4 : "Eclat" haute frequence (noise burst, 2-4kHz, 20ms, volume -3dB)
Layer 5 : Stinger musical (2 notes ascendantes, sine, 600→900Hz, 200ms)
```

### 2.3 Boule qui touche le cochonnet

```
Layer 1 : "Toc" bois/resine (jsfxr, sine, freq 500Hz, decay 100ms)
Layer 2 : Petit rebond (jsfxr, sine, freq 800Hz, 30ms, delayed 50ms)
```

### 2.4 Boule qui s'arrete (pose)

```
Layer 1 : Crissement de gravier (noise, filtered 1-3kHz, 200ms, volume faible)
Layer 2 : "Thud" sourd (sine, 150Hz, 50ms)
```

### 2.5 Lancer (whoosh)

```
Layer 1 : Whoosh d'air (noise, bandpass 800-2000Hz, decay 200ms)
Layer 2 : Mouvement de bras (subtle, noise, 400Hz, 50ms)
```

### 2.6 Victoire match

```
Layer 1 : Fanfare courte (3 notes : Do-Mi-Sol, square wave, 150ms chacune)
Layer 2 : Foule qui applaudit (ElevenLabs : "small crowd cheering and clapping")
Layer 3 : Confettis (pluie de clochettes, sine random 2-4kHz, 20 instances, 2s)
```

---

## 3. MUSIQUE ADAPTATIVE

### 3.1 Systeme de tension musicale

La musique s'adapte au score pour amplifier les emotions :

| Score (max 13) | Etat | Musique | Volume |
|----------------|------|---------|--------|
| 0-6 vs 0-6 | Calme | `mus_match_calm` (90 BPM) | 0.5 |
| 7-9 | Tension legere | Meme track, ajouter des percussions | 0.55 |
| 10+ | Tension forte | Crossfade vers `mus_match_tense` (120 BPM) | 0.6 |
| Match point (12) | Critique | Ajouter un motif de basse urgente | 0.65 |
| Derniere boule + match point | Maximum | Silence musical → tension pure | 0.0 |

### 3.2 Le silence strategique

**Le silence est un outil audio aussi puissant que le son.**

| Moment | Audio | Pourquoi le silence marche |
|--------|-------|--------------------------|
| Avant le dernier lancer decisif | Musique fade out, ambiance seule | La pression est internalisee |
| Pendant la deceleration finale | Tout baisse sauf le roulement | Le joueur retient son souffle |
| Juste avant l'affichage du score | 200ms de silence total | Creer l'anticipation |
| Apres un carreau | 100ms silence puis explosion sonore | Le contraste amplifie l'impact |

### 3.3 Implementation Phaser

```javascript
// Systeme de musique adaptative
class AdaptiveMusic {
  constructor(scene) {
    this.scene = scene;
    this.calmTrack = scene.sound.add('mus_match_calm', { loop: true });
    this.tenseTrack = scene.sound.add('mus_match_tense', { loop: true, volume: 0 });
  }

  start() {
    this.calmTrack.play({ volume: 0.5 });
    this.tenseTrack.play({ volume: 0 });
  }

  updateTension(scoreA, scoreB) {
    const maxScore = Math.max(scoreA, scoreB);
    const tension = maxScore / 13; // 0 → 1

    if (maxScore >= 10) {
      // Crossfade vers tense
      this.scene.tweens.add({
        targets: this.calmTrack, volume: 0.5 * (1 - tension),
        duration: 2000
      });
      this.scene.tweens.add({
        targets: this.tenseTrack, volume: 0.6 * tension,
        duration: 2000
      });
    }

    // Match point : silence pour la derniere boule
    if (maxScore >= 12) {
      this.fadeToSilence(3000);
    }
  }

  fadeToSilence(duration) {
    this.scene.tweens.add({ targets: this.calmTrack, volume: 0, duration });
    this.scene.tweens.add({ targets: this.tenseTrack, volume: 0, duration });
  }

  // Apres un carreau : burst de musique
  carreauStinger() {
    const stinger = this.scene.sound.add('sfx_carreau_stinger');
    stinger.play({ volume: 0.8 });
  }
}
```

---

## 4. VARIATION ET ANTI-REPETITION

### 4.1 Pitch variation

Chaque son joue avec une **variation de pitch aleatoire** (±5-10%) :

```javascript
// Jouer un SFX avec variation
function playSFX(scene, key, baseVolume = 0.7) {
  const rate = 0.93 + Math.random() * 0.14;     // 0.93 → 1.07 (±7%)
  const volume = baseVolume * (0.85 + Math.random() * 0.3); // ±15%
  scene.sound.play(key, { rate, volume });
}
```

### 4.2 Variantes d'impact

Pour les collisions boule-boule, avoir **3-4 variantes** du meme son :

```javascript
// Pool de sons d'impact
const IMPACT_VARIANTS = ['impact_1', 'impact_2', 'impact_3', 'impact_4'];
let lastImpact = -1;

function playImpact(scene, intensity) {
  // Eviter de jouer le meme son 2x de suite
  let index;
  do { index = Math.floor(Math.random() * IMPACT_VARIANTS.length); }
  while (index === lastImpact);
  lastImpact = index;

  const rate = 0.8 + intensity * 0.4; // Plus fort = plus aigu
  scene.sound.play(IMPACT_VARIANTS[index], { rate, volume: 0.5 + intensity * 0.3 });
}
```

### 4.3 Volume dynamique selon l'intensite

| Intensite du choc | Volume | Pitch shift | Hitstop associe |
|-------------------|--------|-------------|----------------|
| Legere (vel < 1) | 0.3 | -10% (plus grave) | 0ms |
| Moyenne (vel 1-3) | 0.5 | 0% | 30ms |
| Forte (vel 3-5) | 0.7 | +5% | 50ms |
| Tres forte (vel > 5) | 0.9 | +10% (plus aigu) | 80ms |
| Carreau | 1.0 | +15% | 100ms |

---

## 5. OUTILS — PARAMETRES CONCRETS

### 5.1 jsfxr — Recettes optimisees

```javascript
// IMPACT METALLIQUE (boule-boule)
{
  waveType: 1,          // square
  attackTime: 0,
  sustainTime: 0.02,
  decayTime: 0.18,
  startFrequency: 750,
  minFrequency: 200,
  slide: -0.3,
  volume: 0.7
}

// CARREAU (impact + eclat)
{
  waveType: 1,
  attackTime: 0,
  sustainTime: 0.04,
  decayTime: 0.35,
  startFrequency: 950,
  minFrequency: 300,
  slide: -0.25,
  volume: 0.9,
  // + 2eme son : noise burst
  // waveType: 3, sustainTime: 0.01, decayTime: 0.05, freq: 3000, vol: 0.4
}

// ROULEMENT (loop)
{
  waveType: 3,          // noise
  attackTime: 0.1,
  sustainTime: 0.5,
  decayTime: 0.1,
  startFrequency: 400,
  volume: 0.2
  // Jouer en loop, moduler volume et pitch avec la vitesse
}

// WHOOSH (lancer)
{
  waveType: 3,
  attackTime: 0.01,
  sustainTime: 0.08,
  decayTime: 0.12,
  startFrequency: 1200,
  minFrequency: 400,
  slide: -0.5,
  volume: 0.5
}

// DING (score +1)
{
  waveType: 0,          // sine
  attackTime: 0,
  sustainTime: 0.15,
  decayTime: 0.25,
  startFrequency: 880,  // La4 = 440Hz, La5 = 880Hz
  volume: 0.6
}

// LEVEL UP (stat +1)
{
  waveType: 0,
  attackTime: 0,
  sustainTime: 0.08,
  decayTime: 0.3,
  startFrequency: 523,  // Do5
  // Jouer 3 notes : Do5 → Mi5 → Sol5 (accord majeur ascendant)
  // 523Hz, 659Hz, 784Hz, espaces de 80ms
}
```

### 5.2 ElevenLabs MCP — Prompts optimises

```
// Ambiance Village
"Mediterranean village square, summer afternoon, cicadas buzzing continuously, distant church bell ringing twice, slight breeze, no music, no voices, 15 seconds"

// Ambiance Plage
"French riviera beach ambiance, gentle waves lapping on shore, seagulls calling overhead, distant boat motor, summer breeze, 15 seconds"

// Foule de spectateurs (victoire)
"Small outdoor crowd applauding and cheering, French village atmosphere, 5 seconds, then fading"

// Vent Colline
"Wind blowing through olive trees on a Provencal hillside, crickets, distant goat bells, peaceful, 15 seconds"

// Son Docks (nuit)
"Night harbor ambiance, metal chains clinking, distant crane machinery humming, water against concrete, eerie industrial, 15 seconds"
```

### 5.3 Performance — Combien de sons simultanes ?

| Plateforme | Sons simultanes safe | Sons simultanes max |
|-----------|---------------------|-------------------|
| Desktop Chrome | 32 | 64 |
| Mobile Safari | 8 | 16 |
| Mobile Chrome | 16 | 32 |
| Capacitor (natif) | 16 | 32 |

**Pour PM** : limiter a **8 sons simultanes max** pour la compatibilite mobile.
- 1 musique
- 1 ambiance loop
- 1 roulement (si actif)
- 5 SFX ponctuels max

```javascript
// Limiter les sons simultanes
const MAX_CONCURRENT = 8;
function playSafe(scene, key, config) {
  if (scene.sound.sounds.filter(s => s.isPlaying).length < MAX_CONCURRENT) {
    scene.sound.play(key, config);
  }
}
```

---

## 6. NOS 14 SFX ACTUELS — AUDIT ET PRIORITES

| SFX actuel | Qualite | Action |
|-----------|---------|--------|
| Impact boule | A evaluer | Ajouter du layering (body + tail) |
| Lancer | A evaluer | Verifier le whoosh |
| Collision cochonnet | A evaluer | Plus leger, plus "bois" |
| Menu navigation | OK probable | Verifier la consistance |
| Score | A evaluer | Ajouter un stinger ascendant |
| Victoire | A evaluer | Ajouter une couche "foule" |
| Defaite | A evaluer | Son plus empathique, pas punitif |

### Sons manquants prioritaires

| Son | Priorite | Outil |
|-----|----------|-------|
| Slow-mo "whoosh" (quand le slow-mo s'active) | P1 | jsfxr (noise pitch-down) |
| Carreau stinger (jingle 0.5s apres le carreau) | P1 | jsfxr (3 notes ascendantes) |
| Roulement dynamique (loop pitch/volume) | P1 | ElevenLabs ou enregistrement |
| Achat boutique "ka-ching" | P2 | jsfxr |
| Level up (stat +1) | P2 | jsfxr (accord ascendant) |
| Match point alert | P2 | jsfxr (motif urgent) |
| Focus activation "whoosh zen" | P2 | jsfxr (sine + reverb) |
