# Cahier des Charges - Techniques et Actions de Petanque
## Analyse complete : Reel vs Implemente dans Petanque Master

> Date : 17 mars 2026
> Sources : FIPJP, FFPJP, Boulipedia, Petanque Generation, Obut, recherche terrain
> Fichier reference detaille : `research/30_techniques_petanque_exhaustif.md`

---

## SYNTHESE RAPIDE

| Categorie | Reel | Implemente | Manquant | Priorite |
|-----------|------|------------|----------|----------|
| Techniques de pointage | 4 | 3 | Donnee (concept) | Basse |
| Techniques de tir | 5 | 1 (tir au fer) | Rafle, tir devant, sautee, tir au but | **HAUTE** |
| Effets/spins | 4 | 0 | Retro, lateral, nature | **HAUTE** |
| Coups tactiques | 8 | 2 (carambolage naturel, poussette) | Ciseau, devant de boule, bec, refente | Moyenne |
| Resultats de tir | 12 | 1 (carreau) | Palet, casquette, contre, etc. | Moyenne |
| Strategies IA | 6+ | 4 | Abandon mene, contre-jeu, gestion boules avancee | Moyenne |
| Surfaces terrain | 8 | 4 | Gravier, dolomie, sol humide, gros gravier | Basse |
| Regles FIPJP | 15+ | ~10 | Cochonnet noye, doublette/triplette, cercle | Moyenne |

---

## 1. TECHNIQUES DE POINTAGE

### 1.1 Roulette
| Aspect | Reel | Implemente |
|--------|------|------------|
| Trajectoire basse, roule des les premiers metres | Oui | **OUI** - `LOFT_ROULETTE { landingFactor: 0.15, arcHeight: -8 }` |
| Position accroupie recommandee | Oui | Non (pas de posture joueur) |
| Sensible aux irregularites du sol | Oui | **PARTIEL** - zones dans terrains, mais pas de micro-deviations aleatoires |
| Terrain ideal : plat et roulant | Oui | **OUI** - IA choisit roulette sur terre/dalles |

**Verdict : Bien implemente.** Manque micro-deviations aleatoires sur terrain irregulier.

### 1.2 Demi-Portee
| Aspect | Reel | Implemente |
|--------|------|------------|
| 50% vol, 50% roulement | Oui | **OUI** - `LOFT_DEMI_PORTEE { landingFactor: 0.50, arcHeight: -40 }` |
| Technique la plus polyvalente | Oui | **OUI** - technique par defaut |
| Permet d'eviter obstacles proches | Oui | **OUI** - phase aerienne significative |

**Verdict : Bien implemente.**

### 1.3 Portee / Plombee
| Aspect | Reel | Implemente |
|--------|------|------------|
| Trajectoire haute, quasi-verticale a l'arrivee | Oui | **OUI** - `LOFT_PLOMBEE { landingFactor: 0.80, arcHeight: -80 }` |
| Boule s'arrete quasi sur place | Oui | **OUI** - `rollEfficiency: 0.45` |
| Ideal terrain sableux/mou | Oui | **OUI** - IA choisit plombee sur sable |
| Cratere visible a l'impact | Oui | **OUI** - rendu visuel |
| Se combine avec effet retro | Oui | **NON** - pas d'effets implementes |

**Verdict : Bien implemente.** Manque la combinaison avec l'effet retro.

### 1.4 La Donnee (concept)
| Aspect | Reel | Implemente |
|--------|------|------------|
| Point d'impact cible au sol | Oui | **PARTIEL** - le landing marker montre ou la boule va atterrir |
| Analyse du sol (trous, bosses, zones humides) | Oui | **NON** - pas de lecture du terrain par le joueur |

**Verdict : Le concept existe via le marker, mais pas exploitable strategiquement.**

---

## 2. TECHNIQUES DE TIR

