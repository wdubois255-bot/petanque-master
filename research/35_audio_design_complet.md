# 35 — Audio Design Complet

> A lire quand : on travaille sur le son, la musique, l'ambiance sonore, ou qu'on utilise ElevenLabs MCP / jsfxr.

---

## 1. PHILOSOPHIE AUDIO

**L'audio represente 50% du game feel.** Un jeu muet perd la moitie de son impact emotionnel. Petanque Master doit sonner aussi bien qu'il se joue.

### Principes directeurs

| Principe | Application |
|----------|------------|
| **Chaque action a un son** | Lancer, impact, roulement, score, UI — rien n'est silencieux |
| **Ambiance = immersion** | Cigales, vent, fontaine — le joueur est en Provence |
| **Musique = emotion** | Chiptune legere en menu, tension en match, triomphe en victoire |
| **Feedback = satisfaction** | Le "clac" du carreau doit etre jouissif |
| **Moins = plus** | Pas de saturation sonore — silence strategique |

---

## 2. CATALOGUE SFX — EFFETS SONORES

### 2.1 Boules et cochonnet

| ID | Son | Description | Outil | Priorite |
|----|-----|------------|-------|----------|
| `sfx_throw` | Lancer de boule | Whoosh court, frequence descendante | jsfxr | P1 |
| `sfx_roll` | Roulement au sol | Loop granulaire, frequence liee a la vitesse | ElevenLabs | P1 |
| `sfx_roll_grass` | Roulement herbe | Plus etouffe, frequence basse | ElevenLabs | P2 |
| `sfx_roll_sand` | Roulement sable | Crissement doux, granuleux | ElevenLabs | P2 |
| `sfx_roll_concrete` | Roulement beton | Plus sec, resonant | ElevenLabs | P2 |
| `sfx_impact_soft` | Impact doux | Boule qui se pose doucement | jsfxr | P1 |
| `sfx_impact_hard` | Impact fort | Boule tiree qui frappe | jsfxr | P1 |
| `sfx_carreau` | Carreau ! | Clac metallique satisfaisant + echo | ElevenLabs | P1 |
| `sfx_boule_boule` | Collision boule-boule | Choc metallique, intensite variable | jsfxr | P1 |
| `sfx_boule_cochonnet` | Boule touche cochonnet | Toc plus leger, bois/resine | jsfxr | P1 |
| `sfx_cochonnet_throw` | Lancer cochonnet | Whoosh leger, plus aigu | jsfxr | P1 |
| `sfx_boule_morte` | Boule hors terrain | Son sourd + "plop" | jsfxr | P2 |
| `sfx_wall_bounce` | Rebond mur (Docks) | Clang metallique | jsfxr | P2 |

### 2.2 UI et menus

| ID | Son | Description | Outil | Priorite |
|----|-----|------------|-------|----------|
| `sfx_menu_move` | Deplacement curseur menu | Tick court, net | jsfxr | P1 |
| `sfx_menu_confirm` | Confirmation | Ding positif, 2 notes montantes | jsfxr | P1 |
| `sfx_menu_cancel` | Annulation | Boup descendant | jsfxr | P1 |
| `sfx_menu_locked` | Element verrouille | Buzz sourd, interdit | jsfxr | P2 |
| `sfx_char_select` | Selection personnage | Clang metallique + flash | jsfxr | P1 |
| `sfx_char_hover` | Survol personnage | Swoosh leger | jsfxr | P2 |

### 2.3 Match et score

| ID | Son | Description | Outil | Priorite |
|----|-----|------------|-------|----------|
| `sfx_vs_slam` | "VS" qui apparait | Impact lourd + reverb | ElevenLabs | P1 |
| `sfx_match_start` | "MATCH!" | Gong/cloche depart | jsfxr | P1 |
| `sfx_point_scored` | Point marque | Ding joyeux court | jsfxr | P1 |
| `sfx_mene_win` | Mene gagnee | Jingle victoire court (3 notes) | jsfxr | P1 |
| `sfx_mene_lose` | Mene perdue | 2 notes descendantes | jsfxr | P2 |
| `sfx_match_point` | Match point atteint | Tension montante, 4 notes | jsfxr | P2 |
| `sfx_victory` | Victoire du match | Fanfare courte (1.5s) | ElevenLabs | P1 |
| `sfx_defeat` | Defaite du match | Notes tristes descendantes (1s) | jsfxr | P2 |
| `sfx_confetti` | Confettis | Pluie legere de clochettes | jsfxr | P2 |

