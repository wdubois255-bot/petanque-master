# 48 — Pixel Art Character Design at 32x32

> A lire quand : on cree un nouveau perso, on retouche des sprites, ou on travaille sur le Rookie.
> Complementaire a : research/24 (guide qualite pixel art), research/26 (Pixelorama/Aseprite)

---

## 1. SILHOUETTE ET LISIBILITE A 32x32

### 1.1 Allocation de pixels

A 32x32, **chaque pixel compte**. Voici la repartition standard pour un personnage chibi :

```
    ████          ← Cheveux/chapeau (4-5px)
   ██████         ← Tete (6-8px de haut, 6-8px de large)
    ████          ← Yeux + visage (2-3px dans la tete)
   ██████         ← Cou (0-1px)
  ████████        ← Torse (6-8px de haut, 8-10px de large)
   ██  ██         ← Bras (quand visibles, 2-3px large)
  ████████        ← Hanches (2px)
   ██  ██         ← Jambes (4-6px de haut, 3-4px large chaque)
   ██  ██         ← Pieds (1-2px)
```

**Proportions chibi** :
- Ratio tete/corps = 1:2 a 1:2.5
- Tete = ~30% de la hauteur totale (9-10px sur 32)
- Corps = ~40% (12-14px)
- Jambes = ~25% (7-8px)
- Marge : 1-2px de vide en haut et en bas (la sprite ne remplit pas tout le cadre)

### 1.2 Distinguer les personnages par la silhouette

**Test de la silhouette noire** : si on remplit tous les pixels en noir, chaque perso doit etre reconnaissable.

| Perso | Element distinctif de silhouette |
|-------|-------------------------------|
| **Le Rookie** | Casquette + posture decontractee |
| **Ley** | Cheveux longs / echarpe flottante |
| **La Choupe** | Carrure large, bras epais |
| **Marcel** | Chapeau / beret + dos legerement voute |
| **Le Magicien** | Lunettes + posture droite/rigide |
| **Reyes** | Grand, epaules carrees, headband |

**Regle** : au moins **1 element qui depasse** le contour du corps (chapeau, cheveux, cape, accessoire) pour casser la silhouette rectangulaire.

### 1.3 Accessoires = identite a 32px

| Accessoire | Taille en pixels | Impact |
|-----------|-----------------|--------|
| Chapeau/casquette | 4-6px large, 3-4px haut | Tres fort (change le sommet de la silhouette) |
| Lunettes | 4-5px large, 1-2px haut | Moyen (detail de visage) |
| Echarpe/foulard | 2-3px, sort du corps | Fort (mouvement) |
| Barbe/moustache | 3-4px sous les yeux | Moyen (personnalite) |
| Pipe/cigarette | 2-3px sort du visage | Fort (profil unique) |
| Boucles d'oreille | 1px de chaque cote | Faible mais perceptible |

### 1.4 Exemples de reference

| Jeu | Resolution sprite | Ce qui les distingue |
|-----|------------------|---------------------|
| **Celeste** (Madeline) | 16x16 → 32x32 | Cheveux rouges = 3 pixels suffisent pour l'identifier |
| **Stardew Valley** | 16x32 | Chaque villageois a 1 couleur dominante unique |
| **Undertale** | 24x24 - 32x32 | Formes simples mais expressives (Sans = cercle, Papyrus = allonge) |
| **Pokemon GBA** (overworld) | 16x32 | Chaque dresseur a un element (chapeau, sac, cape) |
| **Rivals of Aether** | 64x64 mais lisible a 32 | Silhouettes tres distinctes, couleurs tranchees |

---

## 2. IDLE ANIMATIONS "BREATHING" (2-3 FRAMES)

### 2.1 Pourquoi c'est essentiel

Un sprite statique donne l'impression d'un jeu mort. Une idle animation de **2-3 frames** :
- Fait vivre le personnage
- Coute quasi rien en memoire
- Ajoute enormement de polish percu