### 2.1 Tir au Fer (Plein Fer) - IMPLEMENTE
| Aspect | Reel | Implemente |
|--------|------|------------|
| Boule frappe directement la cible sans toucher le sol | Oui | **OUI** - `LOFT_TIR { landingFactor: 0.95, arcHeight: -65 }` |
| Vitesse d'impact 2-3x plus rapide | Oui | **OUI** - vitesse augmentee |
| Detecte le carreau naturellement | Oui | **OUI** - COR 0.62, `CARREAU_THRESHOLD = 24px` |
| Selection de cible adverse | Oui | **OUI** - ciblage dans AimingSystem |

**Verdict : Excellent. Le seul type de tir mais tres bien fait.**

### 2.2 Tir a la Rafle / Raspaille - MANQUANT
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Boule rasante, roule au sol avant impact | Oui | Nouveau loft preset `LOFT_RAFLE` |
| Accessibilite debutant | Oui | Precision moins exigeante que tir au fer |
| Ideal surfaces lisses | Oui | Efficace sur dalles/terre, nul sur sable |
| Efficace pour tirer le cochonnet | Oui | Cible cochonnet autorisee |

**Proposition implementation :**
```javascript
LOFT_RAFLE = {
  landingFactor: 0.20,   // 20% vol, 80% roulement
  arcHeight: -5,          // Tres bas
  flyDurationMult: 0.3,   // Rapide
  rollEfficiency: 0.85,   // Conserve bien la vitesse au sol
  speedMultiplier: 1.8    // Plus rapide qu'un point, moins qu'un fer
}
```

### 2.3 Tir Devant - MANQUANT
| Aspect | Reel | A implementer |
|--------|------|---------------|
| 90% vol, atterrit 20-30cm avant la cible | Oui | Nouveau loft preset `LOFT_TIR_DEVANT` |
| Meilleur controle que le fer | Oui | Precision intermediaire |
| Rebonds sur sols durs | Oui | Deviation possible sur dalles |

**Proposition implementation :**
```javascript
LOFT_TIR_DEVANT = {
  landingFactor: 0.85,    // 85% vol, 15% roulement
  arcHeight: -55,          // Un peu plus bas que fer
  flyDurationMult: 0.5,
  rollEfficiency: 0.5,
  speedMultiplier: 2.0,    // Vitesse de tir
  landingOffset: -20       // Atterrit 20px AVANT la cible (nouveau param)
}
```

### 2.4 Tir a la Sautee - MANQUANT (PRIORITE BASSE)
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Sauter par-dessus une boule obstacle | Oui | Tres complexe - necessite detection obstacle |
| Tir au fer obligatoire | Oui | Variante du tir au fer avec arc augmente |
| Difficulte tres elevee | Oui | Reservee aux persos haute precision |

**Proposition** : Implementable comme variante contextuelle du tir au fer quand une boule alliee est entre le tireur et la cible. Arc augmente automatiquement. Disponible uniquement si stat precision >= 7.

### 2.5 Tir au But (Cochonnet) - PARTIELLEMENT IMPLEMENTE
| Aspect | Reel | Implemente |
|--------|------|------------|
| Viser le cochonnet au lieu d'une boule | Oui | **PARTIEL** - IA Ricardo cible le cochonnet (`targetsCocho: true`) |
| Joueur peut choisir de tirer le cochonnet | Oui | **NON** - pas d'option pour le joueur humain |
| Deplace ou sort le cochonnet | Oui | **OUI** - physique fonctionne (cochonnet est un objet mobile) |
| Annule la mene si cochonnet sort | Oui | **PARTIEL** - regle pas completement implementee |

**Amelioration necessaire** : Ajouter option "Tirer le cochonnet" dans l'UI de tir pour le joueur humain.

---

## 3. EFFETS ET SPINS - ENTIEREMENT MANQUANT

C'est le **plus gros manque** du jeu actuellement. Les effets sont fondamentaux en petanque reelle.

### 3.1 Effet Retro (Backspin)
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Freine la boule apres contact sol | Oui | Modifier `rollEfficiency` dynamiquement |
| Peut faire reculer la boule | Oui | `rollEfficiency` negatif ou tres faible |
| Essentiel pour le carreau sur place | Oui | Augmente chance de carreau |
| Necessite poignet souple | Oui | Lie a stat "Effet" du personnage |

