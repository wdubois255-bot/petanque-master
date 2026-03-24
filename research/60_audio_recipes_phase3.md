# 60 — Audio Recipes Phase 3

> A lire quand : on implemente les SFX de l'AXE B (resultats de tir) et l'AXE E (audio enrichi).
> Prerequis : research/35 (audio design complet), research/49 (sound design impact)
> Fichier cible : `src/utils/SoundManager.js` (methodes a ajouter)

---

## 1. SHOT RESULT SFX (6 nouveaux sons proceduraux)

Chaque son utilise le Web Audio API existant dans SoundManager.js.
Pattern : `playFile()` tente d'abord un fichier audio pre-enregistre, puis fallback procedural.
Tous les volumes passent par `_effectiveVol()` pour respecter les settings utilisateur.

### 1.1 sfxPalet() — Metallic scrape + thud

Le palet : la boule tiree prend exactement la place de la boule cible.
Son : impact metallique + grattement court (la boule glisse au sol apres le choc).

```
Layer 1 — Impact metallique (attack)
  Oscillator: square wave
  Frequency: 750 Hz -> 300 Hz (sweep descendant sur 60ms)
  Gain: 0.20 -> 0.001 (exponential ramp, 80ms)
  Filter: bandpass 1500 Hz, Q=2

Layer 2 — Scrape/grattement (body)
  Noise: white noise, 200ms
  Filter: bandpass 2000-3500 Hz, Q=1.5
  Gain: 0.08 -> 0.001 (exponential ramp, 200ms)
  Note: le filtre sweep de 3500 Hz a 1200 Hz sur la duree (grattement qui ralentit)

Layer 3 — Thud sourd (sub)
  Oscillator: sine wave
  Frequency: 120 Hz -> 60 Hz (sweep sur 100ms)
  Gain: 0.06 -> 0.001 (exponential ramp, 100ms)
```

**Duree totale : ~250ms**
**Sensation cible : "CLAC-rrrr" — impact sec suivi d'un glissement**

### 1.2 sfxCasquette() — Light tap + silence

La casquette : effleure la cible, la deplace a peine. Resultat decevant.
Son : petit "tac" sec et fin, puis silence abrupt.

```
Layer 1 — Tap leger
  Oscillator: triangle wave
  Frequency: 1100 Hz
  Gain: 0.10 -> 0.001 (exponential ramp, 40ms)
  Pas de filter

Layer 2 — Click haute frequence
  Noise: white noise burst, 15ms
  Filter: highpass 3000 Hz
  Gain: 0.04 -> 0.001 (exponential ramp, 15ms)

Pas de layer 3 — le silence apres le tap EST le son.
```

**Duree totale : ~50ms (volontairement court)**
**Sensation cible : "tic." — un petit rien, decevant**

### 1.3 sfxCiseau() — Double metallic hit (tac-tac!)