### 2.2 Technique : respiration (breathing)

**Frame 1 (base)** : posture normale
**Frame 2 (respiration)** : torse monte de 1px, tete suit

```
Frame 1:        Frame 2:
   ████            ████       ← tete monte 1px
  ██████          ██████
   ████            ████
  ████████        ████████    ← torse monte 1px
  ████████         ████████
   ██  ██          ██  ██
   ██  ██          ██  ██    ← jambes immobiles
```

**Timing** :
- Frame 1 : 500ms
- Frame 2 : 500ms
- = 1 cycle de respiration par seconde (60 BPM, naturel)

### 2.3 Implementation en spritesheet

```
Spritesheet personnage (4 directions × frames) :
┌────┬────┬────┬────┬────┬────┐
│Down│Down│Down│Down│Down│Down│
│Idle│Idle│Walk│Walk│Walk│Walk│
│ 1  │ 2  │ 1  │ 2  │ 3  │ 4  │
├────┼────┼────┼────┼────┼────┤
│Left│Left│Left│Left│Left│Left│
│... │... │... │... │... │... │
└────┴────┴────┴────┴────┴────┘
```

**Taille spritesheet** : 6 frames × 4 directions = 24 frames × 32×32 = 192×128 pixels (compact).

### 2.4 Phaser 3 — Configuration animation

```javascript
// Creer l'animation idle (breathing)
this.anims.create({
  key: 'player_idle_down',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 1 }),
  frameRate: 2, // 2 FPS = 500ms par frame
  repeat: -1    // Loop infini
});

// Jouer l'idle quand le joueur ne bouge pas
if (this.speed === 0) {
  this.sprite.play('player_idle_down', true);
}
```

---

## 3. VICTORY / DEFEAT POSES

### 3.1 References fighting games

| Jeu | Victory pose | Defeat pose | Frames |
|-----|-------------|-------------|--------|
| **Street Fighter** | Poing leve + phrase | A genoux, tete baissee | 3-4 |
| **Pokemon** (trainer) | Bras leves ou poing serre | Sprite qui trembles | 2-3 |
| **Smash Bros** | Pose unique par perso | Applaudir le gagnant | 3-4 |
| **Windjammers** | Saut de joie | S'effondre | 2-3 |

### 3.2 Exprimer en 32x32

**Victoire (3 frames)** :
```
Frame 1:       Frame 2:       Frame 3:
   ████          ████            ████
  ██████        ██████          ██████
   ████          ████    ██     ████
 ██████████    ██████████ ██  ████████
  ████████      ████████      ████████
   ██  ██        ██  ██        ██  ██
   ██  ██       ██    ██       ██  ██

 (normal)     (bras leve)    (poing serre)
```

**Patterns universels pour la victoire** :
- Bras leves (joie) — 1px de deplacement suffit
- Saut (+2px vers le haut sur 1 frame)
- Poing serre (bras devant le torse)

**Defaite (2-3 frames)** :
```
Frame 1:       Frame 2:
   ████          ████
  ██████        ██████
   ████          ████
  ████████      ████████
  ████████      ████████
   ██  ██        ██████      ← genoux plies
   ██  ██          ██        ← accroupi

 (normal)     (tete baissee, accroupi)
```

**Patterns universels pour la defaite** :
- Tete baissee (-1px tete, +1px epaules)
- Accroupi (jambes pliees)
- Bras pendants (bras descendent de 1-2px)

### 3.3 Micro-animations de personnalite

| Perso | Victoire | Defaite |
|-------|---------|---------|
| **Rookie** | Saut de joie, poing leve | Gratte la tete, decu mais pas abattu |
| **Ley** | Croix les bras, air satisfait | Serre les poings, frustre |
| **La Choupe** | Flexe les muscles | Tape du pied, en colere |
| **Marcel** | Sourire, ajuste son chapeau | Hausse les epaules, philosophe |
| **Le Magicien** | Ajuste ses lunettes, air superieur | Regard perplexe, incomprehension |
| **Reyes** | Salut martial | Tete baissee, respect pour l'adversaire |