**Proposition implementation :**
```javascript
// Dans Ball.js - nouveau parametre spin
this.spin = { type: 'none', intensity: 0 }; // none/retro/left/right

// Modification de la friction apres atterrissage
if (this.spin.type === 'retro' && this.hasLanded) {
  const retroForce = this.spin.intensity * RETRO_MAX_FORCE;
  // Deceleration supplementaire proportionnelle au spin
  const retroDecel = retroForce * effectiveFriction;
  newSpeed = Math.max(0, newSpeed - retroDecel * dt);
}
```

**Impact gameplay :**
- Roulette + retro = boule qui ralentit plus vite (utile sur dalles)
- Plombee + retro = boule quasi immobile apres atterrissage (technique pro)
- Tir au fer + retro = meilleur taux de carreau sur place
- Stat "Effet" determine l'intensite max applicable (1-10)

### 3.2 Effet Lateral (Gauche/Droite)
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Devie la boule lateralement apres contact sol | Oui | Force laterale apres atterrissage |
| Contourner obstacles | Oui | Trajectoire courbe au sol |
| Difficile a maitriser | Oui | Lie a stat "Effet" |

**Proposition implementation :**
```javascript
// Apres atterrissage, appliquer une force laterale
if (this.spin.type === 'left' || this.spin.type === 'right') {
  const lateralDir = this.spin.type === 'left' ? -1 : 1;
  const lateralForce = this.spin.intensity * LATERAL_MAX_FORCE;
  // Force perpendiculaire a la direction de deplacement
  const perpX = -this.vy / speed * lateralDir;
  const perpY = this.vx / speed * lateralDir;
  this.vx += perpX * lateralForce * dt;
  this.vy += perpY * lateralForce * dt;
}
```

**Impact gameplay :**
- Permet de contourner une boule devant pour atteindre le cochonnet
- Ajoute une dimension strategique majeure
- Stat "Effet" 1-3 : seulement retro faible. 4-6 : retro + lateral faible. 7-10 : tous effets, intensite elevee.

### 3.3 Jouer Nature (pas d'effet)
- Deja le comportement par defaut
- Devrait etre le choix affiche quand aucun effet n'est selectionne

### 3.4 UI Proposee pour les Effets
```
[ROULETTE] [DEMI-PORTEE] [PLOMBEE] | [TIRER]

Effet: [NATURE] [RETRO] [<- GAUCHE] [DROITE ->]
Intensite: [========--] 80%
```

- Selection par touches (E pour cycler les effets, molette pour intensite)
- Intensite limitee par stat "Effet" du personnage
- Indicateur visuel sur la fleche de visee (courbe si lateral, frein si retro)

---

## 4. COUPS TACTIQUES SPECIAUX

### 4.1 Devant de Boule - MANQUANT
| Aspect | Reel | Etat |
|--------|------|------|
| Placer sa boule juste devant une boule adverse | Oui | **PARTIELLEMENT EMERGENT** - le joueur peut techniquement le faire manuellement |
| IA utilise cette strategie | Oui | **PARTIEL** - Marcel (pointeur) fait un offset lateral mais pas "devant de boule" explicite |

**Amelioration** : L'IA pointeur devrait parfois viser intentionnellement devant une boule adverse bien placee pour bloquer le passage au cochonnet.

### 4.2 La Poussette - EMERGENT
| Aspect | Reel | Etat |
|--------|------|------|
| Pousser ses propres boules vers le but | Oui | **EMERGENT** - la physique le permet naturellement (collision boule-boule) |
| Strategie intentionnelle | Oui | **NON** - ni l'IA ni l'UI ne proposent cette option |

**Amelioration** : L'IA stratege devrait detecter les situations ou pousser une boule alliee vers le cochonnet est plus rentable que pointer directement.

### 4.3 Le Carambolage - EMERGENT
| Aspect | Reel | Etat |
|--------|------|------|
| Chaine de chocs multiples | Oui | **OUI** - la physique gere les collisions multiples naturellement |
| "Faire le menage" | Oui | **PARTIEL** - pas de strategie IA dediee |