### 2.4 Progression et boutique

| ID | Son | Description | Outil | Priorite |
|----|-----|------------|-------|----------|
| `sfx_xp_gain` | XP gagne | Tinkle montant progressif | jsfxr | P2 |
| `sfx_level_up` | Montee de stat | Ding ascendant puissant | jsfxr | P2 |
| `sfx_ecu_gain` | Ecus gagnes | Pieces metalliques (loop court) | jsfxr | P2 |
| `sfx_purchase` | Achat boutique | Ka-ching! satisfaisant | jsfxr | P2 |
| `sfx_unlock` | Deblocage | Jingle magique (1s) + flash | ElevenLabs | P2 |
| `sfx_ability_use` | Capacite activee | Whoosh energetique | jsfxr | P2 |

---

## 3. MUSIQUE

### 3.1 Pistes necessaires

| ID | Scene | Style | Duree | Tempo | Outil |
|----|-------|-------|-------|-------|-------|
| `mus_title` | TitleScene | Chiptune provencal, joyeux, guitare | 60-90s loop | 110 BPM | Beepbox |
| `mus_charselect` | CharSelectScene | Energique, anticipation, percussions | 45-60s loop | 130 BPM | Beepbox |
| `mus_match_calm` | PetanqueScene (debut) | Leger, detendu, acoustique | 90s loop | 90 BPM | Beepbox |
| `mus_match_tense` | PetanqueScene (fin) | Meme theme, plus urgent, rythme double | 60s loop | 120 BPM | Beepbox |
| `mus_victory` | ResultScene (victoire) | Triomphant, cuivres, celebratoire | 15s une fois | 140 BPM | Beepbox |
| `mus_defeat` | ResultScene (defaite) | Melancolique, piano/guitare | 10s une fois | 70 BPM | Beepbox |
| `mus_shop` | ShopScene | Decontracte, jazzy, marche provencal | 60s loop | 100 BPM | Beepbox |
| `mus_arcade_intro` | ArcadeScene (intro) | Epique/aventure, montee en puissance | 20s une fois | 120 BPM | Beepbox |
| `mus_arcade_ending` | ArcadeScene (ending) | Heroique, resolution | 15s une fois | 100 BPM | Beepbox |

### 3.2 Transitions musicales

| Transition | Technique | Duree |
|-----------|----------|-------|
| Menu → Match | Crossfade | 1500ms |
| Calm → Tense (in-match) | Crossfade progressif quand score >= 10 | 3000ms |
| Match → Resultat | Quick fade out → jingle victoire/defaite | 500ms out, 200ms silence |
| Resultat → Menu | Fade out → fade in | 1000ms each |

### 3.3 Composition chiptune provencale

**Gammes recommandees** :
- **Majeur** pour les themes joyeux (do majeur, sol majeur)
- **Dorien** pour les moments de tension (mi dorien — sonne "mediterraneen")
- **Mixolydien** pour les celebrations (sol mixolydien — sonne festif)

**Instruments chiptune** :
- Lead : square wave (25% duty cycle) — melodie
- Accompagnement : triangle wave — basse
- Percussions : noise channel — rythme
- Accent : sine wave avec vibrato — guitare acoustique

**Reference sonore** : imaginer un croisement entre la musique de **Stardew Valley** (legere, champetre) et **Shovel Knight** (heroique, dynamique).

---

## 4. AMBIANCE SONORE

### 4.1 Ambiances par terrain

| Terrain | Sons d'ambiance | Volume | Implementation |
|---------|----------------|--------|---------------|
| Village | Cigales (loop), cloches lointaines (ponctuel, 30-60s), fontaine | 0.3 | 2 loops + 1 timer random |
| Plage | Vagues (loop), mouettes (ponctuel, 20-40s), vent | 0.3 | 2 loops + 1 timer random |
| Parc | Oiseaux (loop), enfants au loin (ponctuel, 45-90s), vent feuilles | 0.25 | 2 loops + 1 timer random |
| Colline | Grillons (loop), vent oliviers (loop), cloches chevres (ponctuel) | 0.25 | 2 loops + 1 timer random |
| Docks | Machines lointaines (loop), chaines/grues (ponctuel, 30-60s), vent mer | 0.2 | 1 loop + 2 timers random |