Le ciseau : la boule tiree frappe 2+ cibles. Spectaculaire.
Son : deux impacts metalliques rapprochees (40ms d'ecart).

```
Layer 1a — Premier impact
  Oscillator: square wave
  Frequency: 850 Hz -> 400 Hz (sweep 50ms)
  Gain: 0.22 -> 0.001 (exponential ramp, 100ms)
  Filter: bandpass 1800 Hz, Q=2.5

Layer 1b — Deuxieme impact (decale de 80ms)
  Oscillator: square wave
  Frequency: 950 Hz -> 450 Hz (sweep 50ms)
  Gain: 0.18 -> 0.001 (exponential ramp, 100ms)
  Filter: bandpass 2000 Hz, Q=2.5
  Note: pitch legerement plus haut que le premier (variation naturelle)

Layer 2 — Resonance metallique combinee
  Oscillator: sine wave
  Frequency: 500 Hz -> 350 Hz (sweep 400ms)
  Gain: 0.06 -> 0.001 (exponential ramp, 400ms)
  Starts at: +30ms

Layer 3 — Noise burst (eclat)
  Noise: white noise, 30ms
  Filter: bandpass 3000 Hz, Q=2
  Gain: 0.05 -> 0.001 (exponential ramp, 30ms)
  Starts at: 0ms
```

**Duree totale : ~500ms**
**Sensation cible : "TAC-TAC!" — double claquement rapide et satisfaisant**

### 1.4 sfxBiberon() — Soft wood hit + crowd "ooh"

Le biberon : la boule pointee touche le cochonnet. Inattendu et drole.
Son : "toc" de bois (cochonnet) + foule surprise.

```
Layer 1 — Wood hit (cochonnet touche)
  Oscillator: sine wave
  Frequency: 600 Hz -> 400 Hz (sweep 60ms)
  Gain: 0.12 -> 0.001 (exponential ramp, 80ms)

Layer 2 — Wood resonance
  Oscillator: triangle wave
  Frequency: 900 Hz
  Gain: 0.04 -> 0.001 (exponential ramp, 50ms)
  Starts at: +5ms

Layer 3 — Crowd "ooh" (surprise) — decale de 200ms
  Oscillator 1: sine wave
  Frequency: 250 Hz -> 350 Hz -> 250 Hz (rise then fall, 500ms)
  Gain: 0.05 -> 0.03 -> 0.001 (attack 100ms, sustain 200ms, decay 200ms)

  Oscillator 2: sine wave (deuxieme "voix")
  Frequency: 200 Hz -> 300 Hz -> 200 Hz (meme courbe, legerement decale)
  Gain: 0.03 -> 0.02 -> 0.001

  Noise: brown noise (LP 400 Hz), volume 0.03, 500ms
  Simule le murmure collectif de la foule
```

**Duree totale : ~750ms**
**Sensation cible : "toc... oooh" — impact bois puis surprise collective**

### 1.5 sfxContre() — Dull thud + crowd groan

Le contre : le tireur touche sa propre boule. Erreur grave.
Son : impact sourd et mat (pas satisfaisant) + foule qui grimace.

```
Layer 1 — Thud sourd (impact decevant)
  Oscillator: sine wave
  Frequency: 200 Hz -> 80 Hz (sweep descendant, 150ms)
  Gain: 0.15 -> 0.001 (exponential ramp, 150ms)

Layer 2 — Buzz desagreable
  Oscillator: sawtooth wave
  Frequency: 120 Hz
  Gain: 0.04 -> 0.001 (exponential ramp, 100ms)
  Filter: lowpass 300 Hz
  Note: le sawtooth grave sonne "mauvais" — exactement l'effet voulu

Layer 3 — Crowd groan (decale de 150ms)
  Oscillator 1: sine wave
  Frequency: 300 Hz -> 150 Hz (descente lente, 600ms)
  Gain: 0.05 -> 0.001 (exponential ramp, 700ms)

  Oscillator 2: triangle wave
  Frequency: 250 Hz -> 120 Hz (descente parallele)
  Gain: 0.03 -> 0.001 (exponential ramp, 600ms)
  Starts at: +200ms (50ms apres osc1)

  Noise: brown noise (LP 300 Hz), volume 0.02, 400ms
```

**Duree totale : ~800ms**
**Sensation cible : "BOUM... ohhh" — erreur evidente, public decu**

### 1.6 sfxTrou() — Ground impact + awkward silence

Le trou : la boule rate completement toute cible. Embarassant.
Son : impact au sol mat et mou, puis silence pesant.

```
Layer 1 — Ground impact (terre)
  Noise: white noise, 100ms
  Filter: lowpass 800 Hz
  Gain: 0.10 -> 0.001 (exponential ramp, 100ms)

Layer 2 — Thud very low
  Oscillator: sine wave
  Frequency: 100 Hz -> 50 Hz (sweep 80ms)
  Gain: 0.08 -> 0.001 (exponential ramp, 80ms)

Pas de layer 3 — le silence qui suit est LE son du trou.
Le code appelant (EngineRenderer) doit s'assurer qu'aucun autre SFX
ne joue pendant 500ms apres le trou pour preserver le silence genant.
```

**Duree totale : ~100ms actif + 500ms de silence impose**
**Sensation cible : "pouf..." — rien. Le neant. La honte.**

---

## 2. TERRAIN AMBIANCE (5 terrains, looping procedural)

Chaque ambiance est un mix de boucles Web Audio procedurale.
Toutes les ambiances jouent a volume faible (0.03-0.08) pour ne pas masquer les SFX de jeu.
Fade-in de 2 secondes au demarrage, fade-out de 1 seconde a l'arret.

L'implementation etend `startTerrainAmbiance(terrainId)` existant dans SoundManager.js.
Si un fichier audio pre-enregistre est disponible, il prend la priorite.

### 2.1 Village — Cigales + vent

**Deja partiellement implemente** (procedural cigales + sfx_brise_vent).
A enrichir avec les parametres ci-dessous.

```
Sound 1 — Cigales (chirps pulsants)
  Type: noise (white)
  Filter: bandpass
    Frequency center: 4500 Hz
    Q: 8 (bande etroite, son strident)
  Amplitude modulation: sine LFO a 4 Hz (pulsation chirp-chirp-chirp)
    LFO depth: 1.0 (on/off complet)
  Volume: 0.04
  Loop: buffer 2s, loop=true
  Note: le bandpass etroit + pulsation LFO simule le "cri-cri-cri" des cigales

Sound 2 — Vent leger
  Type: noise (pink, via approximation existante dans SoundManager)
  Filter: lowpass 200 Hz
  Volume: 0.03
  Modulation: gain LFO sine 0.1 Hz, depth 0.02 (souffle lent et regulier)
  Loop: buffer 3s, loop=true

Mixage:
  Cigales: 60% du mix ambiance
  Vent: 40% du mix ambiance
  Volume total: 0.05
  Loop duration: continu tant que PetanqueScene est active
```

### 2.2 Plage — Vagues + mouettes

```
Sound 1 — Vagues (ressac rythmique)
  Type: noise (brown — plus de basses que white)
  Generation: boucle de white noise filtree en brown via accumulation
    brown[i] = (brown[i-1] + white[i] * 0.02) / 1.02
  Filter: lowpass 400 Hz
  Amplitude envelope: gain oscille via sine LFO a 0.15 Hz (1 vague toutes les ~7s)
    LFO min: 0.01 (silence relatif entre les vagues)
    LFO max: 0.06 (crete de la vague)
  Loop: buffer 8s, loop=true
  Note: le rythme lent (0.15 Hz) donne un effet de ressac naturel

Sound 2 — Mouettes (cris ponctuels)
  Type: sine wave chirps
  Frequence: sweep 1200 Hz -> 1800 Hz -> 1200 Hz (montee-descente en 200ms)
  Repetition: sine wave de modulation, 2 chirps rapides espaces de 150ms
  Gain: 0.03 per chirp, decay 100ms
  Timing: jouer un groupe de 2-3 chirps toutes les 15-25s (random timer)
  Note: pas en boucle continue — scheduling aleatoire via delayedCall

Mixage:
  Vagues: 70% du mix
  Mouettes: 30% (ponctuel)
  Volume total: 0.06
```

### 2.3 Parc — Oiseaux + enfants lointains

```
Sound 1 — Oiseaux (chirps melodiques aleatoires)
  Type: sine wave harmonics
  Generation: scheduler qui joue un chirp toutes les 2-5s (aleatoire)
  Chaque chirp:
    Note 1: sine, frequence random 1800-3200 Hz, duree 80ms, gain 0.03
    Note 2: sine, frequence random (±200 Hz de la note 1), duree 60ms, gain 0.02, decale +100ms
    Note 3 (optionnel, 50% chance): sine, frequence note1 * 1.5, duree 40ms, gain 0.015, decale +180ms
  Envelope par note: attack 5ms, decay naturel exponential
  Filter: pas de filtre (sine pure = clair et melodique)
  Note: la randomisation des frequences evite la repetitivite

Sound 2 — Enfants au loin
  Type: noise (white)
  Filter: lowpass 800 Hz (distance = perte des aigus)
  Volume: 0.015 (tres discret)
  Modulation: gain LFO sine 0.3 Hz, depth 0.01 (modulation legere, bruit de fond)
  Loop: buffer 3s, loop=true
  Timing: jouer pendant 5-10s, silence 20-40s, repeter
  Note: le filtre passe-bas a 800 Hz donne l'illusion de distance

Mixage:
  Oiseaux: 65% du mix
  Enfants: 35%
  Volume total: 0.04
```

### 2.4 Colline — Vent + cloches lointaines

```
Sound 1 — Vent soutenu
  Type: noise (pink, approximation existante)
  Filter: bandpass 300 Hz, Q=0.7 (bande large, vent naturel)
  Modulation: gain LFO sine 0.08 Hz, depth 0.03 (rafales lentes)
    Ajouter un second LFO a 0.23 Hz, depth 0.01 (micro-variation)
  Volume: 0.05
  Loop: buffer 4s, loop=true
  Note: le double LFO (lent + rapide) evite la monotonie du vent

Sound 2 — Cloches de chevre (ponctuelles)
  Type: sine wave
  Frequence: 800 Hz (fondamentale) + 1600 Hz (harmonique, -6dB)
  Envelope: attack 2ms, decay 300ms (son clair qui s'estompe)
  Gain: 0.025 per cloche
  Repetition: 1-3 tintements espaces de 200ms
  Timing: jouer un groupe toutes les 30-60s (random timer)
  Filter: highpass 600 Hz (eliminer les basses, son de cloche aerien)
  Note: l'infrequence rend chaque tintement significatif

Mixage:
  Vent: 80% du mix
  Cloches: 20% (ponctuel)
  Volume total: 0.05
```

### 2.5 Docks — Eau + metal creaks

```
Sound 1 — Eau (clapotis portuaire)
  Type: noise (brown — basses profondes)
  Generation: brown noise via accumulation (comme plage, mais plus lent)
  Filter: lowpass 250 Hz (eau profonde, pas de vagues)
  Modulation: gain LFO sine 0.2 Hz, depth 0.02
  Volume: 0.04
  Loop: buffer 5s, loop=true
  Note: plus grave et plus calme que les vagues de la plage

Sound 2 — Metal creaks (grincements)
  Type: sawtooth wave (harmoniques riches = metallique)
  Frequence: random 80-150 Hz
  Modulation: frequence LFO sine 2-4 Hz (random), depth 20 Hz
    Cree un effet de "grincement" oscillant
  Envelope: attack 50ms, sustain 200ms, decay 300ms
  Gain: 0.02 per creak
  Filter: bandpass 200 Hz, Q=3 (son etrangle, metallique)
  Timing: jouer un creak toutes les 20-40s (random timer)
  Note: le sawtooth filtre en bandpass etroit sonne industriel et inquietant

Mixage:
  Eau: 70% du mix
  Metal: 30% (ponctuel)
  Volume total: 0.04
```

---

## 3. CROWD REACTIONS (4 variations)

Etend les `sfxCrowdCheer()` et `sfxCrowdGroan()` existants.
Ajoute 2 nouvelles methodes + enrichit les existantes.

### 3.1 sfxCrowdCheer() — Victoire / carreau / ciseau

**Deja implemente** dans SoundManager.js. A enrichir.

```
Existant: 5 sawtooth oscillators montants + noise burst
Amelioration proposee:

Layer 1 — Noise burst harmonique (existant, garder)
  Noise: white noise, 300ms
  Filter: bandpass 2000 Hz, Q=1
  Gain: 0.06

Layer 2 — Voix montantes (existant, enrichir)
  5 oscillators sawtooth
  Frequences: 200, 250, 300, 350, 400 Hz
  Chaque monte de freq*1.0 a freq*1.5 sur 300ms
  Gain: 0.02 -> 0.05 -> 0.001 (crescendo puis decay)

Layer 3 — Claps rapides (NOUVEAU)
  15 bursts de noise courts (30ms chacun)
  Filter: bandpass 1500-2500 Hz (random par burst)
  Espacements aleatoires sur 1.5s
  Gain: 0.03-0.06 (random par burst)
  Note: reprend la logique de sfxCrowdApplause() mais plus energique
```

**Duree totale : ~1.5s**
**Quand : carreau, ciseau, victoire de mene**

### 3.2 sfxCrowdGasp() — NOUVEAU — Sur casquette (presque)

Court moment de retenue collective. La foule pensait que c'etait un bon tir.

```
Layer 1 — Intake court (aspiration)
  Noise: white noise, 150ms
  Filter: highpass 1000 Hz (son aere, aigu)
  Gain: 0.04 -> 0.001 (decay rapide, 150ms)

Layer 2 — Murmure bref
  Oscillator: sine wave
  Frequence: 350 Hz -> 400 Hz (legere montee = surprise)
  Gain: 0.03 -> 0.001 (180ms)

Layer 3 — Seconde "voix"
  Oscillator: triangle wave
  Frequence: 280 Hz -> 320 Hz
  Gain: 0.02 -> 0.001 (160ms)
  Starts at: +20ms
```

**Duree totale : ~200ms**
**Sensation cible : "Hh!" — aspiration breve et surprise**
**Quand : casquette (effleure la cible), boule qui s'arrete a 1px du cochonnet**

### 3.3 sfxCrowdBoo() — NOUVEAU — Sur contre (erreur)

Desapprobation collective. Le joueur vient de toucher sa propre boule.

```
Layer 1 — Grondement grave collectif
  Oscillator: sine wave
  Frequence: 150 Hz
  Gain: 0.05 -> 0.001 (exponential ramp, 800ms)

Layer 2 — Seconde voix descendante
  Oscillator: sawtooth wave
  Frequence: 200 Hz -> 100 Hz (descente sur 600ms)
  Gain: 0.03 -> 0.001 (700ms)
  Filter: lowpass 400 Hz (etouffe, grognon)

Layer 3 — Noise murmure
  Noise: brown noise (LP 300 Hz)
  Gain: 0.02 -> 0.001 (600ms)
  Starts at: +50ms

Layer 4 — "Non!" ponctuel (optionnel)
  Oscillator: sine
  Frequence: 300 Hz -> 180 Hz (chute rapide)
  Gain: 0.03 -> 0.001 (200ms)
  Starts at: +100ms
```

**Duree totale : ~800ms**
**Sensation cible : "Boooo..." — desapprobation traInante**
**Quand : contre (touche sa propre boule), boule morte (hors terrain)**

### 3.4 sfxCrowdOoh() — NOUVEAU — Sur biberon / point serre

Surprise collective. Mi-chemin entre le gasp et le cheer.

```
Layer 1 — "Ooh" montant-descendant
  Oscillator: sine wave
  Frequence: 200 Hz -> 350 Hz -> 250 Hz (montee 200ms, plateau 100ms, descente 200ms)
  Gain: 0.04 -> 0.06 -> 0.001 (crescendo-decrescendo, 500ms total)

Layer 2 — Seconde voix harmonique
  Oscillator: sine wave
  Frequence: 250 Hz -> 400 Hz -> 300 Hz (meme courbe, +50Hz)
  Gain: 0.025 -> 0.04 -> 0.001 (500ms)
  Starts at: +30ms (leger decalage = effet de foule)

Layer 3 — Troisieme voix basse
  Oscillator: triangle wave
  Frequence: 150 Hz -> 250 Hz -> 180 Hz
  Gain: 0.02 -> 0.03 -> 0.001 (500ms)
  Starts at: +60ms

Layer 4 — Souffle collectif
  Noise: white noise
  Filter: bandpass 800 Hz, Q=0.5
  Gain: 0.02 -> 0.001 (400ms)
  Starts at: +50ms
```

**Duree totale : ~550ms**
**Sensation cible : "Oooooh!" — surprise collective melodique**
**Quand : biberon (cochonnet deplace), point tres serre (< 3px), recul spectaculaire**

---

## 4. MAPPING RESULTATS -> SONS + CROWD

Tableau de synthese pour l'integration dans `PetanqueEngine._detectShotResult()` :

| Resultat | SFX principal | Crowd reaction | happyTime |
|----------|--------------|----------------|-----------|
| **Carreau** | sfxCarreau() (existant) | sfxCrowdCheer() | 0.4 |
| **Palet** | sfxPalet() | sfxCrowdCheer() (court) | 0.3 |
| **Casquette** | sfxCasquette() | sfxCrowdGasp() | - |
| **Ciseau** | sfxCiseau() | sfxCrowdCheer() | 0.5 |
| **Biberon** | sfxBiberon() | sfxCrowdOoh() | - |
| **Contre** | sfxContre() | sfxCrowdBoo() | - |
| **Trou** | sfxTrou() | (silence) | - |
| **Recul** | sfxBouleBoule() (existant) | sfxCrowdOoh() | - |
| **Normal** | sfxBouleBoule() (existant) | - | - |

**Timing** : le SFX principal joue immediatement a la detection. La crowd reaction joue avec un delai de 200-400ms (temps de reaction naturel de la foule).

---

## 5. COMMENTATEUR (Texte uniquement, pas d'audio)

Le commentateur affiche des phrases en haut de l'ecran pendant 3 secondes.
Pas de synthese vocale — texte stylise avec fond semi-transparent.

### 5.1 Categories de phrases

| Categorie | Trigger | Nombre de phrases |
|-----------|---------|-------------------|
| `premier_lancer` | Debut de mene | 4 |
| `bon_point` | Boule joueur < 15px du cochonnet | 5 |
| `tres_pres` | 2 boules < 5px l'une de l'autre | 4 |
| `carreau` | Carreau detecte | 4 |
| `ciseau` | Ciseau detecte | 3 |
| `palet` | Palet detecte | 3 |
| `biberon` | Biberon detecte | 3 |
| `contre` | Contre detecte | 4 |
| `trou` | Trou detecte | 4 |
| `match_point` | Score = 12 | 4 |
| `tension` | Score 10-10, 11-11 ou 12-12 | 4 |
| `fanny` | Score 13-0 | 3 |
| `comeback` | Joueur remonte de 5+ points | 3 |
| `derniere_boule` | Derniere boule de la mene | 3 |
| `victoire` | Match gagne | 4 |
| **Total** | | **~55 phrases** |

### 5.2 Banque de phrases (public/data/commentator.json)

```json
{
  "premier_lancer": [
    "Premier lancer de la mene !",
    "C'est parti !",
    "A vous de jouer !",
    "On y va !"
  ],
  "bon_point": [
    "Joli point !",
    "Bien place !",
    "Ça, c'est du beau jeu !",
    "Belle boule !",
    "Propre !"
  ],
  "tres_pres": [
    "C'est serre !",
    "On va devoir mesurer...",
    "Impossible a departager a l'oeil !",
    "Au millimetre !"
  ],
  "carreau": [
    "CARREAU ! Magnifique !",
    "Et c'est le carreau ! Parfait !",
    "CLAC ! Carreau sur place !",
    "Un carreau de maitre !"
  ],
  "ciseau": [
    "CISEAU ! Deux d'un coup !",
    "Le ciseau ! Exceptionnel !",
    "Deux boules ejectees ! Le ciseau !"
  ],
  "palet": [
    "Palet ! Il prend la place !",
    "Et il chasse pour se placer !",
    "Tire et remplace ! Le palet !"
  ],
  "biberon": [
    "Biberon ! Le cochonnet bouge !",
    "Oh ! Il a touche le but !",
    "Biberon ! Tout change !"
  ],
  "contre": [
    "Oh non ! Il touche sa propre boule !",
    "Le contre ! Ça fait mal...",
    "Aie ! Erreur de tir !",
    "Contre ! C'est la tuile..."
  ],
  "trou": [
    "Et... c'est le trou.",
    "Completement a cote !",
    "Le trou. On oublie et on passe.",
    "Ça arrive aux meilleurs..."
  ],
  "match_point": [
    "Match point !",
    "Plus qu'un point pour la victoire !",
    "On y est presque ! Match point !",
    "La balle de match !"
  ],
  "tension": [
    "Egalite ! La tension monte !",
    "Score serre ! Tout se joue maintenant !",
    "Rien n'est fait ! Egalite !",
    "Les deux equipes au coude a coude !"
  ],
  "fanny": [
    "13-0 ! La fanny !",
    "Fanny ! Ça c'est de l'humiliation !",
    "La fanny est consommee !"
  ],
  "comeback": [
    "Quel retournement !",
    "Il revient de loin !",
    "Le comeback ! On y croit !"
  ],
  "derniere_boule": [
    "Derniere boule de la mene !",
    "Tout se joue sur ce lancer !",
    "La derniere ! Concentration !"
  ],
  "victoire": [
    "Et c'est gagne !",
    "Victoire ! Bravo !",
    "Le match est plié ! Felicitations !",
    "VICTOIRE !"
  ]
}
```

### 5.3 Implementation

Fichier cible : `src/petanque/Commentator.js` (nouveau) ou integre dans `EngineRenderer.js`.

```js
// Logique de base
class Commentator {
    constructor(scene) {
        this.scene = scene;
        this.phrases = null; // charge depuis commentator.json
        this._lastCategory = null;
        this._lastTime = 0;
        this._cooldown = 3000; // 3s entre deux commentaires
    }

    say(category) {
        const now = Date.now();
        if (now - this._lastTime < this._cooldown) return;
        if (category === this._lastCategory && now - this._lastTime < 8000) return;

        const pool = this.phrases[category];
        if (!pool || pool.length === 0) return;

        const text = pool[Math.floor(Math.random() * pool.length)];
        this._display(text);
        this._lastCategory = category;
        this._lastTime = now;
    }

    _display(text) {
        // Texte en haut de l'ecran, fond semi-transparent
        // Style: police pixel, couleur creme #F5E6D0, fond #1A1510 alpha 0.6
        // Tween: fade in 200ms, stay 2500ms, fade out 300ms
    }
}
```

**Regles anti-spam** :
- Cooldown minimum de 3 secondes entre deux commentaires
- Pas le meme category 2 fois de suite (sauf si 8+ secondes d'ecart)
- Si 2 events arrivent en meme temps, priorite : carreau > ciseau > palet > biberon > contre > trou > reste

---

## 6. IMPLEMENTATION SUMMARY

### Methodes a ajouter dans SoundManager.js

| Methode | Section | LOC estimees |
|---------|---------|-------------|
| `sfxPalet()` | Shot results | ~25 |
| `sfxCasquette()` | Shot results | ~15 |
| `sfxCiseau()` | Shot results | ~35 |
| `sfxBiberon()` | Shot results | ~35 |
| `sfxContre()` | Shot results | ~30 |
| `sfxTrou()` | Shot results | ~15 |
| `sfxCrowdGasp()` | Crowd | ~20 |
| `sfxCrowdBoo()` | Crowd | ~25 |
| `sfxCrowdOoh()` | Crowd | ~25 |
| Enrichir `sfxCrowdCheer()` | Crowd | ~15 (delta) |
| Ambiances procedurale (5 terrains) | Ambiance | ~150 |
| **Total** | | **~390 lignes** |

### Fichiers a creer/modifier

| Fichier | Action |
|---------|--------|
| `src/utils/SoundManager.js` | Ajouter 10 methodes SFX + enrichir ambiances |
| `public/data/commentator.json` | Creer avec ~55 phrases |
| `src/petanque/Commentator.js` | Creer classe commentateur texte |
| `src/petanque/EngineRenderer.js` | Integrer appels commentateur |
| `src/petanque/PetanqueEngine.js` | Appeler les bons SFX par resultat |

### Ordre d'implementation

```
1. SFX resultats (6 methodes)           — 1h
2. Crowd reactions (3 nouvelles + 1 enrichie) — 45min
3. Ambiances terrain (5 configs)         — 1h30
4. Commentateur texte (classe + JSON)    — 1h
5. Integration dans PetanqueEngine       — 30min
6. Tests + tuning volumes               — 1h
```

**Temps total estime : ~6h**

---

*Document cree le 24 mars 2026. Source de verite : research/35, research/49, src/utils/SoundManager.js.*