**Amelioration** : L'IA tireur (Fanny) devrait analyser les alignements de boules pour maximiser les degats.

### 4.4 Le Ciseau - MANQUANT
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Frapper 2 boules non alignees en 1 tir | Oui | Theoriquement possible via physique mais pas detecte/celebre |

**Amelioration** : Detecter quand un tir touche 2 boules adverses et afficher "CISEAU !" avec celebration.

### 4.5 Coup de Bec - EMERGENT
| Aspect | Reel | Etat |
|--------|------|------|
| Boule change de trajectoire en touchant le cote d'une autre | Oui | **OUI** - collisions cercle-cercle gerent ca naturellement |
| Peut etre intentionnel | Oui | **NON** - pas propose dans l'UI |

### 4.6 Refente - EMERGENT
| Aspect | Reel | Etat |
|--------|------|------|
| Bousculer un ensemble pour finir pres du but | Oui | **EMERGENT** - possible via physique |

### 4.7 Tir sur Boule Collee - EMERGENT
| Aspect | Reel | Etat |
|--------|------|------|
| Transfert de masse aligne | Oui | **OUI** - physique le simule naturellement |

### 4.8 Rentrer en Deux - EMERGENT
| Aspect | Reel | Etat |
|--------|------|------|
| Pousser 2 boules alliees vers le but | Oui | **EMERGENT** - possible via physique |

---

## 5. RESULTATS DE TIR - DETECTION ET FEEDBACK

### Actuellement detecte :
| Resultat | Detecte | Feedback |
|----------|---------|----------|
| **Carreau sur place** | **OUI** (dist <= 24px) | Texte "CARREAU !", hitstop, SFX, flash |
| **Carreau allonge/recul** | Non distingue | Pas de variante |

### A implementer :

| Resultat | Condition de detection | Feedback propose |
|----------|----------------------|------------------|
| **Palet** | Boule tiree reste < 50px du point d'impact, cible chassee | "PALET !" texte argente |
| **Casquette** | Tir touche mais cible deplacee < 5px | "Casquette..." texte gris |
| **Trou** | Tir rate completement (aucune collision) | SFX impact sol sourd |
| **Banane** | Tir rate de > 80px | "A cote !" ou rien (humiliation silencieuse) |
| **Contre** | Tir touche la cible MAIS aussi une boule alliee | "Contre !" texte rouge |
| **Ciseau** | Tir touche 2+ boules adverses | "CISEAU !!" texte or + celebration |
| **Biberon** | Boule pointee touche le cochonnet (distance 0) | "BIBERON !" texte or |
| **Fanny** | Score final 13-0 | Animation speciale + humiliation traditionnelle |

**Implementation proposee :**
```javascript
// Dans PetanqueEngine.js, apres resolution physique
_analyzeShotResult(thrownBall, targets) {
  const results = [];

  // Detecter les collisions
  const hitBalls = this._getCollisionTargets(thrownBall);
  const hitAllied = hitBalls.filter(b => b.team === thrownBall.team);
  const hitEnemy = hitBalls.filter(b => b.team !== thrownBall.team);

  // Carreau (deja implemente)
  if (this.lastShotWasTir && carreau) results.push('carreau');

  // Palet
  else if (this.lastShotWasTir && distFromImpact < 50 && hitEnemy.length > 0)
    results.push('palet');

  // Casquette
  else if (this.lastShotWasTir && hitEnemy.length > 0 && maxDisplacement < 5)
    results.push('casquette');

  // Ciseau
  if (hitEnemy.length >= 2) results.push('ciseau');

  // Contre
  if (hitAllied.length > 0 && this.lastShotWasTir) results.push('contre');

  // Biberon (pointage)
  if (!this.lastShotWasTir && touchesCochonnet) results.push('biberon');

  return results;
}
```

---

## 6. STRATEGIES IA - ANALYSE AVANCEE