### 4.2 Structure d'un mix ambiance

```
Volume
1.0 ─────────────────────────────────────────
0.8 ─ Musique ──────────────────────────────
0.6 ─────────────────────────────────────────
0.4 ─────────────────────────────────────────
0.3 ─ Ambiance loop ────────────────────────
0.2 ─ Ambiance ponctuelle ──────────────────
0.1 ─────────────────────────────────────────
0.0 ─────────────────────────────────────────
     Musique > Ambiance loop > Ambiance ponctuelle
```

### 4.3 Generation avec ElevenLabs MCP

**Prompts recommandes** pour chaque ambiance :

```
Village : "Mediterranean village square ambiance, cicadas buzzing, distant church bell"
Plage : "Mediterranean beach ambiance, gentle waves, seagulls, light wind"
Parc : "French park ambiance, birds singing, distant children playing, leaves rustling"
Colline : "Provencal hillside ambiance, crickets, wind through olive trees, distant goat bells"
Docks : "Night harbor ambiance, distant industrial machinery, chains, sea wind"
```

**Parametres** : duree 10-30s, format WAV, mono (l'espace stereo sera simule par Phaser).

---

## 5. PARAMETRES JSFXR

### 5.1 Recettes pour les SFX principaux

```javascript
// sfx_throw — Whoosh de lancer
{ waveType: 3, // noise
  attackTime: 0, sustainTime: 0.1, decayTime: 0.15,
  startFrequency: 800, minFrequency: 200,
  slide: -0.4, volume: 0.6 }

// sfx_impact_soft — Pose douce
{ waveType: 0, // sine
  attackTime: 0, sustainTime: 0.05, decayTime: 0.2,
  startFrequency: 300, volume: 0.5 }

// sfx_impact_hard — Tir violent
{ waveType: 1, // square
  attackTime: 0, sustainTime: 0.03, decayTime: 0.3,
  startFrequency: 600, minFrequency: 100,
  slide: -0.6, volume: 0.8 }

// sfx_carreau — Carreau satisfaisant
{ waveType: 1, // square
  attackTime: 0, sustainTime: 0.05, decayTime: 0.4,
  startFrequency: 900, minFrequency: 400,
  slide: -0.3, volume: 0.9,
  // + reverb delay 50ms, 3 repetitions decroissantes }

// sfx_boule_boule — Collision boule-boule
{ waveType: 1,
  attackTime: 0, sustainTime: 0.02, decayTime: 0.15,
  startFrequency: 700, volume: 0.7 }

// sfx_menu_confirm — Ding positif
{ waveType: 0, // sine
  attackTime: 0, sustainTime: 0.1, decayTime: 0.2,
  startFrequency: 600,
  // jouer 2 notes : 600Hz puis 900Hz apres 80ms }

// sfx_menu_move — Tick curseur
{ waveType: 1,
  attackTime: 0, sustainTime: 0.01, decayTime: 0.05,
  startFrequency: 1200, volume: 0.3 }
```

### 5.2 Variation dynamique

Pour eviter la monotonie, varier legerement chaque son :
- **Pitch** : ±5% aleatoire a chaque lecture
- **Volume** : ±10% aleatoire
- **Implementation** : `sound.play({ rate: 0.95 + Math.random() * 0.1, volume: baseVol * (0.9 + Math.random() * 0.2) })`

---

## 6. IMPLEMENTATION PHASER 3

### 6.1 Audio Manager pattern

```javascript
// Dans BootScene.js — chargement
this.load.audio('sfx_throw', 'assets/audio/sfx/throw.wav');
this.load.audio('sfx_impact_soft', 'assets/audio/sfx/impact_soft.wav');
this.load.audio('mus_title', 'assets/audio/music/title.ogg');
// ...

// Classe AudioManager (utilitaire singleton)
class AudioManager {
  static playMusic(scene, key, config = {}) {
    if (this.currentMusic) this.currentMusic.stop();
    this.currentMusic = scene.sound.add(key, {
      loop: config.loop ?? true,
      volume: config.volume ?? 0.6
    });
    this.currentMusic.play();
  }

  static playSFX(scene, key, config = {}) {
    const rate = 0.95 + Math.random() * 0.1;
    const volume = (config.volume ?? 0.7) * (0.9 + Math.random() * 0.2);
    scene.sound.play(key, { rate, volume });
  }

  static crossfade(scene, fromKey, toKey, duration = 1500) {
    const from = this.currentMusic;
    const to = scene.sound.add(toKey, { loop: true, volume: 0 });
    to.play();
    scene.tweens.add({ targets: from, volume: 0, duration });
    scene.tweens.add({ targets: to, volume: 0.6, duration });
    this.currentMusic = to;
  }
}
```

### 6.2 Roulement dynamique (son lie a la vitesse)

```javascript
// Dans Ball.js — update()
if (this.speed > 0.1) {
  if (!this.rollSound || !this.rollSound.isPlaying) {
    this.rollSound = this.scene.sound.add('sfx_roll', { loop: true, volume: 0 });
    this.rollSound.play();
  }
  // Volume proportionnel a la vitesse (max a speed 5)
  this.rollSound.setVolume(Math.min(this.speed / 5, 1) * 0.4);
  // Pitch proportionnel aussi
  this.rollSound.setRate(0.8 + (this.speed / 5) * 0.4);
} else if (this.rollSound) {
  this.rollSound.stop();
  this.rollSound = null;
}
```

### 6.3 Gestion du contexte audio web

```javascript
// Debloquer l'audio au premier input utilisateur (obligatoire sur mobile)
this.input.once('pointerdown', () => {
  if (this.sound.context.state === 'suspended') {
    this.sound.context.resume();
  }
});
```

---

## 7. MIX ET VOLUME

### 7.1 Niveaux par defaut

| Categorie | Volume defaut | Range options |
|-----------|--------------|---------------|
| Musique | 0.6 | 0.0 — 1.0 |
| SFX | 0.7 | 0.0 — 1.0 |
| Ambiance | 0.3 | 0.0 — 1.0 |
| Master | 1.0 | 0.0 — 1.0 |

### 7.2 Options audio (menu)

```
┌─ OPTIONS AUDIO ──────────┐
│ Musique    ▓▓▓▓▓▓░░░░ 60%│
│ Effets     ▓▓▓▓▓▓▓░░░ 70%│
│ Ambiance   ▓▓▓░░░░░░░ 30%│
│ Master     ▓▓▓▓▓▓▓▓▓▓100%│
│                           │
│ [Retour]                  │
└───────────────────────────┘
```

### 7.3 Sauvegarde

- Volumes sauvegardes dans localStorage via SaveManager
- Charger et appliquer au boot (BootScene)
- Champs : `audioSettings: { music: 0.6, sfx: 0.7, ambiance: 0.3, master: 1.0 }`

---

## 8. PRIORITE D'IMPLEMENTATION

### Phase 1 — Sons essentiels (MVP)
1. `sfx_throw`, `sfx_impact_soft`, `sfx_impact_hard` (coeur du gameplay)
2. `sfx_boule_boule`, `sfx_boule_cochonnet` (collisions)
3. `sfx_menu_move`, `sfx_menu_confirm` (navigation)
4. `mus_title` (ambiance titre)
5. Audio context unlock (mobile)

### Phase 2 — Ambiance et polish
6. `sfx_roll` + variation par terrain
7. `sfx_carreau` (moment dramatique)
8. Ambiance par terrain (loop de base)
9. `mus_match_calm` + `mus_match_tense`
10. Crossfade musique calm→tense

### Phase 3 — Completude
11. Jingles victoire/defaite
12. SFX boutique et progression
13. Ambiances ponctuelles (timer random)
14. Toutes les pistes musicales
15. Options volume

---

## 9. BUDGET ET PRODUCTION

| Source | Cout | Sons produits |
|--------|------|--------------|
| jsfxr | Gratuit | SFX retro (impacts, UI, boules) |
| ElevenLabs MCP | Credits inclus | Ambiances, sons complexes |
| Beepbox | Gratuit | Musique chiptune |
| Enregistrement real | Gratuit (smartphone) | Impacts boule reels (option) |
| **Total** | **~0€** | **~50 sons + 8 pistes** |

### Tips de production

- **Format** : WAV pour les SFX courts, OGG pour la musique (compression)
- **Sample rate** : 44100 Hz
- **Mono** pour les SFX (economie memoire), stereo pour la musique
- **Normaliser** tous les sons au meme volume de crête (-1dB)
- **Couper les silences** en debut et fin de fichier