---

## 4. DONNER DE LA PERSONNALITE EN 32x32

### 4.1 La palette comme personnalite

**Chaque perso a 2-3 couleurs dominantes** qui le definissent :

| Perso | Couleur 1 | Couleur 2 | Couleur accent | Temperature |
|-------|----------|----------|---------------|-------------|
| Rookie | Vert #4CAF50 | Gris #9E9E9E | Blanc | Neutre-frais |
| Ley | Bleu #1565C0 | Blanc #F5F5F5 | Rouge #D32F2F | Froid |
| La Choupe | Rouge #C62828 | Marron #5D4037 | Jaune #FFB300 | Tres chaud |
| Marcel | Beige #D7CCC8 | Vert olive #6B7F3B | Marron #4E342E | Chaud |
| Le Magicien | Violet #7B1FA2 | Blanc #EEEEEE | Dore #FFD700 | Froid-mystere |
| Reyes | Orange #E65100 | Noir #212121 | Blanc | Chaud-intense |

**Regle** : aucun chevauchement de couleur dominante entre les persos. Si deux persos partagent la meme couleur principale, ils se confondent a l'ecran.

### 4.2 La posture comme langage

A 32x32, la posture se lit par **l'inclinaison du torse** et **la position des bras** :

| Posture | Ce qu'elle communique | Technique pixel |
|---------|----------------------|----------------|
| Droit, epaules carrees | Confiance, discipline | Torse vertical, bras colles |
| Legerement penche | Decontracte, cool | Torse incline 1px a droite |
| Voute | Age, fatigue, sagesse | Tete 1px en avant |
| Mains sur les hanches | Assurance, arrogance | Bras sortent sur les cotes |
| Bras croises | Defiance, reserve | Bras devant le torse |

### 4.3 Les yeux — Le pixel le plus important

A 32x32, les yeux font **2x2 ou 3x2 pixels**. C'est le point focal du sprite.

```
Style 1 (2x2) :     Style 2 (3x2) :     Style 3 (1x2 chibi) :
  ██  ██               ███ ███             █  █
  ██  ██               ███ ███

Neutre, simple.      Expressif, detaille.  Minimaliste, mignon.
Stardew Valley.      Fire Emblem GBA.      Undertale.
```

**Pour PM** : style 2 (3x2) ou 2x2 selon le perso. Le Magicien a des lunettes qui encadrent les yeux. La Choupe a les yeux plus petits (1x2) car son visage est plus large.

### 4.4 Micro-animations de personnalite

Des animations idle uniques par perso (en plus de la respiration commune) :

| Perso | Micro-animation | Frames | Timer |
|-------|----------------|--------|-------|
| Rookie | Regarde a gauche puis a droite | 4 | Toutes les 8s |
| Ley | Fait tourner une boule dans sa main | 4 | Toutes les 10s |
| La Choupe | Tape du pied (impatient) | 3 | Toutes les 6s |
| Marcel | Caresse sa moustache/barbe | 3 | Toutes les 12s |
| Le Magicien | Ajuste ses lunettes | 3 | Toutes les 15s |
| Reyes | Croise les bras et hoche la tete | 4 | Toutes les 10s |

**Implementation** : timer aleatoire qui declenche la micro-animation entre les lancers.

---

## 5. APPLICATION — LE ROOKIE

### 5.1 Design visuel du Rookie

**Archetype** : le "P'tit Nouveau" — jeune, decontracte, attachant.