### Actuellement implemente :
| Strategie | Personnage | Etat |
|-----------|-----------|------|
| Pointer systematique | Marcel | **OUI** |
| Tirer systematique | Fanny | **OUI** |
| Calcul cout-benefice tir vs point | Ricardo | **OUI** |
| Tir du cochonnet (mene morte) | Ricardo, Marius | **OUI** |
| Comportement imprevisible | Thierry | **OUI** |
| Comportement equilibre | Rene | **OUI** |

### Strategies manquantes a haute valeur :

#### 6.1 Abandon de Mene
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Ne pas chercher le point, limiter les degats | Fondamental | IA devrait detecter mene perdue et jouer defensif |
| Mieux perdre 1-2 points que 5-6 | Oui | Calcul : si adversaire a 3+ boules proches, limiter |

**Proposition** : Si l'adversaire a 3+ boules plus proches que la meilleure alliee, l'IA joue ses boules restantes en "sacrifice" pour bloquer ou limiter le score.

#### 6.2 Gestion Avancee des Boules
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Compter boules restantes des 2 cotes | Fondamental | **PARTIEL** - l'IA sait combien elle en a mais n'exploite pas assez |
| "Ajouter" quand adversaire n'a plus de boules | Oui | L'IA devrait maximiser les points quand elle a des boules en plus |

#### 6.3 Pression Psychologique (gameplay)
| Aspect | Reel | A implementer |
|--------|------|---------------|
| Braquer/brancher | Ambiance | Catchphrases provocatrices avant/apres les coups |
| Celebration exageree | Ambiance | Animations de celebration par personnage |

#### 6.4 Choix Strategique de Distance Cochonnet
| Aspect | Reel | Implemente |
|--------|------|------------|
| Distance courte favorise pointeurs | Oui | **OUI** - Marcel lance a 0.45 puissance |
| Distance longue favorise tireurs | Oui | **OUI** - Fanny lance a 0.7 puissance |
| Adapter selon adversaire | Oui | **PARTIEL** - choix fixe par personnalite, pas adaptatif |

**Amelioration** : L'IA devrait analyser les stats de l'adversaire et adapter sa distance de cochonnet.

---

## 7. REGLES FIPJP - ECARTS AVEC L'IMPLEMENTATION

### Regles bien implementees :
- [x] Equipe qui perd rejoue
- [x] Score = boules plus proches que meilleure perdante
- [x] Victoire a 13 points
- [x] Cochonnet lance a 6-10m
- [x] 1v1 tete-a-tete : 3 boules/joueur
- [x] Boule hors terrain = morte

### Regles partiellement implementees :
- [ ] **Cochonnet noye** : Si cochonnet sort du terrain, regles complexes selon qui a encore des boules
- [ ] **Mene nulle** : Si les 2 equipes sont a egale distance, mene nulle possible
- [ ] **Cercle de lancement** : Pas visible/simule (cosmetic mais immersif)

### Regles manquantes :
- [ ] **Doublette (2v2)** : 3 boules/joueur, 6 total - format non implemente
- [ ] **Triplette (3v3)** : 2 boules/joueur, 6 total - format non implemente
- [ ] **Boule morte apres sortie** : La boule est-elle retiree visuellement du jeu ?
- [ ] **Mesure** : Quand les boules sont tres proches, une mesure est necessaire (animation possible)
- [ ] **Donnee invalide de cochonnet** : Si cochonnet < 6m ou > 10m, relance (pas verifiable)

---

## 8. SURFACES ET TERRAINS

### Surfaces implementees :
| Surface | Friction | Proprietees speciales | Terrain |
|---------|----------|----------------------|---------|
| Terre battue | 1.0 | Baseline | Village |
| Sable | 3.0-3.5 | Haute friction | Plage |
| Herbe | 1.8 | + zones gravier 1.2 | Parc |
| Dalles | 0.4 | Murs rebond 0.7 | Docks |
| Terre + pente | 1.0 | Gravity 0.03 down | Colline |

### Surfaces manquantes (pour futurs terrains) :
| Surface | Friction suggeree | Propriete speciale | Terrain possible |
|---------|-------------------|-------------------|-----------------|
| **Gravier fin** | 1.5 | Micro-deviations aleatoires | Boulodrome municipal |
| **Dolomie** | 1.2 | Surface premium, stable | Terrain competition |
| **Sol humide** | Variable (1.3-2.0) | Friction augmentee, boules s'enfoncent | Variante meteo |
| **Gros gravier** | 2.5 | Roulette impossible, deviations fortes | Terrain sauvage |
| **Goudron/Asphalte** | 0.5 | Rebonds violents, peu de controle | Parking |
| **Terre seche craquellee** | 0.8 | Zones irreguliers | Terrain ete |

### Propriete manquante : Micro-deviations
En reel, le terrain n'est JAMAIS parfaitement uniforme. Implementer un bruit de Perlin leger sur la trajectoire au sol ajouterait beaucoup de realisme :
```javascript
// Deviation terrain aleatoire (bruit de Perlin simplifie)
if (this.isRolling && terrain.roughness > 0) {
  const noise = Math.sin(this.x * 0.1) * Math.cos(this.y * 0.13) * terrain.roughness;
  this.vx += noise * 0.01;
  this.vy += noise * 0.01;
}
```

---

## 9. PLAN D'AMELIORATION PAR PRIORITE

### PRIORITE 1 - Impact gameplay maximal (Sprint prochain)

#### 1A. Ajouter les effets (retro + lateral)
- **Effort** : ~150 lignes dans Ball.js + 50 lignes UI dans AimingSystem.js
- **Impact** : Transforme le jeu. Ajoute une dimension entiere de gameplay.
- **Dependance** : Stat "Effet" deja dans characters.json
- **UI** : Nouvelle rangee de boutons sous le selecteur de technique
- **Fichiers touches** : Ball.js, AimingSystem.js, Constants.js, PetanqueAI.js

#### 1B. Ajouter le tir a la rafle
- **Effort** : ~30 lignes (nouveau loft preset + bouton UI)
- **Impact** : Diversifie le tir, rend la stat "Puissance" plus utile
- **UI** : Ajouter un 2e type de tir : [TIR AU FER] [RAFLE]
- **Fichiers touches** : Constants.js, AimingSystem.js, PetanqueAI.js

#### 1C. Tir au cochonnet pour le joueur
- **Effort** : ~20 lignes (option UI + ciblage)
- **Impact** : Strategie fondamentale manquante
- **UI** : Bouton "TIRER LE BUT" quand mode tir actif
- **Fichiers touches** : AimingSystem.js

### PRIORITE 2 - Feedback et immersion (Sprint +1)

#### 2A. Detection des resultats de tir
- **Effort** : ~100 lignes dans PetanqueEngine.js
- **Impact** : Feedback satisfaisant, vocabulaire authentique
- Detecter : palet, casquette, contre, ciseau, biberon, fanny
- Afficher le nom du coup avec animation appropriee

#### 2B. Catchphrases contextuelles
- **Effort** : ~80 lignes + donnees JSON
- **Impact** : Ambiance provencale, personnalite des persos
- Chaque personnage reagit differemment aux coups (carreau, rate, fanny)

#### 2C. Micro-deviations terrain
- **Effort** : ~20 lignes dans Ball.js
- **Impact** : Realisme trajectoire, rend la roulette plus risquee sur terrain irregulier

### PRIORITE 3 - IA avancee (Sprint +2)

#### 3A. Strategie abandon de mene
- L'IA detecte quand la mene est perdue et joue defensif

#### 3B. Poussette intentionnelle
- L'IA detecte quand pousser une boule alliee est plus rentable

#### 3C. Gestion avantage de boules
- L'IA exploite l'avantage numerique (additionner, bombarder)

#### 3D. Distance cochonnet adaptative
- L'IA adapte la distance du cochonnet selon les forces/faiblesses de l'adversaire

### PRIORITE 4 - Completude (Sprint +3)

#### 4A. Tir devant
- Nouveau loft preset avec `landingOffset`

#### 4B. Tir a la sautee
- Variante contextuelle du tir au fer quand obstacle detecte

#### 4C. Doublette et triplette
- Formats 2v2 et 3v3 avec gestion d'equipe