**Elements de design** :
- **Casquette** (element distinctif #1) — portee a l'envers ou de travers
- **T-shirt** simple (couleur unie — vert ou orange)
- **Jean/short** decontracte
- **Baskets** (pas de chaussures de ville)
- **Expression** : yeux grands, air curieux/determine

### 5.2 Palette Rookie

| Element | Couleur | Hex | Justification |
|---------|---------|-----|---------------|
| Casquette | Vert | #4CAF50 | Frais, jeunesse, different du roster |
| T-shirt | Blanc/creme | #F5E6CC | Neutre, adaptable |
| Jean | Bleu denim | #5C6BC0 | Classique |
| Peau | Beige chaud | #EFCDA2 | Mediterraneen |
| Cheveux | Brun | #5D4037 | Naturel |
| Outline | Marron chaud | #3A2E28 | Standard PM (jamais noir pur) |

**Alternative** : casquette orange #FF9800 si le vert est trop proche du Parc (terrain herbe).

### 5.3 Evolution visuelle (3 tenues)

| Palier | 10-19 pts | 20-29 pts | 30-40 pts |
|--------|----------|----------|----------|
| **Haut** | T-shirt uni | Polo avec col | Maillot personnalise |
| **Casquette** | A l'envers | Droite | Headband sportif |
| **Accessoire** | Rien | Lunettes de soleil sur la casquette | Bracelet de champion |
| **Posture** | Decontracte, mains dans les poches | Plus assuree | Droite, confiante |
| **Palette shift** | Vert clair #66BB6A | Vert #4CAF50 | Vert fonce #2E7D32 + accents dores |
| **Sprite tag** | `rookie_t1` | `rookie_t2` | `rookie_t3` |

**Cout production** : 3 sprites × 24 frames (4 dir × 6 frames) = 72 frames de 32×32.
Avec PixelLab : ~1h de generation + 2h de retouche = **~3h total**.

### 5.4 Coherence avec le roster

| Verification | Status |
|-------------|--------|
| Silhouette unique (casquette vs chapeau Marcel, vs lunettes Magicien) | ✅ |
| Couleur unique (vert, absente du roster actuel) | ✅ |
| Temperature palette (neutre-frais, entre Ley froid et Choupe chaud) | ✅ |
| Taille similaire (32x32, memes proportions chibi) | ✅ |
| Accessoire distinctif (casquette) | ✅ |

---

## 6. CHECKLIST QUALITE SPRITE 32x32

### Avant de valider un sprite

- [ ] **Silhouette test** : remplir en noir, encore reconnaissable ?
- [ ] **Palette** : max 8-12 couleurs par sprite (incluant les ombres)
- [ ] **Outline** : marron #3A2E28, jamais noir #000
- [ ] **Yeux** : le point le plus lumineux du sprite (attire le regard)
- [ ] **Proportions chibi** : tete ~30%, corps ~40%, jambes ~25%
- [ ] **Pas de sub-pixel** : chaque "pixel art pixel" = 1 pixel reel
- [ ] **Pas d'anti-alias** : bords nets, pas de gradients lisses
- [ ] **Test in-game** : le sprite est-il lisible sur le terrain ? (pas perdu dans le decor)
- [ ] **Test a distance** : sur un ecran mobile 5", le sprite est-il reconnaissable ?
- [ ] **Idle animation** : au moins 2 frames de respiration
- [ ] **Coherence roster** : les couleurs ne conflictent pas avec un autre perso

### Erreurs frequentes a 32x32

| Erreur | Consequence | Solution |
|--------|------------|---------|
| Trop de couleurs (>16) | Le sprite "vibre", pas pixel art | Reduire a 8-12 max |
| Pixels de 2 tailles differentes | Incoherence d'echelle | Tout en 1:1 |
| Anti-alias automatique | Flou, perd le look pixel | Desactiver dans l'editeur |
| Sprite trop petit dans le cadre 32x32 | Perdu sur le terrain | Occuper 80-90% du cadre |
| Outline noire (#000) | Trop dur, ecrase les details | Utiliser #3A2E28 |
| Peau trop claire | Delave, pas provencal | Utiliser #EFCDA2+ |
| Symmetrie parfaite | Raide, robotique | 1px d'asymetrie = naturel |