#### 4D. Cochonnet noye (regles completes)
- Regle quand cochonnet sort du terrain

#### 4E. Nouveaux terrains
- Gravier, dolomie, goudron, sol humide

---

## 10. TABLEAU RECAPITULATIF GLOBAL

### Actions du joueur dans le jeu actuel vs reel

| Action | Reel | Dans le jeu | Gap |
|--------|------|-------------|-----|
| Pointer roulette | Oui | **OUI** | - |
| Pointer demi-portee | Oui | **OUI** | - |
| Pointer plombee | Oui | **OUI** | - |
| Tir au fer | Oui | **OUI** | - |
| Tir a la rafle | Oui | **NON** | Manque |
| Tir devant | Oui | **NON** | Manque |
| Tir a la sautee | Oui | **NON** | Manque (bas prio) |
| Tir au cochonnet (joueur) | Oui | **NON** | Manque |
| Effet retro | Oui | **NON** | **Manque critique** |
| Effet lateral | Oui | **NON** | **Manque critique** |
| Choisir distance cochonnet | Oui | Non (auto) | Amelioration possible |
| Mesurer les distances | Oui | Auto (TAB) | OK |
| Devant de boule | Intentionnel | Emergent | OK pour l'instant |
| Poussette | Intentionnel | Emergent | OK pour l'instant |
| Carambolage | Intentionnel | Emergent | OK pour l'instant |
| Abandonner la mene | Strategique | NON | Manque IA |

### Feedback manquant

| Evenement | Feedback actuel | Feedback souhaite |
|-----------|-----------------|-------------------|
| Carreau | "CARREAU !" + flash + hitstop | **OK** |
| Palet | Rien | "PALET !" texte argente |
| Casquette | Rien | "Casquette..." + SFX |
| Trou (rate) | Rien | SFX impact sourd |
| Contre | Rien | "CONTRE !" texte rouge |
| Ciseau | Rien | "CISEAU !!" celebration |
| Biberon | Rien | "BIBERON !" celebration |
| Fanny (13-0) | Score | Animation humiliation speciale |
| Boule proche cochonnet | Rien | SFX tension crescendo |
| Derniere boule | Rien | Musique tension + ralenti |

---

## 11. VISION REALISME AVANCE

Pour atteindre un niveau de realisme exceptionnel, voici les couches a ajouter par ordre :

### Couche 1 : Physique enrichie (effets)
- Retro, lateral, nature
- ~200 lignes de code
- **Transforme le gameplay**

### Couche 2 : Variete des tirs
- Rafle, tir devant, tir au cochonnet
- ~80 lignes de code
- **Diversifie les situations**

### Couche 3 : Feedback contextuel
- Detection et nommage des coups
- Catchphrases personnages
- ~200 lignes de code + donnees JSON
- **Rend le jeu vivant**

### Couche 4 : Terrain dynamique
- Micro-deviations, rugosity variable
- Zones d'ombre/humidite
- ~50 lignes de code
- **Ajoute de l'incertitude realiste**

### Couche 5 : IA strategique
- Abandon mene, poussette, gestion boules, adaptativite
- ~200 lignes dans PetanqueAI.js
- **Rend l'IA plus humaine**

### Couche 6 : Formats et regles
- Doublette, triplette, cochonnet noye
- ~300 lignes de code
- **Complete les regles FIPJP**

**Total estime : ~1000 lignes de code + donnees JSON pour un jeu de petanque quasi-complet.**

---

## CONCLUSION

Le jeu a une **base physique exceptionnelle** (COR realiste, friction lineaire, sub-stepping, collisions masse-dependantes). Les 3 techniques de pointage et le tir au fer sont bien implementes.

Les **2 plus gros manques** sont :
1. **Les effets (retro/lateral)** - fondamentaux en petanque reelle, absents du jeu
2. **La variete des tirs** - un seul type de tir (fer) alors qu'il en existe 5

Ces 2 ajouts transformeraient le gameplay de "bon" a "exceptionnel" en termes de profondeur strategique et de realisme.
